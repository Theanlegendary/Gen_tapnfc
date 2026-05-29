import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, Text, TextProps, TextStyle } from 'react-native';
import { TextVariant, theme } from '@/src/constants/theme';
import { usePreferences } from '@/src/hooks/usePreferences';

type TextTone = 'primary' | 'muted' | 'inverse';
type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  tone?: TextTone;
  muted?: boolean;
  weight?: TextWeight;
  style?: StyleProp<TextStyle>;
}

const weightStyles: Record<TextWeight, TextStyle> = {
  regular: {
    fontFamily: theme.typography.fontFamilyRegular,
    fontWeight: '400',
  },
  medium: {
    fontFamily: theme.typography.fontFamilyMedium,
    fontWeight: '500',
  },
  semibold: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontWeight: '600',
  },
  bold: {
    fontFamily: theme.typography.fontFamilyBold,
    fontWeight: '700',
  },
};

function inferVariantFromStyle(style: TextStyle | undefined): TextVariant {
  const size = typeof style?.fontSize === 'number' ? style.fontSize : undefined;
  if (!size) return 'body';
  if (size >= 24) return 'h1';
  if (size >= 18) return 'h2';
  if (size <= 12) return 'caption';
  return 'body';
}

function sanitizeTextStyle(style: TextStyle | undefined) {
  if (!style) return undefined;
  const {
    fontFamily,
    fontSize,
    includeFontPadding,
    letterSpacing,
    lineHeight,
    ...layoutAndSemanticStyle
  } = style;

  return layoutAndSemanticStyle;
}

export function AppText({
  children,
  variant,
  tone = 'primary',
  muted = false,
  weight,
  style,
  ...rest
}: PropsWithChildren<AppTextProps>) {
  const { colors } = usePreferences();
  const flattenedStyle = StyleSheet.flatten(style);
  const resolvedVariant = variant ?? inferVariantFromStyle(flattenedStyle);
  const safeStyle = sanitizeTextStyle(flattenedStyle);
  const resolvedTone = muted ? 'muted' : tone;

  const toneStyles: Record<TextTone, TextStyle> = {
    primary: { color: colors.textPrimary },
    muted: { color: colors.textMuted },
    inverse: { color: colors.textInverse },
  };

  return (
    <Text
      style={[
        styles.base,
        theme.typography.variants[resolvedVariant],
        toneStyles[resolvedTone],
        safeStyle,
        weight && weightStyles[weight],
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

export function H1(props: Omit<AppTextProps, 'variant'>) {
  return <AppText {...props} variant="h1" />;
}

export function H2(props: Omit<AppTextProps, 'variant'>) {
  return <AppText {...props} variant="h2" />;
}

export function Body(props: Omit<AppTextProps, 'variant'>) {
  return <AppText {...props} variant="body" />;
}

export function Caption(props: Omit<AppTextProps, 'variant'>) {
  return <AppText {...props} variant="caption" />;
}
