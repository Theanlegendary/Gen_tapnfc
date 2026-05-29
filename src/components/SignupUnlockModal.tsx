import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppButton } from '@/src/components/AppButton';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { appRoutes } from '@/src/constants/navigation';
import { theme } from '@/src/constants/theme';

const DEFAULT_TITLE = 'Create your account to unlock your own NFC identity.';
const DEFAULT_MESSAGE =
  'Sign in or register to save profiles, write NFC chips, sync to the cloud, and build your personal identity card.';

interface SignupUnlockModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export function SignupUnlockModal({
  visible,
  onClose,
  title = DEFAULT_TITLE,
  message,
}: SignupUnlockModalProps) {
  const body = message ?? DEFAULT_MESSAGE;
  function goToLogin() {
    onClose();
    router.push(appRoutes.login);
  }

  function goToRegister() {
    onClose();
    router.push('/auth/register');
  }

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.panel} onPress={(event) => event.stopPropagation()}>
          <View style={styles.iconWrap}>
            <AppIcon name="Nfc" size={28} color={theme.colors.primary} />
          </View>
          <AppText variant="h2" weight="bold" style={styles.title}>
            {title}
          </AppText>
          <AppText variant="body" tone="muted" style={styles.message}>
            {body}
          </AppText>
          <View style={styles.actions}>
            <AppButton label="Sign In" onPress={goToLogin} />
            <AppButton label="Create Account" variant="secondary" onPress={goToRegister} />
            <AppButton label="Continue Exploring" variant="ghost" onPress={onClose} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(17,24,39,0.45)',
    padding: theme.spacing.lg,
  },
  panel: {
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
    ...theme.shadows.floating,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
  actions: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
});
