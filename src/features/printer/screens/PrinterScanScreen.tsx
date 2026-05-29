import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { productTypeOptions } from '@/src/constants/options';
import {
  PrinterInfoRow,
  PrinterScreenHeader,
  PrinterSurfaceCard,
  printerUi,
} from '@/src/features/printer/components/PrinterScreenUi';
import { useAuth } from '@/src/hooks/useAuth';
import { useCameraAccess } from '@/src/hooks/useCameraAccess';
import { useActiveBatch } from '@/src/hooks/useActiveBatch';
import { usePrinterJobs } from '@/src/hooks/usePrinterJobs';
import { isNfcAvailable, readNfcUid } from '@/src/services/nfcManagerService';
import { extractScanUid, matchScanToPrinterJob } from '@/src/services/printerScanService';
import { Order, PrinterJob } from '@/src/types/models';

type FlowStep = 0 | 1 | 2;

const FLOW_STEPS = [
  { key: 'read', label: 'READ', icon: 'ScanLine' as const, title: 'Card Code' },
  { key: 'match', label: 'MATCH', icon: 'ShieldCheck' as const, title: 'Order Match' },
  { key: 'verify', label: 'VERIFY', icon: 'BadgeCheck' as const, title: 'QA Verify' },
] as const;

function qaStatusLabel(job: PrinterJob | null) {
  if (!job) return 'Waiting';
  if (job.stage === 'done') return 'Passed';
  if (job.stage === 'nfc_verification') return 'Ready';
  if (job.stage === 'nfc_writing') return 'Writing NDEF';
  if (job.stage === 'printing') return 'Printing';
  if (job.stage === 'failed') return 'Issue';
  return 'Waiting';
}

