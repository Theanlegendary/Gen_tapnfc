import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { productTypeOptions, paymentMethodOptions } from '@/src/constants/options';
import { useAuth } from '@/src/hooks/useAuth';
import { auth } from '@/src/services/firebaseClient';
import { createOrder } from '@/src/services/firestoreService';
import { getAuthErrorMessage } from '@/src/services/authService';
import { theme } from '@/src/constants/theme';

const salesTheme = theme.roles.sales;
const PINK = salesTheme.primary;
const PINK_BG = salesTheme.background;

type ProductValue = typeof productTypeOptions[number]['value'];
type PaymentValue = typeof paymentMethodOptions[number]['value'];
type Priority = 'low' | 'normal' | 'high' | 'urgent';
type PaymentStatus = 'unpaid' | 'partial' | 'paid';
type SubmitNotice = { tone: 'info' | 'success' | 'error'; title: string; message: string } | null;

const PRIORITY_OPTIONS = [
  { label: 'Low',    value: 'low'    as Priority, color: '#6E8A95' },
  { label: 'Normal', value: 'normal' as Priority, color: theme.colors.primary },
  { label: 'High',   value: 'high'   as Priority, color: '#FF9F0A' },
  { label: 'Urgent', value: 'urgent' as Priority, color: '#FF3B30' },
];

const PAYMENT_STATUS_OPTIONS = [
  { label: 'Unpaid',  value: 'unpaid'  as PaymentStatus, color: '#FF3B30' },
  { label: 'Partial', value: 'partial' as PaymentStatus, color: '#FF9F0A' },
  { label: 'Paid',    value: 'paid'    as PaymentStatus, color: theme.status.success },
];

function moneyValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

async function withTimeout<T>(work: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  try {
    return await Promise.race([work, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function getOrderCreationMessage(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: unknown }).code) : '';
  const message = getAuthErrorMessage(error);

  if (code === 'permission-denied' || message.toLowerCase().includes('permission')) {
    return 'Your account was blocked by Firestore rules. Deploy the updated firestore.rules (sales and printer can create orders), then try again.';
  }
  if (message.toLowerCase().includes('open order already exists')) {
    return 'An open order already exists for this contact and product. Use a different phone number or product type, or close the existing order first.';
  }
  if (message.toLowerCase().includes('session expired')) {
    return message;
  }
  if (message.toLowerCase().includes('taking too long')) {
    return message;
  }
  return message;
}

const ORDER_CREATOR_ROLES = ['sales', 'printer', 'admin', 'super_admin'] as const;

// Card gradients for each product type
const CARD_GRADIENTS: Record<string, [string, string]> = {
  wood_card:  ['#6B5B4B', '#2F2923'],
  metal_card: ['#8E8E93', '#3A3A3C'],
  pvc_card:   ['#007AFF', '#1C1C1E'],
};

function BankCard({ product, selected, onPress }: {
  product: typeof productTypeOptions[number];
  selected: boolean;
  onPress: () => void;
}) {
  const [g1, g2] = CARD_GRADIENTS[product.value] ?? ['#333', '#111'];
  return (
    <Pressable onPress={onPress} style={[card.wrap, selected && card.wrapSelected]}>
      <LinearGradient colors={[g1, g2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={card.gradient}>
        {/* Chip */}
        <View style={card.chip}>
          <View style={card.chipLine} />
          <View style={card.chipLine} />
        </View>
        {/* NFC symbol */}
        <AppText style={card.nfc}>))))</AppText>
        {/* Product name */}
        <AppText style={card.name}>{product.label}</AppText>
        <AppText style={card.price}>${product.price}</AppText>
        {/* Dots */}
        <View style={card.dots}>
          {[0,1,2,3].map(i => <View key={i} style={card.dot} />)}
          <AppText style={card.dotsText}>SITEHUB</AppText>
        </View>
      </LinearGradient>
      {selected && (
        <View style={card.checkBadge}>
          <AppIcon name="ShieldCheck" size={14} color="#fff" />
        </View>
      )}
    </Pressable>
  );
}

