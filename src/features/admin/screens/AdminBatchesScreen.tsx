import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AdminScreenShell } from '@/src/features/admin/components/AdminScreenShell';
import { AppText } from '@/src/components/AppText';
import { batchMaterialOptions, batchPrinterTypeOptions } from '@/src/constants/options';
import { theme } from '@/src/constants/theme';
import { useAuth } from '@/src/hooks/useAuth';
import { useProductionBatches } from '@/src/hooks/useProductionBatches';
import {
  assignOrderToBatch,
  createProductionBatch,
  listPaidOrdersUnbatched,
} from '@/src/services/productionService';

export default function AdminBatchesScreen() {
  const { user } = useAuth();
  const { batches, isLoading } = useProductionBatches();
  const [assigning, setAssigning] = useState<string | null>(null);

  async function handleCreateBatch() {
    if (!user?.id) return;
    try {
      const suffix = String(Date.now()).slice(-4);
      await createProductionBatch({
        batchNumber: `ADM-${suffix}`,
        material: 'wood',
        printerType: 'uv_flatbed',
        branch: user.branch ?? '',
        createdBy: user.id,
      });
      Alert.alert('Batch created', 'Assign paid orders from the list below.');
    } catch (err) {
      Alert.alert('Failed', err instanceof Error ? err.message : 'Try again.');
    }
  }

  async function handleAssign(batchId: string, orderId: string) {
    setAssigning(orderId);
    try {
      await assignOrderToBatch(batchId, orderId, user?.id);
      Alert.alert('Assigned', 'Order added to batch and printer job created.');
    } catch (err) {
      Alert.alert('Assign failed', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setAssigning(null);
    }
  }

  async function showUnbatched(batchId: string) {
    const orders = await listPaidOrdersUnbatched(user?.branch);
    if (orders.length === 0) {
      Alert.alert('No orders', 'No paid unbatched orders available.');
      return;
    }
    const first = orders[0];
    Alert.alert(
      'Assign next paid order',
      `${first.customerName} (${first.cardCode})`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Assign', onPress: () => void handleAssign(batchId, first.id) },
      ]
    );
  }

  return (
    <AdminScreenShell title="Production Batches">
      <Pressable style={styles.createBtn} onPress={() => void handleCreateBatch()}>
        <AppText style={styles.createBtnText}>+ New batch</AppText>
      </Pressable>
      <ScrollView contentContainerStyle={styles.list}>
        {isLoading ? (
          <AppText tone="muted">Loading…</AppText>
        ) : (
          batches.map((batch) => {
            const material =
              batchMaterialOptions.find((m) => m.value === batch.material)?.label ?? batch.material;
            const printer =
              batchPrinterTypeOptions.find((p) => p.value === batch.printerType)?.label ?? batch.printerType;
            return (
              <View key={batch.id} style={styles.card}>
                <AppText style={styles.cardTitle}>{batch.batchNumber}</AppText>
                <AppText style={styles.cardMeta}>
                  {material} · {printer} · {batch.orderIds.length} orders · {batch.status}
                </AppText>
                <Pressable
                  style={styles.assignBtn}
                  onPress={() => void showUnbatched(batch.id)}
                  disabled={assigning !== null}
                >
                  <AppText style={styles.assignBtnText}>Assign paid order</AppText>
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>
    </AdminScreenShell>
  );
}

const styles = StyleSheet.create({
  createBtn: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  createBtnText: { color: '#fff', fontWeight: '800' },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 10 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  cardMeta: { marginTop: 4, fontSize: 12, color: theme.colors.textMuted },
  assignBtn: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  assignBtnText: { fontWeight: '700', color: theme.colors.textPrimary },
});
