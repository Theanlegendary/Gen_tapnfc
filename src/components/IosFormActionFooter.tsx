import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { theme } from '@/src/constants/theme';
import { iosDesign } from '@/src/design-system/ios';

const IOS_BLUE = theme.colors.primary;

export interface IosFormActionFooterProps {
  secondaryLabel: string;
  onSecondaryPress: () => void;
  primaryLabel: string;
  onPrimaryPress: () => void;
  secondaryIcon?: AppIconName;
  primaryIcon?: AppIconName;
  loading?: boolean;
  disabled?: boolean;
  /** When true, only renders the button row (parent supplies footer chrome / safe area). */
  embedded?: boolean;
  /** Stack buttons vertically (e.g. narrow layouts). */
  stacked?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function IosFormActionFooter({
  secondaryLabel,
  onSecondaryPress,
  primaryLabel,
  onPrimaryPress,
  secondaryIcon = 'RotateCcw',
  primaryIcon = 'ShieldCheck',
  loading = false,
  disabled = false,
  embedded = false,
  stacked = false,
  style,
}: IosFormActionFooterProps) {
  const insets = useSafeAreaInsets();
  const isDisabled = disabled || loading;

  const row = (
    <View style={[styles.row, stacked && styles.rowStacked, style]}>
      <Pressable
        accessibilityRole="button"
        onPress={onSecondaryPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.secondary,
          stacked && styles.fullWidth,
          isDisabled && styles.disabled,
          pressed && !isDisabled && styles.pressed,
        ]}
      >
        <AppIcon name={secondaryIcon} size={17} color={theme.colors.textPrimary} />
        <AppText style={styles.secondaryText} weight="semibold">
          {secondaryLabel}
        </AppText>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={onPrimaryPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.primary,
          stacked && styles.fullWidth,
          isDisabled && styles.disabled,
          pressed && !isDisabled && styles.pressed,
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <AppIcon name={primaryIcon} size={17} color="#fff" />
            <AppText style={styles.primaryText} weight="semibold">
              {primaryLabel}
            </AppText>
          </>
        )}
      </Pressable>
    </View>
  );

  if (embedded) {
    return row;
  }

  return (
    <View
      style={[
        styles.footer,
        { paddingBottom: Math.max(insets.bottom, iosDesign.spacing.sm) + iosDesign.spacing.xs },
      ]}
    >
      {row}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: iosDesign.spacing.md,
    paddingTop: iosDesign.spacing.sm + 2,
    backgroundColor: theme.colors.surface,
    ...iosDesign.shadows.control,
    shadowOffset: { width: 0, height: -2 },
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: iosDesign.spacing.sm,
  },
  rowStacked: {
    flexDirection: 'column',
  },
  fullWidth: {
    flex: 0,
    width: '100%',
  },
  secondary: {
    minHeight: 48,
    borderRadius: iosDesign.radius.sm,
    paddingHorizontal: iosDesign.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: theme.colors.surfaceSoft,
  },
  secondaryText: {
    color: theme.colors.textPrimary,
    fontSize: 17,
  },
  primary: {
    flex: 1,
    minHeight: 48,
    borderRadius: iosDesign.radius.sm,
    paddingHorizontal: iosDesign.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: IOS_BLUE,
  },
  primaryText: {
    color: '#fff',
    fontSize: 17,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: iosDesign.animation.softPressScale }],
  },
  disabled: {
    opacity: 0.5,
  },
});
