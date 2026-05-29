import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/src/services/firebaseClient';
import { AppText } from '@/src/components/AppText';
import {
  ProfileStatCell,
  ProfileStatsGrid,
  SettingsGroup,
  SettingsSection,
} from '@/src/components/SettingsGroup';
import { theme } from '@/src/constants/theme';
import { AdminScreenShell } from '@/src/features/admin/components/AdminScreenShell';

const ORDER_STATUS_OPTIONS: { label: string; value: string; color: string }[] = [
  { label: 'New',              value: 'new',              color: '#6E8A95' },
  { label: 'Design',           value: 'design',           color: '#FFB343' },
  { label: 'Printing',         value: 'printing',         color: '#00A4A6' },
  { label: 'NFC Writing',      value: 'nfc_writing',      color: '#7c3aed' },
  { label: 'NFC Verification', value: 'nfc_verification', color: '#2563eb' },
  { label: 'Ready',            value: 'ready',            color: '#000000' },
  { label: 'Delivered',        value: 'delivered',        color: '#173E4A' },
];


interface OrderData {
  id: string;
  status: string;
  paymentStatus: string;
  quantity: number;
  assignedSalesman: string;
  productType: string;
  createdAt: any;
}

interface PrinterJobData {
  id: string;
  printerId: string;
  printerName?: string;
  salaryStatus?: string;
  totalCards?: number;
}

interface SalesmanStat {
  id: string;
  name: string;
  count: number;
  revenue: number;
}

interface PrinterStat {
  id: string;
  name: string;
  cards: number;
}

const PRODUCT_PRICES: Record<string, number> = {
  wood_card: 49,
  metal_card: 89,
  pvc_card: 29,
};

