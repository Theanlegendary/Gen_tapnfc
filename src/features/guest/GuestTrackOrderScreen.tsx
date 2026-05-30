import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/src/components/AppButton';
import { AppEmptyState } from '@/src/components/AppState';
import { AppHeader } from '@/src/components/AppHeader';
import { AppText } from '@/src/components/AppText';
import { productTypeOptions } from '@/src/constants/options';
import { appRoutes } from '@/src/constants/navigation';
import { iosDesign } from '@/src/design-system/ios';
import { GuestHintBanner, GuestSurfaceCard, guestUi } from '@/src/features/guest/GuestScreenUi';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { getOrder } from '@/src/services/firestoreService';
import { loadGuestLastOrderId } from '@/src/services/guestDraftService';
import type { Order } from '@/src/types/models';
import { buildOrderTimeline } from '@/src/utils/orderTrackTimeline';

export function GuestTrackOrderScreen() {
  const { user } = useAuth();
  const isGuest = useIsGuest();
  const { requireAccount } = useRequireAccount();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOrder = useCallback(async () => {
    if (isGuest || !user) {
      setOrder(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const orderId =
      (typeof params.orderId === 'string' ? params.orderId : params.orderId?.[0]) ??
      (await loadGuestLastOrderId()) ??
      null;
    if (!orderId) {
      setOrder(null);
      setLoading(false);
      return;
    }
    try {
      const found = await getOrder(orderId);
      setOrder(found);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [isGuest, user, params.orderId]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  if (isGuest) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <AppHeader title="Track order" subtitle="Sign in to view your orders" showBack />
        <AppEmptyState
          iconName="Package"
          title="Orders live in your account"
          description="Sign in to see real order status from Firebase — design, production, QA, and shipping."
        />
        <AppButton
          label="Sign in to track"
          onPress={() =>
            requireAccount(() => router.push(appRoutes.guestTrackOrder), {
              message: 'Sign in to track your NFC card orders.',
            })
          }
        />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const productLabel = order
    ? productTypeOptions.find((p) => p.value === order.productType)?.label ?? order.productType
    : null;
  const timeline = order ? buildOrderTimeline(order) : [];
  const statusLabel = order ? order.status.replace(/_/g, ' ') : '';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppHeader title="Track order" subtitle="Live status from Firebase" showBack />

        {loading ? (
          <ActivityIndicator color={guestUi.accent} style={styles.loader} />
        ) : !order ? (
          <>
            <AppEmptyState
              iconName="Package"
              title="No orders yet"
              description="Place an order from Design your card, then return here to follow production and delivery."
            />
            <AppButton label="Design your card" onPress={() => router.push(appRoutes.guestDesign)} />
          </>
        ) : (
          <>
            <GuestSurfaceCard>
              <AppText style={styles.orderId}>{order.id}</AppText>
              <AppText style={styles.orderProduct}>
                {productLabel} × {order.quantity}
              </AppText>
              <AppText style={styles.orderTotal}>Status: {statusLabel}</AppText>
              <AppText style={styles.orderEta}>
                Placed {new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
              </AppText>
            </GuestSurfaceCard>

            <GuestHintBanner>
              <AppText style={styles.hintBody}>
                Payment: {order.paymentStatus} · {order.currency ?? 'USD'}{' '}
                {order.amount != null ? order.amount.toLocaleString() : '—'}
              </AppText>
            </GuestHintBanner>

            <GuestSurfaceCard title="Timeline">
              {timeline.map((step) => (
                <View key={step.step} style={styles.timelineRow}>
                  <View style={[styles.timelineDot, step.done && styles.timelineDotDone, step.active && styles.timelineDotActive]} />
                  <View style={styles.timelineCopy}>
                    <AppText style={styles.timelineStep}>{step.step}</AppText>
                    <AppText style={styles.timelineAt}>{step.at}</AppText>
                  </View>
                </View>
              ))}
            </GuestSurfaceCard>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: guestUi.bg },
  scroll: {
    padding: iosDesign.spacing.md,
    gap: iosDesign.spacing.md,
    paddingBottom: iosDesign.spacing.xxl,
  },
  loader: { marginTop: 24 },
  orderId: { fontSize: 13, fontWeight: '800', color: guestUi.muted, letterSpacing: 0.4 },
  orderProduct: { fontSize: 17, fontWeight: '800', color: guestUi.text, marginTop: 4 },
  orderTotal: { fontSize: 14, fontWeight: '700', color: guestUi.accent, marginTop: 6 },
  orderEta: { fontSize: 12, fontWeight: '500', color: guestUi.muted, marginTop: 4 },
  hintBody: { fontSize: 12, fontWeight: '500', color: guestUi.muted },
  timelineRow: { flexDirection: 'row', gap: 12, paddingVertical: 10 },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    backgroundColor: guestUi.border,
  },
  timelineDotDone: { backgroundColor: guestUi.accent },
  timelineDotActive: { backgroundColor: '#2563EB' },
  timelineCopy: { flex: 1, gap: 2 },
  timelineStep: { fontSize: 14, fontWeight: '700', color: guestUi.text },
  timelineAt: { fontSize: 12, fontWeight: '500', color: guestUi.muted },
});
