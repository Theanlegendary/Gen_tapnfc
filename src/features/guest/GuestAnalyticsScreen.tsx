import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/src/components/AppButton';
import { AppEmptyState } from '@/src/components/AppState';
import { AppHeader } from '@/src/components/AppHeader';
import { MetricCard } from '@/src/components/MetricCard';
import { AppText } from '@/src/components/AppText';
import { iosDesign } from '@/src/design-system/ios';
import { GuestSurfaceCard, guestUi } from '@/src/features/guest/GuestScreenUi';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { getCustomerInsights, type CustomerInsights } from '@/src/services/customerInsightsService';

export function GuestAnalyticsScreen() {
  const { user } = useAuth();
  const isGuest = useIsGuest();
  const { requireAccount } = useRequireAccount();
  const [insights, setInsights] = useState<CustomerInsights | null>(null);
  const [loading, setLoading] = useState(!isGuest);

  const load = useCallback(async () => {
    if (isGuest || !user?.id) {
      setInsights(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setInsights(await getCustomerInsights(user.id));
    } catch {
      setInsights(null);
    } finally {
      setLoading(false);
    }
  }, [isGuest, user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (isGuest) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <AppHeader title="Analytics" subtitle="Sign in for live stats" showBack />
          <AppEmptyState
            iconName="TrendingUp"
            title="Analytics need an account"
            description="Profile and order stats come from Firebase after you sign in and publish your card."
          />
          <AppButton label="Sign in" onPress={() => requireAccount()} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppHeader title="Analytics" subtitle="From your Firebase account" showBack />

        {loading ? (
          <ActivityIndicator color={guestUi.accent} />
        ) : !insights ? (
          <AppEmptyState
            iconName="TrendingUp"
            title="No data yet"
            description="Create your e-card or place an order to start seeing activity here."
          />
        ) : (
          <>
            <View style={styles.metricsRow}>
              <MetricCard label="Total orders" value={String(insights.totalOrders)} highlight="Live" />
              <MetricCard label="In progress" value={String(insights.activeOrders)} />
            </View>
            <View style={styles.metricsRow}>
              <MetricCard label="Delivered" value={String(insights.deliveredOrders)} />
              <MetricCard
                label="Public profile"
                value={insights.bioSlug ? 'Live' : 'None'}
              />
            </View>

            <GuestSurfaceCard title="Profile">
              {insights.bioSlug ? (
                <>
                  <AppText style={styles.line}>Slug: /public/{insights.bioSlug}</AppText>
                  <AppText style={styles.lineMuted}>
                    {insights.displayName ?? user?.displayName ?? 'Your card'}
                  </AppText>
                  <AppButton
                    label="Open public profile"
                    variant="outline"
                    onPress={() => router.push(`/public/${insights.bioSlug}`)}
                  />
                </>
              ) : (
                <AppText style={styles.lineMuted}>
                  No published e-card yet. Choose e-card at checkout to create your live profile.
                </AppText>
              )}
            </GuestSurfaceCard>

            <AppText style={styles.note}>
              Detailed tap and view analytics will appear here when NFC event tracking is enabled in Firebase.
            </AppText>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: guestUi.bg },
  scroll: {
    padding: iosDesign.spacing.md,
    gap: iosDesign.spacing.md,
    paddingBottom: iosDesign.spacing.xxl,
  },
  metricsRow: { flexDirection: 'row', gap: iosDesign.spacing.sm },
  line: { fontSize: 14, fontWeight: '700', color: guestUi.text },
  lineMuted: { fontSize: 13, fontWeight: '500', color: guestUi.muted, lineHeight: 18 },
  note: { fontSize: 12, fontWeight: '500', color: guestUi.muted, lineHeight: 17 },
});
