import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppSearchBar } from '@/src/components/AppSearchBar';
import { AppText } from '@/src/components/AppText';
import { SettingsGroup, SettingsSection } from '@/src/components/SettingsGroup';
import { orderCardStatusOptions, orderStatusOptions } from '@/src/constants/options';
import { theme } from '@/src/constants/theme';
import {
  AdminScreenShell,
  AdminStatusPill,
} from '@/src/features/admin/components/AdminScreenShell';
import { searchEmptyMessage, useSearchQuery } from '@/src/hooks/useSearchQuery';
import { usePreferences } from '@/src/hooks/usePreferences';
import { updateOrderStatus } from '@/src/services/firestoreService';
import { getAuthErrorMessage } from '@/src/services/authService';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/src/services/firebaseClient';
import { Order } from '@/src/types/models';
import { getNextOrderStatus } from '@/src/utils/orderStatusFlow';

function paymentTone(status: string): 'success' | 'warning' | 'neutral' {
  if (status === 'paid') return 'success';
  if (status === 'pending') return 'warning';
  return 'neutral';
}

export default function AdminOrdersScreen() {
  const { colors } = usePreferences();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { input: searchInput, setInput: setSearchInput, query: searchQuery, submitSearch, clearSearch } =
    useSearchQuery();
  const [filterStatus, setFilterStatus] = useState('all');

  async function load() {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
      const nextOrders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
      setOrders(nextOrders);
    } catch {
      // keep empty
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function advanceStatus(order: Order) {
    const next = getNextOrderStatus(order.status);
    if (!next) return;
    Alert.alert('Advance order?', `Move ${order.customerName} to ${next}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Advance',
        onPress: async () => {
          try {
            await updateOrderStatus(order.id, next);
            setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: next } : o)));
          } catch (err) {
            Alert.alert('Update failed', getAuthErrorMessage(err));
          }
        },
      },
    ]);
  }

  const filtered = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      o.customerName?.toLowerCase().includes(q) ||
      o.cardCode?.toLowerCase().includes(q) ||
      o.id?.toLowerCase().includes(q);
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'frozen' || filterStatus === 'closed'
        ? (o.cardStatus ?? 'active') === filterStatus
        : o.status === filterStatus);
    return matchSearch && matchStatus;
  });

  const statusTabs = ['all', 'new', 'ready_to_print', 'printing', 'qa_pending', 'qa_failed', 'ready_to_ship', 'ready', 'shipped', 'frozen', 'closed', 'delivered'];

  return (
    <AdminScreenShell
      title="Orders"
      subtitle="Admin"
      rightAction={
        <AppText variant="caption" tone="muted" weight="medium">
          {orders.length} total
        </AppText>
      }
      scroll={false}
      headerBottom={
        <>
          <AppSearchBar
            embedded
            value={searchInput}
            onChangeText={setSearchInput}
            onSearch={submitSearch}
            onClear={clearSearch}
            loading={loading}
            placeholder="Search customer or card code…"
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <View style={[styles.filterGroup, { backgroundColor: colors.surface }]}>
              {statusTabs.map((s) => {
                const opt = orderStatusOptions.find((o) => o.value === s);
                const active = filterStatus === s;
                return (
                  <Pressable
                    key={s}
                    style={[styles.filterPill, active && { backgroundColor: colors.primary }]}
                    onPress={() => setFilterStatus(s)}
                  >
                    <AppText
                      variant="caption"
                      weight="semibold"
                      style={{ color: active ? '#FFFFFF' : colors.textMuted }}
                    >
                      {s === 'all' ? 'All' : (opt?.label ?? s)}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </>
      }
    >
      <SettingsSection title="Queue" compact />
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {loading ? (
          <AppText variant="body" tone="muted" style={styles.empty}>
            Loading…
          </AppText>
        ) : filtered.length === 0 ? (
          <AppText variant="body" tone="muted" style={styles.empty}>
            {searchEmptyMessage(
              false,
              Boolean(searchQuery),
              searchQuery,
              filterStatus === 'all' ? 'No orders found.' : `No ${filterStatus.replace('_', ' ')} orders.`
            )}
          </AppText>
        ) : (
          <SettingsGroup compact>
            {filtered.map((order, index) => {
              const statusOpt = orderStatusOptions.find((o) => o.value === order.status);
              const cardStatus = order.cardStatus ?? 'active';
              const cardStatusOpt = orderCardStatusOptions.find((o) => o.value === cardStatus);
              const canAdvance = getNextOrderStatus(order.status) !== null && cardStatus === 'active';
              const nextStatus = getNextOrderStatus(order.status);
              const nextLabel =
                orderStatusOptions.find((o) => o.value === nextStatus)?.label ?? '—';

              return (
                <View key={order.id}>
                  <Pressable
                    style={({ pressed }) => [styles.orderRow, pressed && { backgroundColor: colors.surfaceSoft }]}
                    onPress={() => router.push({ pathname: '/order-detail/[orderId]', params: { orderId: order.id } })}
                  >
                    <View style={styles.orderCopy}>
                      <AppText variant="caption" tone="muted" weight="bold">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </AppText>
                      <AppText variant="body" weight="semibold" numberOfLines={1}>
                        {order.customerName}
                      </AppText>
                      <AppText variant="caption" tone="muted" numberOfLines={1}>
                        {order.productType?.replace('_', ' ')} × {order.quantity} · {order.cardCode}
                      </AppText>
                      {order.priority === 'urgent' ? (
                        <AdminStatusPill label="Urgent" tone="danger" />
                      ) : null}
                    </View>
                    <View style={styles.orderBadges}>
                      <AdminStatusPill label={statusOpt?.label ?? order.status} tone="info" />
                      <AdminStatusPill label={order.paymentStatus ?? 'unknown'} tone={paymentTone(order.paymentStatus)} />
                      {cardStatus !== 'active' && cardStatusOpt ? (
                        <AdminStatusPill label={cardStatusOpt.label} tone="warning" />
                      ) : null}
                    </View>
                  </Pressable>
                  {canAdvance ? (
                    <Pressable style={[styles.advanceBtn, { backgroundColor: colors.surfaceSoft }]} onPress={() => advanceStatus(order)}>
                      <AppText variant="caption" weight="semibold" style={{ color: colors.primary }}>
                        Advance to {nextLabel}
                      </AppText>
                    </Pressable>
                  ) : cardStatus !== 'active' ? (
                    <View style={[styles.lockedStrip, { backgroundColor: colors.surfaceSoft }]}>
                      <AppText variant="caption" tone="muted" weight="medium">
                        {cardStatusOpt?.label ?? cardStatus} card — open detail to manage
                      </AppText>
                    </View>
                  ) : null}
                  {index < filtered.length - 1 ? (
                    <View style={[styles.separator, { backgroundColor: colors.border }]} />
                  ) : null}
                </View>
              );
            })}
          </SettingsGroup>
        )}
      </ScrollView>
    </AdminScreenShell>
  );
}

const styles = StyleSheet.create({
  filterScroll: { marginTop: 2 },
  filterGroup: {
    flexDirection: 'row',
    borderRadius: theme.radius.lg,
    padding: 4,
    gap: 3,
    marginHorizontal: theme.spacing.md,
    ...theme.shadows.control,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radius.md,
  },
  list: { paddingBottom: theme.spacing.xxl, gap: theme.spacing.sm },
  empty: { textAlign: 'center', marginTop: theme.spacing.xl, paddingHorizontal: theme.spacing.md },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    minHeight: 64,
  },
  orderCopy: { flex: 1, gap: 3 },
  orderBadges: { alignItems: 'flex-end', gap: 4, maxWidth: '42%' },
  advanceBtn: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    borderRadius: theme.radius.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  lockedStrip: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    borderRadius: theme.radius.sm,
    paddingVertical: 8,
    paddingHorizontal: theme.spacing.sm,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: theme.spacing.md,
  },
});
