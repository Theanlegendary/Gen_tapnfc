import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/src/components/AppButton';
import { AppIcon } from '@/src/components/AppIcon';
import { FloatingNfcCard } from '@/src/components/FloatingNfcCard';
import { MetricCard } from '@/src/components/MetricCard';
import { AppText } from '@/src/components/AppText';
import { appRoutes } from '@/src/constants/navigation';
import { GUEST_DEMO_ANALYTICS, GUEST_DEMO_ORDER_ID, GUEST_SAMPLE_PROFILE_SLUG } from '@/src/constants/guestDemo';
import { iosDesign } from '@/src/design-system/ios';
import {
  GuestHero,
  GuestHintBanner,
  GuestQuickTile,
  guestUi,
} from '@/src/features/guest/GuestScreenUi';
import { useAuth } from '@/src/hooks/useAuth';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { loadGuestCardDraft } from '@/src/services/guestDraftService';

export function GuestHomeScreen() {
  const { user } = useAuth();
  const { requireAccount } = useRequireAccount();
  const [hasDraft, setHasDraft] = useState(false);

  const refreshDraft = useCallback(async () => {
    const draft = await loadGuestCardDraft();
    setHasDraft(Boolean(draft));
  }, []);

  useEffect(() => {
    void refreshDraft();
  }, [refreshDraft]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <GuestHero
          eyebrow={getGreeting()}
          title={`Welcome, ${firstName(user?.displayName)}`}
          subtitle="Design your card, preview your NFC identity, and explore the full consumer journey — no account required."
        />

        <FloatingNfcCard
          name={user?.displayName ?? 'ID.NTITY'}
          subtitle="Tap, scan, and share your NFC identity"
        />

        {hasDraft ? (
          <GuestHintBanner>
            <AppText style={styles.hintTitle}>Draft on this device</AppText>
            <AppText style={styles.hintBody}>You have a saved card design. Open Design your card to continue or checkout.</AppText>
          </GuestHintBanner>
        ) : (
          <GuestHintBanner>
            <AppText style={styles.hintBody}>
              New here? Design your card, pick virtual or physical, then checkout. Track order is demo-only.
            </AppText>
          </GuestHintBanner>
        )}

        <AppText style={styles.sectionLabel}>Create & order</AppText>
        <View style={styles.quickGrid}>
          <GuestQuickTile
            icon="PenLine"
            title="Design your card"
            description="Virtual or physical NFC — live preview, details, and apply"
            onPress={() => router.push(appRoutes.guestDesign)}
            accent={guestUi.charcoal}
          />
          <GuestQuickTile
            icon="Eye"
            title="Preview profile"
            description="See how your public NFC page looks when tapped"
            onPress={() => router.push(`/public/${GUEST_SAMPLE_PROFILE_SLUG}`)}
            accent="#0EA5E9"
          />
          <GuestQuickTile
            icon="Wallet"
            title="Demo checkout"
            description="3-step walkthrough — no payment processed"
            onPress={() => router.push(appRoutes.guestCheckout)}
          />
          <GuestQuickTile
            icon="Package"
            title="Track order"
            description={`Sample timeline · ${GUEST_DEMO_ORDER_ID}`}
            onPress={() => router.push(appRoutes.guestTrackOrder)}
          />
        </View>

        <View style={styles.metricsRow}>
          <MetricCard label="Demo views" value={String(GUEST_DEMO_ANALYTICS.profileViews)} highlight="Preview" />
          <MetricCard label="Demo taps" value={String(GUEST_DEMO_ANALYTICS.nfcTaps)} />
        </View>

        <AppText style={styles.sectionLabel}>Explore</AppText>
        <View style={styles.quickGrid}>
          <GuestQuickTile
            icon="ScanLine"
            title="Scan QR"
            description="Camera scanner and demo profile codes"
            onPress={() => router.push(appRoutes.scan)}
          />
          <GuestQuickTile
            icon="Nfc"
            title="NFC tap demo"
            description="Simulated tap → sample public profile"
            onPress={() => router.push(appRoutes.nfcDemo)}
            accent="#7c3aed"
          />
          <GuestQuickTile
            icon="Sparkles"
            title="Themes"
            description="Preview bio page color themes"
            onPress={() => router.push('/theme-picker')}
          />
          <GuestQuickTile
            icon="TrendingUp"
            title="Analytics"
            description="Read-only engagement demo"
            onPress={() => router.push(appRoutes.guestAnalytics)}
          />
        </View>

        <View style={styles.ctaBlock}>
          <View style={styles.ctaIcon}>
            <AppIcon name="Sparkles" size={22} color={guestUi.accent} />
          </View>
          <View style={styles.ctaCopy}>
            <AppText style={styles.ctaTitle}>Ready for your own NFC identity?</AppText>
            <AppText style={styles.ctaSub}>Sign up to save designs, place real orders, and activate chips.</AppText>
          </View>
        </View>
        <AppButton
          label="Create my NFC identity"
          onPress={() =>
            requireAccount(undefined, {
              message: 'Create your account to unlock your own NFC identity.',
            })
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function firstName(name?: string | null) {
  return name?.trim().split(/\s+/)[0] || 'there';
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: guestUi.bg },
  scroll: {
    padding: iosDesign.spacing.md,
    gap: iosDesign.spacing.md,
    paddingBottom: iosDesign.spacing.xxl,
  },
  hintTitle: { fontSize: 13, fontWeight: '700', color: guestUi.text },
  hintBody: { fontSize: 12, fontWeight: '500', color: guestUi.muted, lineHeight: 17 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: guestUi.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: iosDesign.spacing.xs,
  },
  quickGrid: { gap: iosDesign.spacing.sm },
  metricsRow: { flexDirection: 'row', gap: iosDesign.spacing.sm },
  ctaBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosDesign.spacing.md,
    backgroundColor: guestUi.surface,
    borderRadius: guestUi.radiusLg,
    padding: iosDesign.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: guestUi.border,
    ...guestUi.shadow,
  },
  ctaIcon: {
    width: 44,
    height: 44,
    borderRadius: guestUi.radiusSm,
    backgroundColor: guestUi.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaCopy: { flex: 1, gap: 4 },
  ctaTitle: { fontSize: 15, fontWeight: '800', color: guestUi.text },
  ctaSub: { fontSize: 12, fontWeight: '500', color: guestUi.muted, lineHeight: 16 },
});
