import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { AppEmptyState } from '@/src/components/AppState';
import { appRoutes } from '@/src/constants/navigation';
import { theme } from '@/src/constants/theme';
import { useNotifications } from '@/src/hooks/useNotifications';
import { useActiveBatch } from '@/src/hooks/useActiveBatch';
import { usePrinterJobs } from '@/src/hooks/usePrinterJobs';
import { searchEmptyMessage, useSearchQuery } from '@/src/hooks/useSearchQuery';
import { PrinterJob } from '@/src/types/models';

const HERO_BG = '#1a1a2e';
const GREEN = '#34C759';
const BLUE = '#007AFF';
const SURFACE = '#FFFFFF';
const SURFACE_BORDER = '#E2E8F0';
const SURFACE_RADIUS = 20;

type TabFilter = 'all' | 'queued' | 'printing' | 'done';

function formatJobDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return { dateText: '-', timeText: '-' };
  }

  return {
    dateText: date.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: '2-digit' }),
    timeText: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }),
  };
}

function compactStage(stage: PrinterJob['stage']) {
  if (stage === 'done') return { label: 'Done', color: GREEN, bg: '#ECFDF3' };
  if (stage === 'awaiting_qa') return { label: 'QA Queue', color: '#5856D6', bg: '#F0EEFF' };
  if (stage === 'reprint') return { label: 'Reprint', color: '#FF9500', bg: '#FFF7ED' };
  if (stage === 'failed') return { label: 'Issue', color: '#FF3B30', bg: '#FFF1F0' };
  return { label: 'Doing', color: '#10B981', bg: '#ECFDF5' };
}

