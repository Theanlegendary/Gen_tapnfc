import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppButton } from '@/src/components/AppButton';
import { AppCard } from '@/src/components/AppCard';
import { AppIcon } from '@/src/components/AppIcon';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { AppText } from '@/src/components/AppText';
import { orderStatusOptions, paymentStatusColors } from '@/src/constants/options';
import { theme } from '@/src/constants/theme';
import { useAuth } from '@/src/hooks/useAuth';
import { usePrinterJobs } from '@/src/hooks/usePrinterJobs';
import { useOrders } from '@/src/hooks/useOrders';
import { useRoleFlags } from '@/src/hooks/useRoleFlags';
import { updatePrinterJob } from '@/src/services/firestoreService';
import { Order, PrinterJob } from '@/src/types/models';
import { AppSearchBar } from '@/src/components/AppSearchBar';
import { searchEmptyMessage, useSearchQuery } from '@/src/hooks/useSearchQuery';
import { appRoutes } from '@/src/constants/navigation';
import { AppAvatar } from '@/src/components/AppAvatar';
import { useBioPage } from '@/src/hooks/useBioPage';

function StatusBadge({ status }: { status: Order['status'] }) {
  const opt = orderStatusOptions.find((o) => o.value === status);
  return (
    <View style={[badge.wrap, { backgroundColor: (opt?.color ?? '#999') + '22' }]}>
      <AppText variant="caption" style={[badge.text, { color: opt?.color ?? '#999' }]}>
        {opt?.label ?? status}
      </AppText>
    </View>
  );
}

