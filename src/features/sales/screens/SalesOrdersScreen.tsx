import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppEmptyState } from '@/src/components/AppState';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { appRoutes } from '@/src/constants/navigation';
import { orderStatusOptions, productTypeOptions } from '@/src/constants/options';
import { formatOrderTotal } from '@/src/utils/orderPricing';
import { theme } from '@/src/constants/theme';
import { SalesSegment, salesUi } from '@/src/features/sales/components/SalesScreenUi';
import { useAuth } from '@/src/hooks/useAuth';
import { useOrders } from '@/src/hooks/useOrders';
import { useSearchQuery } from '@/src/hooks/useSearchQuery';
import { Order } from '@/src/types/models';

const HERO_BG = '#1a1a2e';
const ACCENT_ORANGE = '#FF9500';

type OrderFilterKey = 'all' | 'pending' | 'active' | 'done';
type SegmentLabel = 'All' | 'Pending' | 'Active' | 'Done';

const SEGMENT_TO_FILTER: Record<SegmentLabel, OrderFilterKey> = {
  All: 'all',
  Pending: 'pending',
  Active: 'active',
  Done: 'done',
};

const FILTER_TO_SEGMENT: Record<OrderFilterKey, SegmentLabel> = {
  all: 'All',
  pending: 'Pending',
  active: 'Active',
  done: 'Done',
};

const ORDER_FILTERS: { key: OrderFilterKey; statuses?: Order['status'][] }[] = [
  { key: 'all' },
  { key: 'pending', statuses: ['new', 'design'] },
  { key: 'active', statuses: ['printing', 'nfc_writing', 'nfc_verification'] },
  { key: 'done', statuses: ['ready', 'delivered'] },
];

function moneyLabel(order: Order) {
  return formatOrderTotal(order);
}

function statusPill(order: Order) {
  if (order.status === 'delivered' || order.status === 'ready') {
    return { label: 'Done', color: '#16A34A', bg: '#ECFDF3' };
  }
  if (order.status === 'new' || order.status === 'design') {
    return { label: 'Pending', color: '#EA580C', bg: '#FFF7ED' };
  }
  return { label: 'Active', color: '#2563EB', bg: '#EFF6FF' };
}

function OrderCard({ order }: { order: Order }) {
  const product = productTypeOptions.find((item) => item.value === order.productType);
  const productName = product?.label ?? order.productType?.replace(/_/g, ' ') ?? 'Card';
  const pill = statusPill(order);

  return (
    <Pressable
      style={({ pressed }) => [styles.orderCard, pressed && styles.orderCardPressed]}
      onPress={() => router.push({ pathname: appRoutes.orderDetail, params: { orderId: order.id } })}
    >
      <View style={styles.orderIconWrap}>
        <AppIcon name="ClipboardList" size={18} color="#64748B" />
      </View>
      <View style={styles.orderMain}>
        <View style={styles.orderTop}>
          <View style={styles.orderCopy}>
            <AppText style={styles.orderOverline}>ORDER #{order.id.slice(0, 6).toUpperCase()}</AppText>
            <AppText style={styles.orderName} numberOfLines={1}>
              {order.customerName}
            </AppText>
          </View>
          <View style={[styles.statusPill, { backgroundColor: pill.bg }]}>
            <AppText style={[styles.statusPillText, { color: pill.color }]}>{pill.label}</AppText>
          </View>
        </View>
        <View style={styles.orderBottom}>
          <AppText style={styles.orderMeta} numberOfLines={1}>
            {productName} · {order.paymentStatus}
          </AppText>
          <AppText style={styles.orderAmount}>{moneyLabel(order)}</AppText>
        </View>
      </View>
    </Pressable>
  );
}

