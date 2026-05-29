import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { roleOptions } from '@/src/constants/options';
import { theme } from '@/src/constants/theme';
import {
  AuthFooterLink,
  AuthFormGroup,
  AuthHeader,
  AuthPrimaryButton,
  AuthScreenShell,
  AuthSectionLabel,
  AuthTextField,
} from '@/src/features/auth/components/authUi';
import { SocialAuthSection } from '@/src/features/auth/SocialAuthSection';
import { useAuth } from '@/src/hooks/useAuth';
import { getAuthErrorMessage } from '@/src/services/authService';
import { AppUser, UserRole } from '@/src/types/models';
import { getPostAuthDestination } from '@/src/utils/guestAuthRedirect';
import { iosDesign, iosPalette } from '@/src/design-system/ios';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterScreen() {
  const { user, isLoading, signUp } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      void getPostAuthDestination(user).then((dest) => router.replace(dest));
    }
  }, [isLoading, user]);

  async function handleSocialSuccess(signedInUser: AppUser) {
    router.replace(await getPostAuthDestination(signedInUser));
  }

  async function handleRegister() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!displayName.trim() || !EMAIL_PATTERN.test(normalizedEmail) || password.length < 6) {
      Alert.alert('Missing details', 'Name, valid email, and 6+ character password are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const registeredUser = await signUp({ displayName, email: normalizedEmail, password, role });
      router.replace(await getPostAuthDestination(registeredUser));
    } catch (error) {
      Alert.alert('Sign up failed', getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  const busy = isSubmitting || isLoading;

  return (
    <AuthScreenShell>
      <AuthHeader
        title="Create Account"
        subtitle="Choose your role to load the right workflow."
      />

      <SocialAuthSection disabled={busy} onSuccess={handleSocialSuccess} />

      <AuthFormGroup>
        <AuthTextField
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Display name"
          editable={!busy}
          autoCapitalize="words"
          textContentType="name"
          autoComplete="name"
        />
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
          placeholder="Password (6+ characters)"
          secureTextEntry
          editable={!busy}
          isLast
          textContentType="newPassword"
          autoComplete="password-new"
        />
      </AuthFormGroup>

      <View style={styles.roleBlock}>
        <AuthSectionLabel>Role</AuthSectionLabel>
        <View style={styles.roleGroup}>
          {roleOptions.map((option, index) => {
            const selected = role === option.value;
            const isLast = index === roleOptions.length - 1;
            return (
              <Pressable
                key={option.value}
                onPress={() => setRole(option.value)}
                disabled={busy}
                style={({ pressed }) => [
                  styles.roleRow,
                  pressed && !busy && styles.rolePressed,
                  !isLast && styles.roleBorder,
                ]}
              >
                <AppText
                  style={[styles.roleLabel, selected && styles.roleLabelSelected]}
                  weight={selected ? 'semibold' : 'medium'}
                >
                  {option.label}
                </AppText>
                {selected ? (
                  <AppText style={styles.roleCheck} weight="semibold">
                    ✓
                  </AppText>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <AuthPrimaryButton
        label={isSubmitting ? 'Creating…' : 'Create Account'}
        onPress={handleRegister}
        loading={isSubmitting}
        disabled={busy}
      />

      <AuthFooterLink
        prompt="Already have an account?"
        action="Sign in"
        onPress={() => router.replace('/auth/login')}
        disabled={busy}
      />
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  roleBlock: {
    gap: iosDesign.spacing.xs,
  },
  roleGroup: {
    backgroundColor: iosPalette.light.surface,
    borderRadius: iosDesign.radius.md,
    overflow: 'hidden',
    ...theme.shadows.control,
    shadowOpacity: 0.04,
  },
  roleRow: {
    minHeight: 44,
    paddingHorizontal: iosDesign.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roleBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  roleLabel: {
    fontSize: 17,
    color: iosPalette.light.textPrimary,
  },
  roleLabelSelected: {
    color: iosPalette.light.primary,
  },
  roleCheck: {
    fontSize: 17,
    color: iosPalette.light.primary,
  },
  rolePressed: {
    backgroundColor: iosPalette.light.surfaceSoft,
  },
});