const card = StyleSheet.create({
  wrap: { flex: 1, borderRadius: 18, overflow: 'visible', borderWidth: 2, borderColor: 'transparent' },
  wrapSelected: { borderColor: PINK },
  gradient: { borderRadius: 16, padding: 14, height: 120, justifyContent: 'space-between' },
  chip: { width: 28, height: 20, backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: 5, justifyContent: 'space-around', padding: 3 },
  chipLine: { height: 2, backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: 1 },
  nfc: { position: 'absolute', top: 12, right: 12, color: 'rgba(255,255,255,0.5)', fontSize: 12, letterSpacing: 0 },
  name: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0, marginTop: 4 },
  price: { color: 'rgba(255,255,255,0.9)', fontSize: 18, fontWeight: '700' },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotsText: { color: 'rgba(255,255,255,0.6)', fontSize: 8, fontWeight: '700', marginLeft: 4, letterSpacing: 0 },
  checkBadge: { position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: 12, backgroundColor: PINK, alignItems: 'center', justifyContent: 'center', ...theme.shadows.control },
});

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 5 }}>
      <AppText style={styles.fieldLabel}>{label}{required ? <AppText style={{ color: theme.colors.danger }}> *</AppText> : null}</AppText>
      {children}
      {hint ? <AppText style={styles.fieldHint}>{hint}</AppText> : null}
    </View>
  );
}

function PillPicker<T extends string>({ options, value, onChange }: {
  options: { label: string; value: T; color?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map(opt => (
        <Pressable key={opt.value}
          style={[styles.pill, value === opt.value && { backgroundColor: opt.color ?? PINK, borderColor: opt.color ?? PINK }]}
          onPress={() => onChange(opt.value)}>
          <AppText style={[styles.pillText, value === opt.value && { color: '#fff' }]}>{opt.label}</AppText>
        </Pressable>
      ))}
    </View>
  );
}

function StepIndicator({ step, total }: { step: number; total: number }) {
  const labels = ['Customer', 'Product', 'Payment'];
  return (
    <View style={styles.stepWrap}>
      {labels.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <View key={label} style={styles.stepItem}>
            <View style={[styles.stepCircle, done && styles.stepDone, active && styles.stepActive]}>
              <AppText style={[styles.stepNum, (done || active) && { color: done ? theme.status.success : '#fff' }]}>
                {done ? 'OK' : String(n)}
              </AppText>
            </View>
            <AppText style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</AppText>
            {i < total - 1 && <View style={[styles.stepLine, done && styles.stepLineDone]} />}
          </View>
        );
      })}
    </View>
  );
}

