import { PropsWithChildren, ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { iosDesign, iosPalette } from '@/src/design-system/ios';
import { theme } from '@/src/constants/theme';

export const AUTH_BG = iosPalette.light.surfaceSoft;
export const AUTH_BLUE = iosPalette.light.primary;
const FIELD_HEIGHT = 50;
const PRIMARY_HEIGHT = 50;

interface AuthScreenShellProps extends PropsWithChildren {
  footer?: ReactNode;
}

export function AuthScreenShell({ children, footer }: AuthScreenShellProps) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 4 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces
        >
          {children}
        </ScrollView>
        {footer}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.mark}>
        <AppIcon name="Nfc" size={22} color={AUTH_BLUE} />
      </View>
      <AppText style={styles.brand}>SITEHUB</AppText>
      <AppText style={styles.title}>{title}</AppText>
      {subtitle ? (
        <AppText style={styles.subtitle}>{subtitle}</AppText>
      ) : null}
    </View>
  );
}

interface AuthSectionLabelProps {
  children: string;
}

export function AuthSectionLabel({ children }: AuthSectionLabelProps) {
  return <AppText style={styles.sectionLabel}>{children}</AppText>;
}

export function AuthFormGroup({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.group, style]}>{children}</View>;
}

interface AuthTextFieldProps extends TextInputProps {
  isLast?: boolean;
  trailing?: ReactNode;
}

export function AuthTextField({ isLast = false, trailing, style, ...rest }: AuthTextFieldProps) {
  return (
    <View style={styles.fieldRow}>
      <TextInput
        style={[styles.fieldInput, style]}
        placeholderTextColor={iosPalette.light.textSecondary}
        {...rest}
      />
      {trailing}
      {!isLast ? <View style={styles.fieldSeparator} /> : null}
    </View>
  );
}

interface AuthPrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function AuthPrimaryButton({ label, onPress, loading, disabled }: AuthPrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.primaryBtn,
        isDisabled && styles.btnDisabled,
        pressed && !isDisabled && styles.btnPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <AppText style={styles.primaryBtnText} weight="semibold">
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

interface AuthTextButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function AuthTextButton({ label, onPress, loading, disabled }: AuthTextButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [styles.textBtn, pressed && !isDisabled && styles.btnPressed]}
    >
      <AppText style={[styles.textBtnLabel, isDisabled && styles.textBtnDisabled]} weight="medium">
        {label}
      </AppText>
    </Pressable>
  );
}

interface AuthOrDividerProps {
  label?: string;
}

export function AuthOrDivider({ label = 'or' }: AuthOrDividerProps) {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <AppText style={styles.dividerText}>{label}</AppText>
      <View style={styles.dividerLine} />
    </View>
  );
}

interface AuthFooterLinkProps {
  prompt: string;
  action: string;
  onPress: () => void;
  disabled?: boolean;
}

export function AuthFooterLink({ prompt, action, onPress, disabled }: AuthFooterLinkProps) {
  return (
    <View style={styles.footerRow}>
      <AppText style={styles.footerPrompt}>{prompt}</AppText>
      <Pressable onPress={onPress} disabled={disabled} hitSlop={8}>
        <AppText style={styles.footerAction} weight="semibold">
          {action}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: AUTH_BG,
  },
  kav: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: iosDesign.spacing.lg,
    paddingTop: iosDesign.spacing.md,
    paddingBottom: iosDesign.spacing.xl,
    gap: iosDesign.spacing.md,
  },
  header: {
    alignItems: 'center',
    gap: 6,
    paddingTop: iosDesign.spacing.sm,
    paddingBottom: iosDesign.spacing.xs,
  },
  mark: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: iosPalette.light.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  brand: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: iosPalette.light.textSecondary,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: iosPalette.light.textPrimary,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    color: iosPalette.light.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: iosPalette.light.textSecondary,
    letterSpacing: 0.3,
    marginLeft: 4,
    marginBottom: -4,
  },
  group: {
    backgroundColor: iosPalette.light.surface,
    borderRadius: iosDesign.radius.lg,
    overflow: 'hidden',
    ...theme.shadows.control,
    shadowOpacity: 0.04,
  },
  fieldRow: {
    position: 'relative',
    minHeight: FIELD_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: iosDesign.spacing.md,
  },
  fieldInput: {
    flex: 1,
    fontSize: 17,
    color: iosPalette.light.textPrimary,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
  },
  fieldSeparator: {
    position: 'absolute',
    left: iosDesign.spacing.md,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
  },
  primaryBtn: {
    minHeight: PRIMARY_HEIGHT,
    borderRadius: iosDesign.radius.sm,
    backgroundColor: AUTH_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: iosDesign.spacing.lg,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
  },
  textBtn: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: iosDesign.spacing.xs,
  },
  textBtnLabel: {
    fontSize: 17,
    color: AUTH_BLUE,
  },
  textBtnDisabled: {
    opacity: 0.45,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnPressed: {
    opacity: 0.82,
    transform: [{ scale: iosDesign.animation.softPressScale }],
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosDesign.spacing.sm,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    fontSize: 13,
    color: iosPalette.light.textSecondary,
    textTransform: 'lowercase',
  },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: iosDesign.spacing.xs,
  },
  footerPrompt: {
    fontSize: 15,
    color: iosPalette.light.textSecondary,
  },
  footerAction: {
    fontSize: 15,
    color: AUTH_BLUE,
  },
});
