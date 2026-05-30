import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { SettingsGroup, SettingsRow, SettingsSection } from '@/src/components/SettingsGroup';
import {
  AuthFooterLink,
  AuthFormGroup,
  AuthHeader,
  AuthPrimaryButton,
  AuthScreenShell,
  AuthTextButton,
  AuthTextField,
} from '@/src/features/auth/components/authUi';
import { SocialAuthSection } from '@/src/features/auth/SocialAuthSection';
import { useAuth } from '@/src/hooks/useAuth';
import { getAuthErrorMessage } from '@/src/services/authService';
import { AppUser } from '@/src/types/models';
import { getPostAuthDestination } from '@/src/utils/guestAuthRedirect';
import { iosPalette } from '@/src/design-system/ios';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const { user, isLoading, signIn, signInAsGuest } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      void getPostAuthDestination(user).then((dest) => router.replace(dest));
    }
  }, [isLoading, user]);

  const busy = isSubmitting || isGuestLoading || isLoading;

  async function handleLogin() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      Alert.alert('Missing details', 'Please enter your email and password.');
      return;
    }
    setIsSubmitting(true);
    try {
      const signedInUser = await signIn({ email: normalizedEmail, password });
      router.replace(await getPostAuthDestination(signedInUser));
    } catch (error) {
      Alert.alert('Sign in failed', getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGuest() {
    setIsGuestLoading(true);
    try {
      await signInAsGuest();
    } finally {
      setIsGuestLoading(false);
    }
  }

  async function handleSocialSuccess(signedInUser: AppUser) {
    router.replace(await getPostAuthDestination(signedInUser));
  }

  return (
    <AuthScreenShell>
      <AuthHeader title="Sign In" subtitle="Welcome back. Sign in to continue." />

      <SocialAuthSection disabled={busy} onSuccess={handleSocialSuccess} />

      <AuthFormGroup>
        <AuthTextField
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!busy}
          textContentType="emailAddress"
          autoComplete="email"
        />
        <AuthTextField
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry={!showPassword}
          editable={!busy}
          isLast
          textContentType="password"
          autoComplete="password"
          trailing={
            <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8} style={styles.eyeBtn}>
              <AppIcon
                name={showPassword ? 'EyeOff' : 'Eye'}
                size={20}
                color={iosPalette.light.textSecondary}
              />
            </Pressable>
          }
        />
      </AuthFormGroup>

      <AuthPrimaryButton
        label={isSubmitting ? 'Signing In…' : 'Sign In'}
        onPress={handleLogin}
        loading={isSubmitting}
        disabled={busy}
      />

      <AuthTextButton
        label={isGuestLoading ? 'Loading…' : 'Continue as Guest'}
        onPress={handleGuest}
        disabled={busy}
        loading={isGuestLoading}
      />

      <AuthFooterLink
        prompt="Don't have an account?"
        action="Create account"
        onPress={() => router.push('/auth/register')}
        disabled={busy}
      />
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  eyeBtn: { padding: 4 },
});
