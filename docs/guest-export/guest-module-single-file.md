# Guest Module Single File Export

This file collects the current guest/customer preview logic so it can be moved out of the main app later without searching the whole repository.

Generated from source files on 2026-05-27. It is an archive/reference file and is not imported by the app.

## Included Files
- `app\auth\login.tsx`
- `src\features\auth\LoginScreen.tsx`
- `src\providers\AuthProvider.tsx`
- `src\types\auth.ts`
- `app\(tabs)\_layout.tsx`
- `app\(tabs)\index.tsx`
- `app\(tabs)\profile.tsx`
- `app\(tabs)\attendance.tsx`
- `app\scan.tsx`
- `app\nfc-demo.tsx`
- `app\guest-analytics.tsx`
- `src\features\guest\GuestHomeScreen.tsx`
- `src\features\guest\GuestProfileScreen.tsx`
- `src\features\guest\GuestConnectionsScreen.tsx`
- `src\features\guest\GuestAnalyticsScreen.tsx`
- `src\features\guest\GuestScanScreen.tsx`
- `src\features\guest\GuestNfcDemoScreen.tsx`
- `src\constants\guestDemo.ts`
- `src\utils\guestScan.ts`
- `src\hooks\useIsGuest.ts`
- `src\hooks\useGuestGate.ts`
- `src\providers\GuestGateProvider.tsx`
- `src\components\GuestGate.tsx`
- `src\components\SignupUnlockModal.tsx`
- `src\utils\authFlow.ts`
- `src\utils\roleCapabilities.ts`
- `src\features\home\HomeScreen.tsx`
- `src\features\bio\EditBioScreen.tsx`
- `src\features\bio\ThemePickerScreen.tsx`
- `src\features\bio\PublicBioScreen.tsx`
- `src\features\settings\SettingsScreen.tsx`
- `src\types\models.ts`


---

## app\auth\login.tsx

```tsx
import { LoginScreen } from '@/src/features/auth/LoginScreen';

export default function LoginRoute() {
  return <LoginScreen />;
}

```

---

## src\features\auth\LoginScreen.tsx

```tsx
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { SettingsGroup, SettingsRow, SettingsSection } from '@/src/components/SettingsGroup';
import { theme } from '@/src/constants/theme';
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
import { getDashboardRoute } from '@/src/utils/authFlow';
import { iosPalette } from '@/src/design-system/ios';

const ENABLE_DEMO = process.env.EXPO_PUBLIC_ENABLE_DEMO_ACCOUNTS === 'true';

const DEMO_ACCOUNTS = [
  { label: 'Sales', email: 'sales@demo.com', password: 'demo1234', color: theme.roles.sales.primary },
  { label: 'Printer', email: 'printer@demo.com', password: 'demo1234', color: theme.roles.printer.primary },
  { label: 'Admin', email: 'admin@demo.com', password: 'demo1234', color: theme.roles.admin.accent },
  { label: 'Sales 2', email: 'sales2@demo.com', password: 'demo1234', color: theme.roles.sales.primary },
];

let demoIndex = 0;

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const { user, isLoading, signIn, signInAsGuest } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(getDashboardRoute(user));
    }
  }, [isLoading, user]);

  const busy = isSubmitting || isGuestLoading || isLoading;

  function fillDemo() {
    const acc = DEMO_ACCOUNTS[demoIndex % DEMO_ACCOUNTS.length];
    setEmail(acc.email);
    setPassword(acc.password);
    demoIndex = (demoIndex + 1) % DEMO_ACCOUNTS.length;
  }

  async function signInDemoAccount(acc: (typeof DEMO_ACCOUNTS)[number]) {
    if (busy) return;
    setEmail(acc.email);
    setPassword(acc.password);
    setIsSubmitting(true);
    try {
      const signedInUser = await signIn({ email: acc.email, password: acc.password });
      router.replace(getDashboardRoute(signedInUser));
    } catch (error) {
      Alert.alert('Demo sign in failed', getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogin() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      Alert.alert('Missing details', 'Please enter your email and password.');
      return;
    }
    setIsSubmitting(true);
    try {
      const signedInUser = await signIn({ email: normalizedEmail, password });
      router.replace(getDashboardRoute(signedInUser));
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

  function handleSocialSuccess(signedInUser: AppUser) {
    router.replace(getDashboardRoute(signedInUser));
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
        label={isSubmitting ? 'Signing Inâ€¦' : 'Sign In'}
        onPress={handleLogin}
        loading={isSubmitting}
        disabled={busy}
      />

      <AuthTextButton
        label={isGuestLoading ? 'Loadingâ€¦' : 'Continue as Guest'}
        onPress={handleGuest}
        disabled={busy}
        loading={isGuestLoading}
      />

      {ENABLE_DEMO ? (
        <View style={styles.demoBlock}>
          <SettingsSection title="Quick demo" footer="Tap a role to sign in instantly." compact />
          <SettingsGroup compact style={styles.demoGroup}>
            {DEMO_ACCOUNTS.map((acc, index) => (
              <SettingsRow
                key={acc.email}
                title={acc.label}
                subtitle={acc.email}
                icon="User"
                iconColor={acc.color}
                iconBackgroundColor={`${acc.color}18`}
                onPress={() => signInDemoAccount(acc)}
                disabled={busy}
                isLast={index === DEMO_ACCOUNTS.length - 1}
                compact
              />
            ))}
          </SettingsGroup>
          <Pressable style={styles.demoCycle} onPress={fillDemo} disabled={busy}>
            <AppText variant="caption" tone="muted">
              Cycle credentials into form
            </AppText>
          </Pressable>
        </View>
      ) : null}

      <AuthFooterLink
        prompt="New here?"
        action="Create an account"
        onPress={() => router.push('/auth/register')}
        disabled={busy}
      />
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  eyeBtn: {
    padding: 4,
    marginLeft: 4,
  },
  demoBlock: {
    gap: 0,
    marginTop: 4,
  },
  demoGroup: {
    marginHorizontal: 0,
  },
  demoCycle: {
    alignItems: 'center',
    paddingVertical: 6,
  },
});
```

---

## src\providers\AuthProvider.tsx

```tsx
import { PropsWithChildren, createContext, useCallback, useEffect, useRef, useState } from 'react';
import {
  getAuthErrorMessage,
  getUserProfile,
  observeAuthState,
  signIn as signInWithEmail,
  signOutCurrentUser,
  signUp as signUpWithEmail,
} from '@/src/services/authService';
import { AuthContextValue, LoginInput, RegisterInput } from '@/src/types/auth';
import { AppUser } from '@/src/types/models';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function createGuestUser(): AppUser {
  const now = new Date().toISOString();
  return {
    id: 'guest',
    email: '',
    displayName: 'Guest User',
    role: 'guest',
    language: 'en',
    isActive: true,
    createdAt: now,
    updatedAt: now,
    isGuest: true,
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Only use this for guest mode, not real Firebase users
  const managedUser = useRef<AppUser | null>(null);
  const isSigningOut = useRef(false);

  const applyGuestSession = useCallback(() => {
    const guestUser = managedUser.current?.isGuest ? managedUser.current : createGuestUser();
    managedUser.current = guestUser;
    setUser(guestUser);
    setError(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = observeAuthState(async (firebaseUser) => {
      if (isSigningOut.current) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      if (managedUser.current?.isGuest) {
        applyGuestSession();
        return;
      }

      if (!firebaseUser) {
        if (managedUser.current?.isGuest) {
          applyGuestSession();
          return;
        }
        managedUser.current = null;
        setUser(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      try {
        const profile = await getUserProfile(firebaseUser.uid);

        if (managedUser.current?.isGuest) {
          applyGuestSession();
          return;
        }

        if (profile?.isActive === false) {
          await signOutCurrentUser();
          managedUser.current = null;
          setUser(null);
          setError('This account is inactive. Contact an admin.');
          setIsLoading(false);
          return;
        }

        if (profile) {
          setUser(profile);
          setError(null);
        } else {
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email ?? '',
            displayName: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'User',
            role: 'sales',
            language: 'en',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          setError(null);
        }
      } catch {
        if (managedUser.current?.isGuest) {
          applyGuestSession();
          return;
        }

        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email ?? '',
          displayName: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'User',
          role: 'sales',
          language: 'en',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        setError(null);
      } finally {
        if (!managedUser.current?.isGuest) {
          setIsLoading(false);
        }
      }
    });

    return unsubscribe;
  }, [applyGuestSession]);

  const value: AuthContextValue = {
    user,
    isLoading,
    error,

    async signIn(input: LoginInput) {
      setError(null);
      setIsLoading(true);
      isSigningOut.current = false;
      managedUser.current = null;

      try {
        const profile = await signInWithEmail(input);
        setUser(profile);
        return profile;
      } catch (err) {
        const msg = getAuthErrorMessage(err);
        setError(msg);
        throw new Error(msg);
      } finally {
        setIsLoading(false);
      }
    },

    async signUp(input: RegisterInput) {
      setError(null);
      setIsLoading(true);
      isSigningOut.current = false;
      managedUser.current = null;

      try {
        const profile = await signUpWithEmail(input);
        setUser(profile);
        return profile;
      } catch (err) {
        const msg = getAuthErrorMessage(err);
        setError(msg);
        throw new Error(msg);
      } finally {
        setIsLoading(false);
      }
    },

    async signInAsGuest() {
      isSigningOut.current = false;
      applyGuestSession();

      try {
        await signOutCurrentUser();
      } catch {
        // Guest session is local; Firebase sign-out is best-effort cleanup.
      }
    },

    async signOutUser() {
      if (__DEV__) {
        console.debug('[auth/provider] signOutUser start', { email: user?.email, role: user?.role });
      }
      isSigningOut.current = true;
      managedUser.current = null;

      setUser(null);
      setError(null);
      setIsLoading(true);

      try {
        await signOutCurrentUser();
        if (__DEV__) {
          console.debug('[auth/provider] Firebase sign-out resolved');
        }
      } catch (err) {
        if (__DEV__) {
          console.warn('[auth/provider] Firebase sign-out failed after local clear', err);
        }
        // already cleared locally
      } finally {
        managedUser.current = null;
        setUser(null);
        setError(null);
        setIsLoading(false);
        if (__DEV__) {
          console.debug('[auth/provider] signOutUser finalized');
        }

        setTimeout(() => {
          isSigningOut.current = false;
        }, 300);
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
```

---

## src\types\auth.ts

