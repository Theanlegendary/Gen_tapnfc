import { Platform, TextStyle, ViewStyle } from 'react-native';

export const iosFonts = {
  regular: 'MavenPro_400Regular',
  medium: 'MavenPro_500Medium',
  semibold: 'MavenPro_600SemiBold',
  bold: 'MavenPro_700Bold',
} as const;

/** Apple-style premium operational palette */
export const premiumPalette = {
  background: '#F5F5F7',
  surface: '#FFFFFF',
  surfaceSoft: '#F2F2F7',
  surfaceGlass: 'rgba(255,255,255,0.82)',
  textPrimary: '#111111',
  textSecondary: '#6E6E73',
  iconInactive: '#AEAEB2',
  border: '#E5E5EA',
  accent: '#30D158',
  accentDark: '#28B84C',
  accentSoft: 'rgba(48,209,88,0.12)',
  charcoal: '#1C1C1E',
  charcoalSoft: 'rgba(28,28,30,0.08)',
} as const;

export const iosPalette = {
  light: {
    background: premiumPalette.background,
    surface: premiumPalette.surface,
    surfaceSoft: premiumPalette.surfaceSoft,
    surfaceGlass: premiumPalette.surfaceGlass,
    primary: premiumPalette.accent,
    primaryDark: premiumPalette.accentDark,
    primarySoft: premiumPalette.accentSoft,
    textPrimary: premiumPalette.textPrimary,
    textSecondary: premiumPalette.textSecondary,
    border: premiumPalette.border,
    iconInactive: premiumPalette.iconInactive,
    charcoal: premiumPalette.charcoal,
  },
  dark: {
    background: '#000000',
    surface: '#1C1C1E',
    surfaceSoft: '#2C2C2E',
    surfaceGlass: 'rgba(28,28,30,0.92)',
    primary: premiumPalette.accent,
    primaryDark: '#5FE38D',
    primarySoft: 'rgba(48,209,88,0.18)',
    textPrimary: '#F5F5F7',
    textSecondary: '#AEAEB2',
    border: 'rgba(255,255,255,0.08)',
    iconInactive: '#8E8E93',
    charcoal: '#F5F5F7',
  },
} as const;

export const iosTypography = {
  h1: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: iosFonts.semibold,
    fontWeight: '600',
    letterSpacing: -0.4,
  } satisfies TextStyle,
  h2: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: iosFonts.semibold,
    fontWeight: '600',
    letterSpacing: -0.2,
  } satisfies TextStyle,
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: iosFonts.regular,
    fontWeight: '400',
    letterSpacing: 0,
  } satisfies TextStyle,
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: iosFonts.regular,
    fontWeight: '400',
    letterSpacing: 0,
  } satisfies TextStyle,
} as const;

export const iosDesign = {
  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 28,
    xxl: 36,
  },
  radius: {
    sm: 10,
    md: 14,
    lg: 18,
    xl: 22,
    pill: 999,
  },
  hitTarget: 44,
  shadows: {
    card: {
      shadowColor: '#1C1C1E',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: Platform.select({ ios: 0.04, android: 0.05, default: 0.04 }),
      shadowRadius: 8,
      elevation: 1,
    } satisfies ViewStyle,
    floating: {
      shadowColor: '#1C1C1E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: Platform.select({ ios: 0.06, android: 0.07, default: 0.06 }),
      shadowRadius: 12,
      elevation: 2,
    } satisfies ViewStyle,
    control: {
      shadowColor: '#1C1C1E',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: Platform.select({ ios: 0.03, android: 0.04, default: 0.03 }),
      shadowRadius: 4,
      elevation: 0,
    } satisfies ViewStyle,
  },
  animation: {
    pressScale: 0.98,
    softPressScale: 0.99,
    duration: {
      fast: 160,
      base: 240,
      slow: 360,
    },
  },
} as const;

export const rolePalettes = {
  default: {
    primary: premiumPalette.accent,
    primaryDark: premiumPalette.accentDark,
    soft: premiumPalette.accentSoft,
    surfaceTint: premiumPalette.charcoalSoft,
  },
  sales: {
    primary: premiumPalette.accent,
    primaryDark: premiumPalette.accentDark,
    soft: premiumPalette.accentSoft,
    surfaceTint: premiumPalette.charcoalSoft,
  },
  printer: {
    primary: premiumPalette.accent,
    primaryDark: premiumPalette.accentDark,
    soft: premiumPalette.accentSoft,
    surfaceTint: premiumPalette.charcoalSoft,
  },
  admin: {
    primary: premiumPalette.accent,
    primaryDark: premiumPalette.accentDark,
    soft: premiumPalette.accentSoft,
    surfaceTint: premiumPalette.charcoalSoft,
  },
} as const;
