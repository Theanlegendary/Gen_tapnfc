import React from 'react';
import { ViewStyle } from 'react-native';
import { AppCard } from '@/design-system';

interface AppleCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'blur';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  blurIntensity?: number;
}

export default function AppleCard({ children, variant = 'default', style }: AppleCardProps) {
  return (
    <AppCard elevated={variant !== 'default'} style={style}>
      {children}
    </AppCard>
  );
}
