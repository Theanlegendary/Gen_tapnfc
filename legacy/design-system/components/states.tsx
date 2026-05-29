import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppIcon } from '../Icon';
import { AppText } from '../typography';
import { colors, spacing } from '../tokens';

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="small" color={colors.primary} />
      <AppText muted>{label}</AppText>
    </View>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <View style={styles.center}>
      <AppIcon name="Info" color={colors.textMuted} />
      <AppText variant="h2">{title}</AppText>
      <AppText muted>{message}</AppText>
    </View>
  );
}

export function ErrorState({ title = 'Something went wrong', message }: { title?: string; message: string }) {
  return (
    <View style={styles.center}>
      <AppIcon name="TriangleAlert" color={colors.danger} />
      <AppText variant="h2">{title}</AppText>
      <AppText muted>{message}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.xxxl },
});
