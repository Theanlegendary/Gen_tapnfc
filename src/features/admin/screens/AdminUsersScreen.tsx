import { useEffect, useState } from 'react';
import {
  Alert, Modal, Pressable, ScrollView,
  StyleSheet, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs, doc, updateDoc, serverTimestamp, orderBy, query } from 'firebase/firestore';
import { db } from '@/src/services/firebaseClient';
import { AppSearchBar } from '@/src/components/AppSearchBar';
import { AppText } from '@/src/components/AppText';
import { SettingsGroup, SettingsSection } from '@/src/components/SettingsGroup';
import { theme } from '@/src/constants/theme';
import {
  AdminHeaderAction,
  AdminScreenShell,
  AdminStatChip,
  AdminStatChipRow,
  AdminStatusPill,
} from '@/src/features/admin/components/AdminScreenShell';
import { searchEmptyMessage, useSearchQuery } from '@/src/hooks/useSearchQuery';
import { usePreferences } from '@/src/hooks/usePreferences';
import { UserRole } from '@/src/types/models';
import { useAuth } from '@/src/hooks/useAuth';
import { createManagedUser, getAuthErrorMessage } from '@/src/services/authService';
import { normalizeRole } from '@/src/utils/authFlow';
import { getRoleLabel } from '@/src/utils/roleCapabilities';

const ROLE_OPTIONS: { label: string; value: UserRole; color: string }[] = [
  { label: 'Sales',    value: 'sales',    color: '#0FBAAF' },
  { label: 'Printer',  value: 'printer',  color: '#00BCD4' },
  { label: 'Admin',    value: 'admin',    color: '#7c3aed' },
  { label: 'Super Admin', value: 'super_admin', color: '#111827' },
  { label: 'Customer', value: 'customer', color: '#10b981' },
];

interface StaffUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  branch?: string;
  isActive: boolean;
  createdAt?: string;
}

function rolePillTone(role: UserRole): 'info' | 'success' | 'warning' | 'neutral' {
  if (role === 'sales') return 'success';
  if (role === 'printer') return 'info';
  if (role === 'admin' || role === 'super_admin') return 'warning';
  return 'neutral';
}

