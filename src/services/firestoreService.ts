import {
  Timestamp,
  addDoc,
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { firebaseCollections } from '@/src/constants/collections';
import { auth, db } from '@/src/services/firebaseClient';
import {
  AppNotification,
  BioPage,
  NfcCard,
  NfcStatus,
  CardDesign,
  Order,
  OrderCardStatus,
  OrderStatus,
  PaymentStatus,
  Payout,
  PrinterJob,
  PrinterJobStage,
  SalaryRecord,
  UserRole,
  isPrinterOperatorRole,
} from '@/src/types/models';
import {
  OPERATOR_JOB_TERMINAL_STAGE,
  canTransitionOrderStatus,
  getNextOrderStatus as getNextStatusInFlow,
} from '@/src/utils/orderStatusFlow';

const PRINTER_STAGE_FLOW: PrinterJobStage[] = [
  'queued',
  'printing',
  'nfc_writing',
  'nfc_verification',
  'awaiting_qa',
  'done',
];

const VALID_PRODUCT_TYPES = new Set(['ecard', 'physical_nfc', 'wood_card', 'metal_card', 'pvc_card']);
const VALID_CURRENCIES = new Set(['USD', 'KHR']);
const VALID_FULFILLMENT = new Set(['digital', 'physical']);
const VALID_CARD_DESIGNS = new Set(['classic_black', 'matte_silver', 'gold_premium', 'rose_gold', 'custom']);
const VALID_PAYMENT_STATUSES = new Set(['unpaid', 'partial', 'paid']);
const VALID_PRIORITIES = new Set(['standard', 'urgent']);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+()\d\s-]{6,24}$/;
const URL_PATTERN = /^https?:\/\/\S+$/i;

function actorId(fallback?: string) {
  return auth.currentUser?.uid || fallback || '';
}

function assertSignedInStaff() {
  if (!auth.currentUser?.uid) {
    throw new Error('Your session expired. Sign in again and retry.');
  }
}

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

function sortNewestFirst<T extends { createdAt?: string; updatedAt?: string }>(items: T[]) {
  return items.sort((a, b) => (b.createdAt ?? b.updatedAt ?? '').localeCompare(a.createdAt ?? a.updatedAt ?? ''));
}

function sortIsoNewestFirst<T extends { createdAt: string }>(items: T[]) {
  return items.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
}

function withoutUndefined<T extends Record<string, unknown>>(payload: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

function assertNonEmpty(value: string | undefined, message: string) {
  if (!value?.trim()) throw new Error(message);
}

function assertValidOrderInput(input: CreateOrderInput) {
  assertNonEmpty(input.customerName, 'Customer name is required.');
  assertNonEmpty(input.createdBy, 'A signed-in staff account is required to create orders.');

  if (!input.phone?.trim() && !input.telegram?.trim()) {
    throw new Error('Phone or Telegram contact is required.');
  }
  if (input.phone?.trim() && !PHONE_PATTERN.test(input.phone.trim())) {
    throw new Error('Enter a valid phone number.');
  }
  if (input.email && !EMAIL_PATTERN.test(input.email.trim().toLowerCase())) {
    throw new Error('Enter a valid customer email.');
  }
  if (!VALID_PRODUCT_TYPES.has(input.productType)) {
    throw new Error('Choose a valid product type.');
  }
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 1000) {
    throw new Error('Quantity must be a whole number from 1 to 1000.');
  }
  if (!VALID_PAYMENT_STATUSES.has(input.paymentStatus)) {
    throw new Error('Choose a valid payment status.');
  }
}

function assertValidStatusTransition(current: OrderStatus, next: OrderStatus) {
  if (current === next) return;
  if (!canTransitionOrderStatus(current, next)) {
    throw new Error(`Cannot move order from ${current} to ${next}.`);
  }
}

function assertValidJobTransition(current: PrinterJobStage, next: PrinterJobStage) {
  if (current === next) return;
  if (next === 'failed' || next === 'reprint') return;
  if (current === 'reprint' && (next === 'queued' || next === 'printing')) return;
  if (next === 'done') {
    throw new Error('Jobs complete only after QA approval.');
  }
  if (next === OPERATOR_JOB_TERMINAL_STAGE && current !== 'nfc_verification') {
    const currentIndex = PRINTER_STAGE_FLOW.indexOf(current);
    const terminalIndex = PRINTER_STAGE_FLOW.indexOf(OPERATOR_JOB_TERMINAL_STAGE);
    if (currentIndex === -1 || currentIndex + 1 !== terminalIndex) {
      throw new Error(`Complete NFC verification before sending to QA.`);
    }
  }
  const currentIndex = PRINTER_STAGE_FLOW.indexOf(current);
  const nextIndex = PRINTER_STAGE_FLOW.indexOf(next);
  if (currentIndex === -1 || nextIndex === -1 || nextIndex !== currentIndex + 1) {
    throw new Error(`Cannot move job from ${current} to ${next}.`);
  }
}

