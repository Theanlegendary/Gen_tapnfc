import React from 'react';
import { FlatList, FlatListProps } from 'react-native';
import { spacing } from '../tokens';

export function AppList<T>(props: FlatListProps<T>) {
  return <FlatList {...props} contentContainerStyle={[{ gap: spacing.md }, props.contentContainerStyle]} />;
}