export default function AdminUsersScreen() {
  const { colors } = usePreferences();
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { input: searchInput, setInput: setSearchInput, query: searchQuery, submitSearch, clearSearch } =
    useSearchQuery();
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    password: '',
    role: 'sales' as UserRole,
    phone: '',
    branch: '',
  });

  async function loadUsers() {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
      const list: StaffUser[] = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          email: data.email ?? '',
          displayName: data.displayName ?? '',
          role: normalizeRole(data.role),
          phone: data.phone,
          branch: data.branch,
          isActive: data.isActive !== false,
          createdAt: data.createdAt?.toDate?.()?.toLocaleDateString() ?? '',
        };
      });
      setUsers(list);
    } catch {
      Alert.alert('Error', 'Could not load users. Check Firestore rules.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, []);

  async function handleCreate() {
    const normalizedEmail = form.email.trim().toLowerCase();
    if (!form.displayName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || form.password.length < 6) {
      Alert.alert('Required', 'Name, valid email, and password (6+ chars) are required.');
      return;
    }
    if (users.some(u => u.email.toLowerCase() === normalizedEmail)) {
      Alert.alert('Duplicate', 'That email is already registered.');
      return;
    }
    if (form.role === 'super_admin' && !isSuperAdmin) {
      Alert.alert('Super admin required', 'Only a super admin can create another super admin account.');
      return;
    }
    setSaving(true);
    try {
      await createManagedUser({
        email: normalizedEmail,
        password: form.password,
        displayName: form.displayName,
        role: form.role,
        phone: form.phone,
        branch: form.branch,
        createdBy: currentUser?.id ?? '',
      });

      Alert.alert('Account created', `${form.displayName} (${form.role}) can now log in with ${form.email}. Share the temporary password securely.`);
      setShowModal(false);
      setForm({ displayName: '', email: '', password: '', role: 'sales', phone: '', branch: '' });
      loadUsers();
    } catch (err: any) {
      Alert.alert('Failed', getAuthErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(user: StaffUser) {
    if (user.id === currentUser?.id) {
      Alert.alert('Not allowed', 'You cannot disable your own account.');
      return;
    }
    if (user.role === 'super_admin' && !isSuperAdmin) {
      Alert.alert('Super admin required', 'Only a super admin can disable a super admin account.');
      return;
    }
    try {
      await updateDoc(doc(db, 'users', user.id), {
        isActive: !user.isActive,
        updatedBy: currentUser?.id ?? '',
        updatedAt: serverTimestamp(),
      });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u));
    } catch {
      Alert.alert('Error', 'Could not update user.');
    }
  }

  const q = searchQuery.toLowerCase();
  const filtered = users.filter(
    (u) =>
      !q ||
      u.displayName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      (u.phone?.toLowerCase().includes(q) ?? false) ||
      (u.branch?.toLowerCase().includes(q) ?? false)
  );

  const counts = {
    total: users.length,
    sales: users.filter(u => u.role === 'sales').length,
    printer: users.filter(u => u.role === 'printer').length,
    admin: users.filter(u => u.role === 'admin').length,
    superAdmin: users.filter(u => u.role === 'super_admin').length,
  };
  const assignableRoles = isSuperAdmin
    ? ROLE_OPTIONS
    : ROLE_OPTIONS.filter(option => option.value !== 'super_admin');

  return (
    <AdminScreenShell
      title="Users"
      subtitle="Admin"
      rightAction={<AdminHeaderAction label="Add" icon="User" onPress={() => setShowModal(true)} />}
      headerBottom={
        <AppSearchBar
          embedded
          value={searchInput}
          onChangeText={setSearchInput}
          onSearch={submitSearch}
          onClear={clearSearch}
          loading={loading}
          placeholder="Search by name, email, role…"
        />
      }
      scroll={false}
    >
      <AdminStatChipRow>
        <AdminStatChip label="Total" value={String(counts.total)} />
        <AdminStatChip label="Sales" value={String(counts.sales)} tone="#000000" />
        <AdminStatChip label="Printer" value={String(counts.printer)} tone="#32ADE6" />
        <AdminStatChip label="Admin" value={String(counts.admin + counts.superAdmin)} tone={colors.primary} />
      </AdminStatChipRow>

      <SettingsSection title="Staff" compact />
      <ScrollView style={styles.listScroll} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {loading ? (
          <AppText variant="body" tone="muted" style={styles.emptyText}>
            Loading users…
          </AppText>
        ) : filtered.length === 0 ? (
          <AppText variant="body" tone="muted" style={styles.emptyText}>
            {searchEmptyMessage(false, Boolean(searchQuery), searchQuery, 'No users found.', '')}
          </AppText>
        ) : (
          <SettingsGroup compact>
            {filtered.map((u, index) => {
              const roleColor = ROLE_OPTIONS.find((r) => r.value === u.role)?.color ?? colors.textMuted;
              return (
                <Pressable
                  key={u.id}
                  onPress={() => handleToggleActive(u)}
                  style={({ pressed }) => [
                    styles.userRow,
                    !u.isActive && styles.userRowInactive,
                    pressed && { backgroundColor: colors.surfaceSoft },
                  ]}
                >
                  <View style={[styles.userAvatar, { backgroundColor: `${roleColor}22` }]}>
                    <AppText variant="body" weight="bold" style={{ color: roleColor }}>
                      {(u.displayName || u.email)[0].toUpperCase()}
                    </AppText>
                  </View>
                  <View style={styles.userInfo}>
                    <AppText variant="body" weight="semibold" numberOfLines={1}>
                      {u.displayName || '—'}
                    </AppText>
                    <AppText variant="caption" tone="muted" numberOfLines={1}>
                      {u.email}
                    </AppText>
                    {u.branch ? (
                      <AppText variant="caption" tone="muted" numberOfLines={1}>
                        {u.branch}
                      </AppText>
                    ) : null}
                  </View>
                  <View style={styles.userRight}>
                    <AdminStatusPill label={getRoleLabel(u.role)} tone={rolePillTone(u.role)} />
                    <AdminStatusPill
                      label={u.isActive ? 'Active' : 'Inactive'}
                      tone={u.isActive ? 'success' : 'danger'}
                    />
                  </View>
                  {index < filtered.length - 1 ? (
                    <View style={[styles.separator, { backgroundColor: colors.border }]} />
                  ) : null}
                </Pressable>
              );
            })}
          </SettingsGroup>
        )}
      </ScrollView>

      {/* Create Account Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalSafe, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.background }]}>
            <Pressable onPress={() => setShowModal(false)} hitSlop={8}>
              <AppText variant="body" weight="semibold" style={{ color: colors.primary }}>
                Cancel
              </AppText>
            </Pressable>
            <AppText variant="body" weight="bold" style={styles.modalTitle}>
              Create Account
            </AppText>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>
            <AppText style={styles.fieldLabel}>Display Name *</AppText>
            <TextInput style={styles.input} value={form.displayName} onChangeText={v => setForm(f => ({ ...f, displayName: v }))}
              placeholder="e.g. Phorn Penh" placeholderTextColor="#ccc" autoCapitalize="words" />

            <AppText style={styles.fieldLabel}>Email *</AppText>
            <TextInput style={styles.input} value={form.email} onChangeText={v => setForm(f => ({ ...f, email: v }))}
              placeholder="user@company.com" placeholderTextColor="#ccc" keyboardType="email-address" autoCapitalize="none" />

            <AppText style={styles.fieldLabel}>Password * (min 6 chars)</AppText>
            <TextInput style={styles.input} value={form.password} onChangeText={v => setForm(f => ({ ...f, password: v }))}
              placeholder="Set a password" placeholderTextColor="#ccc" secureTextEntry />

            <AppText style={styles.fieldLabel}>Phone</AppText>
            <TextInput style={styles.input} value={form.phone} onChangeText={v => setForm(f => ({ ...f, phone: v }))}
              placeholder="+855 12 345 678" placeholderTextColor="#ccc" keyboardType="phone-pad" />

            <AppText style={styles.fieldLabel}>Branch / Workshop</AppText>
            <TextInput style={styles.input} value={form.branch} onChangeText={v => setForm(f => ({ ...f, branch: v }))}
              placeholder="e.g. Phnom Penh HQ" placeholderTextColor="#ccc" />

            <AppText style={styles.fieldLabel}>Role *</AppText>
            <View style={styles.roleGrid}>
              {assignableRoles.map(opt => (
                <Pressable
                  key={opt.value}
                  style={[styles.roleOption, form.role === opt.value && { backgroundColor: opt.color, borderColor: opt.color }]}
                  onPress={() => setForm(f => ({ ...f, role: opt.value }))}
                >
                  <AppText style={[styles.roleOptionText, form.role === opt.value && { color: '#fff' }]}>
                    {opt.label}
                  </AppText>
                </Pressable>
              ))}
            </View>

            {/* Preview */}
            <View style={styles.previewCard}>
              <AppText style={styles.previewTitle}>Account Preview</AppText>
              <AppText style={styles.previewRow}>Name: <AppText style={styles.previewVal}>{form.displayName || '—'}</AppText></AppText>
              <AppText style={styles.previewRow}>Email: <AppText style={styles.previewVal}>{form.email || '—'}</AppText></AppText>
              <AppText style={styles.previewRow}>Role: <AppText style={[styles.previewVal, { color: ROLE_OPTIONS.find(r => r.value === form.role)?.color }]}>{getRoleLabel(form.role)}</AppText></AppText>
              <AppText style={styles.previewNote}>
                After creation, this person can log in immediately with the email and password above.
              </AppText>
            </View>

            <Pressable
              style={[styles.createBtn, { backgroundColor: colors.primary }, saving && { opacity: 0.6 }]}
              disabled={saving}
              onPress={handleCreate}
            >
              <AppText variant="body" weight="bold" style={styles.createBtnText}>
                {saving ? 'Creating…' : 'Create Account'}
              </AppText>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </AdminScreenShell>
  );
}

const styles = StyleSheet.create({
  listScroll: { flex: 1 },
  list: { paddingBottom: theme.spacing.xxl },
  emptyText: { textAlign: 'center', marginTop: theme.spacing.xl, paddingHorizontal: theme.spacing.md },
  userRow: {
    position: 'relative',
    minHeight: 68,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  userRowInactive: { opacity: 0.55 },
  separator: {
    position: 'absolute',
    left: theme.spacing.md,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: { flex: 1, minWidth: 0, gap: 2 },
  userRight: { alignItems: 'flex-end', gap: 4 },
  modalSafe: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
  },
  modalTitle: { flex: 1, textAlign: 'center' },
  modalHeaderSpacer: { width: 56 },
  modalBody: { padding: theme.spacing.lg, gap: 10, paddingBottom: 60 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#636366', marginTop: 10 },
  input: {
    backgroundColor: '#F1F3F6',
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 16,
    color: '#111111',
    marginTop: 4,
  },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  roleOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: '#F1F3F6',
  },
  roleOptionText: { fontSize: 14, fontWeight: '600', color: '#636366' },
  previewCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    gap: 4,
  },
  previewTitle: { fontSize: 13, fontWeight: '700', color: '#111111', marginBottom: 4 },
  previewRow: { fontSize: 13, color: '#6E6E73' },
  previewVal: { fontWeight: '700', color: '#111111' },
  previewNote: { fontSize: 12, color: '#8E8E93', marginTop: 6, lineHeight: 17 },
  createBtn: { borderRadius: theme.radius.lg, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  createBtnText: { color: '#FFFFFF' },
});
