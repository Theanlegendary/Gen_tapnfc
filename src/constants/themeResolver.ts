import type { ProfileTheme, TypographyColorKey, UiPreferences } from '@/src/types/models';
import { theme, type ThemeMode } from '@/src/constants/theme';
import { iosPalette } from '@/src/design-system/ios';

export interface ResolvedAppColors {
  background: string;
  surface: string;
  surfaceSoft: string;
  surfaceGlass: string;
  primary: string;
  primaryDark: string;
  primarySoft: string;
  accent: string;
  textPrimary: string;
  textMuted: string;
  textInverse: string;
  border: string;
  typographyColor: string;
}

interface ProfilePalette {
  primary: string;
  primaryDark: string;
  primarySoft: string;
  accent: string;
  light: { background: string; surface: string; surfaceSoft: string; textPrimary: string; textMuted: string; border: string };
  dark: { background: string; surface: string; surfaceSoft: string; textPrimary: string; textMuted: string; border: string };
}

const profilePalettes: Record<ProfileTheme, ProfilePalette> = {
  aqua: {
    primary: iosPalette.light.primary,
    primaryDark: iosPalette.light.primaryDark,
    primarySoft: iosPalette.light.primarySoft,
    accent: iosPalette.light.primary,
    light: {
      background: iosPalette.light.background,
      surface: iosPalette.light.surface,
      surfaceSoft: iosPalette.light.surfaceSoft,
      textPrimary: iosPalette.light.textPrimary,
      textMuted: iosPalette.light.textSecondary,
      border: iosPalette.light.border,
    },
    dark: {
      background: iosPalette.dark.background,
      surface: iosPalette.dark.surface,
      surfaceSoft: iosPalette.dark.surfaceSoft,
      textPrimary: iosPalette.dark.textPrimary,
      textMuted: iosPalette.dark.textSecondary,
      border: iosPalette.dark.border,
    },
  },
  mono: {
    primary: '#000000',
    primaryDark: '#000000',
    primarySoft: 'rgba(0,0,0,0.08)',
    accent: '#000000',
    light: {
      background: '#F5F5F7',
      surface: '#FFFFFF',
      surfaceSoft: '#F2F2F7',
      textPrimary: '#000000',
      textMuted: '#6E6E73',
      border: 'rgba(60,60,67,0.08)',
    },
    dark: {
      background: '#000000',
      surface: '#0F0F10',
      surfaceSoft: '#171717',
      textPrimary: '#FFFFFF',
      textMuted: '#A1A1AA',
      border: 'rgba(255,255,255,0.07)',
    },
  },
};

export const typographyColorMap: Record<TypographyColorKey, { label: string; color: string }> = {
  deep_teal: { label: 'Default', color: iosPalette.light.textPrimary },
  ocean_blue: { label: 'Ocean Blue', color: '#0C4A6E' },
  forest: { label: 'Forest', color: '#14532D' },
  slate: { label: 'Slate', color: '#334155' },
  indigo: { label: 'Indigo', color: '#3730A3' },
  violet: { label: 'Violet', color: '#5B21B6' },
  rose: { label: 'Rose', color: '#9F1239' },
  amber: { label: 'Amber', color: '#92400E' },
  charcoal: { label: 'Charcoal', color: '#1F2937' },
  midnight: { label: 'Midnight', color: '#0B1220' },
};

export function getTypographyColor(key?: TypographyColorKey): string {
  if (!key) return typographyColorMap.deep_teal.color;
  return typographyColorMap[key]?.color ?? typographyColorMap.deep_teal.color;
}

const typographyColorKeys = Object.keys(typographyColorMap) as TypographyColorKey[];
const profileThemeKeys: ProfileTheme[] = ['aqua', 'mono'];

function resolveColorMode(_raw: Partial<UiPreferences> & Record<string, unknown> | null | undefined): ThemeMode {
  return 'light';
}

function resolveTypographyColor(raw: Partial<UiPreferences> | null | undefined): TypographyColorKey {
  const legacy = raw as (Partial<UiPreferences> & { textColor?: TypographyColorKey }) | null | undefined;
  const key = raw?.typographyColor ?? legacy?.textColor;
  if (key && typographyColorKeys.includes(key as TypographyColorKey)) {
    return key as TypographyColorKey;
  }
  return 'deep_teal';
}

function resolveProfileTheme(raw: Partial<UiPreferences> | null | undefined): ProfileTheme {
  const key = raw?.profileTheme as string | undefined;
  if (key === 'whatsapp') return 'aqua';
  if (key && profileThemeKeys.includes(key as ProfileTheme)) {
    return key as ProfileTheme;
  }
  return mapLegacyProfileTheme(raw?.theme);
}

export function normalizeUiPreferences(raw: Partial<UiPreferences> | null | undefined): UiPreferences {
  const extended = raw as (Partial<UiPreferences> & Record<string, unknown>) | null | undefined;
  const profileTheme = resolveProfileTheme(raw);
  const colorMode = resolveColorMode(extended);
  const typographyColor = resolveTypographyColor(raw);

  return {
    language: raw?.language ?? 'en',
    theme: raw?.theme ?? 'vibrant_pink',
    profileTheme,
    colorMode,
    typographyColor,
  };
}

function mapLegacyProfileTheme(bioTheme?: UiPreferences['theme']): ProfileTheme {
  return 'aqua';
}

export function resolveAppColors(preferences: UiPreferences): ResolvedAppColors {
  const palette = profilePalettes[preferences.profileTheme] ?? profilePalettes.aqua;
  const isDark = preferences.colorMode === 'dark';
  const mode = isDark ? palette.dark : palette.light;
  const brandPrimary = palette.primary;
  const brandPrimaryDark = palette.primaryDark;
  const brandPrimarySoft = palette.primarySoft;
  const typographyColor = mode.textPrimary;

  return {
    background: mode.background,
    surface: mode.surface,
    surfaceSoft: mode.surfaceSoft,
    surfaceGlass: isDark ? 'rgba(15,15,16,0.82)' : iosPalette.light.surfaceGlass,
    primary: brandPrimary,
    primaryDark: brandPrimaryDark,
    primarySoft: brandPrimarySoft,
    accent: palette.accent,
    textPrimary: mode.textPrimary,
    textMuted: mode.textMuted,
    textInverse: theme.colors.textInverse,
    border: mode.border,
    typographyColor,
  };
}

export function getStatusBarStyle(colorMode: ThemeMode): 'light' | 'dark' | 'auto' {
  return colorMode === 'dark' ? 'light' : 'dark';
}
