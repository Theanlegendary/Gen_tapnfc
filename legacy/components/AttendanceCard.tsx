import React from 'react';
import { AppText } from '@/src/components/AppText';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

interface AttendanceCardProps {
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
}

export default function AttendanceCard({ title, icon, onPress }: AttendanceCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        {icon}
      </View>
      <AppText style={styles.title}>{title}</AppText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '47%',
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    marginBottom: 8,
  },
  title: {
    color: '#1d4ed8',
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
});
