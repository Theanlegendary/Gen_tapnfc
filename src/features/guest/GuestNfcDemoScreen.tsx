import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppHeader } from '@/src/components/AppHeader';
import { AppIcon } from '@/src/components/AppIcon';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { AppText } from '@/src/components/AppText';
import { iosDesign } from '@/src/design-system/ios';
import { GuestHintBanner, guestUi } from '@/src/features/guest/GuestScreenUi';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { getCustomerInsights } from '@/src/services/customerInsightsService';

export function GuestNfcDemoScreen() {
  const pulse = useRef(new Animated.Value(0)).current;
  const sheen = useRef(new Animated.Value(0)).current;
  const { user } = useAuth();
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

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    const sheenLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(800),
        Animated.timing(sheen, {
          toValue: 1,
          duration: 1700,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(sheen, {
          toValue: 0,
          duration: 1,
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    sheenLoop.start();
    return () => {
      pulseLoop.stop();
      sheenLoop.stop();
    };
  }, [pulse, sheen]);

  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.35],
  });
  const ringOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.44, 0],
  });

  function simulateTap() {
    if (bioSlug) {
      router.push(`/public/${bioSlug}`);
      return;
    }
    requireAccount(undefined, {
      message: 'Sign in and publish an e-card to open your profile on tap.',
    });
  }

  return (
    <ScreenContainer>
      <AppHeader title="NFC Preview" subtitle="Simulated tap - no chip write" showBack={router.canGoBack()} />

      <GuestHintBanner>
        <AppText style={styles.hintBody}>
          Preview the tap experience with a modern access-card interaction. Real chip writing unlocks after account setup.
        </AppText>
      </GuestHintBanner>

      <Pressable style={styles.tapZone} onPress={simulateTap} accessibilityRole="button" accessibilityLabel="Simulate NFC tap">
        <Animated.View
          pointerEvents="none"
          style={[
            styles.softGlow,
            {
              opacity: ringOpacity,
              transform: [{ scale: ringScale }],
            },
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            {
              opacity: ringOpacity,
              transform: [{ scale: ringScale }],
            },
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.sheen,
            {
              transform: [
                { translateX: sheen.interpolate({ inputRange: [0, 1], outputRange: [-180, 260] }) },
                { rotate: '-18deg' },
              ],
            },
          ]}
        />
        <View style={styles.chip}>
          <AppIcon name="Nfc" size={48} color={guestUi.accent} />
        </View>
        <AppText variant="h2" style={styles.tapLabel}>
          Ready to tap
        </AppText>
        <AppText variant="caption" tone="muted">
          Simulates opening a secure profile card
        </AppText>
      </Pressable>

      <Pressable
        style={styles.writeRow}
        onPress={() =>
          requireAccount(undefined, {
            message: 'Create an account to program and lock NFC chips with your profile URL.',
          })
        }
      >
        <AppIcon name="ShieldCheck" size={18} color={guestUi.muted} />
        <AppText variant="caption" tone="muted">
          Real NFC write requires an account
        </AppText>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hintBody: { fontSize: 12, fontWeight: '500', color: guestUi.muted, lineHeight: 17 },
  tapZone: {
    marginTop: iosDesign.spacing.lg,
    minHeight: 300,
    borderRadius: guestUi.radiusLg,
    backgroundColor: guestUi.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: iosDesign.spacing.sm,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: guestUi.border,
    ...guestUi.shadowFloating,
  },
  softGlow: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: guestUi.accentSoft,
  },
  ring: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(48,209,88,0.28)',
  },
  sheen: {
    position: 'absolute',
    top: -70,
    bottom: -70,
    width: 62,
    backgroundColor: 'rgba(255,255,255,0.54)',
  },
  chip: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: guestUi.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    ...guestUi.shadow,
  },
  tapLabel: {
    marginTop: iosDesign.spacing.sm,
  },
  writeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: iosDesign.spacing.xs,
    marginTop: iosDesign.spacing.md,
  },
});
