import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/src/components/AppButton';
import { AppHeader } from '@/src/components/AppHeader';
import { AppText } from '@/src/components/AppText';
import { appRoutes } from '@/src/constants/navigation';
import { guestUi } from '@/src/features/guest/GuestScreenUi';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';

/** Checkout requires a real account — routes to payment + Firebase order creation. */
export function GuestCheckoutScreen() {
  const { user, isLoading } = useAuth();
  const isGuest = useIsGuest();
  const { requireAccount } = useRequireAccount();

  useEffect(() => {
    if (isLoading || isGuest || !user) return;
    router.replace(appRoutes.guestPostLoginChoice);
  }, [isLoading, isGuest, user]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={guestUi.accent} />
      </SafeAreaView>
    );
  }

  if (isGuest || !user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.body}>
          <AppHeader title="Checkout" subtitle="Sign in to place your order" showBack />
          <AppText style={styles.copy}>
            Your card design is saved on this device. Sign in or create an account to pay and create a real order in
            Firebase.
          </AppText>
          <AppButton
            label="Sign in to checkout"
            onPress={() =>
              requireAccount(() => router.push(appRoutes.guestPostLoginChoice), {
                message: 'Sign in to complete payment and create your order.',
              })
            }
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ActivityIndicator color={guestUi.accent} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: guestUi.bg, justifyContent: 'center' },
  body: { flex: 1, padding: 20, gap: 16 },
  copy: { fontSize: 14, fontWeight: '500', color: guestUi.muted, lineHeight: 20 },
});
