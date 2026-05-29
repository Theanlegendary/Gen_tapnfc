import { forwardRef, useState } from 'react';
import { StyleProp, StyleSheet, TextInput, TextInputProps, TextStyle, View } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { RoleThemeKey, theme } from '@/src/constants/theme';
import { usePreferences } from '@/src/hooks/usePreferences';

interface AppInputProps extends Omit<TextInputProps, 'style' | 'role'> {
  label?: string;
  role?: RoleThemeKey;
  style?: StyleProp<TextStyle>;
}

export const AppInput = forwardRef<TextInput, AppInputProps>(function AppInput(
  { label, role: _role = 'default', style, onBlur, onFocus, ...props },
  ref
) {
  void _role;
  const [focused, setFocused] = useState(false);
  const { colors } = usePreferences();
  const fillColor = focused ? colors.surface : colors.surfaceSoft;

  return (
    <View style={styles.container}>
      {label ? (
        <AppText variant="caption" tone="muted">
          {label}
        </AppText>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.primary}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        style={[
          styles.input,
          {
            backgroundColor: fillColor,
            color: colors.typographyColor,
          },
          focused && styles.inputFocused,
          style,
        ]}
        {...props}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xs,
  },
  input: {
    minHeight: 56,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.lg,
    ...theme.typography.variants.body,
  },
  inputFocused: {
    ...theme.shadows.control,
  },
});
