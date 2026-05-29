import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/src/services/firebaseClient';
import { AppSearchBar } from '@/src/components/AppSearchBar';
import { AppText } from '@/src/components/AppText';
import { SettingsGroup, SettingsSection } from '@/src/components/SettingsGroup';
import { theme } from '@/src/constants/theme';
import {
  AdminScreenShell,
  AdminStatChip,
  AdminStatChipRow,
  AdminStatusPill,
} from '@/src/features/admin/components/AdminScreenShell';
import { searchEmptyMessage, useSearchQuery } from '@/src/hooks/useSearchQuery';
import { usePreferences } from '@/src/hooks/usePreferences';

type VerificationStatus = 'verified' | 'written' | 'failed' | 'writing' | string;

interface NfcCard {
  id: string;
  chipUID: string;
  cardCode: string;
  profileUrl: string;
  verificationStatus: VerificationStatus;
  writtenBy: string;
  writtenAt: any;
  orderId?: string;
}

function statusTone(status: VerificationStatus): 'success' | 'info' | 'danger' | 'warning' | 'neutral' {
  if (status === 'verified') return 'success';
  if (status === 'written') return 'info';
  if (status === 'failed') return 'danger';
  if (status === 'writing') return 'warning';
  return 'neutral';
}

export default function NfcLogsScreen() {
  const { colors } = usePreferences();
  const [cards, setCards] = useState<NfcCard[]>([]);
  const [loading, setLoading] = useState(true);
  const { input: searchInput, setInput: setSearchInput, query: searchQuery, submitSearch, clearSearch } =
    useSearchQuery();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const snap = await getDocs(query(collection(db, 'nfc_cards'), orderBy('writtenAt', 'desc')));
        setCards(snap.docs.map(d => ({ id: d.id, ...d.data() } as NfcCard)));
      } catch {
        // silent fail — show empty state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const q = searchQuery.toLowerCase();
  const filtered = cards.filter(
    (c) =>
      !q ||
      c.chipUID?.toLowerCase().includes(q) ||
      c.cardCode?.toLowerCase().includes(q) ||
      c.writtenBy?.toLowerCase().includes(q) ||
      c.orderId?.toLowerCase().includes(q)
  );

  function formatDate(ts: any): string {
    if (!ts) return '—';
    try {
      const d = ts.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '—';
    }
  }

  function truncate(str: string, max = 36): string {
    if (!str) return '—';
    return str.length > max ? str.slice(0, max) + '…' : str;
  }

  return (
    <AdminScreenShell
      title="NFC Logs"
      subtitle="Admin"
      scroll={false}
      rightAction={
        <AppText variant="caption" tone="muted" weight="medium">
          {cards.length} chips
        </AppText>
      }
      headerBottom={
        <AppSearchBar
          embedded
          value={searchInput}
          onChangeText={setSearchInput}
          onSearch={submitSearch}
          onClear={clearSearch}
          loading={loading}
          placeholder="Search by card code or chip UID…"
        />
      }
    >
      <AdminStatChipRow>
        {(['verified', 'written', 'writing', 'failed'] as const).map((s) => (
          <AdminStatChip
            key={s}
            label={s}
            value={String(cards.filter((c) => c.verificationStatus === s).length)}
          />
        ))}
      </AdminStatChipRow>

      <SettingsSection title="Records" compact />
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {loading ? (
          <AppText variant="body" tone="muted" style={styles.empty}>
            Loading NFC logs…
          </AppText>
        ) : filtered.length === 0 ? (
          <AppText variant="body" tone="muted" style={styles.empty}>
            {searchEmptyMessage(false, Boolean(searchQuery), searchQuery, 'No NFC records found.', '')}
          </AppText>
        ) : (
          <SettingsGroup compact>
            {filtered.map((card, index) => (
              <View key={card.id}>
                <View style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.cardLeft}>
                      <AppText variant="body" weight="semibold">
                        {card.chipUID || '—'}
                      </AppText>
                      {card.cardCode ? (
                        <AppText variant="caption" tone="muted">
                          Card: {card.cardCode}
                        </AppText>
                      ) : null}
                      {card.orderId ? (
                        <AppText variant="caption" tone="muted">
                          Order: {card.orderId.slice(0, 8).toUpperCase()}
                        </AppText>
                      ) : null}
                      <AppText variant="caption" tone="muted" numberOfLines={1}>
                        {truncate(card.profileUrl)}
                      </AppText>
                    </View>
                    <AdminStatusPill
                      label={card.verificationStatus ?? 'unknown'}
                      tone={statusTone(card.verificationStatus ?? 'unknown')}
                    />
                  </View>
                  <View style={[styles.cardBottom, { borderTopColor: colors.border }]}>
                    <AppText variant="caption" tone="muted">
                      By: {card.writtenBy || '—'}
                    </AppText>
                    <AppText variant="caption" tone="muted">
                      {formatDate(card.writtenAt)}
                    </AppText>
                  </View>
                </View>
                {index < filtered.length - 1 ? (
                  <View style={[styles.separator, { backgroundColor: colors.border }]} />
                ) : null}
              </View>
            ))}
          </SettingsGroup>
        )}
      </ScrollView>
    </AdminScreenShell>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: theme.spacing.xxl },
  empty: { textAlign: 'center', marginTop: theme.spacing.xl, paddingHorizontal: theme.spacing.md },
  card: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm + 2, gap: 8 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  cardLeft: { flex: 1, gap: 3 },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: theme.spacing.md },
});