```ts
import { AppUser, UserRole } from '@/src/types/models';

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  displayName: string;
  role: UserRole;
}

export interface AuthContextValue {
  user: AppUser | null;
  isLoading: boolean;
  error: string | null;
  signIn: (input: LoginInput) => Promise<AppUser>;
  signUp: (input: RegisterInput) => Promise<AppUser>;
  signInAsGuest: () => Promise<void>;
  signOutUser: () => Promise<void>;
}
```

---

## app\(tabs)\_layout.tsx

```tsx
import { Tabs } from 'expo-router';
import { AuthGate } from '@/src/components/AuthGate';
import { LiquidTabBar } from '@/src/components/LiquidTabBar';

export default function TabsLayout() {
  return (
    <AuthGate allowedRoles={['guest', 'customer']}>
      <Tabs
        tabBar={(props) => <LiquidTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="attendance" options={{ title: 'Connections' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      </Tabs>
    </AuthGate>
  );
}
```

---

## app\(tabs)\index.tsx

```tsx
import { HomeScreen } from '@/src/features/home/HomeScreen';

export default function HomeTabRoute() {
  return <HomeScreen />;
}

```

---

## app\(tabs)\profile.tsx

```tsx
import { GuestProfileScreen } from '@/src/features/guest/GuestProfileScreen';
import { PayoutsProfileScreen } from '@/src/features/payouts/PayoutsProfileScreen';
import { useIsGuest } from '@/src/hooks/useIsGuest';

export default function PayoutsProfileTabRoute() {
  const isGuest = useIsGuest();
  if (isGuest) {
    return <GuestProfileScreen />;
  }
  return <PayoutsProfileScreen />;
}

```

---

## app\(tabs)\attendance.tsx

```tsx
import { GuestConnectionsScreen } from '@/src/features/guest/GuestConnectionsScreen';
import { OrdersQueueScreen } from '@/src/features/orders/OrdersQueueScreen';
import { useIsGuest } from '@/src/hooks/useIsGuest';

export default function OrdersQueueTabRoute() {
  const isGuest = useIsGuest();
  if (isGuest) {
    return <GuestConnectionsScreen />;
  }
  return <OrdersQueueScreen />;
}

```

---

## app\scan.tsx

```tsx
import { GuestScanScreen } from '@/src/features/guest/GuestScanScreen';

export default function ScanRoute() {
  return <GuestScanScreen />;
}
```

---

## app\nfc-demo.tsx

```tsx
import { GuestNfcDemoScreen } from '@/src/features/guest/GuestNfcDemoScreen';

export default function NfcDemoRoute() {
  return <GuestNfcDemoScreen />;
}
```

---

## app\guest-analytics.tsx

```tsx
import { GuestAnalyticsScreen } from '@/src/features/guest/GuestAnalyticsScreen';

export default function GuestAnalyticsRoute() {
  return <GuestAnalyticsScreen />;
}
```

---

## src\features\guest\GuestHomeScreen.tsx

```tsx
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppButton } from '@/src/components/AppButton';
import { AppCard } from '@/src/components/AppCard';
import { AppIcon } from '@/src/components/AppIcon';
import { FloatingNfcCard } from '@/src/components/FloatingNfcCard';
import { MetricCard } from '@/src/components/MetricCard';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { AppText } from '@/src/components/AppText';
import { GUEST_DEMO_ANALYTICS, GUEST_SAMPLE_PROFILE_SLUG } from '@/src/constants/guestDemo';
import { theme } from '@/src/constants/theme';
import { useAuth } from '@/src/hooks/useAuth';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';

export function GuestHomeScreen() {
  const { user } = useAuth();
  const { requireAccount } = useRequireAccount();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <AppText variant="caption" tone="muted" style={styles.greeting}>
          Guest Preview
        </AppText>
        <AppText variant="h1">{getGreeting()}, {firstName(user?.displayName)}</AppText>
        <AppText variant="body" tone="muted">
          Scan, tap, and explore â€” sign up when you are ready for your own NFC identity.
        </AppText>
      </View>

      <FloatingNfcCard
        name={user?.displayName ?? 'ID.NTITY'}
        subtitle="Tap, scan, and share your NFC identity"
      />

      <View style={styles.metricsRow}>
        <MetricCard label="Demo views" value={String(GUEST_DEMO_ANALYTICS.profileViews)} highlight="Preview" />
        <MetricCard label="Demo taps" value={String(GUEST_DEMO_ANALYTICS.nfcTaps)} />
      </View>

      <AppCard style={styles.actionCard}>
        <View style={styles.actionCardInner}>
          <View style={styles.actionIcon}>
            <AppIcon name="ScanLine" size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.actionText}>
            <AppText variant="h2">Scan QR</AppText>
            <AppText variant="caption" tone="muted">
              Try the camera scanner or open demo profile codes.
            </AppText>
          </View>
        </View>
        <AppButton label="Open Scanner" onPress={() => router.push('/scan')} />
      </AppCard>

      <AppCard style={styles.actionCard}>
        <View style={styles.actionCardInner}>
          <View style={[styles.actionIcon, styles.actionIconNfc]}>
            <AppIcon name="Nfc" size={22} color="#7c3aed" />
          </View>
          <View style={styles.actionText}>
            <AppText variant="h2">NFC Tap Preview</AppText>
            <AppText variant="caption" tone="muted">
              Simulated tap animation â†’ sample public profile (no chip write).
            </AppText>
          </View>
        </View>
        <AppButton label="Try NFC Demo" variant="secondary" onPress={() => router.push('/nfc-demo')} />
      </AppCard>

      <AppCard style={styles.actionCard}>
        <View style={styles.actionCardInner}>
          <View style={styles.actionIcon}>
            <AppIcon name="User" size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.actionText}>
            <AppText variant="h2">Sample profile</AppText>
            <AppText variant="caption" tone="muted">
              View Instagram, Telegram, and preview Add to Contact.
            </AppText>
          </View>
        </View>
        <AppButton
          label="View sample"
          variant="ghost"
          onPress={() => router.push(`/public/${GUEST_SAMPLE_PROFILE_SLUG}`)}
        />
      </AppCard>

      <View style={styles.row}>
        <AppButton
          label="Themes"
          fullWidth={false}
          style={styles.halfButton}
          variant="outline"
          onPress={() => router.push('/theme-picker')}
        />
        <AppButton
          label="Analytics"
          fullWidth={false}
          style={styles.halfButton}
          variant="outline"
          onPress={() => router.push('/guest-analytics')}
        />
      </View>

      <AppButton
        label="Create my NFC identity"
        onPress={() =>
          requireAccount(undefined, {
            message: 'Create your account to unlock your own NFC identity.',
          })
        }
      />
    </ScreenContainer>
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
  header: {
    gap: theme.spacing.xxs,
    marginBottom: theme.spacing.sm,
  },
  greeting: {
    textTransform: 'uppercase',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionCard: {
    gap: theme.spacing.md,
  },
  actionCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconNfc: {
    backgroundColor: '#F3E8FF',
  },
  actionText: {
    flex: 1,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  halfButton: {
    flex: 1,
  },
});
```

---

## src\features\guest\GuestProfileScreen.tsx

```tsx
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppButton } from '@/src/components/AppButton';
import { AppCard } from '@/src/components/AppCard';
import { AppIcon } from '@/src/components/AppIcon';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { AppText } from '@/src/components/AppText';
import { GUEST_SAMPLE_PROFILE_SLUG } from '@/src/constants/guestDemo';
import { theme } from '@/src/constants/theme';
import { useAuth } from '@/src/hooks/useAuth';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';

export function GuestProfileScreen() {
  const { user, signOutUser } = useAuth();
  const { requireAccount } = useRequireAccount();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <AppText variant="h1">Guest Profile</AppText>
        <View style={styles.previewPill}>
          <AppText variant="caption" weight="bold" style={styles.previewPillText}>
            PREVIEW MODE
          </AppText>
        </View>
      </View>

      <AppCard style={styles.identityCard}>
        <View style={styles.avatar}>
          <AppText style={styles.avatarText}>{(user?.displayName ?? 'G')[0]}</AppText>
        </View>
        <View style={styles.identityCopy}>
          <AppText variant="h2">{user?.displayName ?? 'Guest User'}</AppText>
          <AppText variant="caption" tone="muted">
            Explore the app â€” create an account for your own NFC identity.
          </AppText>
        </View>
      </AppCard>

      <AppButton
        label="Create my profile"
        onPress={() =>
          requireAccount(undefined, {
            message: 'Create an account to build and save your own public NFC identity.',
          })
        }
      />
      <AppButton
        label="Preview sample profile"
        variant="ghost"
        onPress={() => router.push(`/public/${GUEST_SAMPLE_PROFILE_SLUG}`)}
      />

      <AppText variant="caption" tone="muted" style={styles.sectionLabel}>
        Locked until you sign up
      </AppText>
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
          <AppCard style={styles.lockedRow}>
            <AppIcon name={action.icon} size={20} color={theme.colors.textMuted} />
            <AppText variant="body" style={styles.lockedLabel}>
              {action.label}
            </AppText>
            <AppIcon name="ShieldCheck" size={16} color={theme.colors.textMuted} />
          </AppCard>
        </Pressable>
      ))}

      <AppButton label="Sign In" onPress={() => router.push('/auth/login')} />
      <AppButton label="Sign Out of Guest" variant="outline" onPress={() => void signOutUser()} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  previewPill: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surfaceSoft,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  previewPillText: {
    color: theme.colors.primary,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  identityCopy: {
    flex: 1,
    gap: 4,
  },
  sectionLabel: {
    marginTop: theme.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    opacity: 0.85,
  },
  lockedLabel: {
    flex: 1,
  },
});
```

---

## src\features\guest\GuestConnectionsScreen.tsx

```tsx
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppCard } from '@/src/components/AppCard';
import { AppHeader } from '@/src/components/AppHeader';
import { AppIcon } from '@/src/components/AppIcon';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { AppText } from '@/src/components/AppText';
import { GUEST_DEMO_CONNECTIONS } from '@/src/constants/guestDemo';
import { theme } from '@/src/constants/theme';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';

export function GuestConnectionsScreen() {
  const { requireAccount } = useRequireAccount();

  return (
    <ScreenContainer>
      <AppHeader title="Connections" subtitle="Sample recent taps & scans" />

      <View style={styles.banner}>
        <AppIcon name="Info" size={16} color={theme.colors.primary} />
        <AppText variant="caption" tone="muted" style={styles.bannerText}>
          Demo connections only â€” sign in to save your real scan history and contacts.
        </AppText>
      </View>

      {GUEST_DEMO_CONNECTIONS.map((item) => (
        <Pressable key={item.id} onPress={() => router.push(`/public/${item.slug}`)}>
          <AppCard style={styles.row}>
            <View style={styles.avatar}>
              <AppText style={styles.avatarText}>{item.name[0]}</AppText>
            </View>
            <View style={styles.copy}>
              <AppText variant="body" weight="semibold">
                {item.name}
              </AppText>
              <AppText variant="caption" tone="muted">
                {item.subtitle}
              </AppText>
            </View>
            <AppText variant="caption" tone="muted">
              {item.when}
            </AppText>
          </AppCard>
        </Pressable>
      ))}

      <Pressable
        onPress={() =>
          requireAccount(undefined, {
            message: 'Create an account to save contacts and sync your connection history.',
          })
        }
      >
        <AppCard style={styles.saveRow}>
          <AppIcon name="User" size={20} color={theme.colors.primary} />
          <AppText variant="body" weight="semibold">
            Save connection
          </AppText>
        </AppCard>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSoft,
  },
  bannerText: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  saveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
});
```

