import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { AppleColors } from '@/styles/globalStyles';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  style?: any;
}

export default function LoadingSpinner({ 
  size = 'large', 
  color = AppleColors.systemBlue,
  style 
}: LoadingSpinnerProps) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});