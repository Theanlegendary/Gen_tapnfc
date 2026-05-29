import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon, AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { AuthGate } from '@/src/components/AuthGate';
import { IosFormActionFooter } from '@/src/components/IosFormActionFooter';
import {
  cardDesignOptions,
  orderCardStatusOptions,
  orderStatusOptions,
  paymentMethodOptions,
  paymentStatusColors,
  paymentStatusOptions,
  priorityOptions,
  productTypeOptions,
} from '@/src/constants/options';
import { theme } from '@/src/constants/theme';
import { useAuth } from '@/src/hooks/useAuth';
import {
  closeOrderCard,
  freezeOrderCard,
  getOrder,
  reopenOrderCard,
  unfreezeOrderCard,
  updateOrderDetails,
} from '@/src/services/firestoreService';
import { getAuthErrorMessage } from '@/src/services/authService';
import { CardDesign, Order, PaymentStatus } from '@/src/types/models';

// ─── Design tokens (shared with NewOrderScreen) ───────────────────────────────
const salesTheme = theme.roles.sales;

const C = {
  pink:       salesTheme.primary,
  pinkDark:   salesTheme.primaryDark,
  pinkLight:  salesTheme.soft,
  pinkFaint:  salesTheme.soft,
  ink:        salesTheme.text,
  inkMid:     salesTheme.muted,
  inkLight:   salesTheme.muted,
  bg:         salesTheme.background,
  surface:    salesTheme.surface,
  success:    theme.status.success,
  successBg:  `${theme.status.success}14`,
  error:      theme.status.error,
  errorBg:    `${theme.status.error}14`,
  blue:       theme.status.info,
  blueBg:     theme.colors.surfaceSoft,
  overlay:    'rgba(24,9,15,0.42)',
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────
type EditableForm = {
  customerName: string;
  phone: string;
  telegram: string;
  whatsapp: string;
  email: string;
  company: string;
  jobTitle: string;
  deliveryAddress: string;
  productType: string;
  quantity: string;
  cardDesign: CardDesign;
  nfcEnabled: boolean;
  nfcTargetUrl: string;
  qrPrinted: boolean;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  depositAmount: string;
  dueDate: string;
  priority: 'standard' | 'urgent';
  notes: string;
  freezeReason: string;
};

function formFromOrder(order: Order): EditableForm {
  return {
    customerName:  order.customerName ?? '',
    phone:         order.phone ?? '',
    telegram:      order.telegram ?? '',
    whatsapp:      order.whatsapp ?? '',
    email:         order.email ?? '',
    company:       order.company ?? '',
    jobTitle:      order.jobTitle ?? '',
    deliveryAddress: order.deliveryAddress ?? '',
    productType:   order.productType || productTypeOptions[0].value,
    quantity:      String(order.quantity || 1),
    cardDesign:    order.cardDesign ?? 'classic_black',
    nfcEnabled:    order.nfcEnabled !== false,
    nfcTargetUrl:  order.nfcTargetUrl ?? '',
    qrPrinted:     order.qrPrinted === true,
    paymentStatus: order.paymentStatus ?? 'unpaid',
    paymentMethod: order.paymentMethod ?? paymentMethodOptions[0].value,
    depositAmount: order.depositAmount !== undefined ? String(order.depositAmount) : '',
    dueDate:       order.dueDate ?? '',
    priority:      order.priority ?? 'standard',
    notes:         order.notes ?? '',
    freezeReason:  order.freezeReason ?? '',
  };
}

function formatDate(value?: string) {
  if (!value) return 'Not set';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function getProduct(o: Pick<Order, 'productType' | 'quantity'> | EditableForm) {
  const t = 'productType' in o ? o.productType : productTypeOptions[0].value;
  return productTypeOptions.find((p) => p.value === t) ?? productTypeOptions[0];
}

function getOrderTotal(o: Pick<Order, 'productType' | 'quantity'> | EditableForm) {
  const p = getProduct(o);
  const q = typeof o.quantity === 'string'
    ? Math.max(1, Number.parseInt(o.quantity, 10) || 1)
    : o.quantity;
  return p.price * q;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Clean borderless text input */
function Field({
  label, value, onChangeText, placeholder, keyboardType, multiline,
}: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
  multiline?: boolean;
}) {
  return (
    <View style={f.wrap}>
      <AppText style={f.label}>{label}</AppText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.inkLight}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[f.input, multiline && f.multiline]}
      />
    </View>
  );
}