---

## src\features\guest\GuestAnalyticsScreen.tsx

```tsx
import { StyleSheet, View } from 'react-native';
import { AppCard } from '@/src/components/AppCard';
import { AppHeader } from '@/src/components/AppHeader';
import { MetricCard } from '@/src/components/MetricCard';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { AppText } from '@/src/components/AppText';
import { GUEST_DEMO_ANALYTICS } from '@/src/constants/guestDemo';
import { theme } from '@/src/constants/theme';

export function GuestAnalyticsScreen() {
  const maxWeekly = Math.max(...GUEST_DEMO_ANALYTICS.weeklyViews);

  return (
    <ScreenContainer>
      <AppHeader title="Analytics" subtitle="Read-only demo data" showBack />

      <View style={styles.demoPill}>
        <AppText variant="caption" weight="bold" style={styles.demoPillText}>
          DEMO PREVIEW
        </AppText>
      </View>

      <View style={styles.metricsRow}>
        <MetricCard label="Profile views" value={String(GUEST_DEMO_ANALYTICS.profileViews)} highlight="Preview" />
        <MetricCard label="NFC taps" value={String(GUEST_DEMO_ANALYTICS.nfcTaps)} />
      </View>
      <View style={styles.metricsRow}>
        <MetricCard label="QR scans" value={String(GUEST_DEMO_ANALYTICS.qrScans)} />
        <MetricCard label="Contact saves" value={String(GUEST_DEMO_ANALYTICS.contactSaves)} />
      </View>

      <AppCard>
        <AppText variant="h2">Traffic sources</AppText>
        {GUEST_DEMO_ANALYTICS.topSources.map((source) => (
          <View key={source.label} style={styles.sourceRow}>
            <AppText variant="body">{source.label}</AppText>
            <AppText variant="body" weight="bold">
              {source.value}%
            </AppText>
          </View>
        ))}
      </AppCard>

      <AppCard>
        <AppText variant="h2">Views this week</AppText>
        <View style={styles.chart}>
          {GUEST_DEMO_ANALYTICS.weeklyViews.map((value, index) => (
            <View key={index} style={styles.barCol}>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(12, (value / maxWeekly) * 96),
                    backgroundColor: theme.colors.primary,
                  },
                ]}
              />
              <AppText variant="caption" tone="muted" style={styles.barLabel}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}
              </AppText>
            </View>
          ))}
        </View>
      </AppCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  demoPill: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surfaceSoft,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  demoPillText: {
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  sourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 4,
    marginTop: theme.spacing.md,
    height: 120,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  bar: {
    width: '100%',
    maxWidth: 28,
    borderRadius: theme.radius.sm,
  },
  barLabel: {
    fontSize: 10,
  },
});
```

---

## src\features\guest\GuestScanScreen.tsx

```tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { AppButton } from '@/src/components/AppButton';
import { AppCard } from '@/src/components/AppCard';
import { AppHeader } from '@/src/components/AppHeader';
import { AppIcon } from '@/src/components/AppIcon';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { AppText } from '@/src/components/AppText';
import { GUEST_DEMO_QR_CODES } from '@/src/constants/guestDemo';
import { theme } from '@/src/constants/theme';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { parseScanPayloadToSlug } from '@/src/utils/guestScan';

export function GuestScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [lastScan, setLastScan] = useState<string | null>(null);
  const { requireAccount } = useRequireAccount();
  const radar = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(radar, {
        toValue: 1,
        duration: 1900,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [radar]);

  const openSlug = useCallback((slug: string) => {
    router.push(`/public/${slug}`);
  }, []);

  const onBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (data === lastScan) return;
      setLastScan(data);
      const slug = parseScanPayloadToSlug(data);
      if (slug) {
        openSlug(slug);
      }
    },
    [lastScan, openSlug]
  );

  return (
    <ScreenContainer>
      <AppHeader title="Scan QR" subtitle="Preview public NFC identities" showBack={router.canGoBack()} />

      {!permission?.granted ? (
        <AppCard style={styles.permissionCard}>
          <AppIcon name="ScanLine" size={32} color={theme.colors.primary} />
          <AppText variant="body" tone="muted">
            Camera access lets you try the scan experience. No scan history is saved in guest mode.
          </AppText>
          <AppButton label="Enable Camera" onPress={() => void requestPermission()} />
        </AppCard>
      ) : (
        <View style={styles.cameraWrap}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={onBarcodeScanned}
          />
          <View style={styles.cameraOverlay}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.radarPulse,
                {
                  opacity: radar.interpolate({ inputRange: [0, 0.72, 1], outputRange: [0.34, 0.08, 0] }),
                  transform: [{ scale: radar.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1.35] }) }],
                },
              ]}
            />
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <AppText variant="caption" tone="inverse" style={styles.overlayText}>
              Point at a demo or public profile QR
            </AppText>
          </View>
        </View>
      )}

      <AppText variant="h2">Demo codes</AppText>
      <AppText variant="caption" tone="muted">
        Tap a sample code to open a public profile preview.
      </AppText>
      {GUEST_DEMO_QR_CODES.map((demo) => (
        <Pressable key={demo.id} onPress={() => openSlug(demo.slug)}>
          <AppCard style={styles.demoRow}>
            <AppIcon name="QrCode" size={22} color={theme.colors.primary} />
            <View style={styles.demoCopy}>
              <AppText variant="body" weight="semibold">
                {demo.label}
              </AppText>
              <AppText variant="caption" tone="muted" numberOfLines={1}>
                {demo.payload}
              </AppText>
            </View>
            <AppIcon name="ChevronRight" size={18} color={theme.colors.textMuted} />
          </AppCard>
        </Pressable>
      ))}

      <AppButton
        label="Generate my QR"
        variant="outline"
        iconName="QrCode"
        onPress={() =>
          requireAccount(undefined, {
            message: 'Create an account to generate your personal QR and NFC identity.',
          })
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  permissionCard: {
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.xl,
  },
  cameraWrap: {
    height: 280,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  overlayText: {
    position: 'absolute',
    bottom: theme.spacing.md,
    textAlign: 'center',
    color: '#fff',
  },
  radarPulse: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  scanFrame: {
    width: 210,
    height: 210,
    borderRadius: 28,
  },
  corner: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderColor: 'rgba(255,255,255,0.86)',
    borderWidth: 3,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 14 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 14 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 14 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 14 },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  demoCopy: {
    flex: 1,
    gap: 2,
  },
});
```

---

## src\features\guest\GuestNfcDemoScreen.tsx

```tsx
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppHeader } from '@/src/components/AppHeader';
import { AppIcon } from '@/src/components/AppIcon';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { AppText } from '@/src/components/AppText';
import { GUEST_SAMPLE_PROFILE_SLUG } from '@/src/constants/guestDemo';
import { theme } from '@/src/constants/theme';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';

export function GuestNfcDemoScreen() {
  const pulse = useRef(new Animated.Value(0)).current;
  const sheen = useRef(new Animated.Value(0)).current;
  const { requireAccount } = useRequireAccount();

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
    router.push(`/public/${GUEST_SAMPLE_PROFILE_SLUG}`);
  }

  return (
    <ScreenContainer>
      <AppHeader title="NFC Preview" subtitle="Simulated tap - no chip write" showBack={router.canGoBack()} />

      <AppText variant="body" tone="muted">
        Preview the tap experience with a modern access-card interaction. Real chip writing unlocks after account setup.
      </AppText>

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
          <AppIcon name="Nfc" size={48} color={theme.colors.primary} />
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
        <AppIcon name="ShieldCheck" size={18} color={theme.colors.textMuted} />
        <AppText variant="caption" tone="muted">
          Real NFC write requires an account
        </AppText>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  tapZone: {
    marginTop: theme.spacing.lg,
    minHeight: 300,
    borderRadius: 30,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    overflow: 'hidden',
    ...theme.shadows.floating,
  },
  softGlow: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: theme.colors.surfaceSoft,
  },
  ring: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(0,122,255,0.36)',
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
    backgroundColor: theme.colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.card,
  },
  tapLabel: {
    marginTop: theme.spacing.sm,
  },
  writeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
  },
});
```

---

## src\constants\guestDemo.ts

```ts
import type { BioPage } from '@/src/types/models';

export const GUEST_SAMPLE_PROFILE_SLUG = 'demo';

export const GUEST_DEMO_QR_CODES = [
  {
    id: 'demo-profile',
    label: 'Sample NFC identity',
    payload: `https://biocloud.app/c/${GUEST_SAMPLE_PROFILE_SLUG}`,
    slug: GUEST_SAMPLE_PROFILE_SLUG,
  },
  {
    id: 'demo-creator',
    label: 'Creator preview',
    payload: 'https://biocloud.app/c/sitehub-creator',
    slug: 'sitehub-creator',
  },
] as const;

export const GUEST_DEMO_CONNECTIONS = [
  {
    id: 'conn-1',
    name: 'Sok Dara',
    subtitle: 'Met at Tech Expo Â· NFC tap',
    when: '2h ago',
    slug: GUEST_SAMPLE_PROFILE_SLUG,
  },
  {
    id: 'conn-2',
    name: 'Mina Chen',
    subtitle: 'QR scan Â· Product launch',
    when: 'Yesterday',
    slug: 'sitehub-creator',
  },
  {
    id: 'conn-3',
    name: 'Alex Rivera',
    subtitle: 'Shared profile link',
    when: '3 days ago',
    slug: 'demo',
  },
] as const;

export const GUEST_DEMO_ANALYTICS = {
  profileViews: 1284,
  nfcTaps: 342,
  qrScans: 891,
  contactSaves: 67,
  topSources: [
    { label: 'NFC tap', value: 42 },
    { label: 'QR scan', value: 35 },
    { label: 'Direct link', value: 23 },
  ],
  weeklyViews: [42, 58, 71, 63, 88, 95, 102],
} as const;

