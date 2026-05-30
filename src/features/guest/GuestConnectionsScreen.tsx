import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/src/components/AppButton';
import { AppEmptyState } from '@/src/components/AppState';
import { AppHeader } from '@/src/components/AppHeader';
import { AppText } from '@/src/components/AppText';
import { iosDesign } from '@/src/design-system/ios';
import { GuestHintBanner, guestUi } from '@/src/features/guest/GuestScreenUi';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';

export function GuestConnectionsScreen() {
  const isGuest = useIsGuest();
  const { requireAccount } = useRequireAccount();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppHeader title="Connections" subtitle="People you met via NFC" />

        <GuestHintBanner>
          <AppText style={styles.hintBody}>
            Connection history will sync from Firebase when someone taps your card or you save a contact.
          </AppText>
        </GuestHintBanner>

        <AppEmptyState
          iconName="Users"
          title="No connections yet"
          description="Sign in and share your NFC profile to start building your network."
        />

        {isGuest ? (
          <AppButton
            label="Sign in to save connections"
            onPress={() =>
              requireAccount(undefined, {
                message: 'Create an account to save contacts and sync your connection history.',
              })
            }
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: guestUi.bg },
  scroll: {
    padding: iosDesign.spacing.md,
    gap: iosDesign.spacing.md,
    paddingBottom: iosDesign.spacing.xxl,
  },
  hintBody: { fontSize: 12, fontWeight: '500', color: guestUi.muted, lineHeight: 17 },
});
