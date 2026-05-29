import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { AppButton } from '@/src/components/AppButton';
import { AppCard } from '@/src/components/AppCard';
import { AppInput } from '@/src/components/AppInput';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { AppText } from '@/src/components/AppText';
import { theme } from '@/src/constants/theme';
import { useAuth } from '@/src/hooks/useAuth';
import { saveNfcWrite, updatePrinterJob } from '@/src/services/firestoreService';

export function NfcProgrammingScreen() {
  const { user } = useAuth();
  const [jobId, setJobId] = useState('');
  const [cardCode, setCardCode] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleProgram() {
    if (!user) return;
    if (!jobId.trim() || !cardCode.trim()) {
      Alert.alert('Missing data', 'Job ID and card code are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const profileUrl = `https://biocloud.app/c/${cardCode.trim()}`;
      await saveNfcWrite({
        chipUID: cardCode.trim(),
        profileUrl,
        orderId: jobId.trim(),
        cardCode: cardCode.trim(),
        writtenBy: user.id,
      });
      try {
        await updatePrinterJob(jobId.trim(), 'printing', undefined, user.id);
      } catch {
        // Job may already be past printing.
      }
      await updatePrinterJob(jobId.trim(), 'nfc_writing', undefined, user.id);
      await updatePrinterJob(jobId.trim(), 'nfc_verification', { notes: notes.trim() || undefined }, user.id);
      setJobId(''); setCardCode(''); setNotes('');
      Alert.alert('NFC programmed', 'Card programming saved and moved to verification.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to program this card.';
      Alert.alert('Programming failed', message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenContainer role="printer">
      <AppText variant="h1">NFC Programming</AppText>
      <AppText variant="body" tone="muted">
        Program chip details and move the job to QA.
      </AppText>

      <AppCard role="printer">
        <View style={styles.form}>
          <AppInput role="printer" label="Printer job ID" value={jobId} onChangeText={setJobId} placeholder="job_1234" />
          <AppInput role="printer" label="NFC card code" value={cardCode} onChangeText={setCardCode} placeholder="NFC-ABCD-29" />
          <AppInput role="printer" label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional programming note" />
          <AppButton role="printer" iconName="Nfc" label="Save Programming" loading={isSubmitting} onPress={handleProgram} />
        </View>
      </AppCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: theme.spacing.sm,
  },
});
