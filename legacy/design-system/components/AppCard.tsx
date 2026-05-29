import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { colors, radius, shadows, spacing } from '../tokens';

type AppCardProps = ViewProps & {
  elevated?: boolean;
};

export function AppCard({ style, elevated = false, ...props }: AppCardProps) {
  return <View {...props} style={[styles.base, elevated ? styles.elevated : null, style]} />;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  elevated: {
    ...shadows.md,
  },
});
