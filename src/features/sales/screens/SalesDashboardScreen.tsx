import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppEmptyState, AppLoadingState } from '@/src/components/AppState';
import { AppText } from '@/src/components/AppText';
import { appRoutes } from '@/src/constants/navigation';
import { productTypeOptions } from '@/src/constants/options';
import { theme } from '@/src/constants/theme';
import { SalesBulkUpload } from '@/src/features/sales/components/SalesBulkUpload';
import { salesUi } from '@/src/features/sales/components/SalesScreenUi';
import { useAuth } from '@/src/hooks/useAuth';
import { useNotifications } from '@/src/hooks/useNotifications';
import { useOrders } from '@/src/hooks/useOrders';
import { Order } from '@/src/types/models';

const HERO_BG = '#1a1a2e';
const AMBER_CARD = '#C96A00';
const BLUE_CARD = '#1A55C4';
const ACCENT_ORANGE = '#FF9500';
const SEP = 'rgba(60,60,67,0.11)';

function orderAmount(order: Order) {
  const product = productTypeOptions.find((item) => item.value === order.productType);
  return order.quantity * (product?.price ?? 49);
}

function formatMoney(value: number) {
  return value.toFixed(2);
}

function formatToday() {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

type NfcBadgeKind = 'pending' | 'verified' | 'failed' | 'none';

function nfcBadgeKind(order: Order): NfcBadgeKind {
  if (order.nfcEnabled === false) return 'none';
  if (order.status === 'delivered' || order.status === 'ready') return 'verified';
  if (order.status === 'nfc_verification') return 'verified';
  if ((order.cardStatus ?? 'active') === 'closed') return 'failed';
  return 'pending';
}

function EarningsPanel({
  unrealized,
  commission,
  unrealizedCount,
  commissionCount,
  onPress,
}: {
  unrealized: number;
  commission: number;
  unrealizedCount: number;
  commissionCount: number;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.earningsCombo} onPress={onPress}>
      <View style={[styles.earningsHalf, styles.earningsHalfAmber]}>
        <View style={styles.earningsHalfTop}>
          <AppText style={styles.earningsLabel}>Unrealized</AppText>
          <View style={styles.earningsPill}>
            <AppText style={styles.earningsPillText}>{unrealizedCount}</AppText>
          </View>
        </View>
        <View style={styles.earningsAmountRow}>
          <AppText style={styles.earningsCurrencyOrange}>$</AppText>
          <AppText style={styles.earningsAmount}>{formatMoney(unrealized)}</AppText>
        </View>
      </View>

      <View style={styles.earningsDivider} />

      <View style={[styles.earningsHalf, styles.earningsHalfBlue]}>
        <View style={styles.earningsHalfTop}>
          <AppText style={styles.earningsLabel}>Commission</AppText>
          <View style={styles.earningsPill}>
            <AppText style={styles.earningsPillText}>{commissionCount}</AppText>
          </View>
        </View>
        <View style={styles.earningsAmountRow}>
          <AppText style={styles.earningsCurrency}>$</AppText>
          <AppText style={styles.earningsAmount}>{formatMoney(commission)}</AppText>
        </View>
      </View>

      <View style={styles.earningsFooter}>
        <AppText style={styles.earningsFooterText}>View Account</AppText>
        <AppIcon name="ChevronRight" size={12} color="rgba(255,255,255,0.85)" />
      </View>
    </Pressable>
  );
}

