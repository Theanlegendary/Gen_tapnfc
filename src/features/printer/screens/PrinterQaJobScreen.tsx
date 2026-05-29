import { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { theme } from '@/src/constants/theme';
import { usePrinterJobs } from '@/src/hooks/usePrinterJobs';
import { getOrder, saveQaVideo, updatePrinterJob } from '@/src/services/firestoreService';
import { Order } from '@/src/types/models';

export default function QaVideoCaptureScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { jobs } = usePrinterJobs();
  const job = jobs.find(j => j.id === jobId) ?? null;
  const [order, setOrder] = useState<Order | null>(null);
  const [recording, setRecording] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [qaVideoUri, setQaVideoUri] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (job?.orderId) getOrder(job.orderId).then(setOrder);
  }, [job?.orderId]);

  // Guard — no jobId
  if (!jobId) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.replace('/printer/queue')} style={styles.backBtn} hitSlop={12}>
            <AppIcon name="ChevronLeft" size={22} color="#fff" />
          </Pressable>
          <View style={styles.headerCenter}>
            <AppText style={styles.headerTitle}>QA Video</AppText>
          </View>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
          <AppIcon name="FileVideo" size={48} color="rgba(255,255,255,0.3)" />
          <AppText style={{ fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center' }}>No job selected</AppText>
          <AppText style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>Go to the queue and complete NFC programming first.</AppText>
          <Pressable style={styles.doneBtn} onPress={() => router.replace('/printer/queue')}>
            <AppText style={styles.doneBtnText}>Back to Queue</AppText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  async function handleRecord() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Camera permission is needed.');
      return;
    }

    setRecording(true);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);

    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: 30,
      quality: 0.7,
    });

    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);

    if (res.canceled || !res.assets?.[0]?.uri) return;

    setSaving(true);
    try {
      const videoUri = res.assets[0].uri;
      await saveQaVideo(jobId, videoUri);
      await updatePrinterJob(
        jobId,
        'awaiting_qa',
        { cardsPrinted: order?.quantity ?? job?.cardsPrinted ?? 1 },
        undefined
      );
      setQaVideoUri(videoUri);
      setSaved(true);
    } catch (err) {
      Alert.alert('Upload failed', (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function handlePreview() {
    const orderId = order?.id ?? job?.orderId;
    if (!orderId) return;
    router.push({ pathname: '/order-detail/[orderId]', params: { orderId } });
  }

  async function handleDownload() {
    const uri = qaVideoUri ?? job?.qaVideoUrl;
    if (!uri) {
      Alert.alert('No video', 'Record QA video before downloading.');
      return;
    }
    const canOpen = await Linking.canOpenURL(uri);
    if (!canOpen) {
      Alert.alert('Download unavailable', 'The QA video is saved, but this device cannot open the file link.');
      return;
    }
    await Linking.openURL(uri);
  }

  return (
    <SafeAreaView style={styles.safe}>
        {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <AppIcon name="ChevronLeft" size={22} color="#fff" />
        </Pressable>
        <View style={styles.headerCenter}>
          <AppText style={styles.headerTitle}>Verification Video</AppText>
          <AppText style={styles.headerSub}>Job #{String(job?.queueNumber ?? '').slice(-4)}</AppText>
        </View>
        {recording && (
          <View style={styles.recBadge}>
            <View style={styles.recDot} />
            <AppText style={styles.recText}>REC {formatTime(elapsed)}</AppText>
          </View>
        )}
      </View>

      {/* Camera frame area */}
      <View style={styles.cameraArea}>
        {/* QA frame guide */}
        <View style={styles.frameGuide}>
          {/* Corner marks */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {saved ? (
            <View style={styles.savedOverlay}>
              <AppIcon name="ShieldCheck" size={56} color={theme.status.success} />
              <AppText style={styles.savedText}>Sent to QA Queue</AppText>
              <AppText style={styles.savedSub}>Inspector can pass or fail from the QA queue.</AppText>
            </View>
          ) : (
            <View style={styles.frameContent}>
              <AppIcon name="FileVideo" size={48} color="rgba(255,255,255,0.3)" />
              <AppText style={styles.frameHint}>
                {recording ? 'Recording...' : 'Frame the card here'}
              </AppText>
            </View>
          )}
        </View>

        {/* Steps */}
        <View style={styles.stepsRow}>
          {['Tap card', 'Show URL', 'Verify'].map((s, i) => (
            <View key={s} style={styles.stepItem}>
              <View style={styles.stepNum}><AppText style={styles.stepNumText}>{i + 1}</AppText></View>
              <AppText style={styles.stepText}>{s}</AppText>
            </View>
          ))}
        </View>
      </View>

      {/* Record button */}
      <View style={styles.footer}>
        {!saved ? (
          <Pressable
            style={[styles.recordBtn, (recording || saving) && styles.recordBtnActive]}
            onPress={handleRecord}
            disabled={saving}
          >
            <View style={[styles.recordInner, (recording || saving) && styles.recordInnerActive]} />
          </Pressable>
        ) : (
          <View style={styles.doneActions}>
            <Pressable style={styles.secondaryDoneBtn} onPress={handlePreview}>
              <AppIcon name="Eye" size={17} color="#fff" />
              <AppText style={styles.doneBtnText}>Preview</AppText>
            </Pressable>
            <Pressable style={styles.secondaryDoneBtn} onPress={handleDownload}>
              <AppIcon name="Download" size={17} color="#fff" />
              <AppText style={styles.doneBtnText}>Download</AppText>
            </Pressable>
            <Pressable style={styles.doneBtn} onPress={() => router.replace('/printer/queue')}>
              <AppText style={styles.doneBtnText}>Done</AppText>
            </Pressable>
          </View>
        )}
        <AppText style={styles.footerHint}>
          {saving ? 'Saving...' : recording ? 'Recording, tap to stop' : saved ? 'Video saved' : 'Tap to record (max 30s)'}
        </AppText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0F' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, gap: 1 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  headerSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  recBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(231,76,60,0.2)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.status.error },
  recText: { color: theme.status.error, fontSize: 12, fontWeight: '700' },
  cameraArea: { flex: 1, padding: 20, gap: 20 },
  frameGuide: { flex: 1, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(48,209,88,0.45)', position: 'relative', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.03)' },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: 'rgba(48,209,88,0.72)', borderWidth: 2 },
  cornerTL: { top: -2, left: -2, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 6 },
  cornerTR: { top: -2, right: -2, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 6 },
  cornerBL: { bottom: -2, left: -2, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: -2, right: -2, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 6 },
  frameContent: { alignItems: 'center', gap: 10 },
  frameHint: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  savedOverlay: { alignItems: 'center', gap: 10 },
  savedText: { color: theme.status.success, fontSize: 18, fontWeight: '600' },
  savedSub: { color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '600' },
  stepsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 12 },
  stepItem: { alignItems: 'center', gap: 6 },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(48,209,88,0.22)', alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(48,209,88,0.42)' },
  stepNumText: { color: '#D9F6E4', fontSize: 11, fontWeight: '600' },
  stepText: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  footer: { alignItems: 'center', paddingBottom: 40, gap: 12 },
  recordBtn: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  recordBtnActive: { borderColor: theme.status.error },
  recordInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.status.error },
  recordInnerActive: { borderRadius: 8, width: 32, height: 32 },
  doneBtn: { backgroundColor: theme.status.success, borderRadius: 16, paddingHorizontal: 40, paddingVertical: 14 },
  secondaryDoneBtn: {
    minHeight: 46,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  doneActions: {
    width: '100%',
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  doneBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  footerHint: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
});
