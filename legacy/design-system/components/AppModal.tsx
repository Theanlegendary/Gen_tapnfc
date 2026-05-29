import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { AppCard } from './AppCard';
import { AppText } from '../typography';
import { colors } from '../tokens';

type AppModalProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function AppModal({ visible, title, onClose, children }: AppModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <AppCard style={styles.card} elevated>
          <AppText variant="h2">{title}</AppText>
          {children}
          <Pressable onPress={onClose} style={styles.close}>
            <AppText>Close</AppText>
          </Pressable>
        </AppCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#00000066', alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { width: '100%', maxWidth: 420, gap: 12 },
  close: { alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 10, backgroundColor: colors.background, borderRadius: 8 },
});