function OrderCard({ order }: { order: Order }) {
  const product = productTypeOptions.find((item) => item.value === order.productType);
  const productLabel = product?.label ?? order.productType?.replace(/_/g, ' ') ?? 'card';
  const nfc = nfcBadgeKind(order);

  return (
    <Pressable
      style={({ pressed }) => [styles.orderCard, pressed && styles.orderCardPressed]}
      onPress={() => router.push({ pathname: appRoutes.orderDetail, params: { orderId: order.id } })}
    >
      <View style={styles.orderTop}>
        <View style={styles.orderLeft}>
          <AppText style={styles.orderId}>#{order.id.slice(0, 6).toUpperCase()}</AppText>
          <AppText style={styles.orderName} numberOfLines={1}>
            {order.customerName}
          </AppText>
        </View>
        <AppText style={styles.orderAmount}>${formatMoney(orderAmount(order))}</AppText>
      </View>
      <View style={styles.orderMeta}>
        <AppText style={styles.orderType} numberOfLines={1}>
          {productLabel.toLowerCase()} · {order.cardCode}
        </AppText>
        {nfc !== 'none' ? (
          <View
            style={[
              styles.nfcBadge,
              nfc === 'verified' && styles.nfcVerified,
              nfc === 'pending' && styles.nfcPending,
              nfc === 'failed' && styles.nfcFailed,
            ]}
          >
            <AppIcon
              name={nfc === 'verified' ? 'BadgeCheck' : nfc === 'failed' ? 'X' : 'Nfc'}
              size={12}
              color={nfc === 'verified' ? '#34C759' : nfc === 'failed' ? '#FF3B30' : ACCENT_ORANGE}
            />
            <AppText
              style={[
                styles.nfcBadgeText,
                nfc === 'verified' && styles.nfcVerifiedText,
                nfc === 'pending' && styles.nfcPendingText,
                nfc === 'failed' && styles.nfcFailedText,
              ]}
            >
              {nfc === 'verified' ? 'NFC Verified' : nfc === 'failed' ? 'NFC Failed' : 'NFC Pending'}
            </AppText>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function SalesDashboardScreen() {
  const { user } = useAuth();
  const { orders, isLoading, refresh } = useOrders('sales', user?.id ?? '');
  const { unreadCount } = useNotifications();

  useEffect(() => {
    refresh();
  }, [refresh]);

  const unpaidOrders = useMemo(
    () => orders.filter((order) => order.paymentStatus !== 'paid'),
    [orders]
  );
  const paidOrders = useMemo(
    () => orders.filter((order) => order.paymentStatus === 'paid'),
    [orders]
  );
  const unrealized = useMemo(
    () => unpaidOrders.reduce((sum, order) => sum + orderAmount(order), 0),
    [unpaidOrders]
  );
  const realized = useMemo(
    () => paidOrders.reduce((sum, order) => sum + orderAmount(order), 0),
    [paidOrders]
  );
  const activeOrders = useMemo(
    () =>
      orders.filter(
        (order) => order.status !== 'delivered' && (order.cardStatus ?? 'active') !== 'closed'
      ),
    [orders]
  );
  const pipeline = useMemo(() => activeOrders.slice(0, 15), [activeOrders]);
  const ordersToday = useMemo(() => {
    const today = new Date().toDateString();
    return orders.filter((o) => new Date(o.createdAt).toDateString() === today).length;
  }, [orders]);

  const recommendation =
    activeOrders.length > 0
      ? {
          title: `${activeOrders.length} active order${activeOrders.length === 1 ? '' : 's'}`,
          subtitle:
            unrealized > 0
              ? 'Review unpaid work and follow up on delivery...'
              : 'Keep the pipeline moving to delivery.',
          route: appRoutes.sales.orders,
        }
      : {
          title: 'Ready for the next customer',
          subtitle: 'Create an order with fulfilment details in one flow.',
          route: appRoutes.sales.newOrder,
        };

  return (
    <View style={styles.safe}>
      <SafeAreaView edges={['top']} style={styles.heroSafe}>
        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <View style={styles.heroGlow2} />

          <View style={styles.heroTop}>
            <View style={styles.roleRow}>
              <View style={styles.roleDot} />
              <AppText style={styles.roleTxt}>Sales Rep · Active</AppText>
            </View>
            <View style={styles.heroActions}>
              <Pressable
                style={styles.iconBtn}
                onPress={() => router.push(appRoutes.sales.orders)}
                hitSlop={8}
              >
                <AppIcon name="Search" size={17} color="rgba(255,255,255,0.85)" />
              </Pressable>
              <Pressable
                style={styles.iconBtn}
                onPress={() => router.push(appRoutes.sales.notifications)}
                hitSlop={8}
              >
                <AppIcon name="Bell" size={17} color="rgba(255,255,255,0.85)" />
                {unreadCount > 0 ? <View style={styles.notifDot} /> : null}
              </Pressable>
            </View>
          </View>

          <AppText style={styles.heroName} numberOfLines={1}>
            {user?.displayName ?? 'Sales'}
          </AppText>
          <AppText style={styles.heroSub}>{formatToday()}</AppText>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.heroTags}
          >
            <View style={styles.heroTag}>
              <AppIcon name="TrendingUp" size={12} color="rgba(255,255,255,0.6)" />
              <AppText style={styles.heroTagText}>
                {ordersToday} today
              </AppText>
            </View>
            <View style={styles.heroTag}>
              <AppIcon name="MapPin" size={12} color="rgba(255,255,255,0.6)" />
              <AppText style={styles.heroTagText}>Phnom Penh</AppText>
            </View>
            <View style={styles.heroTag}>
              <AppIcon name="Nfc" size={12} color="rgba(255,255,255,0.6)" />
              <AppText style={styles.heroTagText}>NFC Ready</AppText>
            </View>
          </ScrollView>

          <EarningsPanel
            unrealized={unrealized}
            commission={realized}
            unrealizedCount={unpaidOrders.length}
            commissionCount={paidOrders.length}
            onPress={() => router.push(appRoutes.sales.payouts)}
          />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <Pressable
          style={({ pressed }) => [styles.recommendCard, pressed && styles.pressed]}
          onPress={() => router.push(recommendation.route)}
        >
          <View style={styles.recIcon}>
            <AppIcon name="ClipboardList" size={20} color={ACCENT_ORANGE} />
          </View>
          <View style={styles.recBody}>
            <AppText style={styles.recTop}>Recommended</AppText>
            <AppText style={styles.recTitle}>{recommendation.title}</AppText>
            <AppText style={styles.recSub} numberOfLines={1}>
              {recommendation.subtitle}
            </AppText>
          </View>
          <AppIcon name="ChevronRight" size={18} color="rgba(60,60,67,0.28)" />
        </Pressable>

        <View style={styles.sectionHeader}>
          <AppText style={styles.secTitle}>Pipeline</AppText>
          <Pressable onPress={() => router.push(appRoutes.sales.orders)} hitSlop={10}>
            <AppText style={styles.secLink}>See all</AppText>
          </Pressable>
        </View>

        {isLoading ? (
          <AppLoadingState title="Loading pipeline..." role="sales" />
        ) : pipeline.length === 0 ? (
          <AppEmptyState
            title="No active orders"
            description="Create a new order to start the sales workflow."
            iconName="ClipboardList"
            role="sales"
          />
        ) : (
          <View style={styles.pipeline}>
            {pipeline.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </View>
        )}

        <SalesBulkUpload />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: salesUi.bg,
  },
  heroSafe: {
    backgroundColor: HERO_BG,
  },
  hero: {
    backgroundColor: HERO_BG,
    paddingHorizontal: 16,
    paddingBottom: 12,
    overflow: 'hidden',
    gap: 8,
  },
  heroGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(100,120,255,0.12)',
    top: -80,
    right: -60,
  },
  heroGlow2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(26,85,196,0.15)',
    bottom: -20,
    left: -30,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#34C759',
  },
  roleTxt: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    borderWidth: 1.5,
    borderColor: HERO_BG,
  },
  heroName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.8,
    lineHeight: 30,
  },
  heroSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.42)',
    marginTop: 2,
  },
  heroTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  heroTagText: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.65)',
  },
  earningsCombo: {
    borderRadius: 14,
    overflow: 'hidden',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  earningsHalf: {
    width: '50%',
    paddingHorizontal: 11,
    paddingTop: 9,
    paddingBottom: 7,
    minHeight: 64,
    justifyContent: 'space-between',
  },
  earningsHalfAmber: {
    backgroundColor: AMBER_CARD,
  },
  earningsHalfBlue: {
    backgroundColor: BLUE_CARD,
  },
  earningsDivider: {
    position: 'absolute',
    left: '50%',
    top: 8,
    bottom: 30,
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginLeft: -StyleSheet.hairlineWidth,
  },
  earningsHalfTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.78)',
  },
  earningsPill: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  earningsPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  earningsAmountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  earningsCurrencyOrange: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFD080',
    lineHeight: 22,
    marginRight: 1,
  },
  earningsCurrency: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
    marginRight: 1,
  },
  earningsAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.6,
    lineHeight: 22,
  },
  earningsFooter: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  earningsFooterText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.88)',
  },
  body: { flex: 1 },
  bodyContent: {
    paddingBottom: 120,
    gap: 0,
  },
  recommendCard: {
    backgroundColor: salesUi.surface,
    borderRadius: salesUi.radiusMd,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: salesUi.border,
    ...salesUi.shadow,
  },
  recIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recBody: { flex: 1, minWidth: 0 },
  recTop: {
    fontSize: 11,
    color: 'rgba(60,60,67,0.6)',
    marginBottom: 1,
  },
  recTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    letterSpacing: -0.2,
  },
  recSub: {
    fontSize: 11,
    color: 'rgba(60,60,67,0.6)',
    marginTop: 1,
  },
  pressed: { opacity: 0.88 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 10,
  },
  secTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.4,
  },
  secLink: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  pipeline: {
    paddingHorizontal: 16,
    gap: 10,
  },
  orderCard: {
    backgroundColor: salesUi.surface,
    borderRadius: salesUi.radiusMd,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: salesUi.border,
    ...salesUi.shadow,
  },
  orderCardPressed: { backgroundColor: '#FAFAFA' },
  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  orderLeft: { flex: 1, minWidth: 0, paddingRight: 8 },
  orderId: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(60,60,67,0.6)',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  orderName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    letterSpacing: -0.2,
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: ACCENT_ORANGE,
    letterSpacing: -0.5,
  },
  orderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 9,
    gap: 8,
  },
  orderType: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(60,60,67,0.6)',
  },
  nfcBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  nfcPending: { backgroundColor: '#FFF8F0' },
  nfcVerified: { backgroundColor: '#F0FFF5' },
  nfcFailed: { backgroundColor: '#FFF0F0' },
  nfcBadgeText: { fontSize: 11, fontWeight: '600' },
  nfcPendingText: { color: ACCENT_ORANGE },
  nfcVerifiedText: { color: '#34C759' },
  nfcFailedText: { color: '#FF3B30' },
});
