import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { AppAvatar } from '@/src/components/AppAvatar';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { RoleThemeKey, theme } from '@/src/constants/theme';
import { usePreferences } from '@/src/hooks/usePreferences';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  role?: RoleThemeKey;
  showBack?: boolean;
  onBackPress?: () => void;
  actionIcon?: AppIconName;
  onActionPress?: () => void;
  avatarName?: string;
  style?: StyleProp<ViewStyle>;
}

export function AppHeader({
  title,
  subtitle,
  role = 'default',
  showBack = false,
  onBackPress,
  actionIcon,
  onActionPress,
  avatarName,
  style,
}: AppHeaderProps) {
  const { colors } = usePreferences();
  void role;
  const backgroundColor = colors.surfaceGlass;
  const titleColor = colors.typographyColor;
  const subtitleColor = colors.textMuted;

  return (
    <BlurView intensity={18} tint="light" style={[styles.header, { backgroundColor }, style]}>
      {showBack ? (
        <Pressable
          style={({ pressed }) => [
            styles.iconButton,
            { backgroundColor: pressed ? colors.textPrimary : colors.surfaceSoft },
          ]}
          onPress={onBackPress ?? (() => router.back())}
          hitSlop={12}
        >
          {({ pressed }) => (
            <AppIcon name="ChevronLeft" size={22} color={pressed ? colors.textInverse : colors.textPrimary} />
          )}
        </Pressable>
      ) : null}

      <View style={styles.copy}>
        {subtitle ? (
          <AppText variant="caption" weight="medium" style={{ color: subtitleColor }}>
            {subtitle}
          </AppText>
        ) : null}
        <AppText variant="h1" weight="semibold" style={[styles.title, { color: titleColor }]} numberOfLines={1}>
          {title}
        </AppText>
      </View>

      {actionIcon && onActionPress ? (
        <Pressable
          style={({ pressed }) => [
            styles.iconButton,
            { backgroundColor: pressed ? colors.textPrimary : colors.surfaceSoft },
          ]}
          onPress={onActionPress}
          hitSlop={12}
        >
          {({ pressed }) => (
            <AppIcon name={actionIcon} color={pressed ? colors.textInverse : colors.textPrimary} />
          )}
        </Pressable>
      ) : avatarName ? (
        <AppAvatar name={avatarName} role={role} size={44} />
      ) : null}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    overflow: 'hidden',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  title: {
    letterSpacing: 0,
  },
});
