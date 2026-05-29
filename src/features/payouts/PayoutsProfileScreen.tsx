import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppButton } from '@/src/components/AppButton';
import { AppCard } from '@/src/components/AppCard';
import { AppIcon } from '@/src/components/AppIcon';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { AppText } from '@/src/components/AppText';
import { theme } from '@/src/constants/theme';
import { useAuth } from '@/src/hooks/useAuth';
import { usePayouts } from '@/src/hooks/usePayouts';
import { usePrinterJobs } from '@/src/hooks/usePrinterJobs';
import { useRoleFlags } from '@/src/hooks/useRoleFlags';

export function PayoutsProfileScreen() {
  const { user } = useAuth();
  const { isSales, isPrinter } = useRoleFlags();
  const { payouts, isLoading: payoutsLoading, error: payoutsError, refresh } = usePayouts(user?.id ?? '');
  const { jobs } = usePrinterJobs();

  const totalPayouts = payouts.reduce((acc, payout) => acc + payout.amount, 0);
  const qaDone = jobs.filter((job) => job.stage === 'done').length;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <AppIcon name={isSales ? 'Wallet' : 'BadgeDollarSign'} size={22} color={theme.colors.primaryDark} />
          <AppText variant="h1">{isSales ? 'My Payouts' : 'My Salary'}</AppText>
        </View>
        <AppText variant="body" tone="muted">
          {isSales ? 'Commission summary and payout history.' : 'QA throughput and earnings.'}
        </AppText>
      </View>

      <AppCard style={styles.profileCard}>
        <View style={styles.avatar}>
          <AppText style={styles.avatarText}>
            {(user?.displayName ?? 'U')[0].toUpperCase()}
          </AppText>
        </View>
        <View style={styles.profileInfo}>
          <AppText variant="h2">{user?.displayName ?? 'User'}</AppText>
          <AppText variant="caption" tone="muted">{user?.email}</AppText>
          <View style={styles.roleBadge}>
            <AppText variant="caption" tone="inverse" style={styles.roleBadgeText}>
              {user?.role?.toUpperCase() ?? 'STAFF'}
            </AppText>
          </View>
        </View>
      </AppCard>

      {isSales ? (
        <>
          {payoutsError ? (
            <AppCard>
              <AppText variant="body" tone="muted">{payoutsError}</AppText>
              <AppButton label="Retry" variant="ghost" onPress={refresh} />
            </AppCard>
          ) : null}

          <AppCard style={styles.totalCard}>
            <AppText variant="caption" tone="muted" style={styles.totalLabel}>TOTAL EARNINGS</AppText>
            <AppText variant="h1" style={styles.totalAmount}>
              ${totalPayouts.toFixed(2)}
            </AppText>
          </AppCard>

          {payoutsLoading ? (
            <AppCard>
              <AppText variant="body" tone="muted">Loading payout records...</AppText>
            </AppCard>
          ) : payouts.length === 0 ? (
            <AppCard>
              <AppText variant="body" tone="muted">No payout records yet.</AppText>
            </AppCard>
          ) : null}

          {payouts.map((payout) => (
            <AppCard key={payout.id} style={styles.payoutRow}>
              <View style={styles.payoutLeft}>
                <AppText variant="h2">{payout.periodLabel}</AppText>
                <View style={[styles.statusBadge, { backgroundColor: payout.status === 'paid' ? theme.colors.accent : theme.colors.warning }]}>
                  <AppText variant="caption" tone="inverse" style={styles.badgeText}>
                    {payout.status.toUpperCase()}
                  </AppText>
                </View>
              </View>
              <AppText variant="h2">${payout.amount.toFixed(2)}</AppText>
            </AppCard>
          ))}
        </>
      ) : null}

      {isPrinter ? (
        <>
          <AppCard style={styles.totalCard}>
            <AppText variant="caption" tone="muted" style={styles.totalLabel}>QA JOBS COMPLETED</AppText>
            <AppText variant="h1" style={styles.totalAmount}>{qaDone}</AppText>
          </AppCard>
          <AppButton
            label="Capture QA Video"
            onPress={() => router.push('/printer/queue')}
          />
        </>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: theme.spacing.xxs,
    marginBottom: theme.spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.xxs,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primaryDark,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  totalCard: {
    gap: theme.spacing.xxs,
  },
  totalLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0,
    fontSize: 10,
  },
  totalAmount: {
    fontSize: 40,
    lineHeight: 50,
    color: theme.colors.primaryDark,
  },
  payoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  payoutLeft: {
    gap: theme.spacing.xxs,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
