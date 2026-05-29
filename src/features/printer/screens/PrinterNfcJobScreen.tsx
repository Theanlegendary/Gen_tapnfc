import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { theme } from '@/src/constants/theme';
import { useAuth } from '@/src/hooks/useAuth';
import { usePrinterJobs } from '@/src/hooks/usePrinterJobs';
import { getOrder, saveNfcWrite, updateNfcStatus, updatePrinterJob } from '@/src/services/firestoreService';
import { writeNfcUrl } from '@/src/services/nfcManagerService';
import { Order } from '@/src/types/models';

// ─── Step bar — icons instead of numbered dots ────────────────────────────────
const STEP_DEFS = [
  { label: 'Print',  icon: 'Printer'     as const },
  { label: 'Encode', icon: 'Nfc'         as const },
  { label: 'Verified', icon: 'BadgeCheck' as const },
] as const;

const workflowTone = {
  done: theme.status.success,
  doneLabel: theme.statusText.success,
  current: theme.status.active,
  currentLabel: theme.statusText.active,
  future: theme.colors.iconInactive,
  rail: 'rgba(60,60,67,0.12)',
  doneConnector: 'rgba(48,209,88,0.32)',
  currentConnector: 'rgba(0,122,255,0.24)',
} as const;

function StepBar({ current }: { current: 1 | 2 | 3 }) {
  return (
    <View style={sb.row}>
      {STEP_DEFS.map((step, i) => {
        const done   = i + 1 < current;
        const active = i + 1 === current;
        const iconColor = done
          ? workflowTone.done
          : active
            ? workflowTone.current
            : workflowTone.future;
        const bgColor = done
          ? 'rgba(48,209,88,0.12)'
          : active
            ? 'rgba(0,122,255,0.10)'
            : theme.colors.surfaceSoft;
        const textColor = done
          ? workflowTone.doneLabel
          : active
            ? workflowTone.currentLabel
            : workflowTone.future;

        return (
          <View key={step.label} style={sb.item}>
            {/* Connector line before this step */}
            {i > 0 && (
              <View style={[sb.line, done && sb.lineDone, active && sb.lineActive]} />
            )}
            <View style={[sb.iconWrap, { backgroundColor: bgColor }]}>
              <AppIcon name={step.icon} size={14} color={iconColor} />
            </View>
            <AppText style={[sb.label, { color: textColor }, active && sb.labelActive]}>
              {step.label}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const sb = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 0,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.iconInactive,
  },
  labelActive: {
    fontWeight: '600',
  },
  line: {
    width: 18,
    height: 1,
    backgroundColor: workflowTone.rail,
    marginHorizontal: 2,
    borderRadius: 1,
  },
  lineDone: {
    backgroundColor: workflowTone.doneConnector,
  },
  lineActive: {
    backgroundColor: workflowTone.currentConnector,
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function NfcProgrammingScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { user } = useAuth();
  const { jobs } = usePrinterJobs();
  const job = jobs.find(j => j.id === jobId) ?? null;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [printed, setPrinted] = useState(false);
  const [written, setWritten] = useState(false);
  const [verified, setVerified] = useState(false);
  const wave = useRef(new Animated.Value(0)).current;
  const sheen = useRef(new Animated.Value(0)).current;
  const success = useRef(new Animated.Value(0)).current;
  const payloadUrl = order?.nfcTargetUrl?.trim() || order?.profileUrl || '';

  useEffect(() => {
    if (job?.orderId) getOrder(job.orderId).then(setOrder);
  }, [job?.orderId]);

  useEffect(() => {
    setPrinted(Boolean(job && job.stage !== 'queued'));
    setWritten(Boolean(job && (job.stage === 'nfc_writing' || job.stage === 'nfc_verification' || job.stage === 'awaiting_qa' || job.stage === 'done')));
    setVerified(Boolean(job && (job.stage === 'nfc_verification' || job.stage === 'awaiting_qa' || job.stage === 'done')));
  }, [job]);

  useEffect(() => {
    const waveLoop = Animated.loop(
      Animated.timing(wave, {
        toValue: 1,
        duration: loading ? 950 : 1800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    );
    const sheenLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(900),
        Animated.timing(sheen, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        Animated.timing(sheen, { toValue: 0, duration: 1, useNativeDriver: true }),
      ])
    );
    waveLoop.start();
    sheenLoop.start();
    return () => { waveLoop.stop(); sheenLoop.stop(); };
  }, [loading, sheen, wave]);

  useEffect(() => {
    if (!verified) return;
    success.setValue(0);
    Animated.timing(success, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [success, verified]);

  // No jobId guard
  if (!jobId) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.replace('/printer/queue')} style={styles.backBtn} hitSlop={12}>
            <AppIcon name="ChevronLeft" size={20} color={theme.colors.textPrimary} />
          </Pressable>
          <View style={styles.headerInfo}>
            <AppText style={styles.headerTitle}>NFC Encode</AppText>
          </View>
        </View>
        <View style={styles.emptyState}>
          <AppIcon name="Nfc" size={40} color={theme.colors.iconInactive} />
          <AppText weight="semibold" style={styles.emptyTitle}>No job selected</AppText>
          <AppText variant="caption" tone="muted" style={styles.emptyBody}>
            Go to the queue and tap a job to start NFC programming.
          </AppText>
          <Pressable
            style={({ pressed }) => [styles.softBtn, pressed && styles.softBtnPressed]}
            onPress={() => router.replace('/printer/queue')}
          >
            <AppText style={styles.softBtnText}>Back to Queue</AppText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  async function handleWrite() {
    if (!user || !job || !order || !printed) return;
    setLoading(true);
    try {
      await updateNfcStatus(order.cardCode, 'writing', user.id);
      if (job.stage === 'queued') await updatePrinterJob(job.id, 'printing', undefined, user.id);
      if (job.stage === 'queued' || job.stage === 'printing') await updatePrinterJob(job.id, 'nfc_writing', undefined, user.id);
      await writeNfcUrl(payloadUrl);
      await saveNfcWrite({ chipUID: order.cardCode, profileUrl: payloadUrl, orderId: order.id, cardCode: order.cardCode, writtenBy: user.id });
      await updateNfcStatus(order.cardCode, 'written', user.id);
      setWritten(true);
      setTimeout(async () => {
        try {
          await updateNfcStatus(order.cardCode, 'verified', user.id);
          await updatePrinterJob(job.id, 'nfc_verification', undefined, user.id);
          setVerified(true);
        } catch (err) {
          Alert.alert('Verification failed', (err as Error).message);
        }
      }, 1500);
    } catch (err) {
      if (order?.cardCode) await updateNfcStatus(order.cardCode, 'failed', user.id);
      Alert.alert('Write failed', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePrint() {
    if (!user || !job || !order || printing) return;
    setPrinting(true);
    try {
      if (job.stage === 'queued') await updatePrinterJob(job.id, 'printing', { cardsPrinted: order.quantity }, user.id);
      setPrinted(true);
    } catch (err) {
      Alert.alert('Print failed', (err as Error).message);
    } finally {
      setPrinting(false);
    }
  }

  const currentStep: 1 | 2 | 3 = verified ? 3 : printed ? 2 : 1;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <AppIcon name="ChevronLeft" size={20} color={theme.colors.textPrimary} />
          </Pressable>
          <View style={styles.headerInfo}>
            <AppText variant="caption" tone="muted" style={styles.headerSub}>
              Job #{String(job?.queueNumber ?? '').slice(-4)}
            </AppText>
            <AppText weight="semibold" style={styles.headerTitle}>NFC Encode</AppText>
          </View>
        </View>
        <StepBar current={currentStep} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Payload info card */}
        {order && (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <AppIcon name={printed ? 'Nfc' : 'Printer'} size={14} color={theme.colors.textMuted} />
              <AppText variant="caption" weight="medium" style={styles.infoLabel}>
                {printed ? 'PAYLOAD TO WRITE' : 'CARD TO PRINT'}
              </AppText>
            </View>
            <AppText weight="semibold" style={styles.infoValue}>
              {printed ? payloadUrl : `${order.customerName} / ${order.productType.replace(/_/g, ' ')}`}
            </AppText>
            <AppText variant="caption" tone="muted">
              {printed
                ? `Card: ${order.cardCode} · read-only after write`
                : `${order.quantity} card(s) · code ${order.cardCode}`}
            </AppText>
          </View>
        )}

        {/* NFC tap zone */}
        <View style={[styles.tapZone, verified && styles.tapZoneDone]}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.tapWave,
              {
                opacity: wave.interpolate({ inputRange: [0, 0.68, 1], outputRange: [0.18, 0.06, 0] }),
                transform: [{ scale: wave.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1.34] }) }],
              },
            ]}
          />
          {verified ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.successRipple,
                {
                  opacity: success.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.22, 0.08, 0] }),
                  transform: [{ scale: success.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.7] }) }],
                },
              ]}
            />
          ) : null}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.cardSheen,
              {
                transform: [
                  { translateX: sheen.interpolate({ inputRange: [0, 1], outputRange: [-180, 260] }) },
                  { rotate: '-18deg' },
                ],
              },
            ]}
          />
          <View style={[styles.nfcOrb, verified && styles.nfcOrbDone]}>
            <AppIcon
              name={verified ? 'ShieldCheck' : printed ? 'Nfc' : 'Printer'}
              size={48}
              color={verified ? theme.status.success : theme.colors.textMuted}
            />
          </View>
          <AppText weight="semibold" style={[styles.tapTitle, verified && styles.tapTitleDone]}>
            {verified
              ? 'Access card verified'
              : written
                ? 'Securing chip…'
                : loading
                  ? 'Writing encrypted payload…'
                  : printed
                    ? 'Hold card near phone'
                    : printing
                      ? 'Printing NFC card…'
                      : 'Print the NFC card first'}
          </AppText>
          <AppText variant="caption" tone="muted" style={styles.tapSub}>
            {!printed && 'Use the card selected by sales, then continue to encode.'}
            {printed && !written && 'Ready to encode NFC access profile'}
            {written && !verified && 'Verifying read-back and lock status'}
            {verified && 'Chip locked — record QA video to send for inspection'}
          </AppText>
        </View>

        {/* Workflow steps — icons */}
        <View style={styles.stepsCard}>
          {STEP_DEFS.map((step, i) => {
            const done = verified || (printed && i === 0) || (written && i < 2) || (loading && i === 1);
            const iconColor = done ? theme.status.success : theme.colors.iconInactive;
            const bgColor   = done ? 'rgba(48,209,88,0.10)' : theme.colors.surfaceSoft;
            return (
              <View key={step.label} style={styles.stepsItem}>
                <View style={[styles.stepsIconWrap, { backgroundColor: bgColor }]}>
                  <AppIcon name={step.icon} size={14} color={iconColor} />
                </View>
                <AppText
                  variant="caption"
                  style={[styles.stepsLabel, done && styles.stepsLabelDone]}
                >
                  {step.label}
                </AppText>
              </View>
            );
          })}
        </View>

        {/* Warning */}
        <View style={styles.warningCard}>
          <AppIcon name="ShieldCheck" size={14} color="#C93400" />
          <AppText variant="caption" style={styles.warningText}>
            Once locked, chip cannot be rewritten.
          </AppText>
        </View>

        {/* Primary action — soft gray default, not heavy black */}
        {!printed ? (
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              printing && styles.actionBtnDisabled,
              pressed && !printing && styles.actionBtnPressed,
            ]}
            disabled={printing}
            onPress={handlePrint}
          >
            <AppIcon name="Printer" size={17} color={theme.colors.textPrimary} />
            <AppText style={styles.actionBtnText}>
              {printing ? 'Printing…' : 'Print NFC Card'}
            </AppText>
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              (loading || written) && styles.actionBtnDisabled,
              pressed && !loading && !written && styles.actionBtnPressed,
            ]}
            disabled={loading || written}
            onPress={handleWrite}
          >
            <AppIcon name="Nfc" size={17} color={verified ? theme.status.success : theme.colors.textPrimary} />
            <AppText style={[styles.actionBtnText, verified && { color: theme.status.success }]}>
              {verified ? 'Chip Locked ✓' : loading ? 'Writing…' : 'Encode & Lock Chip'}
            </AppText>
          </Pressable>
        )}

        {/* QA continue — green tint, not solid green */}
        {verified && (
          <Pressable
            style={({ pressed }) => [styles.qaBtn, pressed && styles.qaBtnPressed]}
            onPress={() => router.push({ pathname: '/printer/qa/[jobId]', params: { jobId: job!.id } })}
          >
            <AppIcon name="ShieldCheck" size={16} color={theme.statusText.success} />
            <AppText style={styles.qaBtnText}>Continue to QA Video</AppText>
          </Pressable>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  // Header
  header: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xs,
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60,60,67,0.06)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: 2,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: { gap: 1 },
  headerSub: { fontSize: 11 },
  headerTitle: {
    fontSize: 18,
    color: theme.colors.textPrimary,
  },

  scroll: {
    padding: theme.spacing.md,
    paddingBottom: 120,
    gap: theme.spacing.sm,
  },

  // Info card
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(60,60,67,0.06)',
    ...theme.shadows.card,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  infoLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    color: theme.colors.textPrimary,
  },

  // Tap zone
  tapZone: {
    height: 230,
    borderRadius: theme.radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(60,60,67,0.06)',
    ...theme.shadows.floating,
  },
  tapZoneDone: {
    borderColor: 'rgba(48,209,88,0.18)',
  },
  tapWave: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: theme.colors.surfaceSoft,
  },
  successRipple: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(48,209,88,0.10)',
  },
  cardSheen: {
    position: 'absolute',
    top: -70,
    bottom: -70,
    width: 56,
    backgroundColor: 'rgba(255,255,255,0.48)',
  },
  nfcOrb: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.card,
  },
  nfcOrbDone: {
    backgroundColor: 'rgba(48,209,88,0.10)',
  },
  tapTitle: {
    fontSize: 15,
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  tapTitleDone: {
    color: theme.colors.textPrimary,
  },
  tapSub: {
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },

  // Steps card — horizontal icon row
  stepsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(60,60,67,0.06)',
    ...theme.shadows.card,
  },
  stepsItem: {
    alignItems: 'center',
    gap: 5,
  },
  stepsIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsLabel: {
    fontSize: 10,
    color: theme.colors.iconInactive,
    fontWeight: '500',
  },
  stepsLabelDone: {
    color: theme.statusText.success,
    fontWeight: '600',
  },

  // Warning
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,149,0,0.08)',
    borderRadius: theme.radius.md,
    padding: 10,
  },
  warningText: {
    color: '#C93400',
    flex: 1,
  },

  // Action button — soft gray default, not heavy black
  actionBtn: {
    height: 50,
    borderRadius: theme.radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(60,60,67,0.10)',
  },
  actionBtnDisabled: { opacity: 0.45 },
  actionBtnPressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },

  // QA button — green tint, not solid green
  qaBtn: {
    height: 50,
    borderRadius: theme.radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(48,209,88,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(48,209,88,0.20)',
  },
  qaBtnPressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  qaBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.statusText.success,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: 17,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  emptyBody: {
    textAlign: 'center',
    lineHeight: 18,
  },
  softBtn: {
    height: 44,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(60,60,67,0.10)',
    marginTop: 4,
  },
  softBtnPressed: { opacity: 0.72 },
  softBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
});
