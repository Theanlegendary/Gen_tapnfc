import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { AppText } from '../typography';
import { colors, radius, spacing } from '../tokens';
import { theme } from '@/src/constants/theme';

type AppInputProps = TextInputProps & {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  rightElement?: React.ReactNode;
};

export function AppInput({ label, error, containerStyle, rightElement, style, ...props }: AppInputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <AppText variant="caption" style={styles.label}>{label}</AppText> : null}
      <View>
        <TextInput
          {...props}
          style={[styles.input, rightElement ? styles.withRight : null, style]}
          placeholderTextColor={colors.textMuted}
        />
        {rightElement ? <View style={styles.rightElement}>{rightElement}</View> : null}
      </View>
      {error ? <AppText variant="caption" style={styles.error}>{error}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  label: {
    marginBottom: spacing.xs,
    color: colors.textMuted,
  },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    ...theme.typography.variants.body,
  },
  withRight: { paddingRight: 52 },
  rightElement: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  error: { color: colors.danger, marginTop: spacing.xs },
});
