import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppAvatar } from '@/src/components/AppAvatar';
import { AppCard } from '@/src/components/AppCard';
import { AppHeader } from '@/src/components/AppHeader';
import { AppIcon } from '@/src/components/AppIcon';
import { AppSelect } from '@/src/components/AppSelect';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { AppText } from '@/src/components/AppText';
import { appRoutes } from '@/src/constants/navigation';
import { languageOptions, profileThemeOptions, typographyColorOptions } from '@/src/constants/options';
import { getRoleTheme, theme } from '@/src/constants/theme';
import { salesUi } from '@/src/features/sales/components/SalesScreenUi';
import {
  PrinterInfoRow,
  PrinterScreenHeader,
  PrinterSettingsRow,
  PrinterSurfaceCard,
} from '@/src/features/printer/components/PrinterScreenUi';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { ProfileTheme, TypographyColorKey, UiPreferences, UserRole } from '@/src/types/models';
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

function usePremiumSettings(role: UserRole | undefined) {
  return role === 'sales' || role === 'printer';
}

export function SettingsScreen() {
  const { signOutUser, user } = useAuth();
  const isGuest = useIsGuest();
  const { requireAccount } = useRequireAccount();
  const { preferences, colors, updatePreferences, resetPreferences, isReady } = useAppTheme();
  const [savingKey, setSavingKey] = useState<SavingKey>(null);
  const [message, setMessage] = useState<Message>(null);
  const showBack = router.canGoBack();
  const premium = usePremiumSettings(user?.role);

  const isBusy = savingKey !== null;
  const controlsDisabled = !isReady;
  const isSaving = (key: Exclude<SavingKey, null>) => savingKey === key;
  const capabilities = getRoleCapabilities(user?.role);
  const roleLabel = getRoleLabel(user?.role);
  const roleTheme = getRoleTheme(user?.role === 'sales' ? 'sales' : user?.role === 'printer' ? 'printer' : 'default');
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

  if (premium) {
    const avatarRole = user?.role === 'printer' ? 'printer' : 'sales';
    const subtitle = isGuest ? 'Preview — changes are not saved' : 'Account & appearance';

    return (
      <SafeAreaView style={styles.premiumSafe} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.premiumScroll} showsVerticalScrollIndicator={false}>
          {showBack ? (
            <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
              <AppIcon name="ChevronLeft" size={20} color={salesUi.text} />
              <AppText style={styles.backText}>Back</AppText>
            </Pressable>
          ) : null}

          <PrinterScreenHeader title="Settings" sub={subtitle} />

          {isGuest ? (
            <View style={styles.banner}>
              <AppText style={styles.bannerText}>
                Guest mode: explore appearance options. Sign up to save settings to your account.
              </AppText>
            </View>
          ) : null}

          {!isReady ? (
            <View style={styles.banner}>
              <AppText style={styles.bannerText}>Loading your saved preferences…</AppText>
            </View>
          ) : null}

          {message ? (
            <View style={[styles.banner, message.type === 'error' && styles.bannerError]}>
              <AppText style={[styles.bannerText, message.type === 'error' && styles.bannerTextError]}>
                {message.text}
              </AppText>
            </View>
          ) : null}

          <PrinterSurfaceCard style={styles.accountCard}>
            <View style={styles.accountTop}>
              <AppAvatar
                name={user?.displayName ?? 'User'}
                role={avatarRole}
                size={56}
              />
              <View style={styles.accountCopy}>
                <AppText style={styles.accountName}>{user?.displayName ?? 'Guest User'}</AppText>
                <AppText style={styles.accountEmail} numberOfLines={1}>
                  {user?.email ?? 'Not signed in'}
                </AppText>
                <View style={[styles.rolePill, { backgroundColor: `${roleTheme.primary}18` }]}>
                  <AppText style={[styles.rolePillText, { color: roleTheme.primaryDark }]}>
                    {roleLabel}
                  </AppText>
                </View>
              </View>
            </View>
            <PrinterInfoRow icon="ShieldCheck" title="Scope" value={getRoleScopeSummary(user?.role)} />
            <PrinterInfoRow icon="Mail" title="Language" value={languageLabel} />
            <PrinterInfoRow icon="Settings" title="Theme" value={profileThemeLabel} last />
          </PrinterSurfaceCard>

          <View style={styles.sectionLabelWrap}>
            <AppText style={styles.sectionLabel}>Role access</AppText>
          </View>
          <PrinterSurfaceCard>
            {capabilities.map((capability, index) => (
              <View
                key={capability.title}
                style={[styles.capabilityRow, index === capabilities.length - 1 && styles.capabilityRowLast]}
              >
                <View style={[styles.capabilityDot, { backgroundColor: roleTheme.primary }]} />
                <View style={styles.capabilityCopy}>
                  <AppText style={styles.capabilityTitle}>{capability.title}</AppText>
                  <AppText style={styles.capabilityDesc}>{capability.description}</AppText>
                </View>
              </View>
            ))}
          </PrinterSurfaceCard>

          <View style={styles.sectionLabelWrap}>
            <AppText style={styles.sectionLabel}>Preferences</AppText>
          </View>
          <PrinterSurfaceCard style={styles.prefsCard}>
            <View style={styles.prefsInner}>
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
                description="App-wide look for sales, printer, admin, and guest profiles."
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
          </PrinterSurfaceCard>

          <View style={styles.sectionLabelWrap}>
            <AppText style={styles.sectionLabel}>Session</AppText>
          </View>
          <PrinterSurfaceCard>
            <PrinterSettingsRow
              icon="RefreshCw"
              title="Reset local settings"
              subtitle="Restore language, theme, and text color defaults."
              value={savingKey === 'reset' ? 'Resetting...' : 'Reset'}
              onPress={handleReset}
              disabled={isBusy}
            />
            <PrinterSettingsRow
              icon="LogOut"
              title="Sign out"
              subtitle="End the current account session."
              value={savingKey === 'signOut' ? 'Signing out...' : undefined}
              onPress={() => void performSignOut()}
              destructive
              last
              disabled={isBusy}
            />
          </PrinterSurfaceCard>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <ScreenContainer>
      <AppHeader
        title="Settings"
        subtitle={isGuest ? 'Preview — changes are not saved' : 'Account & appearance'}
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
          Loading your saved preferences…
        </AppText>
      ) : null}

      {message ? (
        <View style={[styles.message, { backgroundColor: colors.surfaceSoft }]}>
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
          <View style={[styles.rolePillLegacy, { backgroundColor: colors.primaryDark }]}>
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
            <View key={capability.title} style={styles.capabilityRowLegacy}>
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
  premiumSafe: {
    flex: 1,
    backgroundColor: salesUi.bg,
  },
  premiumScroll: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 120,
    gap: 14,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 15,
    fontWeight: '700',
    color: salesUi.text,
  },
  banner: {
    borderRadius: salesUi.radiusSm,
    backgroundColor: '#EFF6FF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#BFDBFE',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bannerError: {
    backgroundColor: '#FFF1F0',
    borderColor: '#FECACA',
  },
  bannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    lineHeight: 17,
  },
  bannerTextError: {
    color: '#DC2626',
  },
  accountCard: {
    paddingTop: 14,
  },
  accountTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  accountCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  accountName: {
    fontSize: 17,
    fontWeight: '900',
    color: salesUi.text,
  },
  accountEmail: {
    fontSize: 12,
    fontWeight: '600',
    color: salesUi.muted,
  },
  rolePill: {
    alignSelf: 'flex-start',
    marginTop: 4,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  sectionLabelWrap: {
    marginTop: 4,
    paddingHorizontal: 2,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: salesUi.muted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  capabilityRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: salesUi.border,
  },
  capabilityRowLast: {
    borderBottomWidth: 0,
  },
  capabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  capabilityCopy: {
    flex: 1,
    gap: 3,
  },
  capabilityTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: salesUi.text,
  },
  capabilityDesc: {
    fontSize: 12,
    fontWeight: '600',
    color: salesUi.muted,
    lineHeight: 17,
  },
  prefsCard: {
    overflow: 'visible',
  },
  prefsInner: {
    padding: 14,
    gap: 16,
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
  rolePillLegacy: {
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
  capabilityRowLegacy: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  preferencesStack: {
    gap: theme.spacing.md,
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
