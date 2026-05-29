import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/src/components/AppText';
import {
  PrinterInfoRow,
  PrinterScreenHeader,
  PrinterStatsBand,
  PrinterSegment,
  PrinterSurfaceCard,
  printerUi,
} from '@/src/features/printer/components/PrinterScreenUi';
import { usePrinterJobs } from '@/src/hooks/usePrinterJobs';
import { PrinterJob } from '@/src/types/models';

type Period = 'Today' | 'Week' | 'Month';

function filterByPeriod(jobs: PrinterJob[], period: Period) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(startOfToday);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(startOfToday);
  monthAgo.setDate(monthAgo.getDate() - 30);

  return jobs.filter((job) => {
    const d = new Date(job.createdAt);
    if (Number.isNaN(d.getTime())) return period === 'Month';
    if (period === 'Today') return d >= startOfToday;
    if (period === 'Week') return d >= weekAgo;
    return d >= monthAgo;
  });
}

function jobEarned(job: PrinterJob) {
  return job.cardsPrinted * job.perCardBonus + job.perOrderBonus;
}

export default function WagesScreen() {
  const { jobs } = usePrinterJobs();
  const [period, setPeriod] = useState<Period>('Week');

  const completed = useMemo(() => jobs.filter((job) => job.stage === 'done'), [jobs]);
  const filtered = useMemo(() => filterByPeriod(completed, period), [completed, period]);

  const totalCards = useMemo(() => filtered.reduce((sum, job) => sum + job.cardsPrinted, 0), [filtered]);
  const totalWage = useMemo(() => filtered.reduce((sum, job) => sum + jobEarned(job), 0), [filtered]);
  const cardPrintedTotal = useMemo(
    () => filtered.reduce((sum, job) => sum + job.cardsPrinted * job.perCardBonus, 0),
    [filtered]
  );
  const bonusTotal = useMemo(() => filtered.reduce((sum, job) => sum + job.perOrderBonus, 0), [filtered]);
  const avgPerCard = totalCards > 0 ? totalWage / totalCards : 0;
  const verifiedCount = filtered.length;
  const readyPayout = filtered.some((job) => job.salaryStatus !== 'paid');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <PrinterScreenHeader title="Wages" sub="Earnings and payout" />

        <View style={styles.heroCard}>
          <View style={styles.heroGlow} />
          <AppText style={styles.heroLabel}>This Week</AppText>
          <AppText style={styles.heroAmount}>${totalWage.toFixed(2)}</AppText>
          <View style={styles.heroFooter}>
            <AppText style={styles.heroMeta}>{totalCards} cards completed</AppText>
            {readyPayout ? (
              <View style={styles.heroPill}>
                <AppText style={styles.heroPillText}>Ready</AppText>
              </View>
            ) : null}
          </View>
        </View>

        <PrinterSegment items={['Today', 'Week', 'Month']} active={period} onChange={setPeriod} />

        <PrinterSurfaceCard style={styles.earningsCard}>
          <PrinterStatsBand
            embedded
            title={`${period} at a glance`}
            items={[
              { icon: 'CreditCard', value: String(totalCards), label: 'Cards', tone: 'blue' },
              { icon: 'BadgeCheck', value: String(verifiedCount), label: 'Verified', tone: 'green' },
              { icon: 'TrendingUp', value: `$${avgPerCard.toFixed(2)}`, label: 'Avg/Card', tone: 'orange' },
            ]}
          />
          <View style={styles.earningsDivider} />
          <PrinterInfoRow icon="CreditCard" title="Card Printed" value={`$${cardPrintedTotal.toFixed(2)}`} />
          <PrinterInfoRow icon="BadgeCheck" title="QA Verified" value={`$${(totalWage - cardPrintedTotal - bonusTotal).toFixed(2)}`} />
          <PrinterInfoRow icon="Wallet" title="Bonus" value={`$${bonusTotal.toFixed(2)}`} last />
        </PrinterSurfaceCard>

        <Pressable
          style={({ pressed }) => [styles.payoutBtn, pressed && styles.payoutBtnPressed]}
          onPress={() => Alert.alert('Payout', 'Payout request will be available soon.')}
        >
          <AppText style={styles.payoutBtnText}>Request Payout</AppText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: printerUi.bg,
  },
  scroll: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 120,
    gap: 0,
  },
  heroCard: {
    marginTop: 16,
    borderRadius: 34,
    backgroundColor: printerUi.dark,
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
    backgroundColor: 'rgba(96,165,250,0.2)',
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
    backgroundColor: printerUi.border,
    marginHorizontal: 14,
  },
  payoutBtn: {
    marginTop: 16,
    height: 48,
    borderRadius: printerUi.radiusMd,
    backgroundColor: printerUi.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: printerUi.green,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 3,
  },
  payoutBtnPressed: {
    opacity: 0.88,
  },
  payoutBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
