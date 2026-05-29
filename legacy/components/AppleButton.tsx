import React from 'react';
import { TextStyle, ViewStyle } from 'react-native';
import { AppButton } from '@/design-system';

interface AppleButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive' | 'plain';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  children?: React.ReactNode;
}

export default function AppleButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  children,
}: AppleButtonProps) {
  const mappedVariant =
    variant === 'primary'
      ? 'primary'
      : variant === 'secondary'
      ? 'secondary'
      : variant === 'plain'
      ? 'outline'
      : 'disabled';

  return (
    <AppButton
      title={title}
      onPress={onPress}
      variant={mappedVariant}
      disabled={disabled}
      loading={loading}
      style={style}
      textStyle={textStyle}
    >
      {children}
    </AppButton>
  );
}
