import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/services/firebaseClient';
import { AppText } from '@/src/components/AppText';
import { SettingsGroup, SettingsRow, SettingsSection } from '@/src/components/SettingsGroup';
import { theme } from '@/src/constants/theme';
import { AdminScreenShell } from '@/src/features/admin/components/AdminScreenShell';
import { usePreferences } from '@/src/hooks/usePreferences';

const SETTINGS_DOC = doc(db, 'settings', 'global');

interface GlobalSettings {
  commissionRate: number;
  wagePerCard: number;
  branches: string[];
  appVersion?: string;
  updatedAt?: unknown;
}

const DEFAULTS: GlobalSettings = {
  commissionRate: 10,
  wagePerCard: 0.5,
  branches: [],
};

export default function SettingsScreen() {
  const { colors } = usePreferences();
  const [settings, setSettings] = useState<GlobalSettings>(DEFAULTS);
  const [commissionInput, setCommissionInput] = useState('10');
  const [wageInput, setWageInput] = useState('0.50');
  const [newBranch, setNewBranch] = useState('');
  const [savingRates, setSavingRates] = useState(false);
  const [savingBranches, setSavingBranches] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const snap = await getDoc(SETTINGS_DOC);
        if (snap.exists()) {
          const data = snap.data() as GlobalSettings;
          setSettings({ ...DEFAULTS, ...data });
          setCommissionInput(String(data.commissionRate ?? 10));
          setWageInput(String(data.wagePerCard ?? 0.5));
        }
      } catch {
        // defaults
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function saveRates() {
    const commission = parseFloat(commissionInput);
    const wage = parseFloat(wageInput);
    if (isNaN(commission) || commission < 0 || commission > 100) {
      Alert.alert('Invalid', 'Commission rate must be between 0 and 100.');
      return;
    }
    if (isNaN(wage) || wage < 0) {
      Alert.alert('Invalid', 'Wage per card must be a positive number.');
      return;
    }
    setSavingRates(true);
    try {
      await setDoc(
        SETTINGS_DOC,
        { commissionRate: commission, wagePerCard: wage, updatedAt: serverTimestamp() },
        { merge: true }
      );
      setSettings((prev) => ({ ...prev, commissionRate: commission, wagePerCard: wage }));
      Alert.alert('Saved', 'Rates updated successfully.');
    } catch {
      Alert.alert('Error', 'Could not save rates.');
    } finally {
      setSavingRates(false);
    }
  }

  async function addBranch() {
    const name = newBranch.trim();
    if (!name) return;
    if (settings.branches.includes(name)) {
      Alert.alert('Duplicate', 'That branch already exists.');
      return;
    }
    const updated = [...settings.branches, name];
    setSavingBranches(true);
    try {
      await setDoc(SETTINGS_DOC, { branches: updated, updatedAt: serverTimestamp() }, { merge: true });
      setSettings((prev) => ({ ...prev, branches: updated }));
      setNewBranch('');
    } catch {
      Alert.alert('Error', 'Could not add branch.');
    } finally {
      setSavingBranches(false);
    }
  }

  async function removeBranch(branch: string) {
    const updated = settings.branches.filter((b) => b !== branch);
    setSavingBranches(true);
    try {
      await setDoc(SETTINGS_DOC, { branches: updated, updatedAt: serverTimestamp() }, { merge: true });
      setSettings((prev) => ({ ...prev, branches: updated }));
    } catch {
      Alert.alert('Error', 'Could not remove branch.');
    } finally {
      setSavingBranches(false);
    }
  }

  return (
    <AdminScreenShell title="Settings" subtitle="Admin">
      {loading ? (
        <AppText variant="body" tone="muted" style={styles.empty}>
          Loading settings…
        </AppText>
      ) : (
        <>
          <SettingsSection
            title="Rates"
            footer="Commission is a percentage of order value. Wage is paid per printed card."
            compact
          />
          <SettingsGroup compact style={styles.fieldGroup}>
            <View style={styles.fieldBlock}>
              <AppText variant="caption" tone="muted" weight="medium">
                Commission rate
              </AppText>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, { color: colors.typographyColor, backgroundColor: colors.surfaceSoft }]}
                  value={commissionInput}
                  onChangeText={setCommissionInput}
                  keyboardType="decimal-pad"
                  placeholder="10"
                  placeholderTextColor={colors.textMuted}
                />
                <AppText variant="body" weight="semibold" tone="muted">
                  %
                </AppText>
              </View>
              <AppText variant="caption" tone="muted">
                Current: {settings.commissionRate}% per order
              </AppText>
            </View>
            <View style={[styles.inlineSeparator, { backgroundColor: colors.border }]} />
            <View style={styles.fieldBlock}>
              <AppText variant="caption" tone="muted" weight="medium">
                Wage per card
              </AppText>
              <View style={styles.inputRow}>
                <AppText variant="body" weight="semibold" tone="muted">
                  $
                </AppText>
                <TextInput
                  style={[styles.input, { color: colors.typographyColor, backgroundColor: colors.surfaceSoft }]}
                  value={wageInput}
                  onChangeText={setWageInput}
                  keyboardType="decimal-pad"
                  placeholder="0.50"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <AppText variant="caption" tone="muted">
                Current: ${settings.wagePerCard} per card
              </AppText>
            </View>
          </SettingsGroup>

          <Pressable
            style={[styles.primaryBtn, { backgroundColor: colors.primary }, savingRates && styles.disabled]}
            onPress={saveRates}
            disabled={savingRates}
          >
            <AppText variant="body" weight="bold" style={styles.primaryBtnText}>
              {savingRates ? 'Saving…' : 'Save rates'}
            </AppText>
          </Pressable>

          <SettingsSection title="Branches" footer="Workshop and office locations for staff assignment." compact />
          <SettingsGroup compact>
            {settings.branches.length === 0 ? (
              <View style={styles.fieldBlock}>
                <AppText variant="body" tone="muted">
                  No branches added yet.
                </AppText>
              </View>
            ) : (
              settings.branches.map((branch, index) => (
                <View key={branch}>
                  <View style={styles.branchRow}>
                    <AppText variant="body" weight="medium" style={{ flex: 1 }}>
                      {branch}
                    </AppText>
                    <Pressable onPress={() => removeBranch(branch)} hitSlop={8}>
                      <AppText variant="caption" weight="semibold" style={{ color: theme.colors.danger }}>
                        Remove
                      </AppText>
                    </Pressable>
                  </View>
                  {index < settings.branches.length - 1 ? (
                    <View style={[styles.inlineSeparator, { backgroundColor: colors.border }]} />
                  ) : null}
                </View>
              ))
            )}
            <View style={[styles.inlineSeparator, { backgroundColor: colors.border }]} />
            <View style={[styles.fieldBlock, styles.addBranchBlock]}>
              <TextInput
                style={[styles.branchInput, { color: colors.typographyColor, backgroundColor: colors.surfaceSoft }]}
                value={newBranch}
                onChangeText={setNewBranch}
                placeholder="e.g. Phnom Penh HQ"
                placeholderTextColor={colors.textMuted}
                onSubmitEditing={addBranch}
                returnKeyType="done"
              />
              <Pressable
                style={[styles.inlineAddBtn, { backgroundColor: colors.primary }, savingBranches && styles.disabled]}
                onPress={addBranch}
                disabled={savingBranches}
              >
                <AppText variant="caption" weight="bold" style={styles.primaryBtnText}>
                  Add
                </AppText>
              </Pressable>
            </View>
          </SettingsGroup>

          <SettingsSection title="App info" compact />
          <SettingsGroup compact>
            <SettingsRow compact title="App name" value="SITEHUB" showChevron={false} />
            <SettingsRow compact title="Version" value="1.0.0" showChevron={false} />
            <SettingsRow compact title="Platform" value="React Native / Expo" showChevron={false} />
            <SettingsRow compact title="Database" value="Firebase Firestore" showChevron={false} isLast />
          </SettingsGroup>
        </>
      )}
    </AdminScreenShell>
  );
}

const styles = StyleSheet.create({
  empty: { textAlign: 'center', marginTop: theme.spacing.xl },
  fieldGroup: { gap: 0 },
  fieldBlock: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    gap: 6,
  },
  inlineSeparator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: theme.spacing.md,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 17,
    fontWeight: '600',
  },
  primaryBtn: {
    marginHorizontal: theme.spacing.md,
    borderRadius: theme.radius.lg,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#FFFFFF' },
  disabled: { opacity: 0.5 },
  branchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    minHeight: 44,
    paddingVertical: 10,
    gap: theme.spacing.sm,
  },
  addBranchBlock: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  branchInput: {
    flex: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 16,
  },
  inlineAddBtn: {
    borderRadius: theme.radius.sm,
    paddingHorizontal: 14,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
