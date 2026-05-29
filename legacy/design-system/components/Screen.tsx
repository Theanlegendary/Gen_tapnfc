import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View, ViewProps } from 'react-native';
import { colors, layout, spacing } from '../tokens';

export function Screen({ style, children, ...props }: ViewProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View {...props} style={[styles.container, style]}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxxl },
  container: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    gap: layout.sectionGap,
  },
});
