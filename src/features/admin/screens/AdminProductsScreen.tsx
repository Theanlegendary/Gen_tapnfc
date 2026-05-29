import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';
import { collection, doc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/services/firebaseClient';
import { AppText } from '@/src/components/AppText';
import { SettingsGroup, SettingsSection } from '@/src/components/SettingsGroup';
import { theme } from '@/src/constants/theme';
import { AdminScreenShell } from '@/src/features/admin/components/AdminScreenShell';
import { usePreferences } from '@/src/hooks/usePreferences';

interface Product {
  id: string;
  name: string;
  emoji: string;
  price: number;
  isActive: boolean;
}

const DEFAULT_PRODUCTS: Product[] = [
  { id: 'wood_card',  name: 'Wood Card',  emoji: '🪵', price: 49, isActive: true },
  { id: 'metal_card', name: 'Metal Card', emoji: '⚙️', price: 89, isActive: true },
  { id: 'pvc_card',   name: 'PVC Card',   emoji: '💳', price: 29, isActive: true },
];

export default function ProductsScreen() {
  const { colors } = usePreferences();
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [editPrices, setEditPrices] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'products'));
        if (snap.docs.length > 0) {
          const loaded: Product[] = snap.docs.map(d => ({
            id: d.id,
            name: d.data().name ?? d.id,
            emoji: d.data().emoji ?? '📦',
            price: d.data().price ?? 0,
            isActive: d.data().isActive !== false,
          }));
          // Merge with defaults to ensure all 3 products exist
          const merged = DEFAULT_PRODUCTS.map(def => {
            const found = loaded.find(l => l.id === def.id);
            return found ?? def;
          });
          setProducts(merged);
        }
        // Initialize edit prices from loaded products
        const prices: Record<string, string> = {};
        DEFAULT_PRODUCTS.forEach(p => {
          const found = snap.docs.find(d => d.id === p.id);
          prices[p.id] = String(found?.data().price ?? p.price);
        });
        setEditPrices(prices);
      } catch {
        // Use defaults
        const prices: Record<string, string> = {};
        DEFAULT_PRODUCTS.forEach(p => { prices[p.id] = String(p.price); });
        setEditPrices(prices);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function saveProduct(product: Product) {
    const priceStr = editPrices[product.id];
    const price = parseFloat(priceStr);
    if (isNaN(price) || price < 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price.');
      return;
    }
    setSaving(prev => ({ ...prev, [product.id]: true }));
    try {
      await setDoc(
        doc(db, 'products', product.id),
        {
          name: product.name,
          emoji: product.emoji,
          price,
          isActive: product.isActive,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setProducts(prev =>
        prev.map(p => p.id === product.id ? { ...p, price } : p)
      );
      Alert.alert('Saved', `${product.name} updated successfully.`);
    } catch {
      Alert.alert('Error', 'Could not save product.');
    } finally {
      setSaving(prev => ({ ...prev, [product.id]: false }));
    }
  }

  async function toggleActive(product: Product) {
    const newActive = !product.isActive;
    try {
      await setDoc(
        doc(db, 'products', product.id),
        { isActive: newActive, updatedAt: serverTimestamp() },
        { merge: true }
      );
      setProducts(prev =>
        prev.map(p => p.id === product.id ? { ...p, isActive: newActive } : p)
      );
    } catch {
      Alert.alert('Error', 'Could not update availability.');
    }
  }

  return (
    <AdminScreenShell title="Products" subtitle="Admin">
      <SettingsSection
        title="Catalog"
        footer="Manage card types, prices, and availability."
        compact
      />

      {loading ? (
        <AppText variant="body" tone="muted" style={styles.empty}>
          Loading products…
        </AppText>
      ) : (
        products.map((product) => (
          <SettingsGroup key={product.id} compact style={[styles.card, !product.isActive && styles.cardInactive]}>
              {/* Product header */}
              <View style={styles.productHeader}>
                <View style={[styles.emojiWrap, { backgroundColor: colors.surfaceSoft }]}>
                  <AppText style={styles.emoji}>{product.emoji}</AppText>
                </View>
                <View style={styles.productInfo}>
                  <AppText variant="body" weight="bold">
                    {product.name}
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    {product.id}
                  </AppText>
                </View>
                <View style={styles.toggleWrap}>
                  <AppText variant="caption" weight="semibold" style={{ color: product.isActive ? theme.colors.success : colors.textMuted }}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </AppText>
                  <Switch
                    value={product.isActive}
                    onValueChange={() => toggleActive(product)}
                    trackColor={{ false: colors.border, true: theme.colors.success }}
                    thumbColor="#fff"
                  />
                </View>
              </View>

              <View style={styles.priceRow}>
                <AppText variant="body" weight="medium">
                  Price (USD)
                </AppText>
                <View style={[styles.priceInputWrap, { backgroundColor: colors.surfaceSoft }]}>
                  <AppText variant="body" weight="semibold" tone="muted">
                    $
                  </AppText>
                  <TextInput
                    style={[styles.priceInput, { color: colors.typographyColor }]}
                    value={editPrices[product.id] ?? String(product.price)}
                    onChangeText={(v) => setEditPrices((prev) => ({ ...prev, [product.id]: v }))}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              <AppText variant="caption" tone="muted">
                Saved price: ${product.price}
              </AppText>

              <Pressable
                style={[styles.saveBtn, { backgroundColor: colors.primary }, saving[product.id] && styles.saveBtnDisabled]}
                onPress={() => saveProduct(product)}
                disabled={saving[product.id]}
              >
                <AppText variant="body" weight="bold" style={styles.saveBtnText}>
                  {saving[product.id] ? 'Saving…' : 'Save changes'}
                </AppText>
              </Pressable>
          </SettingsGroup>
        ))
      )}
    </AdminScreenShell>
  );
}

const styles = StyleSheet.create({
  empty: { textAlign: 'center', marginTop: theme.spacing.xl },
  card: { marginBottom: theme.spacing.md, padding: theme.spacing.lg, gap: theme.spacing.md },
  cardInactive: { opacity: 0.6 },
  productHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  emojiWrap: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 24 },
  productInfo: { flex: 1, gap: 2 },
  toggleWrap: { alignItems: 'center', gap: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm },
  priceInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.md,
    paddingHorizontal: 10,
    height: 44,
    gap: 4,
  },
  priceInput: { fontSize: 17, fontWeight: '600', minWidth: 72, textAlign: 'right' },
  saveBtn: { borderRadius: theme.radius.sm, paddingVertical: 11, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#FFFFFF' },
});