function includesLoose(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function orderMatchesQuery(order: Order, query: string) {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  const statusLabel = orderStatusOptions.find((o) => o.value === order.status)?.label ?? order.status;

  return (
    includesLoose(order.id, q)
    || includesLoose(order.id.slice(0, 8), q)
    || includesLoose(order.customerName ?? '', q)
    || includesLoose(order.phone ?? '', q)
    || includesLoose(order.cardCode ?? '', q)
    || includesLoose(order.status ?? '', q)
    || includesLoose(statusLabel, q)
  );
}

export default function SalesOrdersScreen() {
  const { user } = useAuth();
  const { orders, isLoading, refresh } = useOrders('sales', user?.id ?? '');
  const { input, setInput, query, submitSearch, clearSearch } = useSearchQuery();
  const [filter, setFilter] = useState<OrderFilterKey>('all');

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      const statuses = ORDER_FILTERS.find((f) => f.key === filter)?.statuses;
      const statusOk = !statuses || statuses.includes(order.status);
      return statusOk && orderMatchesQuery(order, query);
    });
  }, [filter, orders, query]);

  const segment = FILTER_TO_SEGMENT[filter];

  return (
    <View style={styles.safe}>
      <SafeAreaView edges={['top']} style={styles.heroSafe}>
        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <View style={styles.heroTop}>
            <View style={styles.roleLbl}>
              <AppIcon name="TrendingUp" size={13} color="rgba(255,255,255,0.45)" />
              <AppText style={styles.roleTxt}>Sales</AppText>
            </View>
            <Pressable
              style={styles.heroActionBtn}
              onPress={() => router.push(appRoutes.sales.newOrder)}
              hitSlop={8}
            >
              <AppIcon name="Plus" size={20} color="rgba(255,255,255,0.9)" />
            </Pressable>
          </View>

          <AppText style={styles.pageTitle}>Orders</AppText>
          <View style={styles.heroStatsRow}>
            <AppText style={styles.heroSub}>Track customer orders and delivery</AppText>
            <View style={styles.heroCountWrap}>
              <AppText style={styles.heroCountNum}>{orders.length}</AppText>
              <AppText style={styles.heroCountLabel}>Total</AppText>
            </View>
          </View>

          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <AppIcon name="Search" size={16} color="rgba(255,255,255,0.45)" />
              <TextInput
                value={input}
                onChangeText={setInput}
                onSubmitEditing={submitSearch}
                placeholder="Search orders"
                placeholderTextColor="rgba(255,255,255,0.35)"
                returnKeyType="search"
                style={styles.searchInput}
              />
              {input.length > 0 ? (
                <Pressable onPress={clearSearch} hitSlop={8}>
                  <AppIcon name="X" size={14} color="rgba(255,255,255,0.45)" />
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.tabsWrap}>
        <SalesSegment
          items={['All', 'Pending', 'Active', 'Done'] as SegmentLabel[]}
          active={segment}
          onChange={(label) => setFilter(SEGMENT_TO_FILTER[label])}
        />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <View style={styles.listHeader}>
          <AppText style={styles.listTitle}>Order list</AppText>
          <AppText style={styles.listCount}>{filtered.length} visible</AppText>
        </View>

        {isLoading && filtered.length === 0 ? (
          <View style={styles.stateWrap}>
            <ActivityIndicator color={salesUi.accent} />
            <AppText style={styles.loadingText}>Loading orders...</AppText>
          </View>
        ) : filtered.length === 0 ? (
          <AppEmptyState
            role="sales"
            iconName="ClipboardList"
            title={query ? 'No matching orders' : 'No orders yet'}
            description={
              query
                ? `No results for "${query}". Try a different keyword or switch filters.`
                : 'Create the first customer order from this sales account.'
            }
          />
        ) : (
          <View style={styles.orderList}>
            {filtered.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </View>
        )}
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
    paddingHorizontal: 20,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(48,209,88,0.1)',
    top: -60,
    right: -50,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  roleLbl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  roleTxt: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.45)',
  },
  heroActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1.2,
    lineHeight: 32,
    marginBottom: 4,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  heroSub: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    paddingRight: 12,
  },
  heroCountWrap: {
    alignItems: 'flex-end',
    gap: 1,
  },
  heroCountNum: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 20,
  },
  heroCountLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    padding: 0,
  },
  tabsWrap: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
    backgroundColor: salesUi.bg,
  },
  body: { flex: 1 },
  bodyContent: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 120,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: salesUi.text,
  },
  listCount: {
    fontSize: 12,
    fontWeight: '700',
    color: salesUi.muted,
  },
  orderList: {
    gap: 10,
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: salesUi.surface,
    borderRadius: salesUi.radiusMd,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: salesUi.border,
    ...salesUi.shadow,
  },
  orderCardPressed: {
    opacity: 0.88,
  },
  orderIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#F4F6FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderMain: {
    flex: 1,
    minWidth: 0,
  },
  orderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  orderCopy: {
    flex: 1,
    minWidth: 0,
  },
  orderOverline: {
    fontSize: 11,
    fontWeight: '700',
    color: salesUi.muted,
  },
  orderName: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: '800',
    color: salesUi.text,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  orderBottom: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  orderMeta: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: salesUi.muted,
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: ACCENT_ORANGE,
  },
  stateWrap: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: salesUi.muted,
    fontWeight: '600',
  },
});