function orderStatusForStage(stage: PrinterJobStage): OrderStatus | null {
  if (stage === 'printing') return 'printing';
  if (stage === 'nfc_writing') return 'nfc_writing';
  if (stage === 'nfc_verification') return 'nfc_verification';
  if (stage === 'awaiting_qa') return 'qa_pending';
  return null;
}

export function getNextOrderStatus(status: OrderStatus): OrderStatus | null {
  return getNextStatusInFlow(status);
}

export function generateCardCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'BC-';
  for (let i = 0; i < 4; i += 1) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function buildProfileUrl(cardCode: string): string {
  return `https://biocloud.app/c/${cardCode}`;
}

export type CreateOrderInput = Omit<
  Order,
  | 'id'
  | 'cardCode'
  | 'profileUrl'
  | 'status'
  | 'updatedBy'
  | 'createdAt'
  | 'updatedAt'
  | 'cardStatus'
  | 'freezeReason'
  | 'frozenAt'
  | 'frozenBy'
  | 'closedAt'
  | 'closedBy'
>;

export type UpdateOrderDetailsInput = Partial<Pick<
  Order,
  | 'customerName'
  | 'phone'
  | 'telegram'
  | 'whatsapp'
  | 'email'
  | 'company'
  | 'jobTitle'
  | 'deliveryAddress'
  | 'productType'
  | 'quantity'
  | 'cardDesign'
  | 'nfcEnabled'
  | 'nfcTargetUrl'
  | 'qrPrinted'
  | 'paymentStatus'
  | 'paymentMethod'
  | 'amount'
  | 'currency'
  | 'fulfillment'
  | 'salesCommission'
  | 'salesCommissionCurrency'
  | 'depositAmount'
  | 'dueDate'
  | 'priority'
  | 'notes'
>>;

async function assertNoDuplicateOpenOrder(input: CreateOrderInput) {
  const phone = input.phone?.trim();
  const telegram = input.telegram?.trim();
  const contactConstraint = phone
    ? where('phone', '==', phone)
    : telegram
      ? where('telegram', '==', telegram)
      : null;

  if (!contactConstraint) return;

  const constraints = [contactConstraint];
  if (input.assignedSalesman) {
    constraints.push(where('assignedSalesman', '==', input.assignedSalesman));
  }

  const duplicateQuery = query(
    collection(db, firebaseCollections.orders),
    ...constraints
  );
  let snapshot;
  try {
    snapshot = await getDocs(duplicateQuery);
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: unknown }).code) : '';
    if (code === 'permission-denied' || code === 'failed-precondition') return;
    throw error;
  }

  const duplicate = snapshot.docs
    .map((d) => mapOrder(d.id, d.data()))
    .find((order) => (
      order.productType === input.productType
      && order.status !== 'delivered'
      && (order.cardStatus ?? 'active') !== 'closed'
    ));

  if (duplicate) {
    throw new Error('An open order already exists for this contact and product.');
  }
}

export async function createOrder(input: CreateOrderInput): Promise<string> {
  assertSignedInStaff();
  const staffId = actorId(input.createdBy);
  const normalized: CreateOrderInput = {
    ...input,
    customerName: input.customerName.trim(),
    phone: input.phone.trim(),
    telegram: input.telegram?.trim() || undefined,
    whatsapp: input.whatsapp?.trim() || undefined,
    email: input.email?.trim().toLowerCase() || undefined,
    company: input.company?.trim() || undefined,
    jobTitle: input.jobTitle?.trim() || undefined,
    deliveryAddress: input.deliveryAddress?.trim() || undefined,
    productType: input.productType,
    quantity: input.quantity,
    cardDesign: input.cardDesign,
    designArtworkUrl: input.designArtworkUrl?.trim() || undefined,
    designArtworkPath: input.designArtworkPath?.trim() || undefined,
    designArtworkFileName: input.designArtworkFileName?.trim() || undefined,
    nfcEnabled: input.nfcEnabled,
    nfcTargetUrl: input.nfcTargetUrl?.trim() || undefined,
    qrPrinted: input.qrPrinted,
    paymentStatus: input.paymentStatus,
    paymentMethod: input.paymentMethod,
    amount: input.amount,
    currency: input.currency,
    fulfillment: input.fulfillment,
    salesCommission: input.salesCommission,
    salesCommissionCurrency: input.salesCommissionCurrency,
    depositAmount: input.depositAmount,
    dueDate: input.dueDate?.trim() || undefined,
    priority: input.priority,
    notes: input.notes?.trim() || undefined,
    assignedSalesman: staffId,
    createdBy: staffId,
  };

  assertValidOrderInput(normalized);
  await assertNoDuplicateOpenOrder(normalized);

  const cardCode = generateCardCode();
  const profileUrl = buildProfileUrl(cardCode);

  const orderRef = await addDoc(collection(db, firebaseCollections.orders), withoutUndefined({
    ...normalized,
    cardCode,
    profileUrl,
    status: 'new' as OrderStatus,
    cardStatus: 'active' as OrderCardStatus,
    updatedBy: staffId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }));

  return orderRef.id;
}