export const GUEST_PUBLIC_BIO_PAGES: Record<string, BioPage> = {
  demo: {
    id: 'guest-demo-profile',
    userId: 'guest-demo',
    slug: 'demo',
    displayName: 'Sok Dara',
    tagline: 'Founder at SITEHUB NFC identity preview',
    whatsapp: '+85512345678',
    instagram: '@sokdara.design',
    telegram: '@sokdara',
    email: 'sok.dara@example.com',
    customLinks: [
      { label: 'Portfolio', url: 'https://biocloud.app/c/demo' },
      { label: 'Book a demo', url: 'https://biocloud.app' },
    ],
    theme: 'vibrant_pink',
    updatedAt: '2026-05-26T00:00:00.000Z',
  },
  'sitehub-creator': {
    id: 'guest-demo-creator',
    userId: 'guest-demo-creator',
    slug: 'sitehub-creator',
    displayName: 'Mina Chen',
    tagline: 'Creator tools and QR launch preview',
    whatsapp: '+85598765432',
    instagram: '@sitehub.creator',
    telegram: '@sitehubcreator',
    email: 'creator@example.com',
    customLinks: [
      { label: 'Media kit', url: 'https://biocloud.app/c/sitehub-creator' },
      { label: 'Launch page', url: 'https://biocloud.app' },
    ],
    theme: 'ocean_wave',
    updatedAt: '2026-05-26T00:00:00.000Z',
  },
};
```

---

## src\utils\guestScan.ts

```ts
import { GUEST_DEMO_QR_CODES } from '@/src/constants/guestDemo';

const SLUG_PATTERN = /(?:biocloud\.app\/c\/|\/public\/)([a-z0-9-]+)/i;

export function parseScanPayloadToSlug(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const urlMatch = trimmed.match(SLUG_PATTERN);
  if (urlMatch?.[1]) return urlMatch[1].toLowerCase();

  const demo = GUEST_DEMO_QR_CODES.find(
    (item) => item.payload === trimmed || item.slug === trimmed.toLowerCase()
  );
  if (demo) return demo.slug;

  if (/^[a-z0-9-]{3,40}$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  return null;
}
```

---

## src\hooks\useIsGuest.ts

```ts
import { useMemo } from 'react';
import { useAuth } from '@/src/hooks/useAuth';
import { isGuestUser } from '@/src/utils/authFlow';

export function useIsGuest() {
  const { user } = useAuth();
  return useMemo(() => isGuestUser(user), [user]);
}
```

---

## src\hooks\useGuestGate.ts

```ts
import { useCallback, useState } from 'react';
import { useIsGuest } from '@/src/hooks/useIsGuest';

export function useGuestGate() {
  const isGuest = useIsGuest();
  const [unlockVisible, setUnlockVisible] = useState(false);
  const [unlockMessage, setUnlockMessage] = useState<string | undefined>(undefined);

  const closeUnlock = useCallback(() => {
    setUnlockVisible(false);
    setUnlockMessage(undefined);
  }, []);

  const showUnlock = useCallback((message?: string) => {
    setUnlockMessage(message);
    setUnlockVisible(true);
  }, []);

  const requireAccount = useCallback(
    (onAllowed?: () => void, options?: { message?: string }) => {
      if (!isGuest) {
        onAllowed?.();
        return true;
      }
      showUnlock(options?.message);
      return false;
    },
    [isGuest, showUnlock]
  );

  return {
    isGuest,
    unlockVisible,
    unlockMessage,
    closeUnlock,
    showUnlock,
    requireAccount,
  };
}
```

---

## src\providers\GuestGateProvider.tsx

```tsx
import { PropsWithChildren, createContext, useContext, useMemo } from 'react';
import { SignupUnlockModal } from '@/src/components/SignupUnlockModal';
import { useGuestGate } from '@/src/hooks/useGuestGate';

type GuestGateContextValue = ReturnType<typeof useGuestGate>;

const GuestGateContext = createContext<GuestGateContextValue | undefined>(undefined);

export function GuestGateProvider({ children }: PropsWithChildren) {
  const gate = useGuestGate();

  const value = useMemo(() => gate, [gate]);

  return (
    <GuestGateContext.Provider value={value}>
      {children}
      <SignupUnlockModal
        visible={gate.unlockVisible}
        onClose={gate.closeUnlock}
        message={gate.unlockMessage}
      />
    </GuestGateContext.Provider>
  );
}

export function useGuestGateContext() {
  const ctx = useContext(GuestGateContext);
  if (!ctx) {
    throw new Error('useGuestGateContext must be used within GuestGateProvider');
  }
  return ctx;
}

/** Prefer provider context; falls back to a local gate when no provider is mounted. */
export function useRequireAccount() {
  const ctx = useContext(GuestGateContext);
  const local = useGuestGate();
  return ctx ?? local;
}
```

---

## src\components\GuestGate.tsx

```tsx
import { PropsWithChildren } from 'react';
import { Redirect } from 'expo-router';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { appRoutes } from '@/src/constants/navigation';

interface GuestGateProps {
  /** When true, guests are blocked and redirected to consumer tabs. */
  blockGuests?: boolean;
}

/** Blocks guest users from staff-only or account-only routes. */
export function GuestGate({ blockGuests = true, children }: PropsWithChildren<GuestGateProps>) {
  const isGuest = useIsGuest();

  if (blockGuests && isGuest) {
    return <Redirect href={appRoutes.customerTabs} />;
  }

  return <>{children}</>;
}
```

---

## src\components\SignupUnlockModal.tsx

```tsx
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppButton } from '@/src/components/AppButton';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { appRoutes } from '@/src/constants/navigation';
import { theme } from '@/src/constants/theme';

const DEFAULT_TITLE = 'Create your account to unlock your own NFC identity.';
const DEFAULT_MESSAGE =
  'Sign in or register to save profiles, write NFC chips, sync to the cloud, and build your personal identity card.';

interface SignupUnlockModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export function SignupUnlockModal({
  visible,
  onClose,
  title = DEFAULT_TITLE,
  message,
}: SignupUnlockModalProps) {
  const body = message ?? DEFAULT_MESSAGE;
  function goToLogin() {
    onClose();
    router.push(appRoutes.login);
  }

  function goToRegister() {
    onClose();
    router.push('/auth/register');
  }

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.panel} onPress={(event) => event.stopPropagation()}>
          <View style={styles.iconWrap}>
            <AppIcon name="Nfc" size={28} color={theme.colors.primary} />
          </View>
          <AppText variant="h2" weight="bold" style={styles.title}>
            {title}
          </AppText>
          <AppText variant="body" tone="muted" style={styles.message}>
            {body}
          </AppText>
          <View style={styles.actions}>
            <AppButton label="Sign In" onPress={goToLogin} />
            <AppButton label="Create Account" variant="secondary" onPress={goToRegister} />
            <AppButton label="Continue Exploring" variant="ghost" onPress={onClose} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(17,24,39,0.45)',
    padding: theme.spacing.lg,
  },
  panel: {
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
    ...theme.shadows.floating,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
  actions: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
});
```

---

## src\utils\authFlow.ts

```ts
import { AppUser, UserRole } from '@/src/types/models';

export const AUTH_ROLES: UserRole[] = ['guest', 'customer', 'sales', 'printer', 'admin', 'super_admin'];
export const STAFF_ROLES: UserRole[] = ['sales', 'printer'];

export type DashboardRoute = '/auth/login' | '/(tabs)' | '/sales' | '/printer/queue' | '/admin';

export function normalizeRole(role: unknown): UserRole {
  if (role === 'super_admin') return 'super_admin';
  if (role === 'admin') return 'admin';
  if (role === 'printer' || role === 'printer_staff') return 'printer';
  if (role === 'sales' || role === 'sales_rep') return 'sales';
  if (role === 'customer' || role === 'user') return 'customer';
  return 'guest';
}

export function getDashboardRoute(user: AppUser | null): DashboardRoute {
  if (!user) return '/auth/login';
  if (user.role === 'admin' || user.role === 'super_admin') return '/admin';
  if (user.role === 'printer') return '/printer/queue';
  if (user.role === 'sales') return '/sales';
  return '/(tabs)';
}

export function canAccessRole(user: AppUser | null, allowedRoles?: UserRole[]) {
  if (!allowedRoles || allowedRoles.length === 0) return Boolean(user);
  if (!user) return false;
  if (user.role === 'super_admin' && allowedRoles.includes('admin')) return true;
  return allowedRoles.includes(user.role);
}

export function isGuestUser(user: AppUser | null) {
  return !user || user.isGuest === true || user.role === 'guest';
}

export function isStaffRole(role: UserRole) {
  return STAFF_ROLES.includes(role);
}
```

---

## src\utils\roleCapabilities.ts

```ts
import { UserRole } from '@/src/types/models';

export type RoleLike = UserRole | null | undefined;

interface RoleCapability {
  title: string;
  description: string;
}

const capabilities: Record<UserRole, RoleCapability[]> = {
  guest: [
    {
      title: 'Explore & scan',
      description: 'Scan demo QR codes, preview public profiles, try NFC tap simulation, and browse themes.',
    },
    {
      title: 'No account saves',
      description: 'Cannot save profiles, contacts, settings sync, uploads, QR/NFC generation, or wallet passes.',
    },
    {
      title: 'Staff areas blocked',
      description: 'Sales, printer, admin, and payout tools redirect to the guest consumer experience.',
    },
  ],
  customer: [
    {
      title: 'Own profile',
      description: 'Can manage personal bio, language, theme, and customer order requests.',
    },
    {
      title: 'Limited access',
      description: 'Cannot view staff wages, branch queues, or global admin settings.',
    },
  ],
  sales: [
    {
      title: 'Sales orders',
      description: 'Can create orders and see only orders assigned to this sales account.',
    },
    {
      title: 'Payout tracking',
      description: 'Can review own commission and payout status after orders are delivered.',
    },
    {
      title: 'Account settings',
      description: 'Can change personal app preferences and sign out, but not edit global rates.',
    },
  ],
  printer: [
    {
      title: 'Create intake orders',
      description: 'Can create a new order directly when a customer request arrives at the print station.',
    },
    {
      title: 'Assigned queue',
      description: 'Can work on assigned or branch-visible print, NFC, and QA jobs.',
    },
    {
      title: 'Wages',
      description: 'Can view own completed jobs, card totals, failures, and salary status.',
    },
    {
      title: 'Account settings',
      description: 'Can change personal app preferences and sign out, but not manage users.',
    },
  ],
  admin: [
    {
      title: 'Global operations',
      description: 'Can manage users, orders, NFC logs, salaries, products, reports, and settings.',
    },
    {
      title: 'Staff oversight',
      description: 'Can review printer and sales activity across every branch.',
    },
    {
      title: 'Backend controlled',
      description: 'Role changes and privileged actions should be enforced by Firestore rules or custom claims.',
    },
  ],
  super_admin: [
    {
      title: 'Owner access',
      description: 'Should manage admins, staff roles, branches, rates, products, and backend configuration.',
    },
    {
      title: 'Audit authority',
      description: 'Should review all records and audit history across sales, printer, and admin accounts.',
    },
    {
      title: 'Production setup',
      description: 'Should be issued from trusted backend claims, not self-service registration.',
    },
  ],
};