const badge = StyleSheet.create({
  wrap: { borderRadius: theme.radius.pill, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  text: { fontSize: 11, fontWeight: '700' },
});

function OrderCard({ order }: { order: Order }) {
  const payColor = paymentStatusColors[order.paymentStatus];
  return (
    <AppCard style={styles.orderCard}>
      <View style={styles.orderTop}>
        <View style={styles.orderInfo}>
          <AppText variant="h2">{order.customerName}</AppText>
          <View style={styles.orderMeta}>
            <AppIcon name="Phone" size={13} color={theme.colors.textMuted} />
            <AppText variant="caption" tone="muted">{order.phone}</AppText>
          </View>
          {order.company ? (
            <AppText variant="caption" tone="muted">{order.company}</AppText>
          ) : null}
        </View>
        <View style={styles.orderRight}>
          <StatusBadge status={order.status} />
          <View style={[styles.payBadge, { backgroundColor: payColor + '22' }]}>
            <AppText variant="caption" style={[styles.payText, { color: payColor }]}>
              {order.paymentStatus.toUpperCase()}
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <AppIcon name="Package" size={13} color={theme.colors.textMuted} />
          <AppText variant="caption" tone="muted">{order.productType} x {order.quantity}</AppText>
        </View>
        <View style={styles.detailRow}>
          <AppIcon name="CreditCard" size={13} color={theme.colors.textMuted} />
          <AppText variant="caption" tone="muted">{order.cardCode}</AppText>
        </View>
      </View>
    </AppCard>
  );
}

const stageColor: Record<PrinterJob['stage'], string> = {
  queued: theme.colors.warning,
  printing: theme.colors.primary,
  nfc_writing: '#7c3aed',
  nfc_verification: '#2563eb',
  awaiting_qa: theme.colors.info,
  done: theme.colors.accent,
  failed: theme.colors.danger,
  reprint: theme.colors.danger,
};

const stageLabel: Record<PrinterJob['stage'], string> = {
  queued: 'Queued',
  printing: 'Printing',
  nfc_writing: 'NFC Write',
  nfc_verification: 'Verifying',
  awaiting_qa: 'Awaiting QA',
  done: 'Done',
  failed: 'Failed',
  reprint: 'Reprint',
};

function JobCard({ job }: { job: PrinterJob }) {
  const color = stageColor[job.stage];
  const [isUpdating, setIsUpdating] = useState(false);

  async function markPrinting() {
    setIsUpdating(true);
    try {
      await updatePrinterJob(job.id, 'printing');
    } catch (error) {
      Alert.alert('Could not update job', error instanceof Error ? error.message : 'Try again later.');
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <AppCard style={styles.jobCard}>
      <View style={styles.jobHeader}>
        <View style={styles.queueBadge}>
          <AppText variant="caption" tone="inverse" style={styles.queueText}>
            #{String(job.queueNumber).slice(-4)}
          </AppText>
        </View>
        <View style={[styles.stageBadge, { backgroundColor: color + '22' }]}>
          <AppText variant="caption" style={[styles.stageText, { color }]}>
            {stageLabel[job.stage]}
          </AppText>
        </View>
        {job.failedCards > 0 ? (
          <View style={[styles.stageBadge, { backgroundColor: theme.colors.danger + '22' }]}>
            <AppText variant="caption" style={[styles.stageText, { color: theme.colors.danger }]}>
              {job.failedCards} failed
            </AppText>
          </View>
        ) : null}
      </View>

      <AppText variant="caption" tone="muted">Order: {job.orderId.slice(0, 10)}...</AppText>

      <View style={styles.jobActions}>
        <AppButton
          label="Printing"
          loading={isUpdating}
          disabled={job.stage !== 'queued'}
          fullWidth={false}
          style={styles.actionBtn}
          onPress={markPrinting}
        />
        <AppButton
          label="NFC Write"
          fullWidth={false}
          variant="secondary"
          style={styles.actionBtn}
          disabled={job.stage !== 'printing' && job.stage !== 'nfc_writing'}
          onPress={() => router.push({ pathname: '/printer/nfc/[jobId]', params: { jobId: job.id } })}
        />
      </View>
    </AppCard>
  );
}

export function OrdersQueueScreen() {
  const { user } = useAuth();
  const { role, isSales, isPrinter } = useRoleFlags();
  const { orders, isLoading: ordersLoading, error: ordersError, refresh } = useOrders(role, user?.id ?? '');
  const { jobs, isLoading: jobsLoading, error: jobsError } = usePrinterJobs();
  const { bioPage } = useBioPage(user?.id ?? '');
  const {
    input: searchInput,
    setInput: setSearchInput,
    query: searchQuery,
    submitSearch,
    clearSearch,
  } = useSearchQuery();

  const activeJobs = useMemo(
    () => jobs.filter((j) => j.stage !== 'done' && j.stage !== 'failed'),
    [jobs]
  );

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((order) => {
      const name = order.customerName.toLowerCase();
      const code = order.cardCode.toLowerCase();
      const id = order.id.toLowerCase();
      const phone = order.phone.toLowerCase();
      return (
        name.includes(q) ||
        code.includes(q) ||
        id.includes(q) ||
        phone.includes(q)
      );
    });
  }, [orders, searchQuery]);

  const filteredJobs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return activeJobs;
    return activeJobs.filter((job) => {
      const queue = String(job.queueNumber);
      const id = job.id.toLowerCase();
      const orderId = job.orderId.toLowerCase();
      return queue.includes(q) || id.includes(q) || orderId.includes(q);
    });
  }, [activeJobs, searchQuery]);

  return (
    <ScreenContainer>
      <View style={styles.headerShell}>
        <View style={styles.headerRow}>
          <Pressable
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={10}
          >
            <AppIcon name="ChevronLeft" size={20} color={theme.colors.primaryDark} />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText variant="caption" tone="muted">
              {isPrinter ? 'Workshop queue' : 'Sales queue'}
            </AppText>
            <AppText variant="h1">
              {isPrinter ? 'Printer Queue' : 'My Orders'}
            </AppText>
          </View>
          <Pressable
            onPress={() =>
              router.push(isPrinter ? appRoutes.printer.settings : appRoutes.sales.settings)
            }
            hitSlop={10}
          >
            <AppAvatar
              name={user?.displayName ?? (isPrinter ? 'Printer' : 'Sales')}
              role={isPrinter ? 'printer' : 'sales'}
              size={40}
              source={bioPage?.photoUrl ? { uri: bioPage.photoUrl } : undefined}
            />
          </Pressable>
        </View>
        <AppText variant="body" tone="muted" style={styles.headerSubtitle}>
          {isSales
            ? 'All orders you have submitted.'
            : 'Live jobs. Tap to advance stage.'}
        </AppText>
        <AppSearchBar
          value={searchInput}
          onChangeText={setSearchInput}
          onSearch={submitSearch}
          onClear={clearSearch}
          loading={ordersLoading || jobsLoading}
          role={isPrinter ? 'printer' : 'sales'}
          placeholder={
            isPrinter
              ? 'Search by job number, order, or ID…'
              : 'Search by customer, card code, or order ID…'
          }
        />
      </View>

      {isSales ? (
        <>
          <AppButton label="+ New Order" onPress={() => router.push('/new-order')} />
          {ordersError ? (
            <AppCard>
              <AppText variant="body" tone="muted">{ordersError}</AppText>
              <AppButton label="Retry" variant="ghost" onPress={refresh} />
            </AppCard>
          ) : null}
          {ordersLoading ? (
            <AppCard>
              <AppText variant="body" tone="muted">Loading orders...</AppText>
            </AppCard>
          ) : filteredOrders.length === 0 ? (
            <AppCard>
              <AppText variant="body" tone="muted">
                {searchEmptyMessage(
                  false,
                  Boolean(searchQuery),
                  searchQuery,
                  'No orders yet. Create your first one above.'
                )}
              </AppText>
            </AppCard>
          ) : null}
          {filteredOrders.map((order) => <OrderCard key={order.id} order={order} />)}
        </>
      ) : null}

      {isPrinter ? (
        <>
          <AppButton
            label="Create Order"
            iconName="Plus"
            role="printer"
            onPress={() => router.push('/new-order')}
          />
          {jobsError ? (
            <AppCard>
              <AppText variant="body" tone="muted">{jobsError}</AppText>
            </AppCard>
          ) : null}
          {jobsLoading ? (
            <AppCard style={styles.emptyCard}>
              <AppText variant="body" tone="muted">Loading queue...</AppText>
            </AppCard>
          ) : filteredJobs.length === 0 ? (
            <AppCard style={styles.emptyCard}>
              <AppText variant="h2">No jobs</AppText>
              <AppText variant="body" tone="muted">
                {searchEmptyMessage(
                  false,
                  Boolean(searchQuery),
                  searchQuery,
                  'No active jobs right now.'
                )}
              </AppText>
            </AppCard>
          ) : null}
          {filteredJobs.map((job) => <JobCard key={job.id} job={job} />)}
        </>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerShell: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    ...theme.shadows.control,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  headerSubtitle: {
    marginTop: 4,
  },
  orderCard: { padding: theme.spacing.md, gap: theme.spacing.sm },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.sm },
  orderInfo: { flex: 1, gap: 3 },
  orderMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  orderRight: { alignItems: 'flex-end', gap: theme.spacing.xs },
  payBadge: { borderRadius: theme.radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  payText: { fontSize: 10, fontWeight: '700' },
  orderDetails: { gap: 4, paddingTop: theme.spacing.xs },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  emptyCard: { alignItems: 'center', gap: theme.spacing.xs, paddingVertical: theme.spacing.xl },
  jobCard: { gap: theme.spacing.sm },
  jobHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, flexWrap: 'wrap' },
  queueBadge: { borderRadius: theme.radius.pill, backgroundColor: theme.colors.primaryDark, paddingHorizontal: 10, paddingVertical: 3 },
  queueText: { fontSize: 11, fontWeight: '700' },
  stageBadge: { borderRadius: theme.radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  stageText: { fontSize: 11, fontWeight: '700' },
  jobActions: { flexDirection: 'row', gap: theme.spacing.xs, marginTop: theme.spacing.xs },
  actionBtn: { flex: 1, minHeight: 44 },
});