export type CustomerOrderFulfillment = 'digital' | 'physical';

export type CreateCustomerOrderInput = {
  customerName: string;
  phone: string;
  email?: string;
  company?: string;
  jobTitle?: string;
  productType: string;
  quantity: number;
  cardDesign: CardDesign;
  nfcEnabled?: boolean;
  qrPrinted?: boolean;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  amount?: number;
  currency?: 'USD' | 'KHR';
  salesCommission?: number;
  salesCommissionCurrency?: 'USD' | 'KHR';
  notes?: string;
  fulfillment: CustomerOrderFulfillment;
};

function assertValidCustomerOrderInput(input: CreateCustomerOrderInput) {
  assertNonEmpty(input.customerName, 'Your name is required.');
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Sign in to save your card.');

  if (!input.phone?.trim() && !input.email?.trim()) {
    throw new Error('Add a phone number or email so we can reach you.');
  }
  if (input.phone?.trim() && !PHONE_PATTERN.test(input.phone.trim())) {
    throw new Error('Enter a valid phone number.');
  }
  if (input.email && !EMAIL_PATTERN.test(input.email.trim().toLowerCase())) {
    throw new Error('Enter a valid email.');
  }
  if (!VALID_PRODUCT_TYPES.has(input.productType)) {
    throw new Error('Choose a valid product type.');
  }
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 100) {
    throw new Error('Quantity must be between 1 and 100.');
  }
  if (!VALID_CARD_DESIGNS.has(input.cardDesign)) {
    throw new Error('Choose a valid card finish.');
  }
}

