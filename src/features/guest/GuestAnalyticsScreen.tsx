import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '@/src/components/AppHeader';
import { MetricCard } from '@/src/components/MetricCard';
import { AppText } from '@/src/components/AppText';
import { GUEST_DEMO_ANALYTICS } from '@/src/constants/guestDemo';
import { iosDesign } from '@/src/design-system/ios';
import { GuestDemoPill, GuestSurfaceCard, guestUi } from '@/src/features/guest/GuestScreenUi';

export function GuestAnalyticsScreen() {
  const maxWeekly = Math.max(...GUEST_DEMO_ANALYTICS.weeklyViews);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppHeader title="Analytics" subtitle="Read-only demo data" showBack />

        <GuestDemoPill label="DEMO PREVIEW" />

        <View style={styles.metricsRow}>
          <MetricCard label="Profile views" value={String(GUEST_DEMO_ANALYTICS.profileViews)} highlight="Preview" />
          <MetricCard label="NFC taps" value={String(GUEST_DEMO_ANALYTICS.nfcTaps)} />
        </View>
        <View style={styles.metricsRow}>
          <MetricCard label="QR scans" value={String(GUEST_DEMO_ANALYTICS.qrScans)} />
          <MetricCard label="Contact saves" value={String(GUEST_DEMO_ANALYTICS.contactSaves)} />
        </View>

        <GuestSurfaceCard title="Traffic sources">
          {GUEST_DEMO_ANALYTICS.topSources.map((source) => (
            <View key={source.label} style={styles.sourceRow}>
              <AppText style={styles.sourceLabel}>{source.label}</AppText>
              <AppText style={styles.sourceValue}>{source.value}%</AppText>
            </View>
          ))}
        </GuestSurfaceCard>

        <GuestSurfaceCard title="Views this week">
          <View style={styles.chart}>
            {GUEST_DEMO_ANALYTICS.weeklyViews.map((value, index) => (
              <View key={index} style={styles.barCol}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(12, (value / maxWeekly) * 96),
                    },
                  ]}
                />
                <AppText style={styles.barLabel}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</AppText>
              </View>
            ))}
          </View>
        </GuestSurfaceCard>
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
  sourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: iosDesign.spacing.xs,
  },
  sourceLabel: { fontSize: 15, fontWeight: '600', color: guestUi.text },
  sourceValue: { fontSize: 15, fontWeight: '800', color: guestUi.accent },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 4,
    marginTop: iosDesign.spacing.md,
    height: 120,
  },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  bar: {
    width: '100%',
    maxWidth: 28,
    borderRadius: guestUi.radiusSm,
    backgroundColor: guestUi.accent,
  },
  barLabel: { fontSize: 10, fontWeight: '600', color: guestUi.muted },
});