export function getRoleLabel(role: RoleLike) {
  if (role === 'super_admin') return 'Super Admin';
  if (role === 'admin') return 'Admin';
  if (role === 'printer') return 'Printer';
  if (role === 'sales') return 'Sales Rep';
  if (role === 'customer') return 'Customer';
  return 'Guest';
}

export function getRoleCapabilities(role: RoleLike) {
  return capabilities[role ?? 'guest'] ?? capabilities.guest;
}

export function getRoleScopeSummary(role: RoleLike) {
  if (role === 'super_admin') return 'All branches, all users, backend-owned privileges.';
  if (role === 'admin') return 'All branches and operational records.';
  if (role === 'printer') return 'Assigned branch, print queue, NFC, QA, and own wages.';
  if (role === 'sales') return 'Own assigned customers, orders, and payouts.';
  if (role === 'customer') return 'Own profile and customer-facing records.';
  return 'Limited preview only.';
}
```

---

## src\features\home\HomeScreen.tsx

```tsx
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppButton } from '@/src/components/AppButton';
import { AppCard } from '@/src/components/AppCard';
import { AppIcon } from '@/src/components/AppIcon';
import { FloatingNfcCard } from '@/src/components/FloatingNfcCard';
import { MetricCard } from '@/src/components/MetricCard';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { AppText } from '@/src/components/AppText';
import { theme } from '@/src/constants/theme';
import { useAuth } from '@/src/hooks/useAuth';
import { useOrders } from '@/src/hooks/useOrders';
import { usePrinterJobs } from '@/src/hooks/usePrinterJobs';
import { useRoleFlags } from '@/src/hooks/useRoleFlags';
import { GuestHomeScreen } from '@/src/features/guest/GuestHomeScreen';

export function HomeScreen() {
  const { user } = useAuth();
  const { role, isSales, isPrinter, isCustomer, isGuest } = useRoleFlags();
  const { jobs } = usePrinterJobs();
  const { orders, isLoading: ordersLoading, error: ordersError, refresh } = useOrders(role, user?.id ?? '');

  if (isGuest) {
    return <GuestHomeScreen />;
  }

  const queueCount = isSales
    ? orders.filter((order) => order.status !== 'delivered').length
    : jobs.filter((job) => job.stage !== 'done').length;
  const completedToday = jobs.filter((job) => job.stage === 'done').length;
  const pendingOrders = orders.filter((order) => order.status !== 'delivered' && (order.cardStatus ?? 'active') !== 'closed').length;

  const dashboardLabel = isSales
    ? 'Sales Dashboard'
    : isPrinter
      ? 'Printer Dashboard'
      : isGuest
        ? 'Guest Preview'
        : 'Customer Dashboard';

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <AppText variant="caption" tone="muted" style={styles.greeting}>
          {dashboardLabel}
        </AppText>
        <AppText variant="h1">{getGreeting()}, {firstName(user?.displayName)}</AppText>
      </View>

      <FloatingNfcCard
        role={isPrinter ? 'printer' : isSales ? 'sales' : 'default'}
        name={user?.displayName ?? 'ID.NTITY'}
        subtitle={isPrinter ? 'Printer NFC station' : isSales ? 'Sales identity workspace' : 'Premium NFC identity'}
      />

      {ordersError ? (
        <AppCard>
          <AppText variant="body" tone="muted">{ordersError}</AppText>
          <AppButton label="Retry" variant="ghost" onPress={refresh} />
        </AppCard>
      ) : null}

      {(isGuest || isCustomer) ? (
        <AppCard style={styles.actionCard}>
          <View style={styles.actionCardInner}>
            <View style={styles.actionIcon}>
              <AppIcon name="Nfc" size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.actionText}>
              <AppText variant="h2">{isGuest ? 'Preview Mode' : 'Bio Card'}</AppText>
              <AppText variant="caption" tone="muted">
                {isGuest ? 'Sign in to create orders and manage cards.' : 'Manage your public bio and card activation.'}
              </AppText>
            </View>
          </View>
          <AppButton
            label={isGuest ? 'Sign In' : 'Edit Bio Page'}
            onPress={() => router.push(isGuest ? '/auth/login' : '/edit-bio')}
          />
        </AppCard>
      ) : null}

      {isSales ? (
        <>
          <View style={styles.metricsRow}>
            <MetricCard label="Open Orders" value={ordersLoading ? '...' : `${pendingOrders}`} highlight="Sales" />
            <MetricCard label="In Queue" value={`${queueCount}`} />
          </View>

          <AppCard style={styles.actionCard}>
            <View style={styles.actionCardInner}>
              <View style={styles.actionIcon}>
                <AppIcon name="ClipboardList" size={22} color={theme.colors.primary} />
              </View>
              <View style={styles.actionText}>
                <AppText variant="h2">New Order</AppText>
                <AppText variant="caption" tone="muted">
                  Capture customer request instantly
                </AppText>
              </View>
            </View>
            <AppButton label="Create Order" onPress={() => router.push('/new-order')} />
          </AppCard>

          <AppCard style={styles.actionCard}>
            <View style={styles.actionCardInner}>
              <View style={[styles.actionIcon, styles.actionIconSecondary]}>
                <AppIcon name="Wallet" size={22} color={theme.colors.secondary} />
              </View>
              <View style={styles.actionText}>
                <AppText variant="h2">My Payouts</AppText>
                <AppText variant="caption" tone="muted">
                  Commission and payout history
                </AppText>
              </View>
            </View>
            <AppButton label="View Payouts" variant="ghost" onPress={() => router.push('/sales/payouts')} />
          </AppCard>
        </>
      ) : null}

      {isPrinter ? (
        <>
          <View style={styles.metricsRow}>
            <MetricCard label="In Queue" value={`${queueCount}`} highlight="Live" />
            <MetricCard label="Done Today" value={`${completedToday}`} />
          </View>

          <AppCard style={styles.actionCard}>
            <View style={styles.actionCardInner}>
              <View style={styles.actionIcon}>
                <AppIcon name="Printer" size={22} color={theme.colors.primary} />
              </View>
              <View style={styles.actionText}>
                <AppText variant="h2">Printer Queue</AppText>
                <AppText variant="caption" tone="muted">
                  Manage NFC programming pipeline
                </AppText>
              </View>
            </View>
            <AppButton label="Open Queue" onPress={() => router.push('/printer/queue')} />
          </AppCard>

          <View style={styles.row}>
            <AppButton
              label="NFC Write"
              fullWidth={false}
              style={styles.halfButton}
              onPress={() => router.push('/printer/scan')}
            />
            <AppButton
              label="QA Video"
              fullWidth={false}
              variant="secondary"
              style={styles.halfButton}
              onPress={() => router.push('/printer/queue')}
            />
          </View>

          <AppCard style={styles.actionCard}>
            <View style={styles.actionCardInner}>
              <View style={[styles.actionIcon, styles.actionIconAccent]}>
                <AppIcon name="BadgeDollarSign" size={22} color={theme.colors.accent} />
              </View>
              <View style={styles.actionText}>
                <AppText variant="h2">My Salary</AppText>
                <AppText variant="caption" tone="muted">
                  QA throughput and earnings
                </AppText>
              </View>
            </View>
            <AppButton label="View Salary" variant="ghost" onPress={() => router.push('/printer/wages')} />
          </AppCard>
        </>
      ) : null}
    </ScreenContainer>
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
  header: {
    gap: theme.spacing.xxs,
    marginBottom: theme.spacing.xs,
  },
  greeting: {
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionCard: {
    gap: theme.spacing.md,
  },
  actionCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconSecondary: {
    backgroundColor: '#FFF0EB',
  },
  actionIconAccent: {
    backgroundColor: '#EDFAF4',
  },
  actionText: {
    flex: 1,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  halfButton: {
    flex: 1,
  },
});
```

---

## src\features\bio\EditBioScreen.tsx

```tsx
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { AppButton } from '@/src/components/AppButton';
import { AppCard } from '@/src/components/AppCard';
import { AppIcon } from '@/src/components/AppIcon';
import { AppInput } from '@/src/components/AppInput';
import { AppText } from '@/src/components/AppText';
import { AppAvatar } from '@/src/components/AppAvatar';
import { theme } from '@/src/constants/theme';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useBioPage } from '@/src/hooks/useBioPage';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { uploadProfilePhoto } from '@/src/services/profilePhotoService';

function SectionHeader({ icon, title }: { icon: React.ComponentProps<typeof AppIcon>['name']; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <AppIcon name={icon} size={18} color={theme.colors.primary} />
      <AppText variant="caption" tone="muted" style={styles.sectionLabel}>{title}</AppText>
    </View>
  );
}