export default function ReportsScreen() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [printerJobs, setPrinterJobs] = useState<PrinterJobData[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [ordersSnap, jobsSnap, usersSnap] = await Promise.all([
          getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'))),
          getDocs(collection(db, 'printer_jobs')),
          getDocs(collection(db, 'users')),
        ]);

        const map: Record<string, string> = {};
        usersSnap.docs.forEach(d => {
          const data = d.data();
          map[d.id] = data.displayName || data.email || d.id;
        });
        setUserMap(map);

        setOrders(ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as OrderData)));
        setPrinterJobs(jobsSnap.docs.map(d => ({ id: d.id, ...d.data() } as PrinterJobData)));
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Computed stats
  const totalRevenue = orders
    .filter(o => o.paymentStatus === 'paid')
    .reduce((s, o) => s + (o.quantity ?? 1) * (PRODUCT_PRICES[o.productType] ?? 49), 0);

  const totalCards = printerJobs.reduce((s, j) => s + (j.totalCards ?? 1), 0);

  const commissionPaid = orders
    .filter(o => o.paymentStatus === 'paid')
    .reduce((s, o) => s + (o.quantity ?? 1) * (PRODUCT_PRICES[o.productType] ?? 49) * 0.1, 0);

  // Status breakdown
  type StatusBreakdownItem = { label: string; value: string; color: string; count: number };
  const statusBreakdown: StatusBreakdownItem[] = ORDER_STATUS_OPTIONS.map(opt => ({
    label: opt.label,
    value: opt.value,
    color: opt.color,
    count: orders.filter(o => o.status === opt.value).length,
  }));
  const maxStatusCount = Math.max(...statusBreakdown.map(s => s.count), 1);

  // Top salesmen
  const salesmanMap: Record<string, SalesmanStat> = {};
  orders.forEach(o => {
    const sid = o.assignedSalesman;
    if (!sid) return;
    if (!salesmanMap[sid]) {
      salesmanMap[sid] = { id: sid, name: userMap[sid] || sid, count: 0, revenue: 0 };
    }
    salesmanMap[sid].count += 1;
    if (o.paymentStatus === 'paid') {
      salesmanMap[sid].revenue += (o.quantity ?? 1) * (PRODUCT_PRICES[o.productType] ?? 49);
    }
  });
  const topSalesmen = Object.values(salesmanMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Top printers
  const printerMap: Record<string, PrinterStat> = {};
  printerJobs.forEach(j => {
    const pid = j.printerId;
    if (!pid) return;
    if (!printerMap[pid]) {
      printerMap[pid] = { id: pid, name: j.printerName || userMap[pid] || pid, cards: 0 };
    }
    printerMap[pid].cards += j.totalCards ?? 1;
  });
  const topPrinters = Object.values(printerMap)
    .sort((a, b) => b.cards - a.cards)
    .slice(0, 5);

  return (
    <AdminScreenShell title="Reports" subtitle="Admin">
      {loading ? (
        <AppText variant="body" tone="muted" style={styles.empty}>
          Loading reports…
        </AppText>
      ) : (
        <>
          <SettingsSection title="Summary" compact />
          <SettingsGroup compact>
            <ProfileStatsGrid>
              <ProfileStatCell compact index={0} total={4} label="Revenue" value={`$${totalRevenue.toLocaleString()}`} icon="Wallet" tone="#000000" />
              <ProfileStatCell compact index={1} total={4} label="Orders" value={String(orders.length)} icon="ClipboardList" />
              <ProfileStatCell compact index={2} total={4} label="Cards printed" value={String(totalCards)} icon="CreditCard" tone="#5856D6" />
              <ProfileStatCell compact index={3} total={4} label="Commission" value={`$${commissionPaid.toFixed(0)}`} icon="BadgeDollarSign" tone="#FF9500" />
            </ProfileStatsGrid>
          </SettingsGroup>

          <SettingsSection title="Order status" compact />
          <SettingsGroup compact style={styles.card}>
              {statusBreakdown.map(s => (
                <View key={s.value} style={styles.barRow}>
                  <AppText style={styles.barLabel}>{s.label}</AppText>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${(s.count / maxStatusCount) * 100}%` as any,
                          backgroundColor: s.color,
                        },
                      ]}
                    />
                  </View>
                  <AppText style={[styles.barCount, { color: s.color }]}>{s.count}</AppText>
                </View>
              ))}
          </SettingsGroup>

          <SettingsSection title="Top salesmen" compact />
          <SettingsGroup compact style={styles.card}>
              {topSalesmen.length === 0 ? (
                <AppText style={styles.emptyInCard}>No sales data yet.</AppText>
              ) : (
                topSalesmen.map((s, i) => (
                  <View key={s.id} style={styles.rankRow}>
                    <View style={[styles.rankBadge, { backgroundColor: i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : '#cd7c2f' }]}>
                      <AppText style={styles.rankNum}>#{i + 1}</AppText>
                    </View>
                    <View style={styles.rankInfo}>
                      <AppText style={styles.rankName}>{s.name}</AppText>
                      <AppText style={styles.rankMeta}>{s.count} orders · ${s.revenue.toLocaleString()} revenue</AppText>
                    </View>
                  </View>
                ))
              )}
          </SettingsGroup>

          <SettingsSection title="Top printers" compact />
          <SettingsGroup compact style={styles.card}>
              {topPrinters.length === 0 ? (
                <AppText style={styles.emptyInCard}>No printer data yet.</AppText>
              ) : (
                topPrinters.map((p, i) => (
                  <View key={p.id} style={styles.rankRow}>
                    <View style={[styles.rankBadge, { backgroundColor: i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : '#cd7c2f' }]}>
                      <AppText style={styles.rankNum}>#{i + 1}</AppText>
                    </View>
                    <View style={styles.rankInfo}>
                      <AppText style={styles.rankName}>{p.name}</AppText>
                      <AppText style={styles.rankMeta}>{p.cards} cards printed</AppText>
                    </View>
                  </View>
                ))
              )}
          </SettingsGroup>
        </>
      )}
    </AdminScreenShell>
  );
}

const styles = StyleSheet.create({
  empty: { textAlign: 'center', marginTop: theme.spacing.xl },
  card: { paddingVertical: theme.spacing.sm, gap: 10 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { width: 90, fontSize: 11, color: '#555', fontWeight: '600' },
  barTrack: { flex: 1, height: 10, backgroundColor: '#f0f0f0', borderRadius: 5, overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5, minWidth: 4 },
  barCount: { width: 28, fontSize: 12, fontWeight: '700', textAlign: 'right' },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rankBadge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  rankNum: { color: '#fff', fontSize: 11, fontWeight: '700' },
  rankInfo: { flex: 1, gap: 2 },
  rankName: { fontSize: 15, fontWeight: '600', color: '#111111' },
  rankMeta: { fontSize: 12, color: '#6E6E73' },
  emptyInCard: { textAlign: 'center', color: '#aaa', fontSize: 13, paddingVertical: 8 },
});
