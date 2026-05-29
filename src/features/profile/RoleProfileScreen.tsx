import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppAvatar } from '@/src/components/AppAvatar';
import { AppIcon } from '@/src/components/AppIcon';
import type { AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import {
  ProfileStatCell,
  ProfileStatsGrid,
  SettingsGroup,
  SettingsRow,
  SettingsSection,
} from '@/src/components/SettingsGroup';
import { appRoutes } from '@/src/constants/navigation';
import { getRoleTheme, theme } from '@/src/constants/theme';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { useOrders } from '@/src/hooks/useOrders';
import { usePrinterJobs } from '@/src/hooks/usePrinterJobs';
import { useBioPage } from '@/src/hooks/useBioPage';
import {
  PrinterInfoRow,
  PrinterMenuRow,
  PrinterScreenHeader,
  PrinterSurfaceCard,
  printerUi,
} from '@/src/features/printer/components/PrinterScreenUi';
import {
  SalesInfoRow,
  SalesMenuRow,
  SalesScreenHeader,
  SalesSurfaceCard,
  salesUi,
} from '@/src/features/sales/components/SalesScreenUi';
import { getRoleLabel, getRoleScopeSummary } from '@/src/utils/roleCapabilities';

type ProfileVariant = 'sales' | 'printer';

interface ProfileStat {
  label: string;
  value: string;
  icon: AppIconName;
  tone?: string;
}

interface ProfileAction {
  label: string;
  description: string;
  icon: AppIconName;
  onPress: () => void;
}

interface ActivityItem {
  title: string;
  subtitle: string;
  meta: string;
}

function formatDate(value?: string) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

interface RoleProfileLayoutProps {
  variant: ProfileVariant;
  title: string;
  subtitle: string;
  stats: ProfileStat[];
  wageStats?: ProfileStat[];
  actions: ProfileAction[];
  activity: ActivityItem[];
  isLoading: boolean;
  error: string | null;
}

function RoleProfileLayout({
  variant,
  title,
  subtitle,
  stats,
  wageStats,
  actions,
  activity,
  isLoading,
  error,
}: RoleProfileLayoutProps) {
  const { user, signOutUser } = useAuth();
  const { bioPage } = useBioPage(user?.id ?? '');
  const { colors } = useAppTheme();
  const [signingOut, setSigningOut] = useState(false);
  const roleTheme = getRoleTheme(variant);
  const isPrinter = variant === 'printer';
  const isSales = variant === 'sales';
  const printerSurface = '#FFFFFF';
  const printerBorder = '#E2E8F0';
  const fallbackName = variant === 'sales' ? 'Sales Rep' : 'Printer Operator';
  const displayName = user?.displayName?.trim() || fallbackName;
  const roleLabel = getRoleLabel(user?.role);
  const primaryActions = actions.slice(0, 2);
  const shortcutActions = actions.slice(2);

  async function performSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOutUser();
      router.replace(appRoutes.login);
    } catch (signOutError) {
      const message = signOutError instanceof Error ? signOutError.message : 'Unable to sign out.';
      Alert.alert('Error', message);
      setSigningOut(false);
    }
  }

  if (isSales) {
    const memberSince = formatDate(user?.createdAt);
    const shortMemberSince = memberSince.includes(',')
      ? memberSince.replace(/,.*$/, '').trim()
      : memberSince;
    const delivered = stats.find((s) => s.label === 'Delivered')?.value ?? '0';
    const active = stats.find((s) => s.label === 'Active')?.value ?? '0';

    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: salesUi.bg }]} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.printerScroll}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
        >
          <SalesScreenHeader title="Me" sub="Sales account" right={active} />

          <SalesSurfaceCard style={styles.printerProfileCard}>
            <View style={styles.printerProfileTop}>
              <AppAvatar
                name={displayName}
                role={variant}
                size={64}
                source={bioPage?.photoUrl ? { uri: bioPage.photoUrl } : undefined}
              />
              <View style={styles.printerProfileCopy}>
                <AppText style={styles.printerProfileName} numberOfLines={1}>
                  {displayName}
                </AppText>
                <AppText style={styles.printerProfileEmail} numberOfLines={1}>
                  {user?.email ?? 'No email on file'}
                </AppText>
                <View style={[styles.printerRolePill, styles.salesRolePill]}>
                  <AppText style={[styles.printerRolePillText, styles.salesRolePillText]}>
                    Online · {roleLabel}
                  </AppText>
                </View>
              </View>
            </View>
          </SalesSurfaceCard>

          <SalesSurfaceCard style={styles.printerInfoCard}>
            <SalesInfoRow icon="ShieldCheck" title="Access" value={getRoleScopeSummary(user?.role)} />
            <SalesInfoRow icon="MapPin" title="Branch" value={user?.branch || 'Default branch'} />
            <SalesInfoRow icon="Phone" title="Contact" value={user?.phone || 'No phone on file'} />
            <SalesInfoRow icon="CalendarDays" title="Member Since" value={shortMemberSince} />
            <SalesInfoRow icon="Package" title="Delivered" value={delivered} last />
          </SalesSurfaceCard>

          <SalesSurfaceCard style={styles.printerShortcutsCard}>
            <SalesMenuRow
              icon="ClipboardList"
              title="My Orders"
              onPress={() => router.push(appRoutes.sales.orders)}
            />
            <SalesMenuRow
              icon="Wallet"
              title="My Payouts"
              onPress={() => router.push(appRoutes.sales.payouts)}
            />
            <SalesMenuRow
              icon="Settings"
              title="Preferences"
              onPress={() => router.push(appRoutes.sales.settings)}
              last
            />
          </SalesSurfaceCard>

          <Pressable
            disabled={signingOut}
            onPress={() => void performSignOut()}
            style={({ pressed }) => [styles.printerSignOutLink, pressed && { opacity: 0.6 }, signingOut && styles.disabled]}
          >
            <AppText style={styles.printerSignOutLinkText}>{signingOut ? 'Signing out...' : 'Sign Out'}</AppText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isPrinter) {
    const memberSince = formatDate(user?.createdAt);
    const shortMemberSince = memberSince.includes(',')
      ? memberSince.replace(/,.*$/, '').trim()
      : memberSince;

    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: printerUi.bg }]} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.printerScroll}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
        >
          <PrinterScreenHeader title="Me" sub="Workshop account" />

          <PrinterSurfaceCard style={styles.printerProfileCard}>
            <View style={styles.printerProfileTop}>
              <AppAvatar
                name={displayName}
                role={variant}
                size={64}
                source={bioPage?.photoUrl ? { uri: bioPage.photoUrl } : undefined}
              />
              <View style={styles.printerProfileCopy}>
                <AppText style={styles.printerProfileName} numberOfLines={1}>
                  {displayName}
                </AppText>
                <AppText style={styles.printerProfileEmail} numberOfLines={1}>
                  {user?.email ?? 'No email on file'}
                </AppText>
                <View style={styles.printerRolePill}>
                  <AppText style={styles.printerRolePillText}>Online · {roleLabel}</AppText>
                </View>
              </View>
            </View>
          </PrinterSurfaceCard>

          <PrinterSurfaceCard style={styles.printerInfoCard}>
            <PrinterInfoRow icon="ShieldCheck" title="Access" value={getRoleScopeSummary(user?.role)} />
            <PrinterInfoRow icon="MapPin" title="Branch" value={user?.branch || 'Workshop A'} />
            <PrinterInfoRow icon="Phone" title="Contact" value={user?.phone || '+855 11 111 111'} />
            <PrinterInfoRow icon="CalendarDays" title="Member Since" value={shortMemberSince} last />
          </PrinterSurfaceCard>

          <PrinterSurfaceCard style={styles.printerShortcutsCard}>
            <PrinterMenuRow
              icon="ClipboardList"
              title="Job Queue"
              onPress={() => router.push(appRoutes.printer.queue)}
            />
            <PrinterMenuRow
              icon="CircleDollarSign"
              title="My Wages"
              onPress={() => router.push(appRoutes.printer.wages)}
            />
            <PrinterMenuRow
              icon="Settings"
              title="Preferences"
              onPress={() => router.push(appRoutes.printer.settings)}
              last
            />
          </PrinterSurfaceCard>

          <Pressable
            disabled={signingOut}
            onPress={() => void performSignOut()}
            style={({ pressed }) => [styles.printerSignOutLink, pressed && { opacity: 0.6 }, signingOut && styles.disabled]}
          >
            <AppText style={styles.printerSignOutLinkText}>{signingOut ? 'Signing out...' : 'Sign Out'}</AppText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: isPrinter ? '#F4F6FA' : colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderCopy}>
            <AppText variant="body" weight="bold" style={[styles.navTitle, { color: colors.typographyColor }]}>
              {title}
            </AppText>
            <AppText variant="caption" tone="muted">
              {subtitle}
            </AppText>
          </View>
          <Pressable
            disabled={signingOut}
            onPress={() => void performSignOut()}
            style={({ pressed }) => [
              styles.headerSignOut,
              isPrinter && styles.headerSignOutPrinter,
              pressed && { opacity: 0.55 },
              signingOut && styles.disabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            hitSlop={8}
          >
            <AppText variant="body" weight="medium" style={{ color: roleTheme.primary }}>
              {signingOut ? '...' : 'Sign Out'}
            </AppText>
          </Pressable>
        </View>

        <SettingsGroup compact style={styles.firstGroup}>
          <View style={[styles.profileRow, isPrinter && { backgroundColor: printerSurface }]}>
            <AppAvatar
              name={displayName}
              role={variant}
              size={48}
              source={bioPage?.photoUrl ? { uri: bioPage.photoUrl } : undefined}
            />
            <View style={styles.profileCopy}>
              <AppText variant="body" weight="semibold" numberOfLines={1} style={{ color: colors.typographyColor }}>
                {displayName}
              </AppText>
              <AppText variant="caption" tone="muted" numberOfLines={1}>
                {user?.email ?? 'No email on file'}
              </AppText>
              <View style={[styles.rolePill, { backgroundColor: colors.surfaceSoft }]}>
                <AppText variant="caption" weight="semibold" style={{ color: roleTheme.primaryDark }}>
                  {roleLabel}
                </AppText>
              </View>
            </View>
          </View>
          <View style={[styles.profileSeparator, { backgroundColor: isPrinter ? printerBorder : colors.border }]} />
          {primaryActions.map((action, index) => (
            <SettingsRow
              key={action.label}
              compact
              icon={action.icon}
              iconColor={colors.textPrimary}
              iconBackgroundColor={colors.surfaceSoft}
              title={action.label}
              subtitle={action.description}
              onPress={action.onPress}
              isLast={index === primaryActions.length - 1}
            />
          ))}
        </SettingsGroup>

        <SettingsSection title="Account" compact />
        <SettingsGroup compact>
          <SettingsRow
            compact
            icon="ShieldCheck"
            iconColor={colors.textPrimary}
            iconBackgroundColor={colors.surfaceSoft}
            title="Access"
            value={getRoleScopeSummary(user?.role)}
            showChevron={false}
          />
          <SettingsRow
            compact
            icon="Home"
            iconColor={colors.textPrimary}
            iconBackgroundColor={colors.surfaceSoft}
            title="Branch"
            value={user?.branch || 'Default branch'}
            showChevron={false}
          />
          <SettingsRow
            compact
            icon="Phone"
            iconColor={colors.textPrimary}
            iconBackgroundColor={colors.surfaceSoft}
            title="Contact"
            value={user?.phone || 'No phone on file'}
            showChevron={false}
          />
          <SettingsRow
            compact
            icon="User"
            iconColor={colors.textPrimary}
            iconBackgroundColor={colors.surfaceSoft}
            title="Member Since"
            value={formatDate(user?.createdAt)}
            showChevron={false}
            isLast
          />
        </SettingsGroup>

        <SettingsSection title="Overview" compact />
        <SettingsGroup compact>
          <ProfileStatsGrid>
            {stats.map((stat, index) => (
              <ProfileStatCell
                key={stat.label}
                compact
                label={stat.label}
                value={stat.value}
                icon={stat.icon}
                tone={stat.tone}
                index={index}
                total={stats.length}
              />
            ))}
          </ProfileStatsGrid>
        </SettingsGroup>

        {wageStats && wageStats.length > 0 ? (
          <>
            <SettingsSection title="My Wage" compact />
            <SettingsGroup compact>
              <ProfileStatsGrid>
                {wageStats.map((stat, index) => (
                  <ProfileStatCell
                    key={stat.label}
                    compact
                    label={stat.label}
                    value={stat.value}
                    icon={stat.icon}
                    tone={stat.tone}
                    index={index}
                    total={wageStats.length}
                  />
                ))}
              </ProfileStatsGrid>
            </SettingsGroup>
          </>
        ) : null}

        <SettingsSection title="Shortcuts" compact />
        <SettingsGroup compact>
          {shortcutActions.map((action) => (
            <SettingsRow
              key={action.label}
              compact
              icon={action.icon}
              iconColor={colors.textPrimary}
              iconBackgroundColor={colors.surfaceSoft}
              title={action.label}
              subtitle={action.description}
              onPress={action.onPress}
              isLast={false}
            />
          ))}
          <SettingsRow
            compact
            icon="LogOut"
            iconColor={theme.colors.danger}
            iconBackgroundColor={colors.surfaceSoft}
            title={signingOut ? 'Signing out...' : 'Sign Out'}
            subtitle="End the current session."
            onPress={() => void performSignOut()}
            destructive
            disabled={signingOut}
            isLast
          />
        </SettingsGroup>

        <SettingsSection title="Recent Activity" compact />
        {isLoading ? (
          <View style={[styles.stateCard, { backgroundColor: colors.surface }]}>
            <AppText variant="body" tone="muted">
              Loading account activity...
            </AppText>
          </View>
        ) : error ? (
          <View
            style={[
              styles.stateCard,
              { backgroundColor: colors.surfaceSoft },
            ]}
          >
            <AppText variant="body" style={{ color: theme.colors.danger }}>
              {error}
            </AppText>
          </View>
        ) : activity.length === 0 ? (
          <View style={[styles.stateCard, { backgroundColor: colors.surface }]}>
            <AppText variant="body" tone="muted">
              No recent account activity yet.
            </AppText>
          </View>
        ) : (
          <SettingsGroup compact>
            {activity.map((item, index) => (
              <SettingsRow
                key={`${item.title}-${item.meta}`}
                compact
                icon="Clock"
                iconColor={colors.textMuted}
                iconBackgroundColor={colors.surfaceSoft}
                title={item.title}
                subtitle={item.subtitle}
                value={item.meta}
                showChevron={false}
                isLast={index === activity.length - 1}
              />
            ))}
          </SettingsGroup>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export function SalesProfileScreen() {
  const { user } = useAuth();
  const { orders, isLoading, error } = useOrders('sales', user?.id ?? '');
  const delivered = orders.filter((order) => order.status === 'delivered').length;
  const active = orders.filter((order) => order.status !== 'delivered' && (order.cardStatus ?? 'active') !== 'closed').length;
  const paid = orders.filter((order) => order.paymentStatus === 'paid').length;
  const salesTheme = getRoleTheme('sales');

  return (
    <RoleProfileLayout
      variant="sales"
      title="Profile"
      subtitle="Sales account"
      isLoading={isLoading}
      error={error}
      stats={[
        { label: 'Total Orders', value: String(orders.length), icon: 'ClipboardList' },
        { label: 'Active', value: String(active), icon: 'Package' },
        { label: 'Delivered', value: String(delivered), icon: 'ShieldCheck', tone: salesTheme.primary },
        { label: 'Paid', value: String(paid), icon: 'Wallet', tone: salesTheme.primary },
      ]}
      actions={[
        {
          label: 'New Order',
          description: 'Create a customer order.',
          icon: 'ClipboardList',
          onPress: () => router.push(appRoutes.sales.newOrder),
        },
        {
          label: 'Settings',
          description: 'Language, theme, access, and session.',
          icon: 'Settings',
          onPress: () => router.push(appRoutes.sales.settings),
        },
        {
          label: 'My Orders',
          description: 'View orders assigned to this sales account.',
          icon: 'ClipboardList',
          onPress: () => router.push(appRoutes.sales.orders),
        },
        {
          label: 'My Payouts',
          description: 'Track commission and payout status.',
          icon: 'Wallet',
          onPress: () => router.push(appRoutes.sales.payouts),
        },
      ]}
      activity={orders.slice(0, 4).map((order) => ({
        title: order.customerName,
        subtitle: `${order.productType.replace('_', ' ')} x ${order.quantity}`,
        meta: order.status.replace('_', ' '),
      }))}
    />
  );
}

export function PrinterProfileScreen() {
  const { jobs, isLoading, error } = usePrinterJobs();
  const done = jobs.filter((job) => job.stage === 'done').length;
  const active = jobs.filter((job) => job.stage !== 'done' && job.stage !== 'failed').length;
  const wages = jobs
    .filter((job) => job.stage === 'done')
    .reduce((sum, job) => sum + job.cardsPrinted * job.perCardBonus + job.perOrderBonus, 0);
  const completedJobs = jobs.filter((job) => job.stage === 'done');
  const cardsPrinted = completedJobs.reduce((sum, job) => sum + job.cardsPrinted, 0);
  const failedCards = completedJobs.reduce((sum, job) => sum + job.failedCards, 0);
  const printerTheme = getRoleTheme('printer');

  return (
    <RoleProfileLayout
      variant="printer"
      title="Profile"
      subtitle="Workshop account"
      isLoading={isLoading}
      error={error}
      stats={[
        { label: 'Active Jobs', value: String(active), icon: 'Printer' },
        { label: 'Done', value: String(done), icon: 'ShieldCheck', tone: printerTheme.primary },
        { label: 'Earned', value: `$${wages.toFixed(2)}`, icon: 'BadgeDollarSign', tone: printerTheme.primary },
        { label: 'Completed', value: String(completedJobs.length), icon: 'ClipboardList' },
      ]}
      wageStats={[
        { label: 'Cards Printed', value: String(cardsPrinted), icon: 'Printer', tone: printerTheme.primary },
        {
          label: 'Failed Cards',
          value: String(failedCards),
          icon: 'ShieldCheck',
          tone: failedCards > 0 ? theme.status.error : theme.status.success,
        },
      ]}
      actions={[
        {
          label: 'Open Queue',
          description: 'Continue assigned production jobs.',
          icon: 'ClipboardList',
          onPress: () => router.push(appRoutes.printer.queue),
        },
        {
          label: 'QA Queue',
          description: 'Pass or fail orders awaiting inspection.',
          icon: 'ShieldCheck',
          onPress: () => router.push(appRoutes.qa.root as never),
        },
        {
          label: 'Settings',
          description: 'Language, theme, access, and session.',
          icon: 'Settings',
          onPress: () => router.push(appRoutes.printer.settings),
        },
        {
          label: 'Job Queue',
          description: 'Open print, NFC, and QA work.',
          icon: 'ClipboardList',
          onPress: () => router.push(appRoutes.printer.queue),
        },
        {
          label: 'My Wages',
          description: 'Review completed cards and pay status.',
          icon: 'BadgeDollarSign',
          onPress: () => router.push(appRoutes.printer.wages),
        },
      ]}
      activity={jobs.slice(0, 4).map((job) => ({
        title: `Job #${String(job.queueNumber).slice(-4)}`,
        subtitle: `${job.cardsPrinted} cards printed`,
        meta: job.stage.replace('_', ' '),
      }))}
    />
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    paddingTop: theme.spacing.sm,
    paddingBottom: 120,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 4,
    paddingBottom: 6,
  },
  pageHeaderCopy: {
    flex: 1,
    gap: 1,
  },
  navTitle: {
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: 0,
    fontWeight: '700',
  },
  headerSignOut: {
    paddingTop: 1,
    paddingLeft: theme.spacing.xs,
  },
  headerSignOutPrinter: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  firstGroup: {
    marginTop: 2,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 11,
  },
  profileCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  profileSeparator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: theme.spacing.md,
  },
  rolePill: {
    alignSelf: 'flex-start',
    marginTop: 3,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  stateCard: {
    marginHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadows.control,
  },
  disabled: {
    opacity: 0.55,
  },
  printerScroll: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 120,
    gap: 14,
  },
  printerSignOutLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  printerSignOutLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
  },
  printerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  printerTitle: {
    fontSize: 28,
    lineHeight: 32,
    color: '#0F172A',
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  printerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  printerSignOut: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  printerSignOutText: {
    color: '#16A34A',
    fontSize: 13,
    fontWeight: '800',
  },
  printerProfileCard: {
    marginTop: 4,
    padding: 14,
    borderRadius: 34,
  },
  printerInfoCard: {
    borderRadius: 28,
  },
  printerShortcutsCard: {
    borderRadius: 28,
  },
  printerProfileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  printerProfileCopy: {
    flex: 1,
    minWidth: 0,
  },
  printerProfileName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  printerProfileEmail: {
    marginTop: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  printerRolePill: {
    marginTop: 6,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    backgroundColor: '#ECFDF3',
  },
  printerRolePillText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#16A34A',
  },
  salesRolePill: {
    backgroundColor: '#EFF6FF',
  },
  salesRolePillText: {
    color: '#2563EB',
  },
  printerQuickRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E7EBF1',
    flexDirection: 'row',
  },
  printerQuickBtn: {
    flex: 1,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  printerQuickBtnBorder: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#E7EBF1',
  },
  printerQuickText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  printerInfoRow: {
    minHeight: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E7EBF1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  printerInfoRowLast: {
    borderBottomWidth: 0,
  },
  printerInfoIcon: {
    width: 30,
    height: 30,
    borderRadius: 11,
    backgroundColor: '#F4F6FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  printerInfoLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  printerInfoValue: {
    maxWidth: 140,
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'right',
  },
  printerShortcutRow: {
    minHeight: 62,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E7EBF1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  printerShortcutRowLast: {
    borderBottomWidth: 0,
  },
  printerShortcutIcon: {
    width: 34,
    height: 34,
    borderRadius: 13,
    backgroundColor: '#F4F6FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  printerShortcutCopy: {
    flex: 1,
    minWidth: 0,
  },
  printerShortcutTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  printerShortcutSubtitle: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  printerActivityCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  printerActivityHeader: {
    minHeight: 42,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  printerActivityTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  printerActivityRow: {
    minHeight: 50,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E7EBF1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  printerActivityRowLast: {
    borderBottomWidth: 0,
  },
  printerActivityIcon: {
    width: 30,
    height: 30,
    borderRadius: 11,
    backgroundColor: '#F4F6FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  printerActivityCopy: {
    flex: 1,
    minWidth: 0,
  },
  printerActivityRowTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  printerActivityRowSub: {
    marginTop: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  printerActivityMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'capitalize',
  },
  printerActivityEmpty: {
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  printerActivityEmptyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
