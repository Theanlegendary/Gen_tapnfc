import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { theme } from '@/src/constants/theme';

export type BadgeTone = 'success' | 'active' | 'warning' | 'error' | 'info' | 'pending' | 'neutral' | 'role';

interface AppBadgeProps {
  label?: string;
  tone?: BadgeTone;
  role?: string;
  style?: StyleProp<ViewStyle>;
}

function resolveTone(tone: BadgeTone): keyof typeof theme.statusTint {
  if (tone === 'role') return 'neutral';
  if (tone === 'info') return 'active';
  return tone;
}

function resolveColors(tone: BadgeTone) {
  const key = resolveTone(tone);
  return {
    backgroundColor: theme.statusTint[key],
    color: theme.statusText[key],
  };
}

export function AppBadge({
  label,
  tone = 'neutral',
  style,
  children,
}: PropsWithChildren<AppBadgeProps>) {
  const colors = resolveColors(tone);

  return (
    <View style={[styles.badge, { backgroundColor: colors.backgroundColor }, style]}>
      <AppText variant="caption" weight="medium" style={[styles.label, { color: colors.color }]}>
        {label ?? children}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    minHeight: 24,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    textTransform: 'capitalize',
    letterSpacing: 0,
  },
});
