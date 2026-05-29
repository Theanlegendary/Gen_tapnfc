import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs } from 'firebase/firestore';
import { AppAvatar } from '@/src/components/AppAvatar';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import {
  ProfileStatCell,
  ProfileStatsGrid,
  SettingsGroup,
  SettingsRow,
  SettingsSection,
} from '@/src/components/SettingsGroup';
import { appRoutes } from '@/src/constants/navigation';
import { theme } from '@/src/constants/theme';
import { useAuth } from '@/src/hooks/useAuth';
import { usePreferences } from '@/src/hooks/usePreferences';
import { useProductionStats } from '@/src/hooks/useProductionStats';
import { useRoleFlags } from '@/src/hooks/useRoleFlags';
import { db } from '@/src/services/firebaseClient';

const MENU: {
  title: string;
  desc: string;
  icon: AppIconName;
  iconColor: string;
  route: string;
}[] = [
  { title: 'Users', desc: 'Staff accounts and roles', icon: 'User', iconColor: '#000000', route: '/admin/users' },
  { title: 'Orders', desc: 'All orders and status', icon: 'ClipboardList', iconColor: theme.colors.primary, route: '/admin/orders' },
  { title: 'Batches', desc: 'Production batches and assignments', icon: 'Package', iconColor: '#5856D6', route: '/admin/batches' },
  { title: 'Printer Health', desc: 'Device status (placeholder telemetry)', icon: 'Printer', iconColor: '#32ADE6', route: '/admin/printer-health' },
  { title: 'Audit Logs', desc: 'QA, shipping, and reprint history', icon: 'FileText', iconColor: '#34C759', route: '/admin/audit-logs' },
  { title: 'NFC Logs', desc: 'Chip write and verify logs', icon: 'Nfc', iconColor: '#5856D6', route: '/admin/nfc-logs' },
  { title: 'Salary', desc: 'Wages and commission', icon: 'BadgeDollarSign', iconColor: '#FF9500', route: '/admin/salary' },
  { title: 'QA Videos', desc: 'Review proof recordings', icon: 'FileVideo', iconColor: '#FF3B30', route: '/admin/qa-videos' },
  { title: 'Reports', desc: 'Revenue and performance', icon: 'Wallet', iconColor: '#32ADE6', route: '/admin/reports' },
  { title: 'Products', desc: 'Cards, prices, and stock', icon: 'Package', iconColor: '#AF52DE', route: '/admin/products' },
  { title: 'Settings', desc: 'Rates, branches, and config', icon: 'Settings', iconColor: '#8E8E93', route: '/admin/settings' },
];

export default function AdminDashboardScreen() {
  const { user, signOutUser } = useAuth();
  const { isAdmin } = useRoleFlags();
  const { colors } = usePreferences();
  const { stats: production, isLoading: productionLoading } = useProductionStats();
  const [stats, setStats] = useState({ orders: 0, revenue: 0, pending: 0, todayOrders: 0 });
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(collection(db, 'orders'));
        const orders = snap.docs.map((d) => d.data());
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setStats({
          orders: orders.length,
          revenue: orders.filter((o) => o.paymentStatus === 'paid').reduce((s, o) => s + (o.quantity ?? 1) * 49, 0),
          pending: orders.filter((o) => ['printing', 'nfc_writing', 'nfc_verification'].includes(o.status)).length,
          todayOrders: orders.filter((o) => o.createdAt?.toDate?.() >= today).length,
        });
      } catch {
        // keep defaults
      }
    }
    load();
  }, []);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOutUser();
      router.replace(appRoutes.login);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign out.';
      Alert.alert('Error', message);
      setSigningOut(false);
    }
  }

  if (!isAdmin) return <Redirect href="/auth/login" />;

  const displayName = user?.displayName?.trim() || 'Administrator';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <View style={styles.topCopy}>
          <AppText variant="caption" tone="muted" weight="medium">
            Admin
          </AppText>
          <AppText variant="h2" weight="bold" numberOfLines={1} style={{ color: colors.typographyColor }}>
            {displayName}
          </AppText>
          {user?.email ? (
            <AppText variant="caption" tone="muted" numberOfLines={1}>
              {user.email}
            </AppText>
          ) : null}
        </View>
        <AppAvatar name={displayName} role="admin" size={40} />
        <Pressable
          accessibilityLabel="Sign out"
          accessibilityRole="button"
          onPress={handleSignOut}
          disabled={signingOut}
          hitSlop={8}
          style={({ pressed }) => [
            styles.signOutBtn,
            { backgroundColor: colors.surface },
            pressed && { opacity: 0.75 },
          ]}
        >
          <AppIcon name="LogOut" size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SettingsSection title="Overview" compact />
        <SettingsGroup compact>
          <ProfileStatsGrid>
            <ProfileStatCell
              compact
              index={0}
              total={4}
              label="Total orders"
              value={String(stats.orders)}
              icon="ClipboardList"
            />
            <ProfileStatCell
              compact
              index={1}
              total={4}
              label="Revenue"
              value={`$${stats.revenue}`}
              icon="Wallet"
              tone={theme.colors.success}
            />
            <ProfileStatCell
              compact
              index={2}
              total={4}
              label="In progress"
              value={String(stats.pending)}
              icon="Clock"
              tone="#FF9500"
            />
            <ProfileStatCell
              compact
              index={3}
              total={4}
              label="Today"
              value={String(stats.todayOrders)}
              icon="Calendar"
              tone={colors.primary}
            />
          </ProfileStatsGrid>
        </SettingsGroup>

        <SettingsSection title="Production floor" compact />
        <SettingsGroup compact>
          <ProfileStatsGrid>
            <ProfileStatCell
              compact
              index={0}
              total={4}
              label="Cards today"
              value={productionLoading ? '…' : String(production?.cardsToday ?? 0)}
              icon="Package"
            />
            <ProfileStatCell
              compact
              index={1}
              total={4}
              label="Active batches"
              value={productionLoading ? '…' : String(production?.batchesActive ?? 0)}
              icon="Package"
              tone="#5856D6"
            />
            <ProfileStatCell
              compact
              index={2}
              total={4}
              label="QA pass rate"
              value={productionLoading ? '…' : `${production?.qaPassRate ?? 100}%`}
              icon="ShieldCheck"
              tone="#34C759"
            />
            <ProfileStatCell
              compact
              index={3}
              total={4}
              label="Jobs in queue"
              value={productionLoading ? '…' : String(production?.jobsInQueue ?? 0)}
              icon="ClipboardList"
              tone="#FF9500"
            />
          </ProfileStatsGrid>
        </SettingsGroup>
        {production && !productionLoading ? (
          <AppText variant="caption" tone="muted" style={styles.productionMeta}>
            {production.qaPending} awaiting QA · {production.readyToShip} ready to ship ·{' '}
            {production.reprintsToday} reprints today
          </AppText>
        ) : null}

        <SettingsSection title="Management" compact />
        <SettingsGroup compact>
          {MENU.map((item, index) => (
            <SettingsRow
              key={item.title}
              compact
              icon={item.icon}
              iconColor={item.iconColor}
              iconBackgroundColor={`${item.iconColor}1A`}
              title={item.title}
              subtitle={item.desc}
              onPress={() => router.push(item.route as never)}
              isLast={index === MENU.length - 1}
            />
          ))}
        </SettingsGroup>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  topCopy: { flex: 1, gap: 2 },
  signOutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.control,
  },
  scroll: {
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  productionMeta: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: -theme.spacing.xs,
  },
});
