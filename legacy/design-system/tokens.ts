export const colors = {
  primary: '#C8102E',
  secondary: '#0C3B8E',
  background: '#F7F0E6',
  surface: '#FFF8EE',
  border: '#E3D4BC',
  textPrimary: '#1F2A37',
  textMuted: '#6B7280',
  success: '#10B981',
  warning: '#D4A017',
  danger: '#EF4444',
  info: '#0C3B8E',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const icon = {
  size: 22,
  strokeWidth: 2.25,
} as const;

export const layout = {
  screenPadding: spacing.lg,
  sectionGap: spacing.lg,
  contentMaxWidth: 960,
  buttonHeight: 48,
} as const;

export const shadows = {
  sm: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
} as const;