/** Customer self-service order from guest design (e-card or physical NFC). */
export async function createCustomerOrder(input: CreateCustomerOrderInput): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Sign in to save your card.');

  assertValidCustomerOrderInput(input);

  const cardCode = generateCardCode();
  const profileUrl = buildProfileUrl(cardCode);
  const status: OrderStatus = input.fulfillment === 'digital' ? 'ready' : 'new';

  const fulfillment = input.fulfillment;
  const orderRef = await addDoc(collection(db, firebaseCollections.orders), withoutUndefined({
    customerName: input.customerName.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim().toLowerCase() || undefined,
    company: input.company?.trim() || undefined,
    jobTitle: input.jobTitle?.trim() || undefined,
    productType: input.productType,
    quantity: input.quantity,
    cardDesign: input.cardDesign,
    cardCode,
    profileUrl,
    nfcEnabled: input.nfcEnabled ?? true,
    qrPrinted: input.qrPrinted ?? true,
    paymentStatus: input.paymentStatus,
    paymentMethod: input.paymentMethod,
    amount: input.amount,
    currency: input.currency,
    fulfillment,
    salesCommission: input.salesCommission,
    salesCommissionCurrency: input.salesCommissionCurrency,
    notes: input.notes?.trim() || undefined,
    status,
    cardStatus: 'active' as OrderCardStatus,
    assignedSalesman: uid,
    createdBy: uid,
    updatedBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }));

  return orderRef.id;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapOrder(id: string, data: any): Order {
  return {
    id,
    customerName: data.customerName ?? '',
    phone: data.phone ?? '',
    telegram: data.telegram,
    whatsapp: data.whatsapp,
    email: data.email,
    company: data.company,
    jobTitle: data.jobTitle,
    deliveryAddress: data.deliveryAddress,
    productType: data.productType ?? '',
    quantity: Number(data.quantity ?? 1),
    cardDesign: data.cardDesign ?? 'classic_black',
    designArtworkUrl: data.designArtworkUrl,
    designArtworkPath: data.designArtworkPath,
    designArtworkFileName: data.designArtworkFileName,
    cardCode: data.cardCode ?? '',
    profileUrl: data.profileUrl ?? '',
    nfcEnabled: data.nfcEnabled,
    nfcTargetUrl: data.nfcTargetUrl,
    qrPrinted: data.qrPrinted,
    paymentStatus: data.paymentStatus ?? 'unpaid',
    paymentMethod: data.paymentMethod,
    amount: typeof data.amount === 'number' ? data.amount : undefined,
    currency: data.currency === 'USD' || data.currency === 'KHR' ? data.currency : undefined,
    fulfillment: data.fulfillment === 'digital' || data.fulfillment === 'physical' ? data.fulfillment : undefined,
    salesCommission: typeof data.salesCommission === 'number' ? data.salesCommission : undefined,
    salesCommissionCurrency:
      data.salesCommissionCurrency === 'USD' || data.salesCommissionCurrency === 'KHR'
        ? data.salesCommissionCurrency
        : undefined,
    depositAmount: typeof data.depositAmount === 'number' ? data.depositAmount : undefined,
    dueDate: data.dueDate,
    priority: data.priority,
    notes: data.notes,
    cardStatus: data.cardStatus ?? 'active',
    freezeReason: data.freezeReason,
    frozenAt: data.frozenAt ? toIso(data.frozenAt) : undefined,
    frozenBy: data.frozenBy,
    closedAt: data.closedAt ? toIso(data.closedAt) : undefined,
    closedBy: data.closedBy,
    status: data.status ?? 'new',
    batchId: data.batchId,
    branch: data.branch,
    assignedSalesman: data.assignedSalesman ?? '',
    createdBy: data.createdBy ?? '',
    updatedBy: data.updatedBy,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

export async function listOrders(role: UserRole, userId: string, branch?: string): Promise<Order[]> {
  if (!userId || role === 'guest') return [];

  const ordersQuery =
    role === 'sales' || role === 'agent'
      ? query(collection(db, firebaseCollections.orders), where('assignedSalesman', '==', userId))
      : role === 'customer'
        ? query(collection(db, firebaseCollections.orders), where('createdBy', '==', userId))
        : query(collection(db, firebaseCollections.orders));

  const snapshot = await getDocs(ordersQuery);
  let items = sortNewestFirst(snapshot.docs.map((d) => mapOrder(d.id, d.data() as Record<string, unknown>)));
  if ((role === 'agent' || role === 'shipping' || isPrinterOperatorRole(role)) && branch?.trim()) {
    items = items.filter((o) => !o.branch || o.branch === branch);
  }
  return items;
}

export async function listOrdersSimple(role: UserRole, userId: string): Promise<Order[]> {
  return listOrders(role, userId);
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const snap = await getDoc(doc(db, firebaseCollections.orders, orderId));
  if (!snap.exists()) return null;
  return mapOrder(snap.id, snap.data());
}

export async function getOrderByCardCode(cardCode: string): Promise<Order | null> {
  const normalized = cardCode.trim().toUpperCase();
  if (!normalized) return null;

  const snapshot = await getDocs(
    query(collection(db, firebaseCollections.orders), where('cardCode', '==', normalized))
  );
  const first = snapshot.docs[0];
  return first ? mapOrder(first.id, first.data()) : null;
}

export async function assignCardCodeToOrder(
  orderId: string,
  cardCode: string,
  updatedBy?: string
): Promise<Order> {
  assertNonEmpty(orderId, 'Order ID is required.');
  const normalized = cardCode.trim().toUpperCase();
  assertNonEmpty(normalized, 'Card UID is required.');

  const conflict = await getOrderByCardCode(normalized);
  if (conflict && conflict.id !== orderId) {
    throw new Error(`UID ${normalized} is already linked to another order.`);
  }

  const profileUrl = buildProfileUrl(normalized);
  await updateDoc(doc(db, firebaseCollections.orders, orderId), {
    cardCode: normalized,
    profileUrl,
    updatedBy: actorId(updatedBy),
    updatedAt: serverTimestamp(),
  });

  const updated = await getOrder(orderId);
  if (!updated) throw new Error('Order not found after UID assignment.');
  return updated;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, updatedBy?: string): Promise<void> {
  const ref = doc(db, firebaseCollections.orders, orderId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Order not found.');

  const order = mapOrder(snap.id, snap.data());
  if (order.cardStatus === 'closed') {
    throw new Error('Closed cards cannot be advanced. Reopen the card first.');
  }
  assertValidStatusTransition(order.status, status);

  await updateDoc(ref, {
    status,
    updatedBy: actorId(updatedBy),
    updatedAt: serverTimestamp(),
  });
}

function assertValidOrderDetailsUpdate(input: UpdateOrderDetailsInput) {
  if (input.customerName !== undefined) {
    assertNonEmpty(input.customerName, 'Customer name is required.');
  }
  if (input.phone?.trim() && !PHONE_PATTERN.test(input.phone.trim())) {
    throw new Error('Enter a valid phone number.');
  }
  if (input.email?.trim() && !EMAIL_PATTERN.test(input.email.trim().toLowerCase())) {
    throw new Error('Enter a valid customer email.');
  }
  if (input.productType !== undefined && !VALID_PRODUCT_TYPES.has(input.productType)) {
    throw new Error('Choose a valid product type.');
  }
  if (input.quantity !== undefined && (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 1000)) {
    throw new Error('Quantity must be a whole number from 1 to 1000.');
  }
  if (input.cardDesign !== undefined && !VALID_CARD_DESIGNS.has(input.cardDesign)) {
    throw new Error('Choose a valid card design.');
  }
  if (input.paymentStatus !== undefined && !VALID_PAYMENT_STATUSES.has(input.paymentStatus)) {
    throw new Error('Choose a valid payment status.');
  }
  if (input.priority !== undefined && !VALID_PRIORITIES.has(input.priority)) {
    throw new Error('Choose a valid priority.');
  }
  if (input.depositAmount !== undefined && (Number.isNaN(input.depositAmount) || input.depositAmount < 0 || input.depositAmount > 1000000)) {
    throw new Error('Deposit amount must be between 0 and 1,000,000.');
  }
  if (input.nfcTargetUrl?.trim() && !URL_PATTERN.test(input.nfcTargetUrl.trim())) {
    throw new Error('Enter a valid http or https NFC URL.');
  }
}

function addTrimmedField(payload: Record<string, unknown>, key: keyof UpdateOrderDetailsInput, value: string | undefined) {
  if (value !== undefined) payload[key] = value.trim();
}

const PRINTER_BLOCKED_ORDER_DETAIL_KEYS: (keyof UpdateOrderDetailsInput)[] = [
  'customerName',
  'phone',
  'telegram',
  'whatsapp',
  'email',
  'company',
  'jobTitle',
  'deliveryAddress',
  'paymentStatus',
  'paymentMethod',
  'depositAmount',
];

async function assertPrinterMayEditOrderDetails(input: UpdateOrderDetailsInput) {
  const uid = actorId();
  if (!uid) return;
  const userSnap = await getDoc(doc(db, firebaseCollections.users, uid));
  if (!userSnap.exists()) return;
  const role = userSnap.data().role as UserRole;
  if (!isPrinterOperatorRole(role)) return;
  const blocked = PRINTER_BLOCKED_ORDER_DETAIL_KEYS.some((key) => input[key] !== undefined);
  if (blocked) {
    throw new Error('Printer operators cannot edit customer or payment details.');
  }
}

export async function updateOrderDetails(
  orderId: string,
  input: UpdateOrderDetailsInput,
  updatedBy?: string
): Promise<void> {
  assertNonEmpty(orderId, 'Order ID is required.');
  assertValidOrderDetailsUpdate(input);
  await assertPrinterMayEditOrderDetails(input);

  const payload: Record<string, unknown> = {};
  addTrimmedField(payload, 'customerName', input.customerName);
  addTrimmedField(payload, 'phone', input.phone);
  addTrimmedField(payload, 'telegram', input.telegram);
  addTrimmedField(payload, 'whatsapp', input.whatsapp);
  addTrimmedField(payload, 'email', input.email?.toLowerCase());
  addTrimmedField(payload, 'company', input.company);
  addTrimmedField(payload, 'jobTitle', input.jobTitle);
  addTrimmedField(payload, 'deliveryAddress', input.deliveryAddress);
  addTrimmedField(payload, 'paymentMethod', input.paymentMethod);
  addTrimmedField(payload, 'dueDate', input.dueDate);
  addTrimmedField(payload, 'notes', input.notes);
  addTrimmedField(payload, 'nfcTargetUrl', input.nfcTargetUrl);

  if (input.productType !== undefined) payload.productType = input.productType;
  if (input.quantity !== undefined) payload.quantity = input.quantity;
  if (input.cardDesign !== undefined) payload.cardDesign = input.cardDesign;
  if (input.nfcEnabled !== undefined) payload.nfcEnabled = input.nfcEnabled;
  if (input.qrPrinted !== undefined) payload.qrPrinted = input.qrPrinted;
  if (input.paymentStatus !== undefined) payload.paymentStatus = input.paymentStatus as PaymentStatus;
  if (input.depositAmount !== undefined) payload.depositAmount = input.depositAmount;
  if (input.priority !== undefined) payload.priority = input.priority;

  if (Object.keys(payload).length === 0) return;

  await updateDoc(doc(db, firebaseCollections.orders, orderId), {
    ...payload,
    updatedBy: actorId(updatedBy),
    updatedAt: serverTimestamp(),
  });
}

export async function freezeOrderCard(orderId: string, reason?: string, updatedBy?: string): Promise<void> {
  assertNonEmpty(orderId, 'Order ID is required.');
  const userId = actorId(updatedBy);
  await updateDoc(doc(db, firebaseCollections.orders, orderId), {
    cardStatus: 'frozen' as OrderCardStatus,
    freezeReason: reason?.trim() ?? '',
    frozenBy: userId,
    frozenAt: serverTimestamp(),
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });
}

export async function unfreezeOrderCard(orderId: string, updatedBy?: string): Promise<void> {
  assertNonEmpty(orderId, 'Order ID is required.');
  const userId = actorId(updatedBy);
  await updateDoc(doc(db, firebaseCollections.orders, orderId), {
    cardStatus: 'active' as OrderCardStatus,
    freezeReason: deleteField(),
    frozenBy: deleteField(),
    frozenAt: deleteField(),
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });
}

export async function closeOrderCard(orderId: string, updatedBy?: string): Promise<void> {
  assertNonEmpty(orderId, 'Order ID is required.');
  const userId = actorId(updatedBy);
  await updateDoc(doc(db, firebaseCollections.orders, orderId), {
    cardStatus: 'closed' as OrderCardStatus,
    closedBy: userId,
    closedAt: serverTimestamp(),
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });
}

export async function reopenOrderCard(orderId: string, updatedBy?: string): Promise<void> {
  assertNonEmpty(orderId, 'Order ID is required.');
  const userId = actorId(updatedBy);
  await updateDoc(doc(db, firebaseCollections.orders, orderId), {
    cardStatus: 'active' as OrderCardStatus,
    closedBy: deleteField(),
    closedAt: deleteField(),
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapPrinterJob(id: string, data: any): PrinterJob {
  return {
    id,
    orderId: String(data.orderId ?? ''),
    batchId: data.batchId as string | undefined,
    printerId: String(data.printerId ?? ''),
    queueNumber: Number(data.queueNumber ?? 0),
    stage: data.stage ?? 'queued',
    cardsPrinted: Number(data.cardsPrinted ?? 0),
    failedCards: Number(data.failedCards ?? 0),
    reprintedCards: Number(data.reprintedCards ?? 0),
    failedCardsApproved: Boolean(data.failedCardsApproved ?? false),
    perCardBonus: Number(data.perCardBonus ?? 0.5),
    perOrderBonus: Number(data.perOrderBonus ?? 0),
    salaryStatus: data.salaryStatus ?? 'unpaid',
    notes: data.notes,
    qaVideoUrl: data.qaVideoUrl,
    isReprint: data.isReprint ?? false,
    reprintOfJobId: data.reprintOfJobId,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

export async function getPrinterJobByOrderId(orderId: string): Promise<PrinterJob | null> {
  assertNonEmpty(orderId, 'Order ID is required.');
  const snapshot = await getDocs(
    query(collection(db, firebaseCollections.printerJobs), where('orderId', '==', orderId))
  );
  if (snapshot.empty) return null;

  const jobs = snapshot.docs
    .map((d) => mapPrinterJob(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const awaitingQa = jobs.find((job) => job.stage === 'awaiting_qa');
  if (awaitingQa) return awaitingQa;

  const active = jobs.find((job) => job.stage !== 'done' && job.stage !== 'failed');
  return active ?? jobs[0];
}

export function subscribePrinterJobs(
  role: UserRole,
  userId: string,
  callback: (jobs: PrinterJob[]) => void,
  onError?: (error: Error) => void,
  batchId?: string | null
) {
  if (!userId || role === 'guest' || role === 'customer' || role === 'sales' || role === 'agent') {
    callback([]);
    return () => {};
  }

  if (!batchId?.trim()) {
    callback([]);
    return () => {};
  }

  const jobsQuery = query(
    collection(db, firebaseCollections.printerJobs),
    where('batchId', '==', batchId)
  );

  return onSnapshot(
    jobsQuery,
    (snapshot) => {
      const jobs = snapshot.docs
        .map((d) => mapPrinterJob(d.id, d.data()))
        .sort((a, b) => a.queueNumber - b.queueNumber);
      callback(jobs);
    },
    (error) => {
      callback([]);
      onError?.(error);
    }
  );
}

function mapNotification(id: string, data: any): AppNotification {
  return {
    id,
    title: data.title ?? 'Notification',
    message: data.message ?? '',
    isRead: Boolean(data.isRead ?? false),
    createdAt: toIso(data.createdAt),
    userId: data.userId,
    priority: data.priority,
    actionUrl: data.actionUrl,
  };
}

export function subscribeNotifications(
  userId: string,
  callback: (items: AppNotification[]) => void,
  onError?: (error: Error) => void
) {
  if (!userId || userId === 'guest') {
    callback([]);
    return () => {};
  }

  const notifQuery = query(collection(db, firebaseCollections.notifications), where('userId', '==', userId));

  return onSnapshot(
    notifQuery,
    (snapshot) => {
      const items = snapshot.docs.map((d) => mapNotification(d.id, d.data()));
      callback(sortIsoNewestFirst(items));
    },
    (error) => {
      callback([]);
      onError?.(error);
    }
  );
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  if (!notificationId?.trim()) return;
  await updateDoc(doc(db, firebaseCollections.notifications, notificationId), {
    isRead: true,
    updatedAt: serverTimestamp(),
    updatedBy: actorId(),
  });
}

export async function updatePrinterJob(
  jobId: string,
  stage: PrinterJobStage,
  extra?: Partial<Pick<PrinterJob, 'cardsPrinted' | 'failedCards' | 'reprintedCards' | 'notes'>>,
  updatedBy?: string
): Promise<void> {
  const ref = doc(db, firebaseCollections.printerJobs, jobId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Printer job not found.');

  const job = mapPrinterJob(snap.id, snap.data());
  assertValidJobTransition(job.stage, stage);

  const safeExtra = {
    ...extra,
  };
  for (const key of ['cardsPrinted', 'failedCards', 'reprintedCards'] as const) {
    const value = safeExtra[key];
    if (value !== undefined && (!Number.isInteger(value) || value < 0 || value > 1000)) {
      throw new Error(`${key} must be a whole number from 0 to 1000.`);
    }
  }

  const userId = actorId(updatedBy);
  const updatePayload: Record<string, unknown> = {
    stage,
    ...safeExtra,
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  };

  if (!job.printerId && userId && stage !== 'queued') {
    updatePayload.printerId = userId;
  }

  await updateDoc(ref, updatePayload);

  const nextOrderStatus = orderStatusForStage(stage);
  if (nextOrderStatus && job.orderId) {
    await updateOrderStatus(job.orderId, nextOrderStatus, userId);
  }
}

export async function saveQaVideo(jobId: string, videoUrl: string, updatedBy?: string): Promise<void> {
  assertNonEmpty(jobId, 'Printer job ID is required.');
  assertNonEmpty(videoUrl, 'QA video URL is required.');
  await updateDoc(doc(db, firebaseCollections.printerJobs, jobId), {
    qaVideoUrl: videoUrl,
    updatedBy: actorId(updatedBy),
    updatedAt: serverTimestamp(),
  });
}

export async function saveNfcWrite(payload: {
  chipUID: string;
  profileUrl: string;
  orderId: string;
  cardCode: string;
  writtenBy: string;
}): Promise<void> {
  assertNonEmpty(payload.cardCode, 'Card code is required.');
  assertNonEmpty(payload.profileUrl, 'Profile URL is required.');

  const ref = doc(db, firebaseCollections.nfcCards, payload.cardCode);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    const data = existing.data();
    if (data.profileUrl && data.writtenBy && data.writtenBy !== payload.writtenBy) {
      throw new Error('This card code is already assigned to another user.');
    }
  }

  await setDoc(
    ref,
    {
      ...payload,
      verificationStatus: 'written' as NfcStatus,
      writtenAt: serverTimestamp(),
      updatedBy: payload.writtenBy,
      updatedAt: serverTimestamp(),
    },
    { merge: false }
  );
}

export async function updateNfcStatus(cardCode: string, status: NfcStatus, updatedBy?: string): Promise<void> {
  assertNonEmpty(cardCode, 'Card code is required.');
  await setDoc(
    doc(db, firebaseCollections.nfcCards, cardCode),
    {
      cardCode,
      verificationStatus: status,
      updatedBy: actorId(updatedBy),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getNfcCard(cardCode: string): Promise<NfcCard | null> {
  const snap = await getDoc(doc(db, firebaseCollections.nfcCards, cardCode));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    chipUID: data.chipUID ?? '',
    profileUrl: data.profileUrl ?? '',
    orderId: data.orderId ?? '',
    cardCode: data.cardCode ?? '',
    writtenBy: data.writtenBy ?? '',
    writtenAt: toIso(data.writtenAt),
    verificationStatus: data.verificationStatus ?? 'not_written',
    updatedAt: toIso(data.updatedAt),
  };
}

export async function listSalaryRecords(printerId: string): Promise<SalaryRecord[]> {
  if (!printerId) return [];
  const salaryQuery = query(
    collection(db, firebaseCollections.salaryRecords),
    where('printerId', '==', printerId)
  );
  const snap = await getDocs(salaryQuery);
  const items = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      printerId: data.printerId,
      printerName: data.printerName,
      period: data.period,
      baseSalary: Number(data.baseSalary ?? 0),
      totalCards: Number(data.totalCards ?? 0),
      failedCards: Number(data.failedCards ?? 0),
      approvedFailedCards: Number(data.approvedFailedCards ?? 0),
      perCardBonus: Number(data.perCardBonus ?? 0),
      qualityBonus: Number(data.qualityBonus ?? 0),
      total: Number(data.total ?? 0),
      status: data.status ?? 'unpaid',
      createdAt: toIso(data.createdAt),
      updatedAt: toIso(data.updatedAt),
    } as SalaryRecord;
  });
  return items.sort((a, b) => b.period.localeCompare(a.period));
}

export async function listPayouts(userId: string): Promise<Payout[]> {
  if (!userId || userId === 'guest') return [];
  const payoutQuery = query(
    collection(db, firebaseCollections.payouts),
    where('userId', '==', userId)
  );
  const snap = await getDocs(payoutQuery);
  return sortNewestFirst(
    snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId: data.userId,
        amount: Number(data.amount ?? 0),
        periodLabel: data.periodLabel,
        status: data.status ?? 'pending',
        createdAt: toIso(data.createdAt),
      } as Payout;
    })
  );
}

export async function upsertBioPage(
  userId: string,
  payload: Omit<BioPage, 'id' | 'userId' | 'updatedAt'>
): Promise<void> {
  assertNonEmpty(userId, 'User ID is required.');
  assertNonEmpty(payload.displayName, 'Display name is required.');
  assertNonEmpty(payload.slug, 'Slug is required.');
  const normalizedSlug = payload.slug.trim().toLowerCase();
  const duplicateSlug = await getDocs(
    query(collection(db, firebaseCollections.bioPages), where('slug', '==', normalizedSlug))
  );
  if (duplicateSlug.docs.some((page) => page.id !== userId)) {
    throw new Error('That public URL slug is already taken.');
  }

  await setDoc(
    doc(db, firebaseCollections.bioPages, userId),
    {
      ...payload,
      slug: normalizedSlug,
      userId,
      updatedBy: userId,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getBioPage(userId: string): Promise<BioPage | null> {
  const snap = await getDoc(doc(db, firebaseCollections.bioPages, userId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    userId: data.userId ?? userId,
    slug: data.slug ?? '',
    displayName: data.displayName ?? '',
    tagline: data.tagline,
    photoUrl: data.photoUrl,
    whatsapp: data.whatsapp,
    instagram: data.instagram,
    telegram: data.telegram,
    email: data.email,
    customLinks: data.customLinks ?? [],
    theme: data.theme ?? 'vibrant_pink',
    updatedAt: toIso(data.updatedAt),
  };
}

export async function getPublicBioPageBySlug(slug: string): Promise<BioPage | null> {
  const normalizedSlug = slug.trim().toLowerCase();
  if (!normalizedSlug) return null;

  const pagesQuery = query(collection(db, firebaseCollections.bioPages), where('slug', '==', normalizedSlug));
  const snap = await getDocs(pagesQuery);

  const first = snap.docs[0];
  if (!first) return null;

  const data = first.data();
  return {
    id: first.id,
    userId: data.userId ?? '',
    slug: data.slug ?? '',
    displayName: data.displayName ?? '',
    tagline: data.tagline,
    photoUrl: data.photoUrl,
    whatsapp: data.whatsapp,
    instagram: data.instagram,
    telegram: data.telegram,
    email: data.email,
    customLinks: data.customLinks ?? [],
    theme: data.theme ?? 'vibrant_pink',
    updatedAt: toIso(data.updatedAt),
  };
}
