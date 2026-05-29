import { PropsWithChildren } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { AppButton } from '@/src/components/AppButton';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { RoleThemeKey, theme } from '@/src/constants/theme';
import { usePreferences } from '@/src/hooks/usePreferences';

interface AppModalProps {
  visible: boolean;
  title: string;
  description?: string;
  role?: RoleThemeKey;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onClose: () => void;
}

export function AppModal({
  visible,
  title,
  description,
  role = 'default',
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
  children,
}: PropsWithChildren<AppModalProps>) {
  const { colors } = usePreferences();

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.panel} onPress={(event) => event.stopPropagation()}>
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: colors.surfaceSoft }]}>
              <AppIcon name="Info" color={colors.textPrimary} />
            </View>
            <Pressable style={styles.closeButton} onPress={onClose} hitSlop={12}>
              <AppIcon name="X" color={theme.colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.copy}>
            <AppText variant="h2" weight="bold">
              {title}
            </AppText>
            {description ? (
              <AppText variant="body" tone="muted">
                {description}
              </AppText>
            ) : null}
          </View>

          {children ? <View style={styles.content}>{children}</View> : null}

          <View style={styles.actions}>
            <AppButton label={cancelLabel} variant="outline" role={role} fullWidth={false} style={styles.action} onPress={onClose} />
            {confirmLabel && onConfirm ? (
              <AppButton label={confirmLabel} role={role} fullWidth={false} style={styles.action} onPress={onConfirm} />
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(17,24,39,0.22)',
    padding: theme.spacing.md,
  },
  panel: {
    width: '100%',
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
    ...theme.shadows.floating,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceSoft,
  },
  copy: {
    gap: theme.spacing.xs,
  },
  content: {
    gap: theme.spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  action: {
    flex: 1,
  },
});
