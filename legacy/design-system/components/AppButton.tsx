import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { AppText } from '../typography';
import { colors, layout, radius, spacing } from '../tokens';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'disabled';

type AppButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  children?: React.ReactNode;
};

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  children,
}: AppButtonProps) {
  const isDisabled = disabled || loading || variant === 'disabled';

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.primary : colors.white} />
      ) : children ? (
        children
      ) : (
        <AppText
          variant="body"
          style={[
            styles.text,
            variant === 'outline' ? styles.outlineText : styles.solidText,
            isDisabled && styles.disabledText,
            textStyle,
          ]}
        >
          {title}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.buttonHeight,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {},
  solidText: { color: colors.white },
  outlineText: { color: colors.primary },
  disabledText: { color: colors.textMuted },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.88 },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.secondary },
  outline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  disabled: { backgroundColor: colors.border },
});
