import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AdminScreenShell } from '@/src/features/admin/components/AdminScreenShell';
import { AppText } from '@/src/components/AppText';
import { theme } from '@/src/constants/theme';
import { useAuth } from '@/src/hooks/useAuth';
import {
  listPrinterHealthRecords,
  upsertPrinterHealthPlaceholder,
} from '@/src/services/productionService';
import { PrinterHealthRecord } from '@/src/types/models';

const STATUS_COLOR: Record<string, string> = {
  online: '#34C759',
  degraded: '#FF9500',
  offline: '#FF3B30',
  unknown: '#8E8E93',
};

export default function AdminPrinterHealthScreen() {
  const { user } = useAuth();
  const [records, setRecords] = useState<PrinterHealthRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRecords(await listPrinterHealthRecords());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function seedPlaceholder() {
    const printerId = `printer_${user?.branch ?? 'main'}_01`;
    try {
      await upsertPrinterHealthPlaceholder(printerId, 'Floor Printer 01', user?.branch ?? '');
      await load();
      Alert.alert('Placeholder saved', 'Telemetry hook can replace this stub later.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not save placeholder.');
    }
  }

  return (
    <AdminScreenShell title="Printer Health">
      <Pressable style={styles.seedBtn} onPress={() => void seedPlaceholder()}>
        <AppText style={styles.seedBtnText}>+ Register placeholder printer</AppText>
      </Pressable>
      <ScrollView contentContainerStyle={styles.list}>
        {loading ? (
          <AppText tone="muted">Loading…</AppText>
        ) : records.length === 0 ? (
          <AppText tone="muted">
            No printers registered. Add a placeholder to show online/offline status here.
          </AppText>
        ) : (
          records.map((rec) => (
            <View key={rec.id} style={styles.card}>
              <View style={styles.cardTop}>
                <AppText style={styles.name}>{rec.printerName || rec.printerId}</AppText>
                <View style={[styles.dot, { backgroundColor: STATUS_COLOR[rec.status] ?? STATUS_COLOR.unknown }]} />
              </View>
              <AppText style={styles.meta}>
                {rec.status.toUpperCase()} · {rec.branch || '—'} · jobs today {rec.jobsToday}
              </AppText>
              <AppText style={styles.meta}>Last seen {new Date(rec.lastSeenAt).toLocaleString()}</AppText>
              {rec.notes ? <AppText style={styles.notes}>{rec.notes}</AppText> : null}
            </View>
          ))
        )}
      </ScrollView>
    </AdminScreenShell>
  );
}

const styles = StyleSheet.create({
  seedBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  seedBtnText: { color: '#fff', fontWeight: '800' },
  list: { padding: 16, paddingBottom: 40, gap: 10 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '800', flex: 1 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  meta: { marginTop: 4, fontSize: 12, color: theme.colors.textMuted },
  notes: { marginTop: 6, fontSize: 11, color: theme.colors.textMuted, fontStyle: 'italic' },
});
