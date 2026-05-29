import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { AppButton } from '@/src/components/AppButton';
import { AppCard } from '@/src/components/AppCard';
import { FloatingNfcCard } from '@/src/components/FloatingNfcCard';
import { AppInput } from '@/src/components/AppInput';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { AppText } from '@/src/components/AppText';
import { theme } from '@/src/constants/theme';
import { useAuth } from '@/src/hooks/useAuth';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
// Fix: use saveNfcWrite instead of removed activateNfcCard/linkCardToBio
import { saveNfcWrite, updateNfcStatus } from '@/src/services/firestoreService';

export function ActivateCardScreen() {
  const { user } = useAuth();
  const { requireAccount } = useRequireAccount();
  const [cardCode, setCardCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleActivate() {
    if (!user) return;
    if (!requireAccount(undefined, { message: 'Create an account to activate and link NFC cards.' })) {
      return;
    }
    if (!cardCode.trim()) {
      Alert.alert('Card code required', 'Enter the activation code from your card or receipt.');
      return;
    }

    setIsSaving(true);
    try {
      const profileUrl = `https://biocloud.app/c/${cardCode.trim()}`;
      await saveNfcWrite({
        chipUID: cardCode.trim(),
        profileUrl,
        orderId: '',
        cardCode: cardCode.trim(),
        writtenBy: user.id,
      });
      await updateNfcStatus(cardCode.trim(), 'verified');
      Alert.alert('Card activated ✅', 'Your NFC card is now linked to your account.');
      setCardCode('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to activate card.';
      Alert.alert('Activation failed', message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScreenContainer>
      <AppText variant="h1">Activate Card</AppText>
      <AppText variant="body" tone="muted">
        Link your physical NFC access card to your public identity profile.
      </AppText>

      <FloatingNfcCard
        name={cardCode.trim() || user?.displayName || 'ID.NTITY'}
        subtitle={cardCode.trim() ? 'Ready to verify activation code' : 'Secure NFC access card'}
      />

      <AppCard style={styles.card}>
        <View style={styles.form}>
          <AppInput label="Card code" value={cardCode} onChangeText={setCardCode} placeholder="NFC-8922-1A2B" />
          <AppButton label="Activate Card" iconName="Nfc" loading={isSaving} onPress={handleActivate} />
          <AppText variant="caption" tone="muted">
            The card is verified, linked, and locked to your profile after activation.
          </AppText>
        </View>
      </AppCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.md,
  },
  form: {
    gap: theme.spacing.sm,
  },
});
