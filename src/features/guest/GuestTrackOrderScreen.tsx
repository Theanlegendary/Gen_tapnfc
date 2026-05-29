import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/src/components/AppButton';
import { AppHeader } from '@/src/components/AppHeader';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { GUEST_DEMO_ORDER, GUEST_DEMO_ORDER_ID } from '@/src/constants/guestDemo';
import { productTypeOptions } from '@/src/constants/options';
import { appRoutes } from '@/src/constants/navigation';
import { iosDesign } from '@/src/design-system/ios';
import {
  GuestDemoPill,
  GuestHintBanner,
  GuestSurfaceCard,
  guestUi,
} from '@/src/features/guest/GuestScreenUi';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { getOrder } from '@/src/services/firestoreService';
import { loadGuestLastOrderId } from '@/src/services/guestDraftService';
import type { Order } from '@/src/types/models';
import { buildOrderTimeline } from '@/src/utils/orderTrackTimeline';

export function GuestTrackOrderScreen() {
  const { user } = useAuth();
  const isGuest = useIsGuest();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(!isGuest);

  const loadOrder = useCallback(async () => {
    if (isGuest) {
      setOrder(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const orderId = (typeof params.orderId === 'string' ? params.orderId : params.orderId?.[0])
      ?? (await loadGuestLastOrderId())
      ?? null;
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
  }, [isGuest, params.orderId]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  const demo = GUEST_DEMO_ORDER;
  const productLabel = order
    ? productTypeOptions.find((p) => p.value === order.productType)?.label ?? order.productType
    : demo.productLabel;
  const quantity = order?.quantity ?? demo.quantity;
  const orderIdDisplay = order?.id ?? GUEST_DEMO_ORDER_ID;
  const timeline = order ? buildOrderTimeline(order) : demo.timeline;
  const statusLabel = order
    ? order.status.replace(/_/g, ' ')
    : 'in production';
  const isDemo = isGuest || !order;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppHeader
          title="Track order"
          subtitle={isDemo ? 'Demo timeline — read only' : 'Your order status'}
          showBack
        />

        {loading ? (
          <ActivityIndicator color={guestUi.accent} style={styles.loader} />
        ) : (
          <GuestSurfaceCard>
            <View style={styles.orderHeader}>
              {isDemo ? <GuestDemoPill label="DEMO" /> : <GuestDemoPill label="YOUR ORDER" />}
              <AppText style={styles.orderId}>{orderIdDisplay}</AppText>
            </View>
            <AppText style={styles.orderProduct}>
              {productLabel} × {quantity}
            </AppText>
            <AppText style={styles.orderTotal}>
              {order ? `Status: ${statusLabel}` : `$${demo.total} · In production`}
            </AppText>
            {!isDemo && order ? (
              <AppText style={styles.orderEta}>
                Placed {new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
              </AppText>
            ) : (
              <AppText style={styles.orderEta}>Est. delivery {demo.eta}</AppText>
            )}
          </GuestSurfaceCard>
        )}

        <GuestHintBanner>
          <AppText style={styles.hintBody}>
            {isDemo
              ? 'This is sample production status. Sign in and finish your design to track a real order.'
              : 'Updates appear here as your card moves through design, print, and delivery.'}
          </AppText>
        </GuestHintBanner>

        <GuestSurfaceCard title="Timeline">
          {timeline.map((item, index) => {
            const isLast = index === timeline.length - 1;
            const active = 'active' in item && item.active;
            return (
              <View key={`${item.step}-${index}`} style={styles.timelineRow}>
                <View style={styles.timelineIconCol}>
                  <View
                    style={[
                      styles.timelineDot,
                      item.done && styles.timelineDotDone,
                      active && styles.timelineDotActive,
                    ]}
                  >
                    {item.done ? <AppIcon name="ShieldCheck" size={12} color="#fff" /> : null}
                  </View>
                  {!isLast ? <View style={styles.timelineLine} /> : null}
                </View>
                <View style={styles.timelineCopy}>
                  <AppText style={[styles.timelineStep, active && styles.timelineStepActive]}>{item.step}</AppText>
                  <AppText style={styles.timelineAt}>{item.at}</AppText>
                </View>
              </View>
            );
          })}
        </GuestSurfaceCard>

        <AppButton label="Design another card" variant="outline" onPress={() => router.push(appRoutes.guestDesign)} />
        {isDemo ? (
          <AppButton label="Sign in to keep your design" onPress={() => router.push(appRoutes.login)} />
        ) : order ? (
          <AppButton
            label="View order details"
            variant="outline"
            onPress={() =>
              router.push({ pathname: appRoutes.orderDetail, params: { orderId: order.id } })
            }
          />
        ) : null}
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
  loader: { marginVertical: iosDesign.spacing.lg },
  orderHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  orderId: { fontSize: 13, fontWeight: '800', color: guestUi.muted, letterSpacing: 0.5 },
  orderProduct: { fontSize: 18, fontWeight: '800', color: guestUi.text },
  orderTotal: { fontSize: 14, fontWeight: '600', color: guestUi.accent, marginTop: 4 },
  orderEta: { fontSize: 12, fontWeight: '500', color: guestUi.muted, marginTop: 2 },
  hintBody: { fontSize: 12, fontWeight: '500', color: guestUi.muted, lineHeight: 17 },
  timelineRow: {
    flexDirection: 'row',
    gap: iosDesign.spacing.md,
    paddingVertical: iosDesign.spacing.sm,
  },
  timelineIconCol: { alignItems: 'center', width: 28 },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: guestUi.border,
    backgroundColor: guestUi.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotDone: {
    backgroundColor: guestUi.accent,
    borderColor: guestUi.accent,
  },
  timelineDotActive: {
    borderColor: guestUi.accent,
    borderWidth: 3,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    minHeight: 24,
    backgroundColor: guestUi.border,
    marginTop: 4,
  },
  timelineCopy: { flex: 1, gap: 2, paddingBottom: iosDesign.spacing.sm },
  timelineStep: { fontSize: 15, fontWeight: '700', color: guestUi.text },
  timelineStepActive: { color: guestUi.accent },
  timelineAt: { fontSize: 12, fontWeight: '500', color: guestUi.muted },
});