function FlowTrack({ step }: { step: FlowStep }) {
  return (
    <View style={styles.flowTrack}>
      {FLOW_STEPS.map((item, index) => {
        const done = step > index;
        const active = step === index;
        const iconColor = done || active ? '#FFFFFF' : '#94A3B8';
        const circleStyle = done ? styles.flowCircleDone : active ? styles.flowCircleActive : styles.flowCircleIdle;

        return (
          <View key={item.key} style={styles.flowStepWrap}>
            {index > 0 ? <View style={[styles.flowConnector, done && styles.flowConnectorDone]} /> : null}
            <View style={[styles.flowCircle, circleStyle]}>
              <AppIcon name={item.icon} size={16} color={iconColor} />
            </View>
            <AppText style={[styles.flowLabel, active && styles.flowLabelActive, done && styles.flowLabelDone]}>
              {item.label}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

function MatchPreviewModal({
  visible,
  order,
  job,
  linkedToQueue,
  onClose,
  onContinue,
}: {
  visible: boolean;
  order: Order | null;
  job: PrinterJob | null;
  linkedToQueue: boolean;
  onClose: () => void;
  onContinue: () => void;
}) {
  if (!order || !job) return null;

  const product =
    productTypeOptions.find((p) => p.value === order.productType)?.label ??
    order.productType.replace(/_/g, ' ');

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHandle} />
          <AppText style={styles.modalTitle}>Print job preview</AppText>
          <AppText style={styles.modalSub}>
            {linkedToQueue ? 'Linked to next job in batch' : 'Matched existing card code'}
          </AppText>

          {order.designArtworkUrl ? (
            <Image source={{ uri: order.designArtworkUrl }} style={styles.modalArtwork} resizeMode="cover" />
          ) : (
            <View style={styles.modalArtworkPlaceholder}>
              <AppIcon name="Image" size={28} color={printerUi.muted} />
              <AppText style={styles.modalArtworkPlaceholderText}>{order.cardDesign.replace(/_/g, ' ')}</AppText>
            </View>
          )}

          <PrinterInfoRow icon="User" title="Customer" value={order.customerName} />
          <PrinterInfoRow icon="Package" title="Product" value={`${product} × ${order.quantity}`} />
          <PrinterInfoRow icon="QrCode" title="Card UID" value={order.cardCode} />
          <PrinterInfoRow
            icon="ClipboardList"
            title="Queue"
            value={`#${String(job.queueNumber).slice(-4)} · ${job.stage.replace(/_/g, ' ')}`}
            last
          />

          <View style={styles.modalActions}>
            <Pressable style={styles.modalSecondary} onPress={onClose}>
              <AppText style={styles.modalSecondaryText}>Close</AppText>
            </Pressable>
            <Pressable style={styles.modalPrimary} onPress={onContinue}>
              <AppText style={styles.modalPrimaryText}>Continue Verify</AppText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function PrinterScanScreen() {
  const { user } = useAuth();
  const { batchId, isLoading: batchLoading } = useActiveBatch();
  const { jobs } = usePrinterJobs();
  const camera = useCameraAccess();

  if (!batchLoading && !batchId) {
    return <Redirect href="/printer/batch-select" />;
  }

  const [manualCode, setManualCode] = useState('');
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [scannedUid, setScannedUid] = useState<string | null>(null);
  const [matchedOrder, setMatchedOrder] = useState<Order | null>(null);
  const [matchedJob, setMatchedJob] = useState<PrinterJob | null>(null);
  const [linkedToQueue, setLinkedToQueue] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [nfcReading, setNfcReading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);

  useEffect(() => {
    void isNfcAvailable().then(setNfcSupported);
  }, []);

  const flowStep = useMemo<FlowStep>(() => {
    if (!scannedUid) return 0;
    if (!matchedJob) return 1;
    return 2;
  }, [scannedUid, matchedJob]);

  const runAutoMatch = useCallback(
    async (raw: string) => {
      const uid = extractScanUid(raw);
      if (!uid || !user?.id) return;

      setLookingUp(true);
      setMatchedOrder(null);
      setMatchedJob(null);
      setLinkedToQueue(false);

      try {
        const result = await matchScanToPrinterJob(raw, jobs, user.id, batchId ?? '');
        if (!result) {
          Alert.alert(
            'No queue match',
            'UID captured but no job in the active batch matches. Assign paid orders to this batch first.'
          );
          return;
        }

        setMatchedOrder(result.order);
        setMatchedJob(result.job);
        setLinkedToQueue(result.linkedToQueue);
        setPreviewOpen(true);
      } catch (error) {
        Alert.alert('Match failed', error instanceof Error ? error.message : 'Try again.');
      } finally {
        setLookingUp(false);
      }
    },
    [jobs, user?.id, batchId]
  );

  const captureUid = useCallback(
    (raw: string) => {
      const uid = extractScanUid(raw);
      if (!uid) {
        Alert.alert('Invalid UID', 'Enter or scan a valid card UID.');
        return;
      }
      setScannedUid(uid);
      setManualCode(uid);
      void runAutoMatch(uid);
    },
    [runAutoMatch]
  );

  const onBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (data === lastScan || lookingUp) return;
      setLastScan(data);
      captureUid(data);
    },
    [lastScan, lookingUp, captureUid]
  );

  const tapNfcCard = useCallback(async () => {
    setNfcReading(true);
    try {
      const uid = await readNfcUid();
      captureUid(uid);
    } catch (error) {
      Alert.alert('NFC read failed', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setNfcReading(false);
    }
  }, [captureUid]);

  function resetFlow() {
    setScannedUid(null);
    setMatchedOrder(null);
    setMatchedJob(null);
    setLinkedToQueue(false);
    setLastScan(null);
    setManualCode('');
    setPreviewOpen(false);
  }

  function openVerify() {
    if (!matchedJob) return;
    setPreviewOpen(false);
    router.push({ pathname: '/printer/nfc/[jobId]', params: { jobId: matchedJob.id } });
  }

  const readStatus = scannedUid ? 'Captured' : 'Waiting';
  const matchStatus = lookingUp
    ? 'Matching…'
    : matchedJob
      ? linkedToQueue
        ? 'Auto · Matched'
        : 'Matched'
      : scannedUid
        ? 'Auto'
        : 'Waiting';
  const qaValue = qaStatusLabel(matchedJob);

  const productLabel =
    matchedOrder &&
    (productTypeOptions.find((p) => p.value === matchedOrder.productType)?.label ??
      matchedOrder.productType.replace(/_/g, ' '));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <PrinterScreenHeader title="Scan" sub="Read → Match → Verify" />

        <FlowTrack step={flowStep} />

        <View style={styles.phaseCard}>
          <AppText style={styles.phaseStep}>
            Step {flowStep + 1}: {FLOW_STEPS[flowStep].title}
          </AppText>
          {flowStep === 0 ? (
            <AppText style={styles.phaseBody}>
              Tap a blank NFC card or scan its barcode. The app captures the chip UID and checks the card is valid.
            </AppText>
          ) : null}
          {flowStep === 1 ? (
            <AppText style={styles.phaseBody}>
              The system links this UID to the next queued job in your active batch only (no global queue).
            </AppText>
          ) : null}
          {flowStep === 2 ? (
            <AppText style={styles.phaseBody}>
              Send layout to the thermal printer, encode secure NDEF data, then confirm visual QA before clearing the
              queue item.
            </AppText>
          ) : null}
        </View>

        <View style={styles.scanCard}>
          {camera.isLoading ? (
            <AppText style={styles.scanSub}>Checking camera permission…</AppText>
          ) : !camera.isGranted ? (
            <>
              <View style={styles.cameraIconWrap}>
                <AppIcon name="ScanLine" size={42} color="#2563EB" />
              </View>
              <AppText style={styles.scanTitle}>Ready to Read</AppText>
              <AppText style={styles.scanSub}>
                {camera.isWeb
                  ? 'Use NFC tap or enter UID below on web.'
                  : 'Enable camera for QR scan, or tap NFC below.'}
              </AppText>
              {!camera.isWeb ? (
                <Pressable
                  style={[styles.enableBtn, camera.requesting && { opacity: 0.6 }]}
                  onPress={() => void camera.enableCamera()}
                  disabled={camera.requesting}
                >
                  <AppText style={styles.enableBtnText}>
                    {camera.requesting ? 'Requesting…' : 'Enable Camera'}
                  </AppText>
                </Pressable>
              ) : null}
            </>
          ) : (
            <>
              <View style={styles.cameraWrap}>
                <CameraView
                  style={styles.camera}
                  facing="back"
                  active
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={onBarcodeScanned}
                />
              </View>
              <AppText style={styles.scanTitle}>{scannedUid ? 'UID Captured' : 'Scan QR'}</AppText>
              <AppText style={styles.scanSub}>
                {scannedUid ? `Chip ID: ${scannedUid}` : 'Point camera at card QR code'}
              </AppText>
            </>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.nfcTapBtn,
              pressed && !nfcReading && { opacity: 0.88 },
              nfcSupported === false && { opacity: 0.45 },
            ]}
            onPress={() => void tapNfcCard()}
            disabled={nfcReading || nfcSupported === false}
          >
            <AppIcon name="Nfc" size={18} color="#FFFFFF" />
            <AppText style={styles.nfcTapBtnText}>
              {nfcReading ? 'Hold card on phone…' : 'Tap Blank NFC Card'}
            </AppText>
          </Pressable>
          {nfcSupported === false ? (
            <AppText style={styles.nfcHint}>NFC not available on this device. Use QR or manual UID.</AppText>
          ) : null}
        </View>

        <View style={styles.manualRow}>
          <View style={styles.manualInputWrap}>
            <AppIcon name="QrCode" size={16} color={printerUi.muted} />
            <TextInput
              style={styles.manualInput}
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="UID / card code"
              placeholderTextColor={printerUi.muted}
              autoCapitalize="characters"
            />
          </View>
          <Pressable
            style={({ pressed }) => [styles.findBtn, pressed && !lookingUp && { opacity: 0.88 }]}
            onPress={() => captureUid(manualCode)}
            disabled={lookingUp || !manualCode.trim()}
          >
            <AppText style={styles.findBtnText}>{lookingUp ? '...' : 'Read'}</AppText>
          </Pressable>
        </View>

        <Pressable onPress={() => matchedOrder && setPreviewOpen(true)} disabled={!matchedOrder}>
          <PrinterSurfaceCard style={styles.statusCard}>
            <PrinterInfoRow icon="QrCode" title="Card Code" value={`${readStatus} · ${scannedUid ?? '—'}`} />
            <PrinterInfoRow icon="CreditCard" title="Order Match" value={matchStatus} />
            <PrinterInfoRow icon="BadgeCheck" title="QA Verify" value={qaValue} last />
            {matchedOrder ? (
              <AppText style={styles.tapPreviewHint}>Tap card for print preview</AppText>
            ) : null}
          </PrinterSurfaceCard>
        </Pressable>

        {matchedOrder && matchedJob ? (
          <PrinterSurfaceCard style={styles.matchCard}>
            <AppText style={styles.matchTitle}>
              {linkedToQueue ? 'Linked to next queue job' : 'Print data matched'}
            </AppText>
            <PrinterInfoRow icon="User" title="Customer" value={matchedOrder.customerName} />
            <PrinterInfoRow icon="Package" title="Product" value={`${productLabel ?? '-'} × ${matchedOrder.quantity}`} />
            <PrinterInfoRow
              icon="Image"
              title="Assets"
              value={matchedOrder.designArtworkUrl ? 'Custom artwork ready' : matchedOrder.cardDesign.replace(/_/g, ' ')}
            />
            <PrinterInfoRow
              icon="ClipboardList"
              title="Job"
              value={`#${String(matchedJob.queueNumber).slice(-4)}`}
              last
            />
          </PrinterSurfaceCard>
        ) : null}

        {flowStep === 2 && matchedJob ? (
          <PrinterSurfaceCard style={styles.verifyCard}>
            <AppText style={styles.verifyTitle}>Verify fulfillment</AppText>
            <AppText style={styles.verifySub}>
              1. Send layout to printer · 2. Write NDEF URL · 3. Operator confirms QA
            </AppText>
            <Pressable style={styles.verifyBtn} onPress={openVerify}>
              <AppIcon name="Printer" size={16} color="#FFFFFF" />
              <AppText style={styles.verifyBtnText}>Open Print & NFC Verify</AppText>
            </Pressable>
          </PrinterSurfaceCard>
        ) : null}

        <View style={styles.actionsRow}>
          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.88 }]}
            onPress={resetFlow}
          >
            <AppIcon name="RefreshCw" size={16} color={printerUi.text} />
            <AppText style={styles.secondaryBtnText}>Reset</AppText>
          </Pressable>

          {scannedUid && !matchedJob ? (
            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && !lookingUp && { opacity: 0.9 }]}
              onPress={() => void runAutoMatch(scannedUid)}
              disabled={lookingUp}
            >
              <AppText style={styles.primaryBtnText}>{lookingUp ? 'Matching…' : 'Re-run Match'}</AppText>
            </Pressable>
          ) : matchedJob ? (
            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
              onPress={() => setPreviewOpen(true)}
            >
              <AppText style={styles.primaryBtnText}>Preview Job</AppText>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

      <MatchPreviewModal
        visible={previewOpen}
        order={matchedOrder}
        job={matchedJob}
        linkedToQueue={linkedToQueue}
        onClose={() => setPreviewOpen(false)}
        onContinue={openVerify}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: printerUi.bg },
  scroll: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 120 },
  flowTrack: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  flowStepWrap: { flex: 1, alignItems: 'center', position: 'relative' },
  flowConnector: {
    position: 'absolute',
    top: 17,
    right: '50%',
    width: '100%',
    height: 2,
    backgroundColor: '#E2E8F0',
    zIndex: 0,
  },
  flowConnectorDone: { backgroundColor: '#34C759' },
  flowCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  flowCircleDone: { backgroundColor: '#34C759' },
  flowCircleActive: { backgroundColor: '#2563EB' },
  flowCircleIdle: { backgroundColor: '#E2E8F0' },
  flowLabel: { marginTop: 6, fontSize: 10, fontWeight: '800', color: printerUi.muted, letterSpacing: 0.5 },
  flowLabelActive: { color: '#2563EB' },
  flowLabelDone: { color: '#16A34A' },
  phaseCard: {
    marginTop: 14,
    borderRadius: printerUi.radiusMd,
    backgroundColor: printerUi.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: printerUi.border,
    padding: 14,
    gap: 6,
    ...printerUi.shadow,
  },
  phaseStep: { fontSize: 11, fontWeight: '800', color: printerUi.muted, letterSpacing: 0.6 },
  phaseBody: { fontSize: 13, fontWeight: '600', color: '#64748B', lineHeight: 18 },
  scanCard: {
    marginTop: 14,
    borderRadius: 34,
    backgroundColor: printerUi.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: printerUi.border,
    padding: 18,
    alignItems: 'center',
    gap: 10,
    ...printerUi.shadow,
  },
  cameraIconWrap: {
    width: 112,
    height: 112,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraWrap: { width: '100%', height: 200, borderRadius: 22, overflow: 'hidden', backgroundColor: '#000' },
  camera: { flex: 1 },
  scanTitle: { fontSize: 20, fontWeight: '900', color: printerUi.text },
  scanSub: { fontSize: 13, fontWeight: '600', color: printerUi.muted, textAlign: 'center' },
  enableBtn: {
    width: '100%',
    height: 48,
    borderRadius: 20,
    backgroundColor: printerUi.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enableBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  nfcTapBtn: {
    width: '100%',
    height: 48,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nfcTapBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  nfcHint: { fontSize: 11, fontWeight: '600', color: printerUi.muted, textAlign: 'center' },
  manualRow: { marginTop: 4, flexDirection: 'row', gap: 8 },
  manualInputWrap: {
    flex: 1,
    height: 44,
    borderRadius: printerUi.radiusSm,
    backgroundColor: printerUi.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: printerUi.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    ...printerUi.shadow,
  },
  manualInput: { flex: 1, fontSize: 13, fontWeight: '600', color: printerUi.text, padding: 0 },
  findBtn: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: printerUi.radiusSm,
    backgroundColor: printerUi.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  findBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  statusCard: { marginTop: 14, borderRadius: printerUi.radiusLg },
  tapPreviewHint: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: printerUi.accent,
    paddingBottom: 10,
  },
  matchCard: { borderRadius: printerUi.radiusLg },
  matchTitle: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
    fontSize: 13,
    fontWeight: '900',
    color: printerUi.text,
  },
  verifyCard: { padding: 14, gap: 8 },
  verifyTitle: { fontSize: 15, fontWeight: '900', color: printerUi.text },
  verifySub: { fontSize: 12, fontWeight: '600', color: printerUi.muted, lineHeight: 17 },
  verifyBtn: {
    marginTop: 6,
    height: 48,
    borderRadius: printerUi.radiusMd,
    backgroundColor: printerUi.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  verifyBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  actionsRow: { marginTop: 14, flexDirection: 'row', gap: 10 },
  secondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: printerUi.radiusMd,
    backgroundColor: printerUi.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: printerUi.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...printerUi.shadow,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '800', color: printerUi.text },
  primaryBtn: {
    flex: 2,
    height: 48,
    borderRadius: printerUi.radiusMd,
    backgroundColor: printerUi.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: printerUi.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingBottom: 28,
    maxHeight: '88%',
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    marginTop: 10,
    marginBottom: 12,
  },
  modalTitle: { fontSize: 20, fontWeight: '900', color: printerUi.text },
  modalSub: { marginTop: 2, marginBottom: 12, fontSize: 12, fontWeight: '600', color: printerUi.muted },
  modalArtwork: { width: '100%', height: 160, borderRadius: 16, marginBottom: 8 },
  modalArtworkPlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 16,
    backgroundColor: '#F4F6FA',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
  },
  modalArtworkPlaceholderText: { fontSize: 12, fontWeight: '700', color: printerUi.muted },
  modalActions: { marginTop: 14, flexDirection: 'row', gap: 10 },
  modalSecondary: {
    flex: 1,
    height: 48,
    borderRadius: printerUi.radiusMd,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: printerUi.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryText: { fontSize: 14, fontWeight: '800', color: printerUi.text },
  modalPrimary: {
    flex: 2,
    height: 48,
    borderRadius: printerUi.radiusMd,
    backgroundColor: printerUi.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
