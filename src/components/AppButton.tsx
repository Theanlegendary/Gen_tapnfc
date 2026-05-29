import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Platform, Pressable, PressableProps, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { getRoleTheme, RoleThemeKey, theme } from '@/src/constants/theme';
import { iosDesign } from '@/src/design-system/ios';
import { usePreferences } from '@/src/hooks/usePreferences';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'disabled';

interface AppButtonProps extends Omit<PressableProps, 'style' | 'role'> {
  label: string;
  loading?: boolean;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  iconName?: AppIconName;
  iconPosition?: 'left' | 'right';
  role?: RoleThemeKey;
  style?: StyleProp<ViewStyle>;
}

export function AppButton({
  label,
  loading = false,
  variant = 'primary',
  fullWidth = true,
  iconName,
  iconPosition = 'left',
  role: _role = 'default',
  disabled,
  style,
  onPress,
  ...rest
}: AppButtonProps) {
  void getRoleTheme(_role);
  const { colors } = usePreferences();
  const isDisabled = disabled || loading || variant === 'disabled';
  const resolvedVariant = isDisabled && !loading ? 'disabled' : variant;

  const variantStyle: Record<ButtonVariant, ViewStyle> = {
    primary: {
      backgroundColor: theme.colors.charcoal,
      ...theme.shadows.control,
    },
    secondary: {
      backgroundColor: colors.surfaceSoft,
    },
    outline: {
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    disabled: {
      backgroundColor: colors.surfaceSoft,
    },
  };

  const labelColor =
    resolvedVariant === 'primary'
      ? theme.colors.textInverse
      : resolvedVariant === 'disabled'
        ? colors.textMuted
        : colors.textPrimary;

  const iconColor = resolvedVariant === 'primary' ? theme.colors.textInverse : colors.textPrimary;

  return (
    <Pressable
      disabled={isDisabled}
      accessibilityRole="button"
      onPress={(event) => {
        if (!isDisabled && Platform.OS === 'ios') {
          void Haptics.selectionAsync();
        }
        onPress?.(event);
      }}
      style={({ pressed }) => [
        styles.button,
        variantStyle[resolvedVariant],
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} />
      ) : (
        <View style={[styles.content, iconPosition === 'right' && styles.contentReverse]}>
          {iconName ? <AppIcon name={iconName} size={18} color={iconColor} /> : null}
          <AppText variant="body" weight="semibold" style={{ color: labelColor }}>
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  contentReverse: {
    flexDirection: 'row-reverse',
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: iosDesign.animation.softPressScale }],
  },
  disabled: {
    opacity: 0.5,
  },
});
