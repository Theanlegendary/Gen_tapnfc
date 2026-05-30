import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { theme } from '@/src/constants/theme';
import { useAuth } from '@/src/hooks/useAuth';
import { createOrder } from '@/src/services/firestoreService';
import { writeAuditLog } from '@/src/services/productionService';
import { CardDesign } from '@/src/types/models';

type CsvRow = {
  customerName: string;
  phone: string;
  email?: string;
  company?: string;
  telegram?: string;
  productType: string;
};

function parseCsvLine(line: string): string[] {
  const cols: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      cols.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  cols.push(current.trim());
  return cols;
}

function headerIndex(headers: string[], ...needles: string[]): number {
  return headers.findIndex((h) => needles.some((n) => h.includes(n)));
}

export function parseEmployeeCsv(text: string): CsvRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const nameIdx = headerIndex(headers, 'name', 'customer');
  const phoneIdx = headerIndex(headers, 'phone', 'mobile');
  const emailIdx = headerIndex(headers, 'email', 'mail');
  const companyIdx = headerIndex(headers, 'company', 'org');
  const telegramIdx = headerIndex(headers, 'telegram');
  const productIdx = headerIndex(headers, 'product', 'card');

  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    return {
      customerName: cols[nameIdx >= 0 ? nameIdx : 0] ?? '',
      phone: cols[phoneIdx >= 0 ? phoneIdx : 1] ?? '',
      email: emailIdx >= 0 ? cols[emailIdx] : undefined,
      company: companyIdx >= 0 ? cols[companyIdx] : undefined,
      telegram: telegramIdx >= 0 ? cols[telegramIdx] : undefined,
      productType: cols[productIdx >= 0 ? productIdx : 2] ?? 'wood_card',
    };
  });
}

export function SalesBulkUpload() {
  const { user } = useAuth();
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);

  async function runImport(rows: CsvRow[]) {
    if (!user?.id) return;
    if (rows.length === 0) {
      Alert.alert('No rows', 'Add a header row and at least one employee line.');
      return;
    }
    setImporting(true);
    let ok = 0;
    let failed = 0;
    for (const row of rows) {
      const hasContact = row.phone?.trim() || row.telegram?.trim() || row.email?.trim();
      if (!row.customerName?.trim() || !hasContact) {
        failed += 1;
        continue;
      }
      try {
        await createOrder({
          customerName: row.customerName,
          phone: row.phone || '',
          email: row.email,
          company: row.company,
          telegram: row.telegram,
          productType: row.productType || 'wood_card',
          quantity: 1,
          cardDesign: 'classic_black' as CardDesign,
          paymentStatus: 'unpaid',
          notes: 'bulk_import',
          assignedSalesman: user.id,
          createdBy: user.id,
        });
        ok += 1;
      } catch {
        failed += 1;
      }
    }
    if (ok > 0) {
      await writeAuditLog({
        action: 'bulk_orders_imported',
        entityType: 'order',
        entityId: user.id,
        actorId: user.id,
        actorRole: user.role,
        branch: user.branch,
        metadata: { created: ok, failed, source: 'sales_csv' },
      });
    }
    setImporting(false);
    Alert.alert('Import complete', `${ok} draft orders created, ${failed} skipped or failed.`);
  }

  return (
    <View style={styles.wrap}>
      <AppText style={styles.title}>Bulk employee / client list</AppText>
      <AppText style={styles.sub}>
        Paste CSV: customerName, phone, email, company, telegram, productType
      </AppText>
      <TextInput
        style={styles.input}
        multiline
        placeholder="Paste CSV here…"
        placeholderTextColor={theme.colors.textMuted}
        value={csvText}
        onChangeText={setCsvText}
        editable={!importing}
      />
      <Pressable
        style={[styles.btn, importing && { opacity: 0.6 }]}
        disabled={importing || !csvText.trim()}
        onPress={() => void runImport(parseEmployeeCsv(csvText))}
      >
        <AppText style={styles.btnText}>{importing ? 'Importing…' : 'Import to Firebase'}</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  title: { fontSize: 15, fontWeight: '800' },
  sub: { marginTop: 4, fontSize: 12, color: theme.colors.textMuted, lineHeight: 17 },
  input: {
    marginTop: 10,
    minHeight: 88,
    maxHeight: 160,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    padding: 10,
    fontSize: 12,
    color: theme.colors.textPrimary,
    textAlignVertical: 'top',
    backgroundColor: theme.colors.background,
  },
  btn: {
    marginTop: 10,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '800' },
  btnSecondary: {
    marginTop: 8,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  btnSecondaryText: { fontWeight: '700', color: theme.colors.primary, fontSize: 13 },
});
