import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AdminScreenShell } from '@/src/features/admin/components/AdminScreenShell';
import { AppText } from '@/src/components/AppText';
import { theme } from '@/src/constants/theme';
import { subscribeAuditLogs } from '@/src/services/productionService';
import { AuditLogEntry } from '@/src/types/models';

const ACTION_LABELS: Record<string, string> = {
  batch_created: 'Batch created',
  batch_active: 'Batch activated',
  batch_paused: 'Batch paused',
  batch_completed: 'Batch completed',
  batch_cancelled: 'Batch cancelled',
  order_assigned_to_batch: 'Order assigned to batch',
  qa_passed: 'QA passed',
  qa_failed: 'QA failed',
  reprint_created: 'Reprint job created',
  order_shipped: 'Order shipped',
  bulk_orders_imported: 'Bulk CSV import',
};

function formatAction(action: string) {
  return ACTION_LABELS[action] ?? action.replace(/_/g, ' ');
}

export default function AdminAuditLogsScreen() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    return subscribeAuditLogs(setLogs);
  }, []);

  return (
    <AdminScreenShell title="Audit Logs">
      <ScrollView contentContainerStyle={styles.list}>
        {logs.length === 0 ? (
          <AppText tone="muted">No audit entries yet.</AppText>
        ) : (
          logs.slice(0, 200).map((log) => (
            <View key={log.id} style={styles.row}>
              <AppText style={styles.action}>{formatAction(log.action)}</AppText>
              <AppText style={styles.meta}>
                {log.entityType} · {log.entityId.slice(0, 10)}
                {log.metadata?.batchId ? ` · batch ${String(log.metadata.batchId).slice(0, 8)}` : ''}
                {log.metadata?.reason ? ` · ${String(log.metadata.reason)}` : ''}
              </AppText>
              <AppText style={styles.time}>{new Date(log.createdAt).toLocaleString()}</AppText>
            </View>
          ))
        )}
      </ScrollView>
    </AdminScreenShell>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 40, gap: 8 },
  row: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  action: { fontWeight: '800', fontSize: 14 },
  meta: { marginTop: 4, fontSize: 12, color: theme.colors.textMuted },
  time: { marginTop: 4, fontSize: 11, color: theme.colors.textMuted },
});
