import { Image, ImageSourcePropType, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { getRoleTheme, RoleThemeKey, theme } from '@/src/constants/theme';

interface AppAvatarProps {
  name?: string;
  source?: ImageSourcePropType;
  iconName?: AppIconName;
  role?: RoleThemeKey;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function AppAvatar({
  name,
  source,
  iconName,
  role = 'default',
  size = 44,
  style,
}: AppAvatarProps) {
  const roleTheme = getRoleTheme(role);
  const initial = (name?.trim() || 'U').charAt(0).toUpperCase();
  const avatarSize = Math.max(32, Math.min(72, size));

  return (
    <View
      style={[
        styles.avatar,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
          backgroundColor: roleTheme.primary,
        },
        style,
      ]}
    >
      {source ? (
        <Image source={source} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      ) : iconName ? (
        <AppIcon name={iconName} color={theme.colors.textInverse} size={avatarSize >= 48 ? 24 : 22} />
      ) : (
        <AppText variant="body" tone="inverse" weight="bold" style={styles.initial}>
          {initial}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...theme.shadows.control,
  },
  initial: {
    textAlign: 'center',
  },
});
