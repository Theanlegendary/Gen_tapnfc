import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { getRoleTheme, RoleThemeKey, theme } from '@/src/constants/theme';
import { usePreferences } from '@/src/hooks/usePreferences';

interface FloatingNfcCardProps {
  name?: string;
  subtitle?: string;
  role?: RoleThemeKey;
}

export function FloatingNfcCard({
  name = 'ID.NTITY',
  subtitle = 'NFC identity card',
  role = 'default',
}: FloatingNfcCardProps) {
  const float = useRef(new Animated.Value(0)).current;
  const sheen = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const flip = useRef(new Animated.Value(0)).current;
  const roleTheme = getRoleTheme(role);
  const { colors } = usePreferences();

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    const sheenLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(900),
        Animated.timing(sheen, {
          toValue: 1,
          duration: 1900,
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
    const pulseLoop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    );
    const flipLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(4200),
        Animated.timing(flip, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(flip, {
          toValue: 0,
          duration: 850,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    floatLoop.start();
    sheenLoop.start();
    pulseLoop.start();
    flipLoop.start();

    return () => {
      floatLoop.stop();
      sheenLoop.stop();
      pulseLoop.stop();
      flipLoop.stop();
    };
  }, [flip, float, pulse, sheen]);

  const floatTransform = {
    transform: [
      {
        translateY: float.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -9],
        }),
      },
      {
        rotateX: float.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '3deg'],
        }),
      },
      {
        rotateZ: float.interpolate({
          inputRange: [0, 1],
          outputRange: ['-0.8deg', '0.8deg'],
        }),
      },
      {
        rotateY: flip.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: ['0deg', '9deg', '0deg'],
        }),
      },
    ],
  };
  const sheenTransform = {
    transform: [
      {
        translateX: sheen.interpolate({
          inputRange: [0, 1],
          outputRange: [-170, 260],
        }),
      },
      { rotate: '-18deg' },
    ],
  };
  const pulseStyle = {
    opacity: pulse.interpolate({
      inputRange: [0, 0.65, 1],
      outputRange: [0.34, 0.12, 0],
    }),
    transform: [
      {
        scale: pulse.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.85],
        }),
      },
    ],
  };

  return (
    <View style={styles.stage}>
      <Animated.View style={[styles.glow, { backgroundColor: colors.surfaceSoft }, pulseStyle]} />
      <Animated.View style={[styles.card, floatTransform, { shadowColor: roleTheme.primary }]}>
        <View style={styles.cardFill} />
        <Animated.View pointerEvents="none" style={[styles.sheen, sheenTransform]} />
        <View style={styles.cardTop}>
          <View style={[styles.nfcMark, { backgroundColor: colors.surfaceSoft }]}>
            <AppIcon name="Nfc" size={22} color={colors.textPrimary} />
          </View>
          <View style={styles.qrWrap}>
            <Animated.View style={[styles.qrPulse, { borderColor: roleTheme.primary }, pulseStyle]} />
            <AppIcon name="QrCode" size={24} color={theme.colors.textPrimary} />
          </View>
        </View>
        <View style={styles.cardCopy}>
          <AppText variant="caption" tone="muted" weight="bold" style={styles.eyebrow}>
            SITEHUB / ID.NTITY
          </AppText>
          <AppText variant="h2" weight="bold" numberOfLines={1}>
            {name}
          </AppText>
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {subtitle}
          </AppText>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    minHeight: 190,
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
  },
  glow: {
    position: 'absolute',
    alignSelf: 'center',
    width: 250,
    height: 126,
    borderRadius: 64,
  },
  card: {
    alignSelf: 'center',
    width: '92%',
    maxWidth: 360,
    minHeight: 176,
    borderRadius: 28,
    overflow: 'hidden',
    padding: theme.spacing.lg,
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1,
  },
  cardFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.surface,
  },
  sheen: {
    position: 'absolute',
    top: -50,
    bottom: -50,
    width: 62,
    backgroundColor: 'rgba(255,255,255,0.62)',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nfcMark: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrWrap: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPulse: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardCopy: {
    gap: 4,
  },
  eyebrow: {
    letterSpacing: 0.6,
  },
});
