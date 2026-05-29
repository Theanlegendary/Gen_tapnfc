import React from 'react';
import { TextInputProps, ViewStyle } from 'react-native';
import { AppInput } from '@/design-system';

interface AppleTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  variant?: 'default' | 'rounded' | 'minimal';
  size?: 'small' | 'medium' | 'large';
  containerStyle?: ViewStyle;
  rightElement?: React.ReactNode;
}

export default function AppleTextInput({
  label,
  error,
  containerStyle,
  rightElement,
  ...props
}: AppleTextInputProps) {
  return (
    <AppInput
      label={label}
      error={error}
      containerStyle={containerStyle}
      rightElement={rightElement}
      {...props}
    />
  );
}
