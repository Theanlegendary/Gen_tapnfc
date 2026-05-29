import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { AppEmptyState } from '@/src/components/AppState';
import { theme } from '@/src/constants/theme';
import { useAuth } from '@/src/hooks/useAuth';
import { listOrdersReadyToShip, markOrderDelivered, markOrderShipped } from '@/src/services/productionService';
import { Order } from '@/src/types/models';

export default function ShippingQueueScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrders(await listOrdersReadyToShip(user?.branch));
    } finally {
      setLoading(false);
    }
  }, [user?.branch]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleShip(order: Order) {
    try {
      if (order.status === 'shipped') {
        await markOrderDelivered(order.id, user?.id);
      } else {
        await markOrderShipped(order.id, undefined, user?.id);
      }
      await load();
    } catch (err) {
      Alert.alert('Update failed', err instanceof Error ? err.message : 'Try again.');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <AppText style={styles.title}>Shipping</AppText>
        <AppText style={styles.sub}>Mark shipped and track delivery</AppText>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {loading ? (
          <AppText tone="muted">Loading…</AppText>
        ) : orders.length === 0 ? (
          <AppEmptyState
            role="sales"
            iconName="Truck"
            title="Nothing to ship"
            description="Orders will appear here after QA passes."
          />
        ) : (
          orders.map((order) => (
            <View key={order.id} style={styles.card}>
              <AppText style={styles.cardTitle}>{order.customerName}</AppText>
              <AppText style={styles.cardMeta}>
                {order.deliveryAddress || 'No address'} · {order.status.replace(/_/g, ' ')}
              </AppText>
              <Pressable style={styles.shipBtn} onPress={() => void handleShip(order)}>
                <AppIcon name="Truck" size={16} color="#fff" />
                <AppText style={styles.shipBtnText}>
                  {order.status === 'shipped' ? 'Mark delivered' : 'Mark shipped'}
                </AppText>
              </Pressable>
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
  shipBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  shipBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
});
