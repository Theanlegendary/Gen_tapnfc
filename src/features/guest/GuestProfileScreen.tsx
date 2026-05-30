import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/src/components/AppButton';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { appRoutes } from '@/src/constants/navigation';
import { iosDesign } from '@/src/design-system/ios';
import {
  GuestDemoPill,
  GuestQuickTile,
  GuestSurfaceCard,
  guestUi,
} from '@/src/features/guest/GuestScreenUi';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { getCustomerInsights } from '@/src/services/customerInsightsService';

export function GuestProfileScreen() {
  const { user, signOutUser } = useAuth();
  const isGuest = useIsGuest();
  const { requireAccount } = useRequireAccount();
  const [bioSlug, setBioSlug] = useState<string | null>(null);

  useEffect(() => {
    if (isGuest || !user?.id) {
      setBioSlug(null);
      return;
    }
    void getCustomerInsights(user.id).then((insights) => setBioSlug(insights.bioSlug));
  }, [isGuest, user?.id]);

  function openPreview() {
    if (bioSlug) {
      router.push(`/public/${bioSlug}`);
      return;
    }
    requireAccount(undefined, {
      message: 'Publish an e-card to get your live public profile URL.',
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <AppText style={styles.title}>Guest Profile</AppText>
          <GuestDemoPill label={isGuest ? 'GUEST' : 'ACCOUNT'} />
        </View>

        <GuestSurfaceCard>
          <View style={styles.identityRow}>
            <View style={styles.avatar}>
              <AppText style={styles.avatarText}>{(user?.displayName ?? 'G')[0]}</AppText>
            </View>
            <View style={styles.identityCopy}>
              <AppText style={styles.name}>{user?.displayName ?? 'Guest User'}</AppText>
              <AppText style={styles.sub}>
                Explore the consumer journey — create an account for your own NFC identity.
              </AppText>
            </View>
          </View>
        </GuestSurfaceCard>

        <GuestQuickTile
          icon="CreditCard"
          title="Design card"
          description="Customize and save a local draft"
          onPress={() => router.push(appRoutes.guestDesign)}
        />
        <GuestQuickTile
          icon="Eye"
          title="Preview profile"
          description={bioSlug ? 'Your live Firebase profile' : 'Publish e-card to go live'}
          onPress={openPreview}
          accent="#0EA5E9"
        />

        <AppButton
          label="Create my profile"
          onPress={() =>
            requireAccount(undefined, {
              message: 'Create an account to build and save your own public NFC identity.',
            })
          }
        />

        <AppText style={styles.sectionLabel}>Locked until you sign up</AppText>
        {[
          { label: 'Generate personal QR', icon: 'QrCode' as const },
          { label: 'Write NFC chip', icon: 'Nfc' as const },
          { label: 'Add to Apple / Google Wallet', icon: 'Wallet' as const },
          { label: 'Upload profile photo', icon: 'Image' as const },
        ].map((action) => (
          <Pressable
            key={action.label}
            onPress={() =>
              requireAccount(undefined, {
                message: `Create an account to unlock: ${action.label.toLowerCase()}.`,
              })
            }
          >
            <View style={styles.lockedRow}>
              <AppIcon name={action.icon} size={20} color={guestUi.muted} />
              <AppText style={styles.lockedLabel}>{action.label}</AppText>
              <AppIcon name="ShieldCheck" size={16} color={guestUi.muted} />
            </View>
          </Pressable>
        ))}

        <AppButton label="Sign In" onPress={() => router.push('/auth/login')} />
        <AppButton label="Sign Out of Guest" variant="outline" onPress={() => void signOutUser()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: guestUi.bg },
  scroll: {
    padding: iosDesign.spacing.md,
    gap: iosDesign.spacing.sm,
    paddingBottom: iosDesign.spacing.xxl,
  },
  header: { gap: iosDesign.spacing.xs, marginBottom: iosDesign.spacing.xs },
  title: { fontSize: 28, fontWeight: '700', color: guestUi.text, letterSpacing: -0.4 },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: iosDesign.spacing.md },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: guestUi.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  identityCopy: { flex: 1, gap: 4 },
  name: { fontSize: 18, fontWeight: '700', color: guestUi.text },
  sub: { fontSize: 12, fontWeight: '500', color: guestUi.muted, lineHeight: 17 },
  sectionLabel: {
    marginTop: iosDesign.spacing.md,
    fontSize: 11,
    fontWeight: '800',
    color: guestUi.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosDesign.spacing.sm,
    backgroundColor: guestUi.surface,
    borderRadius: guestUi.radiusMd,
    padding: iosDesign.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: guestUi.border,
    opacity: 0.9,
  },
  lockedLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: guestUi.text },
});