function SuccessScreen({ orderId, onNewOrder, onViewOrders }: {
  orderId: string;
  onNewOrder: () => void;
  onViewOrders: () => void;
}) {
  return (
    <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
      <View style={styles.successIcon}>
        <AppIcon name="ShieldCheck" size={48} color={theme.status.success} />
      </View>
      <AppText style={styles.successTitle}>Order Created!</AppText>
      <AppText style={styles.successSub}>#{orderId.slice(0, 8).toUpperCase()} has been pushed to the printer queue.</AppText>
      <View style={{ gap: 12, width: '100%', marginTop: 32 }}>
        <Pressable style={styles.submitBtn} onPress={onViewOrders}>
          <AppIcon name="ClipboardList" size={18} color="#fff" />
          <AppText style={styles.submitBtnText}>View Queue</AppText>
        </Pressable>
        <Pressable style={styles.draftBtn} onPress={onNewOrder}>
          <AppText style={styles.draftBtnText}>Create Another Order</AppText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function SubmitNoticeCard({ notice }: { notice: SubmitNotice }) {
  if (!notice) return null;

  const isError = notice.tone === 'error';
  const isSuccess = notice.tone === 'success';

  return (
    <View style={[
      styles.notice,
      isError ? styles.noticeError : isSuccess ? styles.noticeSuccess : styles.noticeInfo,
    ]}>
      <AppIcon
        name={isError ? 'TriangleAlert' : isSuccess ? 'CircleCheck' : 'Info'}
        size={18}
        color={isError ? theme.colors.danger : isSuccess ? theme.status.success : PINK}
      />
      <View style={styles.noticeCopy}>
        <AppText style={[
          styles.noticeTitle,
          isError ? styles.noticeErrorText : isSuccess ? styles.noticeSuccessText : styles.noticeInfoText,
        ]}>
          {notice.title}
        </AppText>
        <AppText style={styles.noticeMessage}>{notice.message}</AppText>
      </View>
    </View>
  );
}

export function NewOrderScreen() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  // Step 1
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');

  // Step 2
  const [product, setProduct] = useState<ProductValue>('wood_card');
  const [quantity, setQuantity] = useState('1');
  const [priority, setPriority] = useState<Priority>('normal');
  const [nfcWrite, setNfcWrite] = useState(true);
  const [qrPrinted, setQrPrinted] = useState(false);

  // Step 3
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('unpaid');
  const [paymentMethod, setPaymentMethod] = useState<PaymentValue>('online');
  const [deposit, setDeposit] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitNotice, setSubmitNotice] = useState<SubmitNotice>(null);

  const selectedProduct = productTypeOptions.find(p => p.value === product)!;
  const qty = Math.max(1, parseInt(quantity) || 1);
  const total = selectedProduct.price * qty;

  function resetForm() {
    setStep(1); setCreatedOrderId(null);
    setCustomerName(''); setPhone(''); setTelegram(''); setEmail('');
    setCompany(''); setJobTitle(''); setProduct('wood_card'); setQuantity('1');
    setPriority('normal'); setNfcWrite(true); setQrPrinted(false);
    setPaymentStatus('unpaid'); setPaymentMethod('online');
    setDeposit(''); setDueDate(''); setDeliveryAddress(''); setNotes('');
    setSubmitNotice(null);
  }

  function validate() {
    if (step === 1) {
      if (!customerName.trim()) {
        const message = 'Customer name is required before continuing.';
        setSubmitNotice({ tone: 'error', title: 'Missing customer name', message });
        Alert.alert('Required', message);
        return false;
      }
      if (!phone.trim() && !telegram.trim()) {
        const message = 'Add at least one contact method: phone or Telegram.';
        setSubmitNotice({ tone: 'error', title: 'Missing contact', message });
        Alert.alert('Required', message);
        return false;
      }
    }

    if (step === 3) {
      const depositAmount = moneyValue(deposit);
      if (depositAmount === null || (depositAmount !== undefined && depositAmount < 0)) {
        const message = 'Deposit amount must be a valid number.';
        setSubmitNotice({ tone: 'error', title: 'Invalid deposit', message });
        Alert.alert('Invalid deposit', message);
        return false;
      }
    }

    setSubmitNotice(null);
    return true;
  }

  async function handleSubmit() {
    if (saving) return;
    if (!user || user.isGuest) {
      const message = 'Please sign in with a sales, printer, or admin staff account before creating an order.';
      setSubmitNotice({ tone: 'error', title: 'Sign in required', message });
      Alert.alert('Sign in required', message);
      return;
    }
    if (!ORDER_CREATOR_ROLES.includes(user.role as typeof ORDER_CREATOR_ROLES[number])) {
      const message = 'This account role cannot create orders. Use a sales, printer, or admin account.';
      setSubmitNotice({ tone: 'error', title: 'Order creation blocked', message });
      Alert.alert('Order creation blocked', message);
      return;
    }
    const staffId = auth.currentUser?.uid ?? user.id;
    if (!staffId || staffId === 'guest') {
      const message = 'Your Firebase session is missing. Sign out, sign in with a demo staff account, and try again.';
      setSubmitNotice({ tone: 'error', title: 'Session expired', message });
      Alert.alert('Session expired', message);
      return;
    }
    if (!validate()) return;

    const depositAmount = moneyValue(deposit);
    setSaving(true);
    setSubmitNotice({
      tone: 'info',
      title: 'Creating order',
      message: 'Saving customer details and adding the job to the printer queue...',
    });

    try {
      const orderId = await withTimeout(
        createOrder({
          customerName: customerName.trim(),
          phone: phone.trim(),
          telegram: telegram.trim() || undefined,
          email: email.trim() || undefined,
          company: company.trim() || undefined,
          jobTitle: jobTitle.trim() || undefined,
          deliveryAddress: deliveryAddress.trim() || undefined,
          productType: product,
          quantity: qty,
          cardDesign: 'classic_black',
          nfcEnabled: nfcWrite,
          qrPrinted,
          depositAmount: depositAmount ?? undefined,
          dueDate: dueDate.trim() || undefined,
          paymentStatus,
          paymentMethod,
          priority: priority === 'urgent' ? 'urgent' : 'standard',
          notes: notes.trim() || undefined,
          assignedSalesman: staffId,
          createdBy: staffId,
        }),
        20000,
        'Order creation is taking too long. Check your internet connection and Firebase rules, then try again.'
      );
      setSubmitNotice({
        tone: 'success',
        title: 'Order created',
        message: 'The order was saved and added to the printer queue.',
      });
      setCreatedOrderId(orderId);
    } catch (err) {
      const message = getOrderCreationMessage(err);
      setSubmitNotice({ tone: 'error', title: 'Order not created', message });
      Alert.alert('Order not created', message);
    } finally {
      setSaving(false);
    }
  }

  // Show success screen
  if (createdOrderId) {
    return (
      <SuccessScreen
        orderId={createdOrderId}
        onNewOrder={resetForm}
        onViewOrders={() => router.replace(user?.role === 'printer' ? '/printer/queue' : user?.role === 'admin' || user?.role === 'super_admin' ? '/admin/orders' : '/sales/orders')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => step > 1 ? setStep(s => s - 1) : router.back()} style={styles.backBtn} hitSlop={12}>
          <AppIcon name="ChevronLeft" size={22} color={PINK} />
        </Pressable>
        <AppText style={styles.headerTitle}>New Order</AppText>
        <AppText style={styles.stepCounter}>{step}/3</AppText>
      </View>

      <StepIndicator step={step} total={3} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {step === 1 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AppIcon name="User" size={18} color={PINK} />
              <AppText style={styles.sectionTitle}>Customer Information</AppText>
            </View>
            <Field label="Customer Name" required>
              <TextInput style={styles.input} value={customerName} onChangeText={setCustomerName} placeholder="Full name of client" placeholderTextColor={theme.colors.textMuted} autoCapitalize="words" />
            </Field>
            <View style={styles.row}>
              <View style={styles.half}>
                <Field label="Phone" required>
                  <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="012 345 678" placeholderTextColor={theme.colors.textMuted} keyboardType="phone-pad" />
                </Field>
              </View>
              <View style={styles.half}>
                <Field label="Telegram">
                  <TextInput style={styles.input} value={telegram} onChangeText={setTelegram} placeholder="@username" placeholderTextColor={theme.colors.textMuted} autoCapitalize="none" />
                </Field>
              </View>
            </View>
            <Field label="Email">
              <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="client@example.com" placeholderTextColor={theme.colors.textMuted} keyboardType="email-address" autoCapitalize="none" />
            </Field>
            <View style={styles.row}>
              <View style={styles.half}>
                <Field label="Company">
                  <TextInput style={styles.input} value={company} onChangeText={setCompany} placeholder="Acme Corp" placeholderTextColor={theme.colors.textMuted} />
                </Field>
              </View>
              <View style={styles.half}>
                <Field label="Job Title">
                  <TextInput style={styles.input} value={jobTitle} onChangeText={setJobTitle} placeholder="Manager" placeholderTextColor={theme.colors.textMuted} />
                </Field>
              </View>
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AppIcon name="CreditCard" size={18} color={PINK} />
              <AppText style={styles.sectionTitle}>Product Details</AppText>
            </View>
            <Field label="Card Type" required>
              <View style={styles.cardGrid}>
                {productTypeOptions.map(opt => (
                  <BankCard key={opt.value} product={opt} selected={product === opt.value} onPress={() => setProduct(opt.value)} />
                ))}
              </View>
            </Field>
            <View style={styles.row}>
              <View style={styles.half}>
                <Field label="Quantity" required>
                  <View style={styles.qtyRow}>
                    <Pressable style={styles.qtyBtn} onPress={() => setQuantity(q => String(Math.max(1, (parseInt(q)||1)-1)))}>
                      <AppText style={styles.qtyBtnText}>-</AppText>
                    </Pressable>
                    <TextInput style={styles.qtyInput} value={quantity} onChangeText={setQuantity} keyboardType="number-pad" textAlign="center" />
                    <Pressable style={styles.qtyBtn} onPress={() => setQuantity(q => String((parseInt(q)||1)+1))}>
                      <AppText style={styles.qtyBtnText}>+</AppText>
                    </Pressable>
                  </View>
                </Field>
              </View>
              <View style={styles.half}>
                <Field label="Total">
                  <View style={styles.totalBox}>
                    <AppText style={styles.totalAmount}>${total}</AppText>
                  </View>
                </Field>
              </View>
            </View>
            <Field label="Priority" required>
              <PillPicker options={PRIORITY_OPTIONS} value={priority} onChange={setPriority} />
            </Field>
            <View style={styles.toggleRow}>
              <View style={styles.toggleItem}>
                <AppIcon name="Nfc" size={16} color={PINK} />
                <AppText style={styles.toggleLabel}>NFC Write</AppText>
                <Switch value={nfcWrite} onValueChange={setNfcWrite} trackColor={{ false: '#ddd', true: PINK }} thumbColor="#fff" />
              </View>
              <View style={styles.toggleItem}>
                <AppIcon name="QrCode" size={16} color={PINK} />
                <AppText style={styles.toggleLabel}>QR Printed</AppText>
                <Switch value={qrPrinted} onValueChange={setQrPrinted} trackColor={{ false: '#ddd', true: PINK }} thumbColor="#fff" />
              </View>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AppIcon name="Wallet" size={18} color={PINK} />
              <AppText style={styles.sectionTitle}>Payment & Delivery</AppText>
            </View>
            <Field label="Payment Status" required>
              <PillPicker options={PAYMENT_STATUS_OPTIONS} value={paymentStatus} onChange={setPaymentStatus} />
            </Field>
            <Field label="Payment Method">
              <PillPicker options={paymentMethodOptions.map(o => ({ ...o }))} value={paymentMethod} onChange={setPaymentMethod} />
            </Field>
            <View style={styles.row}>
              <View style={styles.half}>
                <Field label="Deposit ($)">
                  <TextInput style={styles.input} value={deposit} onChangeText={setDeposit} placeholder="0.00" placeholderTextColor={theme.colors.textMuted} keyboardType="decimal-pad" />
                </Field>
              </View>
              <View style={styles.half}>
                <Field label="Due Date">
                  <TextInput style={styles.input} value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" placeholderTextColor={theme.colors.textMuted} />
                </Field>
              </View>
            </View>
            <Field label="Delivery Address">
              <TextInput style={styles.inputMulti} value={deliveryAddress} onChangeText={setDeliveryAddress} placeholder="Street, Building, Floor..." placeholderTextColor={theme.colors.textMuted} multiline numberOfLines={2} />
            </Field>
            <Field label="Notes">
              <TextInput style={styles.inputMulti} value={notes} onChangeText={setNotes} placeholder="Special instructions..." placeholderTextColor={theme.colors.textMuted} multiline numberOfLines={3} />
            </Field>
            {/* Summary */}
            <View style={styles.summaryCard}>
              <AppText style={styles.summaryTitle}>Order Summary</AppText>
              {[
                ['Customer', customerName],
                ['Contact', phone || telegram],
                ['Product', `${selectedProduct.label} x ${qty}`],
                ['Priority', priority],
                ['Payment', paymentStatus],
                ['Total', `$${total}`],
              ].map(([k, v]) => (
                <View key={k} style={styles.summaryRow}>
                  <AppText style={styles.summaryKey}>{k}</AppText>
                  <AppText style={[styles.summaryVal, k === 'Total' && { color: PINK, fontWeight: '700' }]}>{v}</AppText>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <SubmitNoticeCard notice={submitNotice} />
        {step < 3 ? (
          <Pressable style={styles.submitBtn} onPress={() => { if (validate()) setStep(s => s + 1); }}>
            <AppText style={styles.submitBtnText}>Continue</AppText>
            <AppIcon name="ChevronRight" size={18} color="#fff" />
          </Pressable>
        ) : (
          <View style={styles.footerRow}>
            <Pressable style={styles.draftBtn} onPress={() => router.back()}>
              <AppText style={styles.draftBtnText}>Cancel</AppText>
            </Pressable>
            <Pressable style={[styles.submitBtn, { flex: 2 }, saving && { opacity: 0.6 }]} disabled={saving} onPress={handleSubmit}>
              <AppIcon name="ShieldCheck" size={18} color="#fff" />
              <AppText style={styles.submitBtnText}>{saving ? 'Submitting...' : 'Submit Order'}</AppText>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PINK_BG },
  header: { backgroundColor: PINK_BG, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.surfaceGlass, alignItems: 'center', justifyContent: 'center', ...theme.shadows.control },
  backBtnText: { color: PINK, fontSize: 25, fontWeight: '700', lineHeight: 29 },
  headerTitle: { color: theme.colors.textPrimary, fontSize: 20, fontWeight: '700' },
  stepCounter: { color: theme.colors.textMuted, fontSize: 14, fontWeight: '600' },
  // Step indicator
  stepWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 20, backgroundColor: theme.colors.surfaceGlass, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  stepItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface },
  stepActive: { borderColor: PINK, backgroundColor: PINK },
  stepDone: { borderColor: theme.status.success, backgroundColor: 'rgba(0,0,0,0.06)' },
  stepNum: { fontSize: 10, fontWeight: '700', color: theme.colors.textMuted },
  stepLabel: { fontSize: 11, color: theme.colors.textMuted, fontWeight: '500' },
  stepLabelActive: { color: PINK, fontWeight: '700' },
  stepLine: { width: 24, height: 2, backgroundColor: theme.colors.border, marginHorizontal: 4 },
  stepLineDone: { backgroundColor: theme.status.success },
  // Content
  scroll: { padding: 20, paddingBottom: 132, gap: 16 },
  section: { backgroundColor: theme.colors.surface, borderRadius: 24, padding: 22, gap: 18, ...theme.shadows.card },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.textPrimary },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0 },
  fieldHint: { fontSize: 11, color: PINK },
  input: { backgroundColor: theme.colors.surfaceSoft, borderRadius: 16, paddingHorizontal: 16, height: 52, fontSize: 15, color: theme.colors.textPrimary },
  inputMulti: { backgroundColor: theme.colors.surfaceSoft, borderRadius: 16, paddingHorizontal: 16, paddingTop: 13, minHeight: 88, fontSize: 15, color: theme.colors.textPrimary, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  pill: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  pillText: { fontSize: 13, fontWeight: '600', color: theme.colors.textMuted },
  cardGrid: { flexDirection: 'row', gap: 10 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: PINK, alignItems: 'center', justifyContent: 'center', ...theme.shadows.control },
  qtyBtnText: { color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 24 },
  qtyInput: { flex: 1, backgroundColor: theme.colors.surfaceSoft, borderRadius: 16, height: 52, fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary },
  totalBox: { backgroundColor: theme.colors.surfaceSoft, borderRadius: 16, height: 52, alignItems: 'center', justifyContent: 'center' },
  totalAmount: { fontSize: 20, fontWeight: '700', color: PINK },
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.colors.surfaceSoft, borderRadius: 16, padding: 12 },
  toggleLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: theme.colors.textMuted },
  summaryCard: { backgroundColor: theme.colors.surfaceSoft, borderRadius: 18, padding: 16, gap: 8 },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryKey: { fontSize: 12, color: theme.colors.textMuted, textTransform: 'capitalize' },
  summaryVal: { fontSize: 12, fontWeight: '600', color: theme.colors.textPrimary },
  footer: { padding: 16, paddingBottom: 32, backgroundColor: theme.colors.surfaceGlass, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border },
  footerRow: { flexDirection: 'row', gap: 10 },
  submitBtn: { backgroundColor: PINK, borderRadius: 18, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, ...theme.shadows.control },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  draftBtn: { flex: 1, borderRadius: 18, height: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface, ...theme.shadows.control },
  draftBtnText: { color: PINK, fontSize: 15, fontWeight: '700' },
  notice: { borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 10, padding: 12, marginBottom: 12 },
  noticeInfo: { backgroundColor: theme.colors.surfaceSoft, borderColor: theme.colors.border },
  noticeSuccess: { backgroundColor: 'rgba(0,0,0,0.06)', borderColor: 'rgba(0,0,0,0.12)' },
  noticeError: { backgroundColor: 'rgba(255,59,48,0.10)', borderColor: 'rgba(255,59,48,0.22)' },
  noticeCopy: { flex: 1, gap: 2 },
  noticeTitle: { fontSize: 13, fontWeight: '800' },
  noticeMessage: { fontSize: 12, lineHeight: 17, color: theme.colors.textMuted },
  noticeInfoText: { color: PINK },
  noticeSuccessText: { color: theme.status.success },
  noticeErrorText: { color: theme.colors.danger },
  // Success
  successIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center', marginBottom: 16, ...theme.shadows.card },
  successTitle: { fontSize: 26, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 8 },
  successSub: { fontSize: 14, color: theme.colors.textMuted, textAlign: 'center', lineHeight: 22 },
});