export function EditBioScreen() {
  const { user } = useAuth();
  const isGuest = useIsGuest();
  const { requireAccount } = useRequireAccount();
  const { bioPage, saveBioPage } = useBioPage(user?.id ?? '');

  const [slug, setSlug] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [tagline, setTagline] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [telegram, setTelegram] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    if (!bioPage) return;
    setSlug(bioPage.slug);
    setDisplayName(bioPage.displayName);
    setTagline(bioPage.tagline ?? '');
    setWhatsapp(bioPage.whatsapp ?? '');
    setInstagram(bioPage.instagram ?? '');
    setTelegram(bioPage.telegram ?? '');
    setEmail(bioPage.email ?? '');
    setPhotoUrl(bioPage.photoUrl);
  }, [bioPage]);

  async function pickImage(fromCamera: boolean) {
    if (!requireAccount(undefined, { message: 'Create an account to upload a profile photo.' })) {
      return;
    }
    if (!user?.id) return;

    try {
      if (fromCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission needed', 'Camera permission is required to take a profile photo.');
          return;
        }
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission needed', 'Photo library access is required to choose a profile photo.');
          return;
        }
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      setIsUploadingPhoto(true);
      try {
        const response = await uploadProfilePhoto({
          uri: asset.uri,
          userId: user.id,
          fileName: asset.fileName,
          mimeType: asset.mimeType,
        });
        setPhotoUrl(response.url);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to upload profile photo.';
        Alert.alert('Upload failed', message);
      } finally {
        setIsUploadingPhoto(false);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to open image picker.';
      Alert.alert('Image error', message);
    }
  }

  async function handleSave() {
    if (!requireAccount(undefined, { message: 'Create an account to save your bio profile.' })) {
      return;
    }
    if (!displayName.trim()) {
      Alert.alert('Required', 'Display name is required.');
      return;
    }
    if (slug.trim() && !/^[a-z0-9-]{3,40}$/i.test(slug.trim())) {
      Alert.alert('Invalid slug', 'Use 3-40 letters, numbers, or hyphens.');
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert('Invalid email', 'Enter a valid email address.');
      return;
    }
    setIsSaving(true);
    try {
      await saveBioPage({
        slug: slug.trim().toLowerCase() || (user?.id ?? ''),
        displayName: displayName.trim(),
        tagline: tagline.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        instagram: instagram.trim() || undefined,
        telegram: telegram.trim() || undefined,
        email: email.trim() || undefined,
        customLinks: bioPage?.customLinks ?? [],
        theme: bioPage?.theme ?? 'vibrant_pink',
        photoUrl: photoUrl,
      });
      Alert.alert('Saved âœ…', 'Your bio page has been updated.');
    } catch (err) {
      Alert.alert('Save failed', (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#9DECF9', '#CBF7EC', '#FFF4D8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <AppIcon name="ChevronLeft" size={22} color={theme.colors.textPrimary} />
          </Pressable>
          <AppText variant="h2">Edit Bio</AppText>
          <Pressable onPress={() => bioPage && router.push(`/public/${bioPage.slug}`)} style={styles.previewBtn}>
            <AppText variant="caption" style={styles.previewText}>Preview</AppText>
          </Pressable>
        </View>

        {/* Profile */}
        <AppCard>
          <SectionHeader icon="User" title="PROFILE" />
          <View style={styles.avatarRow}>
            <AppAvatar
              name={displayName || user?.displayName || 'User'}
              role="sales"
              size={72}
              source={photoUrl ? { uri: photoUrl } : undefined}
            />
            <View style={styles.avatarActions}>
              <Pressable
                style={styles.avatarButton}
                onPress={() => void pickImage(false)}
                disabled={isUploadingPhoto}
              >
                <AppIcon name="Image" size={16} color={theme.colors.primary} />
                <AppText variant="caption" weight="bold" style={styles.avatarButtonText}>
                  {isUploadingPhoto ? 'Uploadingâ€¦' : 'Choose photo'}
                </AppText>
              </Pressable>
              <Pressable
                style={styles.avatarButtonSecondary}
                onPress={() => void pickImage(true)}
                disabled={isUploadingPhoto}
              >
                <AppIcon name="ScanLine" size={16} color={theme.colors.textPrimary} />
                <AppText variant="caption" weight="bold" style={styles.avatarSecondaryText}>
                  Take photo
                </AppText>
              </Pressable>
            </View>
          </View>
          <View style={styles.fields}>
            <AppInput label="Display name *" value={displayName} onChangeText={setDisplayName} placeholder="Sok Dara" autoCapitalize="words" />
            <AppInput label="Tagline" value={tagline} onChangeText={setTagline} placeholder="Coffee Â· Code Â· Khmer poetry" />
            <AppInput label="URL slug" value={slug} onChangeText={setSlug} placeholder="sokdara" autoCapitalize="none" />
          </View>
        </AppCard>

        {/* Social links */}
        <AppCard>
          <SectionHeader icon="Phone" title="SOCIAL LINKS" />
          <View style={styles.fields}>
            <AppInput label="WhatsApp" value={whatsapp} onChangeText={setWhatsapp} placeholder="+855 12 345 678" keyboardType="phone-pad" />
            <AppInput label="Instagram" value={instagram} onChangeText={setInstagram} placeholder="@sokdara" autoCapitalize="none" />
            <AppInput label="Telegram" value={telegram} onChangeText={setTelegram} placeholder="@sokdara_pp" autoCapitalize="none" />
            <AppInput label="Email" value={email} onChangeText={setEmail} placeholder="sok@dara.bio" keyboardType="email-address" autoCapitalize="none" />
          </View>
        </AppCard>

        {isGuest ? (
          <AppText variant="caption" tone="muted" style={styles.guestHint}>
            Guest preview â€” sign up to save changes.
          </AppText>
        ) : null}
        <AppButton label="Save Bio Page" loading={isSaving} onPress={handleSave} />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: theme.spacing.lg, paddingBottom: 120, gap: theme.spacing.md },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.xs },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' },
  previewBtn: { paddingHorizontal: theme.spacing.sm, paddingVertical: 6, borderRadius: theme.radius.pill, backgroundColor: theme.colors.primary },
  previewText: { color: '#fff', fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, marginBottom: theme.spacing.sm },
  sectionLabel: { textTransform: 'uppercase', letterSpacing: 0, fontSize: 10 },
  fields: { gap: theme.spacing.sm },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  avatarActions: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  avatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  avatarButtonText: {
    color: theme.colors.primary,
  },
  avatarButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  avatarSecondaryText: {
    color: theme.colors.textPrimary,
  },
  guestHint: {
    textAlign: 'center',
  },
});
```

---

## src\features\bio\ThemePickerScreen.tsx

```tsx
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppCard } from '@/src/components/AppCard';
import { AppHeader } from '@/src/components/AppHeader';
import { AppSelect } from '@/src/components/AppSelect';
import { AppText } from '@/src/components/AppText';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { bioThemeOptions } from '@/src/constants/options';
import { theme } from '@/src/constants/theme';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useBioPage } from '@/src/hooks/useBioPage';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { BioTheme } from '@/src/types/models';

export function ThemePickerScreen() {
  const { user } = useAuth();
  const isGuest = useIsGuest();
  const { requireAccount } = useRequireAccount();
  const { bioPage, saveBioPage, isLoading } = useBioPage(user?.id ?? '');
  const [previewTheme, setPreviewTheme] = useState<BioTheme>('vibrant_pink');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = isGuest ? previewTheme : (bioPage?.theme ?? 'vibrant_pink');

  async function handleSelect(value: BioTheme) {
    if (isGuest) {
      setPreviewTheme(value);
      return;
    }
    if (!requireAccount(undefined, { message: 'Create an account to save your bio theme.' })) {
      return;
    }
    if (!bioPage || saving) return;
    setSaving(true);
    setError(null);
    try {
      await saveBioPage({ ...bioPage, theme: value });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save theme.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenContainer>
      <AppHeader
        title="Bio theme"
        subtitle="Public page look"
        showBack={router.canGoBack()}
      />
      <AppText variant="body" tone="muted">
        {isGuest
          ? 'Preview bio themes in guest mode. Sign up to save your choice.'
          : 'Pick the look for your public bio page. Changes save when you choose a theme.'}
      </AppText>

      {error ? (
        <AppText variant="caption" style={styles.error}>
          {error}
        </AppText>
      ) : null}

      <AppCard>
        <AppSelect<BioTheme>
          label="Theme"
          value={current}
          disabled={!isGuest && (isLoading || !bioPage || saving)}
          options={bioThemeOptions.map((opt) => ({
            label: opt.label,
            value: opt.value,
            leading: (
              <View style={[styles.swatch, { backgroundColor: opt.bg }]}>
                <View style={[styles.swatchBar, { backgroundColor: opt.accent }]} />
              </View>
            ),
          }))}
          onChange={(value) => void handleSelect(value)}
        />
      </AppCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  swatch: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    justifyContent: 'flex-end',
    padding: 4,
  },
  swatchBar: {
    height: 6,
    borderRadius: theme.radius.pill,
    opacity: 0.85,
  },
  error: {
    color: theme.colors.danger,
    fontWeight: '700',
  },
});
```

---

## src\features\bio\PublicBioScreen.tsx

```tsx
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Linking, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { getPublicBioPageBySlug } from '@/src/services/firestoreService';
import { BioPage } from '@/src/types/models';
import { bioThemeOptions } from '@/src/constants/options';
import { theme } from '@/src/constants/theme';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';

interface Props { slug: string }

function getThemeStyle(t: BioPage['theme']) {
  return bioThemeOptions.find((o) => o.value === t) ?? bioThemeOptions[0];
}

function SocialButton({ icon, label, url, bg }: { icon: React.ComponentProps<typeof AppIcon>['name']; label: string; url: string; bg: string }) {
  return (
    <Pressable style={[styles.socialBtn, { backgroundColor: bg }]} onPress={() => Linking.openURL(url)}>
      <AppIcon name={icon} size={20} color="#fff" />
      <AppText variant="body" style={styles.socialLabel}>{label}</AppText>
    </Pressable>
  );
}

