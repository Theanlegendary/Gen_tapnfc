import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { AppIcon, AppIconName } from '../Icon';
import { AppText } from '../typography';
import { colors, spacing } from '../tokens';

type HeaderProps = {
  title: string;
  onBack?: () => void;
  rightIcon?: AppIconName;
  onRightPress?: () => void;
};

export function AppHeader({ title, onBack, rightIcon, onRightPress }: HeaderProps) {
  return (
    <View style={styles.row}>
      <Pressable onPress={onBack} style={styles.iconBtn}>
        {onBack ? <AppIcon name="ChevronLeft" /> : <View style={styles.placeholder} />}
      </Pressable>
      <AppText variant="h2" style={styles.title}>{title}</AppText>
      <Pressable onPress={onRightPress} style={styles.iconBtn}>
        {rightIcon ? <AppIcon name={rightIcon} /> : <View style={styles.placeholder} />}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  placeholder: { width: 22, height: 22 },
  title: { flex: 1, textAlign: 'center', marginHorizontal: spacing.sm },
});
