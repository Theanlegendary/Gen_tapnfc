import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { AppEmptyState } from '@/src/components/AppState';
import { batchMaterialOptions, batchPrinterTypeOptions } from '@/src/constants/options';
import { theme } from '@/src/constants/theme';
import { useActiveBatch } from '@/src/hooks/useActiveBatch';
import { useAuth } from '@/src/hooks/useAuth';
import { useProductionBatches } from '@/src/hooks/useProductionBatches';
import { createProductionBatch, setBatchStatus } from '@/src/services/productionService';
import { ProductionBatch } from '@/src/types/models';

const HERO_BG = '#1a1a2e';

function BatchRow({
  batch,
  selected,
  onSelect,
}: {
  batch: ProductionBatch;
  selected: boolean;
  onSelect: () => void;
}) {
  const material = batchMaterialOptions.find((m) => m.value === batch.material)?.label ?? batch.material;
  const printer = batchPrinterTypeOptions.find((p) => p.value === batch.printerType)?.label ?? batch.printerType;

  return (
    <Pressable
      style={[styles.batchCard, selected && styles.batchCardSelected]}
      onPress={onSelect}
    >
      <View style={styles.batchTop}>
        <AppText style={styles.batchNumber}>{batch.batchNumber}</AppText>
        <View style={[styles.statusPill, batch.status === 'active' && styles.statusPillActive]}>
          <AppText style={styles.statusPillText}>{batch.status}</AppText>
        </View>
      </View>
      <AppText style={styles.batchMeta}>
        {material} · {printer} · {batch.orderIds.length} orders
      </AppText>
      {batch.branch ? <AppText style={styles.batchBranch}>Branch: {batch.branch}</AppText> : null}
    </Pressable>
  );
}

export default function PrinterBatchSelectScreen() {
  const { user } = useAuth();
  const { batches, isLoading, error } = useProductionBatches();
  const { batchId, selectBatch, hasActiveBatch } = useActiveBatch();
  const [creating, setCreating] = useState(false);

  const selectable = useMemo(
    () => batches.filter((b) => b.status === 'active' || b.status === 'draft' || b.status === 'paused'),
    [batches]
  );

  async function handleSelect(batch: ProductionBatch) {
    try {
      if (batch.status === 'draft') {
        await setBatchStatus(batch.id, 'active', { activeOperatorId: user?.id });
      } else if (batch.status === 'paused') {
        await setBatchStatus(batch.id, 'active', { activeOperatorId: user?.id });
      }
      await selectBatch(batch.id);
      router.replace('/printer/queue');
    } catch (err) {
      Alert.alert('Could not select batch', err instanceof Error ? err.message : 'Try again.');
    }
  }

  async function handleQuickCreate() {
    if (!user?.id) return;
    setCreating(true);
    try {
      const suffix = String(Date.now()).slice(-4);
      const id = await createProductionBatch({
        batchNumber: `B-${suffix}`,
        material: 'wood',
        printerType: 'uv_flatbed',
        branch: user.branch ?? '',
        createdBy: user.id,
      });
      await setBatchStatus(id, 'active', { activeOperatorId: user.id });
      await selectBatch(id);
      router.replace('/printer/queue');
    } catch (err) {
      Alert.alert('Create failed', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <View style={styles.safe}>
      <SafeAreaView edges={['top']} style={styles.heroSafe}>
        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <AppText style={styles.workshopTxt}>Workshop</AppText>
          <AppText style={styles.pageTitle}>Select Batch</AppText>
          <AppText style={styles.heroSub}>
            Choose an active production batch before queue or scan work.
          </AppText>
          {hasActiveBatch && batchId ? (
            <Pressable style={styles.continueBtn} onPress={() => router.replace('/printer/queue')}>
              <AppText style={styles.continueBtnText}>Continue current batch</AppText>
              <AppIcon name="ChevronRight" size={16} color="#fff" />
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Pressable
          style={[styles.createBtn, creating && { opacity: 0.6 }]}
          onPress={() => void handleQuickCreate()}
          disabled={creating}
        >
          {creating ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <AppIcon name="Plus" size={18} color="#fff" />
              <AppText style={styles.createBtnText}>New batch</AppText>
            </>
          )}
        </Pressable>

        {error ? (
          <AppText style={styles.errorText}>{error}</AppText>
        ) : null}

        {isLoading ? (
          <AppText tone="muted" style={styles.loadingText}>
            Loading batches…
          </AppText>
        ) : selectable.length === 0 ? (
          <AppEmptyState
            role="printer"
            iconName="Package"
            title="No batches"
            description="Create a batch to assign paid orders and start production."
          />
        ) : (
          selectable.map((batch) => (
            <BatchRow
              key={batch.id}
              batch={batch}
              selected={batchId === batch.id}
              onSelect={() => void handleSelect(batch)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  heroSafe: { backgroundColor: HERO_BG },
  hero: {
    backgroundColor: HERO_BG,
    paddingHorizontal: 20,
    paddingBottom: 22,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(100,120,255,0.12)',
    top: -60,
    right: -50,
  },
  workshopTxt: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1.2,
    marginBottom: 6,
  },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 18 },
  continueBtn: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  continueBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  body: { padding: 16, paddingBottom: 120, gap: 10 },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: HERO_BG,
    borderRadius: 16,
    paddingVertical: 14,
  },
  createBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  batchCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E2E8F0',
  },
  batchCardSelected: { borderColor: '#2563EB', borderWidth: 2 },
  batchTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  batchNumber: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  statusPill: {
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillActive: { backgroundColor: '#DCFCE7' },
  statusPillText: { fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'capitalize' },
  batchMeta: { marginTop: 6, fontSize: 13, color: '#64748B', fontWeight: '600' },
  batchBranch: { marginTop: 4, fontSize: 11, color: '#94A3B8' },
  errorText: { color: theme.status.error, textAlign: 'center' },
  loadingText: { textAlign: 'center', paddingVertical: 24 },
});