export function PublicBioScreen({ slug }: Props) {
  const isGuest = useIsGuest();
  const { requireAccount } = useRequireAccount();
  const [bioPage, setBioPage] = useState<BioPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [contactPreviewed, setContactPreviewed] = useState(false);
  const heroFloat = useRef(new Animated.Value(0)).current;
  const savePulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getPublicBioPageBySlug(slug).then(setBioPage).finally(() => setIsLoading(false));
  }, [slug]);

  useEffect(() => {
    const heroLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(heroFloat, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(heroFloat, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    const saveLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(savePulse, {
          toValue: 1,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(savePulse, {
          toValue: 0,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    heroLoop.start();
    saveLoop.start();
    return () => {
      heroLoop.stop();
      saveLoop.stop();
    };
  }, [heroFloat, savePulse]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <AppText variant="body" tone="muted">Loadingâ€¦</AppText>
      </SafeAreaView>
    );
  }

  if (!bioPage) {
    return (
      <SafeAreaView style={styles.center}>
        <AppText variant="h2">Page not found</AppText>
        <AppText variant="body" tone="muted">This bio page does not exist yet.</AppText>
      </SafeAreaView>
    );
  }

  const themeStyle = getThemeStyle(bioPage.theme);
  const profileUrl = `https://biocloud.app/c/${bioPage.slug}`;

  async function handleShare() {
    await Share.share({ message: `${bioPage!.displayName} â€” ${profileUrl}`, url: profileUrl });
  }

  function handleSaveContactPreview() {
    setContactPreviewed(true);
  }

  async function handleSaveContact() {
    if (isGuest) {
      requireAccount(undefined, {
        message: 'Create an account to save contacts to your device and history.',
      });
      return;
    }

    // vCard format
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${bioPage!.displayName}`,
      bioPage!.tagline ? `TITLE:${bioPage!.tagline}` : '',
      bioPage!.whatsapp ? `TEL;TYPE=CELL:${bioPage!.whatsapp}` : '',
      bioPage!.email ? `EMAIL:${bioPage!.email}` : '',
      `URL:${profileUrl}`,
      'END:VCARD',
    ].filter(Boolean).join('\n');

    await Share.share({ message: vcard, title: `${bioPage!.displayName} Contact` });
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeStyle.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Share button top right */}
        <View style={styles.topBar}>
          <View />
          <Pressable onPress={handleShare} style={styles.shareBtn}>
            <AppIcon name="Share" size={18} color={themeStyle.accent} />
          </Pressable>
        </View>

        {/* Avatar */}
        <Animated.View
          style={[
            styles.avatarWrap,
            {
              transform: [
                {
                  translateY: heroFloat.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -6],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={[styles.avatarGlow, { backgroundColor: `${themeStyle.accent}20` }]} />
          <View style={[styles.avatar, { backgroundColor: themeStyle.accent }]}>
            <AppText style={[styles.avatarText, { color: themeStyle.bg }]}>
              {(bioPage.displayName ?? 'U')[0].toUpperCase()}
            </AppText>
          </View>
        </Animated.View>

        {/* Name + tagline */}
        <AppText style={[styles.name, { color: themeStyle.text }]}>{bioPage.displayName}</AppText>
        {bioPage.tagline ? (
          <AppText style={[styles.tagline, { color: themeStyle.text + 'AA' }]}>{bioPage.tagline}</AppText>
        ) : null}

        {/* Save to Contacts */}
        <Animated.View
          style={{
            transform: [
              {
                scale: savePulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.018],
                }),
              },
            ],
          }}
        >
          <Pressable
            style={[styles.saveContactBtn, { backgroundColor: themeStyle.accent, shadowColor: themeStyle.accent }]}
            onPress={isGuest ? handleSaveContactPreview : handleSaveContact}
          >
            <AppIcon name="User" size={18} color="#fff" />
            <AppText style={styles.saveContactText}>
              {isGuest ? 'Preview Add to Contact' : 'Save to Contacts'}
            </AppText>
          </Pressable>
        </Animated.View>
        {contactPreviewed && isGuest ? (
          <View style={styles.previewBox}>
            <AppText variant="caption" tone="muted" style={styles.previewNote}>
              Preview: {bioPage.displayName}
              {bioPage.whatsapp ? ` Â· ${bioPage.whatsapp}` : ''}
              {bioPage.telegram ? ` Â· Telegram ${bioPage.telegram}` : ''}
            </AppText>
            <Pressable onPress={handleSaveContact}>
              <AppText variant="caption" weight="bold" style={[styles.previewNote, { color: themeStyle.accent }]}>
                Save for real â†’
              </AppText>
            </Pressable>
          </View>
        ) : null}

        {/* Social links */}
        <View style={styles.socials}>
          {bioPage.whatsapp ? (
            <SocialButton icon="Phone" label={`WhatsApp Â· ${bioPage.whatsapp}`} url={`https://wa.me/${bioPage.whatsapp.replace(/\D/g, '')}`} bg="#25D366" />
          ) : null}
          {bioPage.instagram ? (
            <SocialButton icon="User" label={`Instagram Â· ${bioPage.instagram}`} url={`https://instagram.com/${bioPage.instagram.replace('@', '')}`} bg="#E1306C" />
          ) : null}
          {bioPage.telegram ? (
            <SocialButton icon="Phone" label={`Telegram Â· ${bioPage.telegram}`} url={`https://t.me/${bioPage.telegram.replace('@', '')}`} bg="#0088CC" />
          ) : null}
          {bioPage.email ? (
            <SocialButton icon="ChevronRight" label={`Email Â· ${bioPage.email}`} url={`mailto:${bioPage.email}`} bg="#6E8A95" />
          ) : null}
          {bioPage.customLinks?.map((link) => (
            <SocialButton key={link.url} icon="ChevronRight" label={link.label} url={link.url} bg={themeStyle.accent} />
          ))}
        </View>

        {/* Footer */}
        <AppText style={styles.footer}>Powered by SITEHUB</AppText>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  scroll: { padding: theme.spacing.lg, paddingBottom: 72, alignItems: 'center', gap: theme.spacing.lg },
  topBar: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shareBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: theme.colors.surfaceGlass, alignItems: 'center', justifyContent: 'center', ...theme.shadows.control },
  avatarWrap: { marginTop: theme.spacing.md, alignItems: 'center', justifyContent: 'center' },
  avatarGlow: { position: 'absolute', width: 148, height: 148, borderRadius: 74 },
  avatar: { width: 116, height: 116, borderRadius: 58, alignItems: 'center', justifyContent: 'center', ...theme.shadows.floating },
  avatarText: { fontSize: 46, fontWeight: '700' },
  name: { fontSize: 34, lineHeight: 40, fontWeight: '700', textAlign: 'center' },
  tagline: { fontSize: 16, lineHeight: 22, textAlign: 'center', marginTop: -theme.spacing.sm },
  saveContactBtn: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.md, borderRadius: theme.radius.pill },
  saveContactText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  socials: { width: '100%', gap: theme.spacing.sm },
  socialBtn: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, padding: theme.spacing.md, borderRadius: theme.radius.lg, ...theme.shadows.control },
  socialLabel: { color: '#fff', fontWeight: '600', flex: 1 },
  footer: { fontSize: 11, color: 'rgba(0,0,0,0.3)', marginTop: theme.spacing.md },
  previewBox: { gap: theme.spacing.xs, alignItems: 'center' },
  previewNote: { textAlign: 'center' },
});
```

---

## src\features\settings\SettingsScreen.tsx

```tsx
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { AppCard } from '@/src/components/AppCard';
import { AppHeader } from '@/src/components/AppHeader';
import { AppIcon } from '@/src/components/AppIcon';
import { AppSelect } from '@/src/components/AppSelect';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { AppText } from '@/src/components/AppText';
import { appRoutes } from '@/src/constants/navigation';
import { languageOptions, profileThemeOptions, typographyColorOptions } from '@/src/constants/options';
import { theme } from '@/src/constants/theme';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { ProfileTheme, TypographyColorKey, UiPreferences } from '@/src/types/models';
import {
  getRoleCapabilities,
  getRoleLabel,
  getRoleScopeSummary,
} from '@/src/utils/roleCapabilities';

type SavingKey =
  | 'language'
  | 'profileTheme'
  | 'typographyColor'
  | 'reset'
  | 'signOut'
  | null;
type Message = { type: 'success' | 'error'; text: string } | null;

