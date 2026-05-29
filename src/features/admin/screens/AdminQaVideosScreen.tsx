import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { collection, getDocs, orderBy, query, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/src/services/firebaseClient';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { SettingsGroup, SettingsSection } from '@/src/components/SettingsGroup';
import { theme } from '@/src/constants/theme';
import { AdminScreenShell, AdminStatusPill } from '@/src/features/admin/components/AdminScreenShell';
import { usePreferences } from '@/src/hooks/usePreferences';

interface PrinterJob {
  id: string;
  queueNumber: number;
  orderId: string;
  qaVideoUrl: string;
  salaryStatus: 'pending' | 'approved' | 'rejected' | string;
  printerId?: string;
  printerName?: string;
  createdAt?: any;
}

function qaTone(status: string): 'success' | 'danger' | 'warning' | 'neutral' {
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'danger';
  if (status === 'pending' || !status) return 'warning';
  return 'neutral';
}

export default function QaVideosScreen() {
  const { colors } = usePreferences();
  const [jobs, setJobs] = useState<PrinterJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const snap = await getDocs(
          query(collection(db, 'printer_jobs'), orderBy('createdAt', 'desc'))
        );
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as PrinterJob));
        // Filter to only jobs with a QA video URL
        setJobs(all.filter(j => j.qaVideoUrl));
      } catch {
        // silent — show empty state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function updateStatus(job: PrinterJob, status: 'approved' | 'rejected') {
    try {
      await updateDoc(doc(db, 'printer_jobs', job.id), { salaryStatus: status });
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, salaryStatus: status } : j));
    } catch {
      Alert.alert('Error', 'Could not update status.');
    }
  }

  async function openVideo(url: string) {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Cannot open URL', url);
      }
    } catch {
      Alert.alert('Error', 'Could not open video link.');
    }
  }

  function formatDate(ts: any): string {
    if (!ts) return '—';
    try {
      const d = ts.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleDateString();
    } catch {
      return '—';
    }
  }

  const pendingCount = jobs.filter(j => j.salaryStatus === 'pending' || !j.salaryStatus).length;

  return (
    <AdminScreenShell
      title="QA Videos"
      subtitle="Admin"
      rightAction={
        pendingCount > 0 ? <AdminStatusPill label={`${pendingCount} pending`} tone="warning" /> : undefined
      }
    >
      {loading ? (
        <AppText variant="body" tone="muted" style={styles.empty}>
          Loading QA videos…
        </AppText>
      ) : jobs.length === 0 ? (
        <View style={styles.emptyState}>
          <AppIcon name="FileVideo" size={40} color={colors.textMuted} />
          <AppText variant="body" weight="bold">
            No QA videos yet
          </AppText>
          <AppText variant="caption" tone="muted" style={styles.emptyDesc}>
            QA videos appear here once printers upload proof recordings.
          </AppText>
        </View>
      ) : (
        <>
          <SettingsSection title="Review queue" compact />
          <SettingsGroup compact>
            {jobs.map((job, index) => (
              <View key={job.id}>
                <View style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.cardLeft}>
                      <AppText variant="body" weight="semibold">
                        Queue #{job.queueNumber ?? '—'}
                      </AppText>
                      <AppText variant="caption" tone="muted">
                        Order: {job.orderId ? job.orderId.slice(0, 8).toUpperCase() : '—'}
                      </AppText>
                      {job.printerName ? (
                        <AppText variant="caption" tone="muted">
                          Printer: {job.printerName}
                        </AppText>
                      ) : null}
                      <AppText variant="caption" tone="muted">
                        {formatDate(job.createdAt)}
                      </AppText>
                    </View>
                    <AdminStatusPill label={job.salaryStatus ?? 'pending'} tone={qaTone(job.salaryStatus ?? 'pending')} />
                  </View>

                  <Pressable
                    style={[styles.videoLink, { backgroundColor: colors.surfaceSoft }]}
                    onPress={() => openVideo(job.qaVideoUrl)}
                  >
                    <AppIcon name="FileVideo" size={16} color={colors.primary} />
                    <AppText variant="caption" weight="semibold" style={{ color: colors.primary, flex: 1 }} numberOfLines={1}>
                      {job.qaVideoUrl.length > 50 ? `${job.qaVideoUrl.slice(0, 50)}…` : job.qaVideoUrl}
                    </AppText>
                  </Pressable>

                  {(job.salaryStatus === 'pending' || !job.salaryStatus) && (
                    <View style={styles.actionRow}>
                      <Pressable
                        style={[styles.actionBtn, { backgroundColor: 'rgba(0,0,0,0.06)' }]}
                        onPress={() => updateStatus(job, 'approved')}
                      >
                        <AppText variant="caption" weight="semibold" style={{ color: '#000000' }}>
                          Approve
                        </AppText>
                      </Pressable>
                      <Pressable
                        style={[styles.actionBtn, { backgroundColor: 'rgba(255,59,48,0.12)' }]}
                        onPress={() => updateStatus(job, 'rejected')}
                      >
                        <AppText variant="caption" weight="semibold" style={{ color: theme.colors.danger }}>
                          Reject
                        </AppText>
                      </Pressable>
                    </View>
                  )}
                </View>
                {index < jobs.length - 1 ? (
                  <View style={[styles.separator, { backgroundColor: colors.border }]} />
                ) : null}
              </View>
            ))}
          </SettingsGroup>
        </>
      )}
    </AdminScreenShell>
  );
}

const styles = StyleSheet.create({
  empty: { textAlign: 'center', marginTop: theme.spacing.xl },
  emptyState: { alignItems: 'center', marginTop: theme.spacing.xxl, gap: theme.spacing.sm, paddingHorizontal: theme.spacing.lg },
  emptyDesc: { textAlign: 'center', lineHeight: 18 },
  card: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm + 2, gap: theme.spacing.sm },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  cardLeft: { flex: 1, gap: 3 },
  videoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: theme.spacing.md,
  },
  actionRow: { flexDirection: 'row', gap: theme.spacing.sm, paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.xs },
  actionBtn: { flex: 1, borderRadius: theme.radius.sm, paddingVertical: 9, alignItems: 'center' },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: theme.spacing.md },
});
