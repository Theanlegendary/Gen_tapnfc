import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppButton } from '@/src/components/AppButton';
import { AppCard } from '@/src/components/AppCard';
import { AppInput } from '@/src/components/AppInput';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { AppText } from '@/src/components/AppText';
import { theme } from '@/src/constants/theme';
import { saveQaVideo, updatePrinterJob } from '@/src/services/firestoreService';

export function QaVideoCaptureScreen() {
  const [jobId, setJobId] = useState('');
  const [videoUri, setVideoUri] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleCapture() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Camera permission is required for QA capture.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: 60,
      quality: 0.5,
    });

    if (result.canceled || !result.assets[0]) return;
    setVideoUri(result.assets[0].uri);
  }

  async function handleSave() {
    if (!jobId.trim() || !videoUri) {
      Alert.alert('Missing data', 'Capture a video and provide a job ID first.');
      return;
    }

    setIsSaving(true);
    try {
      await saveQaVideo(jobId.trim(), videoUri);
      await updatePrinterJob(jobId.trim(), 'awaiting_qa', { notes: 'QA video captured — awaiting inspection' });
      Alert.alert('Saved', 'Job sent to the QA queue for inspection.');
      setJobId('');
      setVideoUri('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save QA video.';
      Alert.alert('Save failed', message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScreenContainer role="printer">
      <AppText variant="h1">QA Video Capture</AppText>
      <AppText variant="body" tone="muted">
        Record final proof video, then hand off to the QA inspection queue.
      </AppText>

      <AppCard role="printer">
        <View style={styles.form}>
          <AppInput role="printer" label="Printer job ID" value={jobId} onChangeText={setJobId} placeholder="job_1234" />
          <AppButton role="printer" iconName="FileVideo" label="Record QA Video" onPress={handleCapture} />
          {videoUri ? (
            <AppText variant="caption" tone="muted">
              Captured: {videoUri.split('/').slice(-1)[0]}
            </AppText>
          ) : (
            <AppText variant="caption" tone="muted">
              No video captured yet.
            </AppText>
          )}
          <AppButton role="printer" iconName="ShieldCheck" label="Attach To Job" variant="secondary" loading={isSaving} onPress={handleSave} />
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
