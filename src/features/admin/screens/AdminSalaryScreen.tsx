import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { collection, doc, getDocs, orderBy, query, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/services/firebaseClient';
import { AppText } from '@/src/components/AppText';
import { SettingsGroup, SettingsSection } from '@/src/components/SettingsGroup';
import { theme } from '@/src/constants/theme';
import {
  AdminScreenShell,
  AdminStatChip,
  AdminStatChipRow,
  AdminStatusPill,
} from '@/src/features/admin/components/AdminScreenShell';
import { usePreferences } from '@/src/hooks/usePreferences';

interface SalaryRecord {
  id: string;
  printerName: string;
  printerId: string;
  period: string;
  totalCards: number;
  failedCards: number;
  total: number;
  status: 'paid' | 'unpaid' | string;
}

interface Payout {
  id: string;
  userId: string;
  periodLabel: string;
  amount: number;
  status: 'paid' | 'unpaid' | string;
}

interface UserMap {
  [uid: string]: string;
}

function payoutTone(status: string): 'success' | 'warning' {
  return status === 'paid' ? 'success' : 'warning';
}

export default function SalaryScreen() {
  const { colors } = usePreferences();
  const [tab, setTab] = useState<'printers' | 'salesmen'>('printers');
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [userMap, setUserMap] = useState<UserMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Load users for name mapping
        const usersSnap = await getDocs(collection(db, 'users'));
        const map: UserMap = {};
        usersSnap.docs.forEach(d => {
          const data = d.data();
          map[d.id] = data.displayName || data.email || d.id;
        });
        setUserMap(map);

        // Load salary records (printers)
        const salarySnap = await getDocs(
          query(collection(db, 'salary_records'), orderBy('period', 'desc'))
        );
        setSalaryRecords(salarySnap.docs.map(d => ({ id: d.id, ...d.data() } as SalaryRecord)));

        // Load payouts (salesmen)
        const payoutsSnap = await getDocs(
          query(collection(db, 'payouts'), orderBy('periodLabel', 'desc'))
        );
        setPayouts(payoutsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Payout)));
      } catch {
        // silent — show empty state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function approveSalary(record: SalaryRecord) {
    try {
      await updateDoc(doc(db, 'salary_records', record.id), {
        status: 'paid',
        approvedAt: serverTimestamp(),
      });
      setSalaryRecords(prev =>
        prev.map(r => r.id === record.id ? { ...r, status: 'paid' } : r)
      );
    } catch {
      Alert.alert('Error', 'Could not approve salary record.');
    }
  }

  async function approvePayout(payout: Payout) {
    try {
      await updateDoc(doc(db, 'payouts', payout.id), {
        status: 'paid',
        approvedAt: serverTimestamp(),
      });
      setPayouts(prev =>
        prev.map(p => p.id === payout.id ? { ...p, status: 'paid' } : p)
      );
    } catch {
      Alert.alert('Error', 'Could not approve payout.');
    }
  }

  const totalPrinterUnpaid = salaryRecords
    .filter(r => r.status !== 'paid')
    .reduce((s, r) => s + (r.total ?? 0), 0);

  const totalSalesUnpaid = payouts
    .filter(p => p.status !== 'paid')
    .reduce((s, p) => s + (p.amount ?? 0), 0);

  return (
    <AdminScreenShell
      title="Salary"
      subtitle="Admin"
      scroll={false}
      headerBottom={
        <View style={[styles.tabRow, { backgroundColor: colors.surface }]}>
          {(['printers', 'salesmen'] as const).map((t) => (
            <Pressable
              key={t}
              style={[styles.tab, tab === t && { backgroundColor: colors.primary }]}
              onPress={() => setTab(t)}
            >
              <AppText
                variant="caption"
                weight="semibold"
                style={{ color: tab === t ? '#FFFFFF' : colors.textMuted }}
              >
                {t === 'printers' ? 'Printers' : 'Salesmen'}
              </AppText>
            </Pressable>
          ))}
        </View>
      }
    >
      <AdminStatChipRow>
        <AdminStatChip label="Printer unpaid" value={`$${totalPrinterUnpaid.toFixed(0)}`} tone="#FF9500" />
        <AdminStatChip label="Sales unpaid" value={`$${totalSalesUnpaid.toFixed(0)}`} tone="#5856D6" />
      </AdminStatChipRow>

      <SettingsSection title={tab === 'printers' ? 'Printer payroll' : 'Sales payouts'} compact />
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {loading ? (
          <AppText variant="body" tone="muted" style={styles.empty}>
            Loading…
          </AppText>
        ) : tab === 'printers' ? (
          salaryRecords.length === 0 ? (
            <AppText variant="body" tone="muted" style={styles.empty}>
              No salary records found.
            </AppText>
          ) : (
            <SettingsGroup compact>
            {salaryRecords.map((record, index) => (
              <View key={record.id}>
              <View style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={styles.cardLeft}>
                    <AppText variant="body" weight="semibold">{record.printerName || userMap[record.printerId] || '—'}</AppText>
                    <AppText variant="caption" tone="muted">Period: {record.period}</AppText>
                    <AppText variant="caption" tone="muted">
                      Cards: {record.totalCards ?? 0} total · {record.failedCards ?? 0} failed
                    </AppText>
                  </View>
                  <View style={styles.cardRight}>
                    <AppText variant="body" weight="bold" style={{ color: colors.primary }}>
                      ${(record.total ?? 0).toFixed(2)}
                    </AppText>
                    <AdminStatusPill label={record.status ?? 'unpaid'} tone={payoutTone(record.status ?? 'unpaid')} />
                  </View>
                </View>
                {record.status !== 'paid' && (
                  <Pressable
                    style={[styles.approveBtn, { backgroundColor: colors.surfaceSoft }]}
                    onPress={() => approveSalary(record)}
                  >
                    <AppText variant="caption" weight="semibold" style={{ color: colors.primary }}>
                      Approve and mark paid
                    </AppText>
                  </Pressable>
                )}
              </View>
              {index < salaryRecords.length - 1 ? (
                <View style={[styles.separator, { backgroundColor: colors.border }]} />
              ) : null}
              </View>
            ))}
            </SettingsGroup>
          )
        ) : (
          payouts.length === 0 ? (
            <AppText variant="body" tone="muted" style={styles.empty}>
              No payout records found.
            </AppText>
          ) : (
            <SettingsGroup compact>
            {payouts.map((payout, index) => (
              <View key={payout.id}>
              <View style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={styles.cardLeft}>
                    <AppText variant="body" weight="semibold">{userMap[payout.userId] || payout.userId}</AppText>
                    <AppText variant="caption" tone="muted">Period: {payout.periodLabel}</AppText>
                  </View>
                  <View style={styles.cardRight}>
                    <AppText variant="body" weight="bold" style={{ color: colors.primary }}>
                      ${(payout.amount ?? 0).toFixed(2)}
                    </AppText>
                    <AdminStatusPill label={payout.status ?? 'unpaid'} tone={payoutTone(payout.status ?? 'unpaid')} />
                  </View>
                </View>
                {payout.status !== 'paid' && (
                  <Pressable
                    style={[styles.approveBtn, { backgroundColor: colors.surfaceSoft }]}
                    onPress={() => approvePayout(payout)}
                  >
                    <AppText variant="caption" weight="semibold" style={{ color: colors.primary }}>
                      Approve and mark paid
                    </AppText>
                  </Pressable>
                )}
              </View>
              {index < payouts.length - 1 ? (
                <View style={[styles.separator, { backgroundColor: colors.border }]} />
              ) : null}
              </View>
            ))}
            </SettingsGroup>
          )
        )}
      </ScrollView>
    </AdminScreenShell>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.md,
    borderRadius: theme.radius.lg,
    padding: 4,
    gap: 3,
    ...theme.shadows.control,
  },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: theme.radius.md },
  list: { paddingBottom: theme.spacing.xxl, gap: theme.spacing.sm },
  empty: { textAlign: 'center', marginTop: theme.spacing.xl, paddingHorizontal: theme.spacing.md },
  card: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm + 2, gap: 8 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  cardLeft: { flex: 1, gap: 3 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  approveBtn: { marginHorizontal: theme.spacing.md, borderRadius: theme.radius.sm, paddingVertical: 8, alignItems: 'center' },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: theme.spacing.md },
});
