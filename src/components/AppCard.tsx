import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { RoleThemeKey, theme } from '@/src/constants/theme';
import { usePreferences } from '@/src/hooks/usePreferences';

interface AppCardProps {
  role?: RoleThemeKey;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function AppCard({ children, role: _role = 'default', elevated = false, style }: PropsWithChildren<AppCardProps>) {
  void _role;
  const { colors } = usePreferences();
  const backgroundColor = colors.surface;
  return <View style={[styles.card, elevated && styles.elevated, { backgroundColor }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    ...theme.shadows.card,
  },
  elevated: {
    ...theme.shadows.floating,
  },
});
