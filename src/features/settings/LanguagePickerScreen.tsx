import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppCard } from '@/src/components/AppCard';
import { AppHeader } from '@/src/components/AppHeader';
import { AppIcon } from '@/src/components/AppIcon';
import { AppSelect } from '@/src/components/AppSelect';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { AppText } from '@/src/components/AppText';
import { languageOptions } from '@/src/constants/options';
import { theme } from '@/src/constants/theme';
import { salesUi } from '@/src/features/sales/components/SalesScreenUi';
import { PrinterScreenHeader, PrinterSurfaceCard } from '@/src/features/printer/components/PrinterScreenUi';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useAuth } from '@/src/hooks/useAuth';

export function LanguagePickerScreen() {
  const { user } = useAuth();
  const { preferences, updatePreferences, isReady } = useAppTheme();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showBack = router.canGoBack();
  const premium = user?.role === 'sales' || user?.role === 'printer';

  async function handleLanguageChange(value: string) {
    if (!isReady || saving) return;
    setSaving(true);
    setError(null);
    try {
      await updatePreferences({ language: value });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save language.');
    } finally {
      setSaving(false);
    }
  }

  if (premium) {
    return (
      <SafeAreaView style={styles.premiumSafe} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.premiumScroll} showsVerticalScrollIndicator={false}>
          {showBack ? (
            <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
              <AppIcon name="ChevronLeft" size={20} color={salesUi.text} />
              <AppText style={styles.backText}>Back</AppText>
            </Pressable>
          ) : null}

          <PrinterScreenHeader title="Language" sub="Display language" />

          <AppText style={styles.hint}>
            Choose your preferred display language. Your choice is saved automatically.
          </AppText>

          {error ? (
            <View style={[styles.banner, styles.bannerError]}>
              <AppText style={[styles.bannerText, styles.bannerTextError]}>{error}</AppText>
            </View>
          ) : null}

          <PrinterSurfaceCard style={styles.card}>
            <View style={styles.cardInner}>
              <AppSelect
                label="Language"
                value={preferences.language}
                options={languageOptions.map((option) => ({
                  label: option.label,
                  value: option.value,
                }))}
                disabled={!isReady || saving}
                onChange={(value) => void handleLanguageChange(value)}
              />
            </View>
          </PrinterSurfaceCard>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <ScreenContainer>
      <AppHeader title="Language" subtitle="Display language" showBack={showBack} />
      <AppText variant="body" tone="muted">
        Choose your preferred display language. Your choice is saved automatically.
      </AppText>

      {error ? (
        <AppText variant="caption" style={styles.error}>
          {error}
        </AppText>
      ) : null}

      <AppCard>
        <AppSelect
          label="Language"
          value={preferences.language}
          options={languageOptions.map((option) => ({
            label: option.label,
            value: option.value,
          }))}
          disabled={!isReady || saving}
          onChange={(value) => void handleLanguageChange(value)}
        />
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
  hint: {
    fontSize: 13,
    fontWeight: '600',
    color: salesUi.muted,
    lineHeight: 18,
  },
  banner: {
    borderRadius: salesUi.radiusSm,
    backgroundColor: '#FFF1F0',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#FECACA',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bannerError: {},
  bannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  bannerTextError: {
    color: '#DC2626',
  },
  card: {
    overflow: 'visible',
  },
  cardInner: {
    padding: 14,
  },
  error: {
    color: theme.colors.danger,
    fontWeight: '700',
  },
});