const f = StyleSheet.create({
  wrap:      { flex: 1, gap: 6 },
  label:     { fontSize: 12, fontWeight: '600', color: C.inkMid, letterSpacing: 0 },
  input: {
    backgroundColor: C.bg, borderRadius: 14,
    paddingHorizontal: 16, height: 52,
    fontSize: 15, color: C.ink, fontWeight: '500',
  },
  multiline: { height: undefined, minHeight: 88, paddingTop: 14, paddingBottom: 14, textAlignVertical: 'top' },
});

/** Pill option group */
function PillGroup<T extends string>({
  label, value, options, onChange,
}: {
  label: string; value: T;
  options: { label: string; value: T; color?: string; price?: number }[];
  onChange: (v: T) => void;
}) {
  return (
    <View style={pg.wrap}>
      <AppText style={pg.label}>{label}</AppText>
      <View style={pg.row}>
        {options.map((opt) => {
          const active = value === opt.value;
          const col = opt.color ?? C.pink;
          return (
            <Pressable
              key={opt.value}
              style={[pg.pill, active ? { backgroundColor: col } : { backgroundColor: C.bg }]}
              onPress={() => onChange(opt.value)}
            >
              <AppText style={[pg.text, { color: active ? '#fff' : col }]}>
                {opt.label}{opt.price ? ` $${opt.price}` : ''}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const pg = StyleSheet.create({
  wrap:  { gap: 8 },
  label: { fontSize: 12, fontWeight: '600', color: C.inkMid, letterSpacing: 0 },
  row:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 50, minHeight: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  text: { fontSize: 13, fontWeight: '700' },
});

/** Toggle with icon + label */
function ToggleRow({
  icon, label, desc, value, onChange,
}: {
  icon: AppIconName; label: string; desc?: string;
  value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <Pressable style={tr.wrap} onPress={() => onChange(!value)}>
      <View style={tr.iconBox}>
        <AppIcon name={icon} size={18} color={C.pink} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText style={tr.label}>{label}</AppText>
        {desc ? <AppText style={tr.desc}>{desc}</AppText> : null}
      </View>
      <View style={[tr.track, value && tr.trackOn]}>
        <View style={[tr.thumb, value && tr.thumbOn]} />
      </View>
    </Pressable>
  );
}

const tr = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.bg, borderRadius: 16, padding: 14, minHeight: 56,
  },
  iconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.pinkFaint, alignItems: 'center', justifyContent: 'center',
  },
  label:   { fontSize: 14, fontWeight: '700', color: C.ink },
  desc:    { fontSize: 11, color: C.inkLight, marginTop: 2 },
  track: {
    width: 52, height: 30, borderRadius: 15,
    backgroundColor: '#DDD6DB', padding: 3, justifyContent: 'center', flexShrink: 0,
  },
  trackOn:  { backgroundColor: C.pink },
  thumb: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18, shadowRadius: 3, elevation: 2,
  },
  thumbOn:  { transform: [{ translateX: 22 }] },
});

/** Section card */
function Section({ title, icon, children }: { title: string; icon: AppIconName; children: ReactNode }) {
  return (
    <View style={sc.wrap}>
      <View style={sc.head}>
        <View style={sc.iconBox}>
          <AppIcon name={icon} size={20} color={C.pink} />
        </View>
        <AppText style={sc.title}>{title}</AppText>
      </View>
      {children}
    </View>
  );
}

const sc = StyleSheet.create({
  wrap: {
    backgroundColor: C.surface, borderRadius: 22, padding: 20,
    shadowColor: 'rgba(180,20,100,0.07)', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1, shadowRadius: 16, elevation: 2,
    gap: 16,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: C.pinkFaint, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 17, fontWeight: '700', color: C.ink, letterSpacing: 0, flex: 1 },
});

/** Stat tile for the quick summary strip */
function StatTile({ icon, label, value, color }: {
  icon: AppIconName; label: string; value: string; color?: string;
}) {
  return (
    <View style={st.wrap}>
      <View style={[st.iconBox, { backgroundColor: color ? `${color}18` : C.pinkFaint }]}>
        <AppIcon name={icon} size={18} color={color ?? C.pink} />
      </View>
      <AppText style={st.label}>{label}</AppText>
      <AppText style={[st.value, color ? { color } : {}]} numberOfLines={1}>{value}</AppText>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: {
    flexGrow: 1, flexBasis: 100,
    backgroundColor: C.surface, borderRadius: 18,
    padding: 14, gap: 6,
    shadowColor: 'rgba(180,20,100,0.06)', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 10, elevation: 1,
  },
  iconBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  label: { fontSize: 11, fontWeight: '600', color: C.inkLight },
  value: { fontSize: 14, fontWeight: '800', color: C.ink },
});

// ─── Loading / Empty screens ─────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={[C.pink, C.pinkDark]} style={styles.headerGrad}>
        <View style={styles.headerInner}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={14}>
            <AppIcon name="ChevronLeft" size={22} color="#fff" />
          </Pressable>
          <AppText style={styles.headerTitle}>Order Detail</AppText>
        </View>
      </LinearGradient>
      <View style={styles.centeredBody}>
        <ActivityIndicator color={C.pink} size="large" />
        <AppText style={styles.loadingText}>Loading order…</AppText>
      </View>
    </SafeAreaView>
  );
}

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={[C.pink, C.pinkDark]} style={styles.headerGrad}>
        <View style={styles.headerInner}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={14}>
            <AppIcon name="ChevronLeft" size={22} color="#fff" />
          </Pressable>
          <AppText style={styles.headerTitle}>Order Detail</AppText>
        </View>
      </LinearGradient>
      <View style={styles.centeredBody}>
        <View style={styles.errorIcon}>
          <AppIcon name="ShieldCheck" size={32} color={C.error} />
        </View>
        <AppText style={styles.errorTitle}>Order unavailable</AppText>
        <AppText style={styles.errorBody}>{message}</AppText>
        <Pressable style={styles.retryBtn} onPress={onRetry}>
          <AppIcon name="RotateCcw" size={18} color={C.pink} />
          <AppText style={styles.retryBtnText}>Try again</AppText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────────