export function SettingsScreen() {
  const { signOutUser, user } = useAuth();
  const isGuest = useIsGuest();
  const { requireAccount } = useRequireAccount();
  const { preferences, colors, updatePreferences, resetPreferences, isReady } = useAppTheme();
  const [savingKey, setSavingKey] = useState<SavingKey>(null);
  const [message, setMessage] = useState<Message>(null);
  const showBack = router.canGoBack();

  const isBusy = savingKey !== null;
  const controlsDisabled = !isReady;
  const isSaving = (key: Exclude<SavingKey, null>) => savingKey === key;
  const capabilities = getRoleCapabilities(user?.role);
  const roleLabel = getRoleLabel(user?.role);
  const languageLabel =
    languageOptions.find((option) => option.value === preferences.language)?.label ?? 'English';
  const profileThemeLabel =
    profileThemeOptions.find((option) => option.value === preferences.profileTheme)?.label ?? 'WhatsApp Light';
  const typographyLabel =
    typographyColorOptions.find((option) => option.value === preferences.typographyColor)?.label ??
    'Default';

  async function savePreference(
    key: Exclude<SavingKey, 'reset' | 'signOut' | null>,
    next: Partial<UiPreferences>,
    label: string
  ) {
    if (!requireAccount(undefined, { message: 'Create an account to save settings and sync preferences.' })) {
      return;
    }
    if (!isReady || savingKey === key) return;

    setSavingKey(key);
    setMessage(null);
    try {
      await updatePreferences(next);
      setMessage({ type: 'success', text: `${label} saved.` });
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Unable to save settings.';
      setMessage({ type: 'error', text });
    } finally {
      setSavingKey(null);
    }
  }

  async function performReset() {
    if (!requireAccount(undefined, { message: 'Create an account to save settings.' })) {
      return;
    }
    if (isBusy) return;

    setSavingKey('reset');
    setMessage(null);
    try {
      await resetPreferences();
      setMessage({ type: 'success', text: 'Settings reset to defaults.' });
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Unable to reset settings.';
      setMessage({ type: 'error', text });
    } finally {
      setSavingKey(null);
    }
  }

  function handleReset() {
    Alert.alert(
      'Reset settings?',
      'Language, theme, and text color will return to defaults.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => void performReset() },
      ]
    );
  }

  async function performSignOut() {
    if (isBusy) return;

    setSavingKey('signOut');
    setMessage(null);
    try {
      await signOutUser();
      router.replace(appRoutes.login);
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Unable to sign out.';
      setMessage({ type: 'error', text });
      setSavingKey(null);
    }
  }

  return (
    <ScreenContainer>
      <AppHeader
        title="Settings"
        subtitle={isGuest ? 'Preview â€” changes are not saved' : 'Account & appearance'}
        showBack={showBack}
      />

      {isGuest ? (
        <View style={[styles.message, { backgroundColor: colors.surfaceSoft }]}>
          <AppText variant="caption" style={{ color: colors.primary, fontWeight: '700' }}>
            Guest mode: explore appearance options. Sign up to save settings to your account.
          </AppText>
        </View>
      ) : null}

      {!isReady ? (
        <AppText variant="body" tone="muted">
          Loading your saved preferencesâ€¦
        </AppText>
      ) : null}

      {message ? (
        <View
          style={[
            styles.message,
            {
              backgroundColor: colors.surfaceSoft,
            },
          ]}
        >
          <AppText
            variant="caption"
            style={{
              color: message.type === 'error' ? theme.colors.danger : colors.primary,
              fontWeight: '700',
            }}
          >
            {message.text}
          </AppText>
        </View>
      ) : null}

      <AppCard>
        <View style={styles.sectionHeader}>
          <AppIcon name="User" size={20} color={colors.primary} />
          <AppText variant="h2">Account</AppText>
        </View>
        <View style={styles.accountRow}>
          <View style={styles.accountInfo}>
            <AppText variant="body">{user?.displayName ?? 'Guest User'}</AppText>
            <AppText variant="caption" tone="muted">
              {user?.email ?? 'Not signed in'}
            </AppText>
            <AppText variant="caption" tone="muted">
              Scope: {getRoleScopeSummary(user?.role)}
            </AppText>
          </View>
          <View style={[styles.rolePill, { backgroundColor: colors.primaryDark }]}>
            <AppText variant="caption" tone="inverse" style={styles.roleText}>
              {roleLabel.toUpperCase()}
            </AppText>
          </View>
        </View>
        <View style={styles.detailGrid}>
          <View style={[styles.detailCell, { backgroundColor: colors.surfaceSoft }]}>
            <AppText variant="caption" tone="muted">
              Language
            </AppText>
            <AppText variant="body" style={styles.detailValue}>
              {languageLabel}
            </AppText>
          </View>
          <View style={[styles.detailCell, { backgroundColor: colors.surfaceSoft }]}>
            <AppText variant="caption" tone="muted">
              Theme
            </AppText>
            <AppText variant="body" style={styles.detailValue}>
              {profileThemeLabel}
            </AppText>
          </View>
        </View>
      </AppCard>

      <AppCard>
        <View style={styles.sectionHeader}>
          <AppIcon name="ShieldCheck" size={20} color={colors.primary} />
          <AppText variant="h2">Role Access</AppText>
        </View>
        <View style={styles.capabilityList}>
          {capabilities.map((capability) => (
            <View key={capability.title} style={styles.capabilityRow}>
              <View style={[styles.capabilityDot, { backgroundColor: colors.primary }]} />
              <View style={styles.capabilityCopy}>
                <AppText variant="body" style={styles.capabilityTitle}>
                  {capability.title}
                </AppText>
                <AppText variant="caption" tone="muted">
                  {capability.description}
                </AppText>
              </View>
            </View>
          ))}
        </View>
      </AppCard>

      <AppCard>
        <View style={styles.sectionHeader}>
          <AppIcon name="ShieldCheck" size={20} color={colors.primary} />
          <AppText variant="h2">Preferences</AppText>
        </View>
        <View style={styles.preferencesStack}>
          <AppSelect
            label="Language"
            value={preferences.language}
            options={languageOptions.map((option) => ({
              label: option.label,
              value: option.value,
            }))}
            disabled={controlsDisabled || isSaving('language')}
            onChange={(value) => void savePreference('language', { language: value }, 'Language')}
          />
          <AppSelect<ProfileTheme>
            label="Profile theme"
            value={preferences.profileTheme}
            description="Choose the app-wide look for sales, printer, admin, and guest profiles."
            options={profileThemeOptions.map((option) => ({
              label: option.label,
              value: option.value,
              leading: <View style={[styles.themeSwatch, { backgroundColor: option.accent }]} />,
            }))}
            disabled={controlsDisabled || isSaving('profileTheme')}
            onChange={(value) =>
              void savePreference('profileTheme', { profileTheme: value }, 'Profile theme')
            }
          />
          <AppSelect<TypographyColorKey>
            label="Text color"
            value={preferences.typographyColor}
            description={`Accent color for body text (${typographyLabel} selected).`}
            options={typographyColorOptions.map((option) => ({
              label: option.label,
              value: option.value,
              leading: <View style={[styles.swatchDot, { backgroundColor: option.color }]} />,
            }))}
            disabled={controlsDisabled || isSaving('typographyColor')}
            onChange={(value) =>
              void savePreference('typographyColor', { typographyColor: value }, 'Text color')
            }
          />
        </View>
      </AppCard>

      <AppCard>
        <View style={styles.sectionHeader}>
          <AppIcon name="LogOut" size={20} color={theme.colors.danger} />
          <AppText variant="h2">Session</AppText>
        </View>
        <Pressable
          disabled={isBusy}
          onPress={handleReset}
          style={[styles.actionRow, isBusy && styles.optionDisabled]}
        >
          <View style={styles.actionCopy}>
            <AppText variant="body" style={styles.actionTitle}>
              Reset Local Settings
            </AppText>
            <AppText variant="caption" tone="muted">
              Restore language, theme, and text color defaults.
            </AppText>
          </View>
          <AppText variant="caption" style={[styles.actionText, { color: colors.primary }]}>
            {savingKey === 'reset' ? 'Resetting...' : 'Reset'}
          </AppText>
        </Pressable>
        <Pressable
          disabled={isBusy}
          onPress={() => void performSignOut()}
          style={[
            styles.actionRow,
            styles.signOutRow,
            { borderTopColor: colors.border },
            isBusy && styles.optionDisabled,
          ]}
        >
          <View style={styles.actionCopy}>
            <AppText variant="body" style={styles.signOutText}>
              Sign Out
            </AppText>
            <AppText variant="caption" tone="muted">
              End the current account session.
            </AppText>
          </View>
          <AppText variant="caption" style={styles.signOutText}>
            {savingKey === 'signOut' ? 'Signing out...' : 'Sign Out'}
          </AppText>
        </Pressable>
      </AppCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  message: {
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    ...theme.shadows.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  accountInfo: {
    flex: 1,
    gap: 3,
  },
  rolePill: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
  },
  detailGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  detailCell: {
    flex: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    gap: 3,
    ...theme.shadows.card,
  },
  detailValue: {
    fontWeight: '700',
  },
  capabilityList: {
    gap: theme.spacing.sm,
  },
  capabilityRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  capabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 7,
  },
  capabilityCopy: {
    flex: 1,
    gap: 2,
  },
  capabilityTitle: {
    fontWeight: '700',
  },
  preferencesStack: {
    gap: theme.spacing.md,
  },
  themeSwatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  swatchDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  optionDisabled: {
    opacity: 0.55,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
  },
  signOutRow: {
    marginTop: theme.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: theme.spacing.md,
  },
  actionCopy: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    fontWeight: '700',
  },
  actionText: {
    fontWeight: '700',
  },
  signOutText: {
    color: theme.colors.danger,
    fontWeight: '700',
  },
});
```

---

## src\types\models.ts

```ts
export type UserRole = 'guest' | 'customer' | 'sales' | 'printer' | 'admin' | 'super_admin';

export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  language: string;
  phone?: string;
  branch?: string;
  isActive?: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  isGuest?: boolean;
}

// â”€â”€â”€ Order â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type OrderStatus =
  | 'new'
  | 'design'
  | 'printing'
  | 'nfc_writing'
  | 'nfc_verification'
  | 'ready'
  | 'delivered';

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export type OrderCardStatus = 'active' | 'frozen' | 'closed';

export type CardDesign =
  | 'classic_black'
  | 'matte_silver'
  | 'gold_premium'
  | 'rose_gold'
  | 'custom';

export interface Order {
  id: string;
  // Customer info
  customerName: string;
  phone: string;
  telegram?: string;
  whatsapp?: string;
  email?: string;
  company?: string;
  jobTitle?: string;
  deliveryAddress?: string;
  // Order details
  productType: string;
  quantity: number;
  cardDesign: CardDesign;
  designArtworkUrl?: string;
  designArtworkPath?: string;
  designArtworkFileName?: string;
  cardCode: string;
  profileUrl: string;
  nfcEnabled?: boolean;
  nfcTargetUrl?: string;
  qrPrinted?: boolean;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  depositAmount?: number;
  dueDate?: string;
  priority?: 'standard' | 'urgent';
  notes?: string;
  cardStatus?: OrderCardStatus;
  freezeReason?: string;
  frozenAt?: string;
  frozenBy?: string;
  closedAt?: string;
  closedBy?: string;
  // Workflow
  status: OrderStatus;
  assignedSalesman: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// â”€â”€â”€ Printer Job â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type PrinterJobStage =
  | 'queued'
  | 'printing'
  | 'nfc_writing'
  | 'nfc_verification'
  | 'done'
  | 'failed';

export interface PrinterJob {
  id: string;
  orderId: string;
  printerId: string;
  queueNumber: number;
  stage: PrinterJobStage;
  cardsPrinted: number;
  failedCards: number;
  reprintedCards: number;
  failedCardsApproved: boolean;
  perCardBonus: number;
  perOrderBonus: number;
  salaryStatus: 'unpaid' | 'paid';
  notes?: string;
  qaVideoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// â”€â”€â”€ NFC Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type NfcStatus =
  | 'not_written'
  | 'writing'
  | 'written'
  | 'verified'
  | 'failed'
  | 'rewrite_needed'
  | 'disabled';

export interface NfcCard {
  id: string;
  chipUID: string;
  profileUrl: string;
  orderId: string;
  cardCode: string;
  writtenBy: string;
  writtenAt: string;
  verificationStatus: NfcStatus;
  updatedAt: string;
}

// â”€â”€â”€ Salary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface SalaryRecord {
  id: string;
  printerId: string;
  printerName: string;
  period: string;            // e.g. "2025-05"
  baseSalary: number;
  totalCards: number;
  failedCards: number;
  approvedFailedCards: number;
  perCardBonus: number;
  qualityBonus: number;
  total: number;
  status: 'unpaid' | 'paid';
  createdAt: string;
  updatedAt: string;
}

// â”€â”€â”€ Legacy / kept for bio pages â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface Payout {
  id: string;
  userId: string;
  amount: number;
  periodLabel: string;
  status: 'pending' | 'paid';
  createdAt: string;
}

// â”€â”€â”€ Bio Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type BioTheme = 'vibrant_pink' | 'tech_noir' | 'editorial' | 'ocean_wave';

export interface BioPage {
  id: string;
  userId: string;
  slug: string;
  displayName: string;
  tagline?: string;
  photoUrl?: string;
  whatsapp?: string;
  instagram?: string;
  telegram?: string;
  email?: string;
  customLinks: { label: string; url: string }[];
  theme: BioTheme;
  updatedAt: string;
}

export type ProfileTheme = 'aqua' | 'mono';

export type TypographyColorKey =
  | 'deep_teal'
  | 'ocean_blue'
  | 'forest'
  | 'slate'
  | 'indigo'
  | 'violet'
  | 'rose'
  | 'amber'
  | 'charcoal'
  | 'midnight';

export interface UiPreferences {
  language: string;
  /** Bio page theme (public profile pages). */
  theme: BioTheme;
  /** App-wide profile chrome theme. */
  profileTheme: ProfileTheme;
  colorMode: 'light' | 'dark';
  typographyColor: TypographyColorKey;
}

// â”€â”€â”€ Notifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type NotificationPriority = 'low' | 'medium' | 'high';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  userId?: string;
  priority?: NotificationPriority;
  actionUrl?: string;
}
```
