import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppEmptyState } from '@/src/components/AppState';
import { AppText } from '@/src/components/AppText';
import {
  SalesInfoRow,
  SalesScreenHeader,
  SalesStatsBand,
  SalesSegment,
  SalesSurfaceCard,
  salesUi,
} from '@/src/features/sales/components/SalesScreenUi';
import { useAuth } from '@/src/hooks/useAuth';
import { useOrders } from '@/src/hooks/useOrders';
import { usePayouts } from '@/src/hooks/usePayouts';
import { Payout } from '@/src/types/models';

type Period = 'Today' | 'Week' | 'Month';

function filterByPeriod(payouts: Payout[], period: Period) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(startOfToday);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(startOfToday);
  monthAgo.setDate(monthAgo.getDate() - 30);

  return payouts.filter((payout) => {
    const d = new Date(payout.createdAt);
    if (Number.isNaN(d.getTime())) return period === 'Month';
    if (period === 'Today') return d >= startOfToday;
    if (period === 'Week') return d >= weekAgo;
    return d >= monthAgo;
  });
}

function payoutStatusLabel(status: Payout['status']) {
  if (status === 'paid') return 'Paid';
  if (status === 'pending') return 'Pending';
  return status;
}

export default function MyPayoutsScreen() {
  const { user } = useAuth();
  const { payouts } = usePayouts(user?.id ?? '');
  const { orders, refresh } = useOrders('sales', user?.id ?? '');
  const [period, setPeriod] = useState<Period>('Week');

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => filterByPeriod(payouts, period), [payouts, period]);

  const totalCommission = filtered.reduce((sum, payout) => sum + payout.amount, 0);
  const pendingApproval = filtered
    .filter((payout) => payout.status === 'pending')
    .reduce((sum, payout) => sum + payout.amount, 0);
  const paidOut = filtered
    .filter((payout) => payout.status === 'paid')
    .reduce((sum, payout) => sum + payout.amount, 0);
  const pendingCount = filtered.filter((payout) => payout.status === 'pending').length;
  const paidCount = filtered.filter((payout) => payout.status === 'paid').length;
  const deliveredCount = orders.filter((order) => order.status === 'delivered').length;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SalesScreenHeader title="Payouts" sub="Commission and earnings" />

        <View style={styles.heroCard}>
          <View style={styles.heroGlow} />
          <AppText style={styles.heroLabel}>This {period}</AppText>
          <AppText style={styles.heroAmount}>${totalCommission.toFixed(2)}</AppText>
          <View style={styles.heroFooter}>
            <AppText style={styles.heroMeta}>{deliveredCount} orders delivered</AppText>
            {pendingCount > 0 ? (
              <View style={styles.heroPill}>
                <AppText style={styles.heroPillText}>{pendingCount} pending</AppText>
              </View>
            ) : null}
          </View>
        </View>

        <SalesSegment items={['Today', 'Week', 'Month']} active={period} onChange={setPeriod} />

        <SalesSurfaceCard style={styles.earningsCard}>
          <SalesStatsBand
            embedded
            title={`${period} commission`}
            items={[
              { icon: 'Clock', value: `$${pendingApproval.toFixed(2)}`, label: 'Awaiting', tone: 'orange' },
              { icon: 'Wallet', value: `$${paidOut.toFixed(2)}`, label: 'Paid', tone: 'green' },
              { icon: 'BadgeDollarSign', value: String(paidCount), label: 'Payouts', tone: 'blue' },
            ]}
          />
          <View style={styles.earningsDivider} />
          <SalesInfoRow icon="Wallet" title="Awaiting approval" value={`$${pendingApproval.toFixed(2)}`} />
          <SalesInfoRow icon="BadgeDollarSign" title="Paid out" value={`$${paidOut.toFixed(2)}`} />
          <SalesInfoRow icon="ClipboardList" title="Total commission" value={`$${totalCommission.toFixed(2)}`} last />
        </SalesSurfaceCard>

        {filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <AppEmptyState
              role="sales"
              iconName="Wallet"
              title="No payout records"
              description="Payouts in this period will appear here."
            />
          </View>
        ) : (
          <SalesSurfaceCard style={styles.recentCard}>
            <View style={styles.recentHeader}>
              <AppText style={styles.recentTitle}>Recent payouts</AppText>
            </View>
            {filtered.slice(0, 8).map((payout, index) => {
              const last = index === Math.min(filtered.length, 8) - 1;
              const label = payout.periodLabel || `Payout ${payout.id.slice(0, 6).toUpperCase()}`;
              return (
                <SalesInfoRow
                  key={payout.id}
                  icon="History"
                  title={label}
                  value={`$${payout.amount.toFixed(2)} · ${payoutStatusLabel(payout.status)}`}
                  last={last}
                />
              );
            })}
          </SalesSurfaceCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: salesUi.bg,
  },
  scroll: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 120,
  },
  heroCard: {
    marginTop: 16,
    borderRadius: 34,
    backgroundColor: salesUi.dark,
    padding: 18,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 4,
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    right: -32,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(48,209,88,0.18)',
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
  },
  heroAmount: {
    marginTop: 4,
    fontSize: 42,
    lineHeight: 44,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  heroFooter: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroMeta: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6EE7B7',
  },
  heroPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  earningsCard: {
    marginTop: 16,
    padding: 0,
    overflow: 'hidden',
  },
  earningsDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: salesUi.border,
    marginHorizontal: 14,
  },
  recentCard: {
    marginTop: 14,
  },
  recentHeader: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: salesUi.text,
  },
  emptyWrap: {
    marginTop: 14,
  },
});