function DetailContent() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const orderId = typeof params.orderId === 'string' ? params.orderId : '';

  const [order,   setOrder]   = useState<Order | null>(null);
  const [form,    setForm]    = useState<EditableForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    if (!orderId) { setLoading(false); setMessage({ type: 'error', text: 'Missing order ID.' }); return; }
    setLoading(true); setMessage(null);
    try {
      const next = await getOrder(orderId);
      setOrder(next);
      setForm(next ? formFromOrder(next) : null);
      if (!next) setMessage({ type: 'error', text: 'Order not found.' });
    } catch (err) {
      setMessage({ type: 'error', text: getAuthErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  const product       = form ? getProduct(form) : productTypeOptions[0];
  const total         = form ? getOrderTotal(form) : 0;
  const cardStatus    = order?.cardStatus ?? 'active';
  const cardStatusOpt = orderCardStatusOptions.find((i) => i.value === cardStatus) ?? orderCardStatusOptions[0];
  const workflowOpt   = orderStatusOptions.find((i) => i.value === order?.status);
  const payColor      = form ? paymentStatusColors[form.paymentStatus] : C.inkLight;

  const setField = <K extends keyof EditableForm>(key: K, value: EditableForm[K]) =>
    setForm((cur) => (cur ? { ...cur, [key]: value } : cur));

  async function handleSave() {
    if (!order || !form) return;
    if (!form.customerName.trim()) {
      Alert.alert('Required', 'Customer name is required.');
      return;
    }
    if (!form.phone.trim() && !form.telegram.trim()) {
      Alert.alert('Required', 'Add at least one contact: phone or Telegram.');
      return;
    }

    const quantity = Number.parseInt(form.quantity, 10);
    const depositAmount = form.depositAmount.trim() ? Number(form.depositAmount) : 0;

    setSaving(true);
    setMessage(null);
    try {
      await updateOrderDetails(order.id, {
        customerName: form.customerName,
        phone: form.phone,
        telegram: form.telegram,
        whatsapp: form.whatsapp,
        email: form.email,
        company: form.company,
        jobTitle: form.jobTitle,
        deliveryAddress: form.deliveryAddress,
        productType: form.productType,
        quantity,
        cardDesign: form.cardDesign,
        nfcEnabled: form.nfcEnabled,
        nfcTargetUrl: form.nfcTargetUrl,
        qrPrinted: form.qrPrinted,
        paymentStatus: form.paymentStatus,
        paymentMethod: form.paymentMethod,
        depositAmount,
        dueDate: form.dueDate,
        priority: form.priority,
        notes: form.notes,
      }, user?.id);
      setMessage({ type: 'success', text: 'Order updated.' });
      await load();
    } catch (err) {
      setMessage({ type: 'error', text: getAuthErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  async function handleFreezeToggle() {
    if (!order || !form) return;
    const frozen = cardStatus === 'frozen';
    setSaving(true); setMessage(null);
    try {
      if (frozen) {
        await unfreezeOrderCard(order.id, user?.id);
        setMessage({ type: 'success', text: 'Card unfrozen.' });
      } else {
        await freezeOrderCard(order.id, form.freezeReason, user?.id);
        setMessage({ type: 'success', text: 'Card frozen.' });
      }
      await load();
    } catch (err) {
      setMessage({ type: 'error', text: getAuthErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  function handleCloseToggle() {
    if (!order) return;
    const closed = cardStatus === 'closed';
    Alert.alert(
      closed ? 'Reopen card?' : 'Close card?',
      closed
        ? 'Move the card back to active management.'
        : 'Hide the card from the active pipeline. You can reopen it later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: closed ? 'Reopen' : 'Close',
          style: closed ? 'default' : 'destructive',
          onPress: async () => {
            setSaving(true); setMessage(null);
            try {
              if (closed) {
                await reopenOrderCard(order.id, user?.id);
                setMessage({ type: 'success', text: 'Card reopened.' });
              } else {
                await closeOrderCard(order.id, user?.id);
                setMessage({ type: 'success', text: 'Card closed.' });
              }
              await load();
            } catch (err) {
              setMessage({ type: 'error', text: getAuthErrorMessage(err) });
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  }

  const summaryRows = useMemo(() => {
    if (!order || !form) return [];
    return [
      ['Workflow', workflowOpt?.label ?? order.status, workflowOpt?.color],
      ['Card',     cardStatusOpt.label,                 cardStatusOpt.color],
      ['Product',  `${product.label} × ${form.quantity || 1}`, undefined],
      ['Total',    `$${total}`,                         payColor],
      ['Card code',order.cardCode || 'Pending',         undefined],
      ['Created',  formatDate(order.createdAt),         undefined],
      ['Updated',  formatDate(order.updatedAt),         undefined],
    ] as const;
  }, [cardStatusOpt, form, order, product.label, total, workflowOpt, payColor]);

  if (loading) return <LoadingScreen />;
  if (!order || !form) {
    return (
      <ErrorScreen
        message={message?.text ?? 'Order not found.'}
        onRetry={load}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <LinearGradient colors={[C.pink, C.pinkDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.headerGrad}>
        <View style={styles.headerInner}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={14}>
            <AppIcon name="ChevronLeft" size={22} color="#fff" />
          </Pressable>
          <View style={styles.headerMid}>
            <AppText style={styles.headerTitle} numberOfLines={1}>{order.customerName || 'Order Detail'}</AppText>
            <AppText style={styles.headerSub}>#{order.id.slice(0, 8).toUpperCase()} · {order.cardCode || 'No code'}</AppText>
          </View>
          <View style={[styles.statusPill, { backgroundColor: `${cardStatusOpt.color}22` }]}>
            <View style={[styles.statusDot, { backgroundColor: cardStatusOpt.color }]} />
            <AppText style={[styles.statusText, { color: cardStatusOpt.color }]}>{cardStatusOpt.label}</AppText>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Message banner ── */}
          {message && (
            <View style={[styles.banner, message.type === 'error' ? styles.bannerError : styles.bannerSuccess]}>
              <AppIcon
                name={message.type === 'error' ? 'Info' : 'ShieldCheck'}
                size={16}
                color={message.type === 'error' ? C.error : C.success}
              />
              <AppText style={[styles.bannerText, message.type === 'error' ? styles.bannerTextError : styles.bannerTextSuccess]}>
                {message.text}
              </AppText>
            </View>
          )}

          {/* ── Card hero ── */}
          {order.designArtworkUrl ? (
            <ImageBackground
              source={{ uri: order.designArtworkUrl }}
              imageStyle={styles.heroCardImage}
              style={styles.heroCard}
            >
              <View style={styles.heroOverlay}>
                <HeroCardInner
                  productLabel={product.label}
                  cardCode={order.cardCode}
                  customerName={form.customerName}
                  quantity={form.quantity}
                  sub={form.customerName}
                />
              </View>
            </ImageBackground>
          ) : (
            <LinearGradient
              colors={['#1A0A12', '#3D1A2A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <HeroCardInner
                productLabel={product.label}
                cardCode={order.cardCode}
                customerName={form.customerName}
                quantity={form.quantity}
                sub={form.cardDesign.replace(/_/g, ' ')}
              />
            </LinearGradient>
          )}

          {/* ── Quick stats ── */}
          <View style={styles.statRow}>
            <StatTile
              icon="BadgeCheck"
              label="Workflow"
              value={workflowOpt?.label ?? order.status}
              color={workflowOpt?.color}
            />
            <StatTile
              icon="CalendarDays"
              label="Due date"
              value={form.dueDate || 'Not set'}
            />
            <StatTile
              icon="CircleDollarSign"
              label="Total"
              value={`$${total}`}
              color={payColor}
            />
          </View>

          {/* ── Summary ── */}
          <Section title="Summary" icon="ShieldCheck">
            <View style={styles.summaryList}>
              {summaryRows.map(([label, value, color]) => (
                <View key={label} style={styles.summaryRow}>
                  <AppText style={styles.summaryKey}>{label}</AppText>
                  <AppText style={[styles.summaryVal, color ? { color } : {}]} numberOfLines={1}>{value}</AppText>
                </View>
              ))}
            </View>
          </Section>

          {/* ── Customer ── */}
          <Section title="Customer" icon="User">
            <Field label="Customer name" value={form.customerName}
              onChangeText={(v) => setField('customerName', v)} />
            <View style={styles.row2}>
              <Field label="Phone" value={form.phone} onChangeText={(v) => setField('phone', v)} keyboardType="phone-pad" />
              <Field label="Telegram" value={form.telegram} onChangeText={(v) => setField('telegram', v)} />
            </View>
            <View style={styles.row2}>
              <Field label="WhatsApp" value={form.whatsapp} onChangeText={(v) => setField('whatsapp', v)} keyboardType="phone-pad" />
              <Field label="Email" value={form.email} onChangeText={(v) => setField('email', v)} keyboardType="email-address" />
            </View>
            <View style={styles.row2}>
              <Field label="Company" value={form.company} onChangeText={(v) => setField('company', v)} />
              <Field label="Job title" value={form.jobTitle} onChangeText={(v) => setField('jobTitle', v)} />
            </View>
            <Field label="Delivery address" value={form.deliveryAddress}
              onChangeText={(v) => setField('deliveryAddress', v)} multiline />
          </Section>

          {/* ── Product ── */}
          <Section title="Product" icon="CreditCard">
            <PillGroup
              label="Product type"
              value={form.productType}
              options={productTypeOptions.map((i) => ({ label: i.label, value: i.value, price: i.price, color: C.pink }))}
              onChange={(v) => setField('productType', v)}
            />
            <View style={styles.row2}>
              <Field label="Quantity" value={form.quantity}
                onChangeText={(v) => setField('quantity', v.replace(/[^\d]/g, ''))}
                keyboardType="numeric" />
              <Field label="Due date" value={form.dueDate}
                onChangeText={(v) => setField('dueDate', v)} placeholder="YYYY-MM-DD" />
            </View>
            <PillGroup
              label="Card design"
              value={form.cardDesign}
              options={cardDesignOptions.map((i) => ({ ...i, color: C.pink }))}
              onChange={(v) => setField('cardDesign', v)}
            />
            <PillGroup
              label="Priority"
              value={form.priority}
              options={priorityOptions.map((i) => ({ ...i }))}
              onChange={(v) => setField('priority', v)}
            />
          </Section>

          {/* ── Payment ── */}
          <Section title="Payment" icon="CircleDollarSign">
            <PillGroup
              label="Payment status"
              value={form.paymentStatus}
              options={paymentStatusOptions.map((i) => ({ ...i, color: paymentStatusColors[i.value] }))}
              onChange={(v) => setField('paymentStatus', v)}
            />
            <PillGroup
              label="Payment method"
              value={form.paymentMethod || paymentMethodOptions[0].value}
              options={paymentMethodOptions.map((i) => ({ ...i, color: C.pink }))}
              onChange={(v) => setField('paymentMethod', v)}
            />
            <View style={styles.row2}>
              <Field label="Deposit" value={form.depositAmount}
                onChangeText={(v) => setField('depositAmount', v.replace(/[^\d.]/g, ''))}
                keyboardType="numeric" />
              <View style={styles.totalTile}>
                <AppText style={styles.totalTileLabel}>Total</AppText>
                <AppText style={[styles.totalTileAmt, { color: payColor }]}>${total}</AppText>
              </View>
            </View>
          </Section>

          {/* ── NFC & Artwork ── */}
          <Section title="NFC & Artwork" icon="Nfc">
            <ToggleRow
              icon="Nfc" label="NFC write" desc="Chip will be programmed"
              value={form.nfcEnabled} onChange={(v) => setField('nfcEnabled', v)}
            />
            <ToggleRow
              icon="QrCode" label="QR printed" desc="QR code on card face"
              value={form.qrPrinted} onChange={(v) => setField('qrPrinted', v)}
            />
            <Field label="NFC target URL" value={form.nfcTargetUrl}
              onChangeText={(v) => setField('nfcTargetUrl', v)}
              keyboardType="url" placeholder={order.profileUrl ?? 'Auto-generated profile URL'} />
            {order.designArtworkUrl ? (
              <View style={styles.artworkStrip}>
                <View style={styles.artworkStripIcon}>
                  <AppIcon name="Image" size={18} color={C.pink} />
                </View>
                <AppText style={styles.artworkStripText} numberOfLines={1}>
                  {order.designArtworkFileName || 'Custom artwork attached'}
                </AppText>
              </View>
            ) : null}
          </Section>

          {/* ── Notes & Controls ── */}
          <Section title="Notes & Card controls" icon="ShieldCheck">
            <Field label="Notes" value={form.notes}
              onChangeText={(v) => setField('notes', v)} multiline />
            <Field label="Freeze reason" value={form.freezeReason}
              onChangeText={(v) => setField('freezeReason', v)}
              placeholder="Reason shown to admin and sales" />

            <View style={styles.actionRow}>
              <Pressable
                style={[
                  styles.actionBtn,
                  cardStatus === 'frozen' ? styles.actionBtnGreen : styles.actionBtnBlue,
                  (saving || cardStatus === 'closed') && styles.actionBtnDisabled,
                ]}
                onPress={handleFreezeToggle}
                disabled={saving || cardStatus === 'closed'}
              >
                <AppIcon name={cardStatus === 'frozen' ? 'RotateCcw' : 'Snowflake'} size={18} color="#fff" />
                <AppText style={styles.actionBtnText}>
                  {cardStatus === 'frozen' ? 'Unfreeze' : 'Freeze'}
                </AppText>
              </Pressable>
              <Pressable
                style={[
                  styles.actionBtn,
                  cardStatus === 'closed' ? styles.actionBtnGreen : styles.actionBtnDanger,
                  saving && styles.actionBtnDisabled,
                ]}
                onPress={handleCloseToggle}
                disabled={saving}
              >
                <AppIcon name={cardStatus === 'closed' ? 'ArchiveRestore' : 'Archive'} size={18} color="#fff" />
                <AppText style={styles.actionBtnText}>
                  {cardStatus === 'closed' ? 'Reopen' : 'Close card'}
                </AppText>
              </Pressable>
            </View>
          </Section>

        </ScrollView>

        <IosFormActionFooter
          secondaryLabel="Reset"
          onSecondaryPress={load}
          primaryLabel={saving ? 'Saving...' : 'Save changes'}
          onPrimaryPress={handleSave}
          loading={saving}
          disabled={saving}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Hero card interior (shared between artwork and blank variants) ────────────
function HeroCardInner({ productLabel, cardCode, customerName, quantity, sub }: {
  productLabel: string; cardCode?: string; customerName: string; quantity: string; sub: string;
}) {
  return (
    <>
      <View style={hero.top}>
        <View style={hero.chip}>
          <View style={hero.chipLine} />
          <View style={hero.chipLine} />
        </View>
        <AppIcon name="Nfc" size={22} color="rgba(255,255,255,0.7)" />
      </View>
      <View>
        <AppText style={hero.code}>{cardCode || 'BC-0000'}</AppText>
        <AppText style={hero.product}>{productLabel.toUpperCase()}</AppText>
      </View>
      <View style={hero.bottom}>
        <View style={{ flex: 1 }}>
          <AppText style={hero.name} numberOfLines={1}>{customerName || 'Customer'}</AppText>
          <AppText style={hero.sub} numberOfLines={1}>{sub.toUpperCase()}</AppText>
        </View>
        <View style={hero.qtyBadge}>
          <AppText style={hero.qty}>×{quantity || 1}</AppText>
        </View>
      </View>
    </>
  );
}

const hero = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chip: {
    width: 42, height: 30, borderRadius: 7,
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.26)',
    backgroundColor: 'rgba(255,255,255,0.10)',
    padding: 6, justifyContent: 'space-between',
  },
  chipLine: { height: 1.2, backgroundColor: 'rgba(255,255,255,0.55)' },
  code:    { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: 0 },
  product: { color: 'rgba(255,255,255,0.60)', fontSize: 10, fontWeight: '700', marginTop: 2, letterSpacing: 0 },
  bottom:  { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  name:    { color: '#fff', fontSize: 15, fontWeight: '800' },
  sub:     { color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '700', marginTop: 2 },
  qtyBadge:{
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  qty:     { color: '#fff', fontSize: 13, fontWeight: '800' },
});

// ─── Root export ──────────────────────────────────────────────────────────────
export function OrderDetailScreen() {
  return (
    <AuthGate allowedRoles={['sales', 'admin', 'super_admin']}>
      <DetailContent />
    </AuthGate>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  // Header
  headerGrad: {},
  headerInner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  headerMid: { flex: 1 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 0 },
  headerSub:   { color: 'rgba(255,255,255,0.70)', fontSize: 11, fontWeight: '600', marginTop: 2 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 50, paddingHorizontal: 10, paddingVertical: 6, flexShrink: 0,
  },
  statusDot:  { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '800' },

  // Loading / error screens
  centeredBody: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24,
  },
  loadingText: { color: C.inkLight, fontSize: 14, fontWeight: '600', marginTop: 8 },
  errorIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: C.errorBg, alignItems: 'center', justifyContent: 'center',
  },
  errorTitle: { fontSize: 18, fontWeight: '700', color: C.ink },
  errorBody:  { fontSize: 14, color: C.inkMid, textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.pinkFaint, borderRadius: 16,
    paddingHorizontal: 20, paddingVertical: 12, marginTop: 4,
  },
  retryBtnText: { color: C.pink, fontSize: 14, fontWeight: '700' },

  // Scroll
  scroll: { padding: 16, paddingBottom: 110, gap: 12 },

  // Banner
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
  },
  bannerError:      { backgroundColor: C.errorBg },
  bannerSuccess:    { backgroundColor: C.successBg },
  bannerText:       { fontSize: 13, fontWeight: '600', flex: 1, lineHeight: 18 },
  bannerTextError:  { color: C.error },
  bannerTextSuccess:{ color: C.success },

  // Hero card
  heroCard: {
    borderRadius: 22, minHeight: 200, padding: 22,
    justifyContent: 'space-between',
    shadowColor: '#7A0D47',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22, shadowRadius: 20, elevation: 6,
  },
  heroCardImage: { borderRadius: 22 },
  heroOverlay: {
    flex: 1, justifyContent: 'space-between',
    margin: -22, padding: 22,
    backgroundColor: C.overlay,
    borderRadius: 22,
  },

  // Quick stats
  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  // Summary
  summaryList: { gap: 0 },
  summaryRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 11, gap: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.bg,
  },
  summaryKey: { fontSize: 13, color: C.inkLight, fontWeight: '500' },
  summaryVal: { fontSize: 13, fontWeight: '700', color: C.ink, textAlign: 'right', flex: 1 },

  // Layout
  row2: { flexDirection: 'row', gap: 10 },

  // Payment total tile
  totalTile: {
    flex: 1, backgroundColor: C.bg, borderRadius: 14,
    minHeight: 52, paddingHorizontal: 16, justifyContent: 'center', gap: 3,
  },
  totalTileLabel: { fontSize: 11, fontWeight: '600', color: C.inkLight },
  totalTileAmt:   { fontSize: 20, fontWeight: '800' },

  // Artwork strip
  artworkStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.pinkFaint, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  artworkStripIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.pinkLight, alignItems: 'center', justifyContent: 'center',
  },
  artworkStripText: { flex: 1, fontSize: 13, fontWeight: '600', color: C.pink },

  // Action buttons (freeze / close)
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, height: 52, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  actionBtnBlue:     { backgroundColor: C.blue },
  actionBtnGreen:    { backgroundColor: C.success },
  actionBtnDanger:   { backgroundColor: C.error },
  actionBtnDisabled: { opacity: 0.45 },
  actionBtnText:     { color: '#fff', fontSize: 14, fontWeight: '700' },

});