function JobCard({ job }: { job: PrinterJob }) {
  const wage = (job.cardsPrinted * job.perCardBonus + job.perOrderBonus).toFixed(2);
  const { dateText, timeText } = formatJobDateTime(job.createdAt);
  const stage = compactStage(job.stage);
  const orderLabel = job.orderId.slice(0, 8);

  function openJob() {
    if (job.stage === 'awaiting_qa') {
      router.push({ pathname: '/printer/qa/[jobId]', params: { jobId: job.id } });
      return;
    }
    router.push({ pathname: '/printer/nfc/[jobId]', params: { jobId: job.id } });
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.jobCard, pressed && styles.jobCardPressed]}
      onPress={openJob}
    >
      <View style={styles.compactCardRow}>
        <View style={styles.compactIconWrap}>
          <AppIcon name="ClipboardList" size={18} color="#4B5563" />
        </View>
        <View style={styles.compactMain}>
          <View style={styles.compactTop}>
            <View style={styles.compactTitleWrap}>
              <AppText style={styles.compactOverline}>JOB #{String(job.queueNumber).slice(-4)}</AppText>
              <AppText style={styles.compactTitle} numberOfLines={1}>
                Order {orderLabel}
              </AppText>
            </View>
            <View style={[styles.compactStagePill, { backgroundColor: stage.bg }]}>
              <AppText style={[styles.compactStageText, { color: stage.color }]}>{stage.label}</AppText>
            </View>
          </View>
          <View style={styles.compactBottom}>
            <AppText style={styles.compactMeta}>
              {dateText} {timeText}
            </AppText>
            <AppText style={styles.compactAmount}>${wage}</AppText>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function PrinterQueueScreen() {
  const { batch, batchId, isLoading: batchLoading } = useActiveBatch();
  const { jobs, isLoading, error } = usePrinterJobs();
  const { unreadCount } = useNotifications();

  if (!batchLoading && !batchId) {
    return <Redirect href="/printer/batch-select" />;
  }
  const [tab, setTab] = useState<TabFilter>('all');
  const {
    input: searchInput,
    setInput: setSearchInput,
    query: searchQuery,
    submitSearch,
    clearSearch,
  } = useSearchQuery();

  const filtered = useMemo(() => {
    const base =
      tab === 'all'
        ? jobs.filter((job) => job.stage !== 'failed')
        : tab === 'queued'
          ? jobs.filter((job) => job.stage === 'queued')
          : tab === 'printing'
            ? jobs.filter(
                (job) =>
                  job.stage === 'printing' ||
                  job.stage === 'nfc_writing' ||
                  job.stage === 'nfc_verification' ||
                  job.stage === 'awaiting_qa' ||
                  job.stage === 'reprint'
              )
            : jobs.filter((job) => job.stage === 'done' || job.stage === 'awaiting_qa');

    const q = searchQuery.trim().toLowerCase();
    if (!q) return base;

    return base.filter((job) => {
      const queue = String(job.queueNumber);
      const id = job.id.toLowerCase();
      const orderId = job.orderId.toLowerCase();
      return queue.includes(q) || id.includes(q) || orderId.includes(q);
    });
  }, [jobs, tab, searchQuery]);

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'queued', label: 'Todo' },
    { key: 'printing', label: 'Doing' },
    { key: 'done', label: 'Handoff' },
  ];
  const todayCount = jobs.length;
  const needVerificationCount = jobs.filter((job) => job.stage === 'nfc_verification').length;
  const quickPrintJob = jobs.find((job) => job.stage === 'queued') ?? null;

  return (
    <View style={styles.safe}>
      <SafeAreaView edges={['top']} style={styles.heroSafe}>
        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <View style={styles.heroTop}>
            <View style={styles.workshopLbl}>
              <AppIcon name="Settings" size={13} color="rgba(255,255,255,0.45)" />
              <AppText style={styles.workshopTxt}>Workshop</AppText>
            </View>
            <Pressable
              style={styles.notifBtn}
              onPress={() => router.push(appRoutes.printer.notifications)}
              hitSlop={8}
            >
              <AppIcon name="Bell" size={17} color="rgba(255,255,255,0.85)" />
              {unreadCount > 0 ? <View style={styles.notifDot} /> : null}
            </Pressable>
          </View>

          <AppText style={styles.pageTitle}>Job Queue</AppText>
          <Pressable onPress={() => router.push('/printer/batch-select')} hitSlop={8}>
            <AppText style={styles.batchLink}>
              Batch: {batch?.batchNumber ?? '—'} · tap to change
            </AppText>
          </Pressable>
          <View style={styles.heroStatsRow}>
            <AppText style={styles.heroSub}>Print, encode, and verify cards</AppText>
            <View style={styles.heroTodayWrap}>
              <AppText style={styles.heroTodayNum}>{todayCount}</AppText>
              <AppText style={styles.heroTodayLabel}>Today</AppText>
            </View>
          </View>

          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <AppIcon name="Search" size={16} color="rgba(255,255,255,0.45)" />
              <TextInput
                value={searchInput}
                onChangeText={setSearchInput}
                onSubmitEditing={submitSearch}
                placeholder="Search order ID"
                placeholderTextColor="rgba(255,255,255,0.35)"
                returnKeyType="search"
                style={styles.searchInput}
              />
              {searchInput.length > 0 ? (
                <Pressable onPress={clearSearch} hitSlop={8}>
                  <AppIcon name="X" size={14} color="rgba(255,255,255,0.45)" />
                </Pressable>
              ) : null}
            </View>
            <Pressable
              style={styles.searchBtn}
              onPress={() => {
                if (quickPrintJob) {
                  router.push({
                    pathname: '/printer/nfc/[jobId]',
                    params: { jobId: quickPrintJob.id },
                  });
                  return;
                }
                router.push('/printer/scan');
              }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" />
              ) : (
                <AppIcon name="Printer" size={18} color="rgba(255,255,255,0.9)" />
              )}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {tabs.map((item) => {
            const active = tab === item.key;
            return (
              <Pressable
                key={item.key}
                style={[styles.tabItem, active && styles.tabItemActive]}
                onPress={() => setTab(item.key)}
              >
                <View style={[styles.tabItemInner, active && styles.tabItemInnerActive]}>
                  <AppText style={[styles.tabItemText, active && styles.tabItemTextOn]}>{item.label}</AppText>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        {error ? (
          <View style={styles.stateWrap}>
            <AppText variant="body" style={styles.errorText}>
              {error}
            </AppText>
          </View>
        ) : null}
        {isLoading && filtered.length === 0 ? (
          <View style={styles.stateWrap}>
            <AppText variant="body" tone="muted">
              Loading queue...
            </AppText>
          </View>
        ) : filtered.length === 0 ? (
          <AppEmptyState
            role="printer"
            iconName="ClipboardList"
            title="No jobs"
            description={searchEmptyMessage(
              false,
              Boolean(searchQuery),
              searchQuery,
              tab === 'all' ? 'Queue is clear right now.' : 'No jobs in this category right now.'
            )}
          />
        ) : (
          <>
            <View style={styles.listHeader}>
              <View>
                <AppText style={styles.listTitle}>Print Queue</AppText>
                <AppText style={styles.listSubtitle}>
                  {needVerificationCount} job{needVerificationCount === 1 ? '' : 's'} need verification
                </AppText>
              </View>
              <Pressable onPress={() => router.push('/printer/scan')} hitSlop={8}>
                <AppText style={styles.listLink}>See all</AppText>
              </Pressable>
            </View>
            {filtered.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  heroSafe: {
    backgroundColor: HERO_BG,
  },
  hero: {
    backgroundColor: HERO_BG,
    paddingHorizontal: 20,
    paddingBottom: 22,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(100,120,255,0.12)',
    top: -60,
    right: -50,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  workshopLbl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  workshopTxt: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.45)',
  },
  notifBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF3B30',
    borderWidth: 1.5,
    borderColor: HERO_BG,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1.2,
    lineHeight: 32,
    marginBottom: 4,
  },
  batchLink: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 6,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  heroSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
  },
  heroTodayWrap: {
    alignItems: 'flex-end',
    gap: 1,
  },
  heroTodayNum: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 20,
  },
  heroTodayLabel: {
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
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  tabsWrap: {
    backgroundColor: '#F4F6FA',
    paddingHorizontal: 14,
    paddingTop: 6,
  },
  tabs: {
    width: '100%',
    backgroundColor: '#EEF2F6',
    borderRadius: 15,
    padding: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SURFACE_BORDER,
  },
  tabItem: {
    flex: 1,
    minWidth: 70,
    alignItems: 'center',
    borderRadius: 11,
    marginHorizontal: 2,
    backgroundColor: 'transparent',
  },
  tabItemInner: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 9,
  },
  tabItemActive: {
    backgroundColor: '#001035',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
    shadowColor: '#001035',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 1,
  },
  tabItemInnerActive: {
    borderTopWidth: 0,
  },
  tabItemText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8EA0B8',
  },
  tabItemTextOn: {
    color: '#fff',
  },
  body: { flex: 1 },
  bodyContent: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 120,
    gap: 8,
  },
  jobCard: {
    backgroundColor: SURFACE,
    borderRadius: SURFACE_RADIUS,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SURFACE_BORDER,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
  },
  jobCardPressed: {
    opacity: 0.82,
  },
  compactCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  compactIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#F5F7FB',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E4EAF3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactMain: {
    flex: 1,
    minWidth: 0,
  },
  compactTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  compactTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  compactOverline: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  compactTitle: {
    marginTop: 1,
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  compactStagePill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  compactStageText: {
    fontSize: 10,
    fontWeight: '800',
  },
  compactBottom: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactMeta: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  compactAmount: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '800',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    paddingBottom: 6,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.3,
  },
  listSubtitle: {
    marginTop: 1,
    fontSize: 11,
    color: 'rgba(60,60,67,0.45)',
    fontWeight: '500',
  },
  listLink: {
    fontSize: 14,
    fontWeight: '500',
    color: BLUE,
  },
  stateWrap: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  errorText: {
    color: theme.status.error,
    textAlign: 'center',
  },
});
