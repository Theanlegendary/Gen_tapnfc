import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { getRoleTheme, RoleThemeKey, theme } from '@/src/constants/theme';
import { usePreferences } from '@/src/hooks/usePreferences';

interface AppStateProps {
  title: string;
  description?: string;
  iconName?: AppIconName;
  role?: RoleThemeKey;
}

export function AppLoadingState({ title = 'Loading...', role = 'default' }: Partial<AppStateProps>) {
  const roleTheme = getRoleTheme(role);
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={roleTheme.primary} />
      <AppText variant="body" tone="muted" style={styles.centerText}>
        {title}
      </AppText>
    </View>
  );
}

export function AppEmptyState({ title, description, iconName = 'ClipboardList' }: AppStateProps) {
  const { colors } = usePreferences();
  return (
    <View style={styles.wrap}>
      <View style={[styles.iconWrap, { backgroundColor: colors.surfaceSoft }]}>
        <AppIcon name={iconName} color={colors.textMuted} />
      </View>
      <AppText variant="body" weight="semibold" style={styles.centerText}>
        {title}
      </AppText>
      {description ? (
        <AppText variant="caption" tone="muted" style={styles.centerText}>
          {description}
        </AppText>
      ) : null}
    </View>
  );
}

export function AppErrorState({ title, description, iconName = 'TriangleAlert' }: AppStateProps) {
  const { colors } = usePreferences();
  return (
    <View style={styles.wrap}>
      <View style={[styles.iconWrap, { backgroundColor: colors.surfaceSoft }]}>
        <AppIcon name={iconName} color={theme.colors.danger} />
      </View>
      <AppText variant="body" weight="semibold" style={styles.centerText}>
        {title}
      </AppText>
      {description ? (
        <AppText variant="caption" tone="muted" style={styles.centerText}>
          {description}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    padding: theme.spacing.xl,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceSoft,
    ...theme.shadows.control,
  },
  centerText: {
    textAlign: 'center',
  },
});
