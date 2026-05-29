import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { AppEmptyState } from '@/src/components/AppState';
import { theme } from '@/src/constants/theme';
import { getPrinterJobByOrderId } from '@/src/services/firestoreService';
import { listOrdersAwaitingQa, submitQaDecision } from '@/src/services/productionService';
import { Order } from '@/src/types/models';

export default function QaQueueScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrders(await listOrdersAwaitingQa());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDecision(order: Order, decision: 'pass' | 'fail') {
    try {
      const job = await getPrinterJobByOrderId(order.id);
      if (!job) {
        Alert.alert('No job', 'Printer job not found for this order.');
        return;
      }
      const reason = decision === 'fail' ? 'Visual QA failed' : undefined;
      await submitQaDecision(order.id, job.id, decision, reason);
      await load();
    } catch (err) {
      Alert.alert('QA update failed', err instanceof Error ? err.message : 'Try again.');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <AppText style={styles.title}>QA Queue</AppText>
        <AppText style={styles.sub}>Pass or fail — no production steps</AppText>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {loading ? (
          <AppText tone="muted">Loading…</AppText>
        ) : orders.length === 0 ? (
          <AppEmptyState
            role="sales"
            iconName="ShieldCheck"
            title="All clear"
            description="No orders awaiting QA inspection."
          />
        ) : (
          orders.map((order) => (
            <View key={order.id} style={styles.card}>
              <AppText style={styles.cardTitle}>{order.customerName}</AppText>
              <AppText style={styles.cardMeta}>
                {order.cardCode} · {order.productType.replace(/_/g, ' ')} × {order.quantity}
              </AppText>
              <View style={styles.actions}>
                <Pressable
                  style={[styles.btn, styles.failBtn]}
                  onPress={() => void handleDecision(order, 'fail')}
                >
                  <AppIcon name="X" size={16} color="#fff" />
                  <AppText style={styles.btnText}>Fail → Reprint</AppText>
                </Pressable>
                <Pressable
                  style={[styles.btn, styles.passBtn]}
                  onPress={() => void handleDecision(order, 'pass')}
                >
                  <AppIcon name="BadgeCheck" size={16} color="#fff" />
                  <AppText style={styles.btnText}>Pass</AppText>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: theme.colors.textPrimary },
  sub: { fontSize: 13, color: theme.colors.textMuted, marginTop: 4 },
  body: { padding: 16, paddingBottom: 80, gap: 10 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  cardMeta: { marginTop: 4, fontSize: 12, color: theme.colors.textMuted },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  passBtn: { backgroundColor: theme.status.success },
  failBtn: { backgroundColor: theme.status.error },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
});
