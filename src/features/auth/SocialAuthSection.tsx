import { useEffect, useState, useCallback, type ComponentType } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import type { AppleAuthenticationButtonProps } from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { AuthOrDivider } from '@/src/features/auth/components/authUi';
import { iosDesign, iosPalette } from '@/src/design-system/ios';
import { theme } from '@/src/constants/theme';
import { useGoogleSignIn } from '@/src/hooks/useGoogleSignIn';
import { getAuthErrorMessage } from '@/src/services/authService';
import {
  isAppleSignInAvailable,
  signInWithAppleTokens,
  signInWithGoogleIdToken,
} from '@/src/services/socialAuthService';
import { AppUser } from '@/src/types/models';

interface SocialAuthSectionProps {
  disabled?: boolean;
  onSuccess: (user: AppUser) => void;
}

const SOCIAL_BTN_HEIGHT = 50;

export function SocialAuthSection({ disabled = false, onSuccess }: SocialAuthSectionProps) {
  const { promptAsync, isConfigured, isReady } = useGoogleSignIn();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  const busy = disabled || isGoogleLoading || isAppleLoading;

  useEffect(() => {
    void isAppleSignInAvailable().then(setAppleAvailable);
  }, []);

  const completeGoogleSignIn = useCallback(
    async (idToken: string) => {
      const user = await signInWithGoogleIdToken(idToken);
      onSuccess(user);
    },
    [onSuccess]
  );

  async function handleGooglePress() {
    if (busy) return;
    if (!isConfigured) {
      Alert.alert(
        'Google sign-in not configured',
        'Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (and platform client IDs) to your .env file, then restart Expo.'
      );
      return;
    }
    if (!isReady) {
      Alert.alert('Google sign-in', 'Still initializing. Try again in a moment.');
      return;
    }

    setIsGoogleLoading(true);
    try {
      const result = await promptAsync();
      if (result.type === 'cancel' || result.type === 'dismiss') return;
      if (result.type === 'error') {
        Alert.alert('Google sign-in failed', result.error?.message ?? 'Unable to open Google sign-in.');
        return;
      }
      if (result.type !== 'success') {
        Alert.alert('Google sign-in failed', 'Sign-in did not complete. Try again.');
        return;
      }
      const idToken = result.params?.id_token;
      if (!idToken) {
        Alert.alert(
          'Google sign-in failed',
          'No ID token was returned. Check your Google OAuth client IDs in .env.'
        );
        return;
      }
      await completeGoogleSignIn(idToken);
    } catch (error) {
      Alert.alert('Google sign-in failed', getAuthErrorMessage(error));
    } finally {
      setIsGoogleLoading(false);
    }
  }

  async function handleApplePress() {
    if (busy) return;

    if (Platform.OS !== 'ios') {
      Alert.alert(
        'Apple Sign-In',
        'Apple Sign-In is only available on iOS devices. Use email/password or Google on this platform.'
      );
      return;
    }

    if (!appleAvailable) {
      Alert.alert('Apple Sign-In unavailable', 'Sign in with Apple is not available on this device.');
      return;
    }

    setIsAppleLoading(true);
    try {
      const AppleAuthentication = await import('expo-apple-authentication');
      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );

      const appleResult = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!appleResult.identityToken) {
        throw new Error('Apple sign-in did not return an identity token.');
      }

      const user = await signInWithAppleTokens(appleResult.identityToken, rawNonce);
      onSuccess(user);
    } catch (error: unknown) {
      const code =
        typeof error === 'object' && error && 'code' in error
          ? String((error as { code?: unknown }).code)
          : '';
      if (code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert('Apple sign-in failed', getAuthErrorMessage(error));
    } finally {
      setIsAppleLoading(false);
    }
  }

  const showApple = Platform.OS === 'ios' && appleAvailable;

  return (
    <View style={styles.wrap}>
      {showApple ? (
        <AppleSignInButton onPress={handleApplePress} disabled={busy && !isAppleLoading} loading={isAppleLoading} />
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={handleGooglePress}
        disabled={busy && !isGoogleLoading}
        style={({ pressed }) => [
          styles.googleBtn,
          (busy && !isGoogleLoading) && styles.disabled,
          pressed && !(busy && !isGoogleLoading) && styles.pressed,
        ]}
      >
        <AppText style={styles.googleLabel} weight="semibold">
          {isGoogleLoading ? 'Connecting…' : 'Continue with Google'}
        </AppText>
      </Pressable>

      {!isConfigured ? (
        <AppText variant="caption" tone="muted" style={styles.hint}>
          Google sign-in requires EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env
        </AppText>
      ) : null}

      <AuthOrDivider />
    </View>
  );
}

interface AppleSignInButtonProps {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

function AppleSignInButton({ onPress, disabled, loading }: AppleSignInButtonProps) {
  const [AppleButton, setAppleButton] = useState<ComponentType<AppleAuthenticationButtonProps> | null>(null);
  const [appleEnums, setAppleEnums] = useState<{
    buttonStyle: AppleAuthenticationButtonProps['buttonStyle'];
    buttonType: AppleAuthenticationButtonProps['buttonType'];
  } | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    void import('expo-apple-authentication').then((mod) => {
      setAppleButton(() => mod.AppleAuthenticationButton);
      setAppleEnums({
        buttonStyle: mod.AppleAuthenticationButtonStyle.BLACK,
        buttonType: mod.AppleAuthenticationButtonType.SIGN_IN,
      });
    });
  }, []);

  if (AppleButton && appleEnums && !loading && !disabled) {
    return (
      <AppleButton
        onPress={onPress}
        buttonStyle={appleEnums.buttonStyle}
        buttonType={appleEnums.buttonType}
        cornerRadius={iosDesign.radius.sm}
        style={styles.appleNative}
      />
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.appleFallback, disabled && styles.disabled, pressed && !disabled && styles.pressed]}
    >
      <AppIcon name="ShieldCheck" size={18} color="#FFFFFF" />
      <AppText style={styles.appleFallbackText} weight="semibold">
        {loading ? 'Connecting…' : 'Continue with Apple'}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: iosDesign.spacing.sm,
  },
  appleNative: {
    width: '100%',
    height: SOCIAL_BTN_HEIGHT,
  },
  appleFallback: {
    minHeight: SOCIAL_BTN_HEIGHT,
    borderRadius: iosDesign.radius.sm,
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: iosDesign.spacing.md,
  },
  appleFallbackText: {
    color: '#FFFFFF',
    fontSize: 17,
  },
  googleBtn: {
    minHeight: SOCIAL_BTN_HEIGHT,
    borderRadius: iosDesign.radius.md,
    backgroundColor: iosPalette.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: iosDesign.spacing.md,
    ...theme.shadows.control,
    shadowOpacity: 0.04,
  },
  googleLabel: {
    fontSize: 17,
    color: iosPalette.light.textPrimary,
  },
  hint: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: iosDesign.animation.softPressScale }],
  },
  disabled: {
    opacity: 0.5,
  },
});
