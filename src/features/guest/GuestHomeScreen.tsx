import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/src/components/AppButton';
import { AppIcon } from '@/src/components/AppIcon';
import { FloatingNfcCard } from '@/src/components/FloatingNfcCard';
import { AppText } from '@/src/components/AppText';
import { appRoutes } from '@/src/constants/navigation';
import { iosDesign } from '@/src/design-system/ios';
import {
  GuestHero,
  GuestHintBanner,
  GuestQuickTile,
  guestUi,
} from '@/src/features/guest/GuestScreenUi';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { getCustomerInsights, type CustomerInsights } from '@/src/services/customerInsightsService';
import { loadGuestCardDraft } from '@/src/services/guestDraftService';

export function GuestHomeScreen() {
  const { user } = useAuth();
  const isGuest = useIsGuest();
  const { requireAccount } = useRequireAccount();
  const [hasDraft, setHasDraft] = useState(false);
  const [insights, setInsights] = useState<CustomerInsights | null>(null);

  const refreshDraft = useCallback(async () => {
    const draft = await loadGuestCardDraft();
    setHasDraft(Boolean(draft));
  }, []);

  const refreshInsights = useCallback(async () => {
    if (isGuest || !user?.id) {
      setInsights(null);
      return;
    }
    try {
      setInsights(await getCustomerInsights(user.id));
    } catch {
      setInsights(null);
    }
  }, [isGuest, user?.id]);

  useEffect(() => {
    void refreshDraft();
    void refreshInsights();
  }, [refreshDraft, refreshInsights]);

  function openPreview() {
    if (insights?.bioSlug) {
      router.push(`/public/${insights.bioSlug}`);
      return;
    }
    requireAccount(undefined, {
      message: 'Sign in and choose e-card to publish your live NFC profile.',
    });
  }

  function openCheckout() {
    if (isGuest) {
      requireAccount(() => router.push(appRoutes.guestPostLoginChoice), {
        message: 'Sign in to pay and create your order in Firebase.',
      });
      return;
    }
    router.push(appRoutes.guestPostLoginChoice);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <GuestHero
          eyebrow={getGreeting()}
          title={`Welcome, ${firstName(user?.displayName)}`}
          subtitle="Design your NFC card, checkout with real orders, and track production — all synced to Firebase."
        />

        <FloatingNfcCard
          name={user?.displayName ?? 'SiteHub'}
          subtitle="Tap, scan, and share your NFC identity"
        />

        {hasDraft ? (
          <GuestHintBanner>
            <AppText style={styles.hintTitle}>Draft on this device</AppText>
            <AppText style={styles.hintBody}>
              Your design is saved locally. Sign in to checkout and sync to your Firebase account.
            </AppText>
          </GuestHintBanner>
        ) : (
          <GuestHintBanner>
            <AppText style={styles.hintBody}>
              Start with Design your card — pick virtual or physical, then sign in to pay and track your real order.
            </AppText>
          </GuestHintBanner>
        )}

        {!isGuest && insights ? (
          <GuestHintBanner>
            <AppText style={styles.hintTitle}>Your account</AppText>
            <AppText style={styles.hintBody}>
              {insights.totalOrders} order(s) · {insights.activeOrders} in progress
              {insights.bioSlug ? ` · Profile live at /${insights.bioSlug}` : ''}
            </AppText>
          </GuestHintBanner>
        ) : null}

        <AppText style={styles.sectionLabel}>Create & order</AppText>
        <View style={styles.quickGrid}>
          <GuestQuickTile
            icon="PenLine"
            title="Design your card"
            description="Virtual or physical — live preview and details"
            onPress={() => router.push(appRoutes.guestDesign)}
            accent={guestUi.charcoal}
          />
          <GuestQuickTile
            icon="Eye"
            title="Preview profile"
            description={
              insights?.bioSlug ? 'Open your live public page' : 'Sign in + e-card to publish'
            }
            onPress={openPreview}
            accent="#0EA5E9"
          />
          <GuestQuickTile
            icon="Wallet"
            title="Checkout"
            description="Pay and create a real Firebase order"
            onPress={openCheckout}
          />
          <GuestQuickTile
            icon="Package"
            title="Track order"
            description={isGuest ? 'Sign in to view orders' : 'Live status from Firebase'}
            onPress={() => router.push(appRoutes.guestTrackOrder)}
          />
        </View>

        <AppText style={styles.sectionLabel}>Explore</AppText>
        <View style={styles.quickGrid}>
          <GuestQuickTile
            icon="ScanLine"
            title="Scan QR"
            description="Scan a real profile QR code"
            onPress={() => router.push(appRoutes.scan)}
          />
          <GuestQuickTile
            icon="Nfc"
            title="NFC"
            description="Learn how tap-to-open works"
            onPress={() => router.push(appRoutes.nfcDemo)}
            accent="#7c3aed"
          />
          <GuestQuickTile
            icon="Sparkles"
            title="Themes"
            description="Bio page color themes"
            onPress={() => router.push('/theme-picker')}
          />
          <GuestQuickTile
            icon="TrendingUp"
            title="Analytics"
            description={isGuest ? 'Sign in for stats' : 'Orders & profile from Firebase'}
            onPress={() => router.push(appRoutes.guestAnalytics)}
          />
        </View>

        <View style={styles.ctaBlock}>
          <View style={styles.ctaIcon}>
            <AppIcon name="Sparkles" size={22} color={guestUi.accent} />
          </View>
          <View style={styles.ctaCopy}>
            <AppText style={styles.ctaTitle}>Ready for your own NFC identity?</AppText>
            <AppText style={styles.ctaSub}>Sign up to save designs, pay, and track real card orders.</AppText>
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
