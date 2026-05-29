export type UserRole =
  | 'guest'
  | 'customer'
  | 'sales'
  | 'agent'
  | 'printer'
  | 'printer_operator'
  | 'qa_inspector'
  | 'shipping'
  | 'admin'
  | 'super_admin';

export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  language: string;
  phone?: string;
  branch?: string;
  territory?: string;
  isActive?: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  isGuest?: boolean;
}

// ─── Order ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'new'
  | 'design'
  | 'ready_to_print'
  | 'printing'
  | 'nfc_writing'
  | 'nfc_verification'
  | 'qa_pending'
  | 'qa_failed'
  | 'ready'
  | 'ready_to_ship'
  | 'shipped'
  | 'delivered';

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export type OrderCardStatus = 'active' | 'frozen' | 'closed';

export type CardDesign =
  | 'classic_black'
  | 'matte_silver'
  | 'gold_premium'
  | 'rose_gold'
  | 'custom';

export interface Order {
  id: string;
  // Customer info
  customerName: string;
  phone: string;
  telegram?: string;
  whatsapp?: string;
  email?: string;
  company?: string;
  jobTitle?: string;
  deliveryAddress?: string;
  // Order details
  productType: string;
  quantity: number;
  cardDesign: CardDesign;
  designArtworkUrl?: string;
  designArtworkPath?: string;
  designArtworkFileName?: string;
  cardCode: string;
  profileUrl: string;
  nfcEnabled?: boolean;
  nfcTargetUrl?: string;
  qrPrinted?: boolean;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  /** Order total in `currency` (USD or KHR riel). */
  amount?: number;
  currency?: 'USD' | 'KHR';
  /** digital = e-card; physical = NFC print + ship */
  fulfillment?: 'digital' | 'physical';
  /** Sales rep commission for payout tracking */
  salesCommission?: number;
  salesCommissionCurrency?: 'USD' | 'KHR';
  depositAmount?: number;
  dueDate?: string;
  priority?: 'standard' | 'urgent';
  notes?: string;
  cardStatus?: OrderCardStatus;
  freezeReason?: string;
  frozenAt?: string;
  frozenBy?: string;
  closedAt?: string;
  closedBy?: string;
  // Workflow
  status: OrderStatus;
  batchId?: string;
  branch?: string;
  assignedSalesman: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Production batch ─────────────────────────────────────────────────────────

export type ProductionBatchStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

export interface ProductionBatch {
  id: string;
  batchNumber: string;
  material: string;
  printerType: string;
  status: ProductionBatchStatus;
  orderIds: string[];
  branch: string;
  activeOperatorId?: string;
  notes?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Printer Job ──────────────────────────────────────────────────────────────

export type PrinterJobStage =
  | 'queued'
  | 'printing'
  | 'nfc_writing'
  | 'nfc_verification'
  | 'awaiting_qa'
  | 'done'
  | 'failed'
  | 'reprint';

export interface PrinterJob {
  id: string;
  orderId: string;
  batchId?: string;
  printerId: string;
  queueNumber: number;
  stage: PrinterJobStage;
  cardsPrinted: number;
  failedCards: number;
  reprintedCards: number;
  failedCardsApproved: boolean;
  perCardBonus: number;
  perOrderBonus: number;
  salaryStatus: 'unpaid' | 'paid';
  notes?: string;
  qaVideoUrl?: string;
  isReprint?: boolean;
  reprintOfJobId?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── QA / shipping / audit ────────────────────────────────────────────────────

export type QaDecision = 'pass' | 'fail';

export interface ReprintRecord {
  id: string;
  orderId: string;
  originalJobId: string;
  newJobId: string;
  batchId?: string;
  reason: string;
  createdBy: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: 'order' | 'batch' | 'printer_job' | 'user' | 'shipping' | 'qa' | 'reprint';
  entityId: string;
  actorId: string;
  actorRole?: UserRole;
  branch?: string;
  metadata?: Record<string, string | number | boolean>;
  createdAt: string;
}

export type PrinterHealthStatus = 'online' | 'degraded' | 'offline' | 'unknown';

export interface PrinterHealthRecord {
  id: string;
  printerId: string;
  printerName: string;
  branch: string;
  status: PrinterHealthStatus;
  lastSeenAt: string;
  jobsToday: number;
  failureRate: number;
  notes?: string;
  updatedAt: string;
}

export interface ProductionStatsSnapshot {
  cardsToday: number;
  batchesActive: number;
  ordersInProduction: number;
  jobsInQueue: number;
  qaPending: number;
  qaPassRate: number;
  readyToShip: number;
  shippedToday: number;
  reprintsToday: number;
  capturedAt: string;
}

// ─── NFC Card ─────────────────────────────────────────────────────────────────

export type NfcStatus =
  | 'not_written'
  | 'writing'
  | 'written'
  | 'verified'
  | 'failed'
  | 'rewrite_needed'
  | 'disabled';

export interface NfcCard {
  id: string;
  chipUID: string;
  profileUrl: string;
  orderId: string;
  cardCode: string;
  writtenBy: string;
  writtenAt: string;
  verificationStatus: NfcStatus;
  updatedAt: string;
}

// ─── Salary ───────────────────────────────────────────────────────────────────

export interface SalaryRecord {
  id: string;
  printerId: string;
  printerName: string;
  period: string;
  baseSalary: number;
  totalCards: number;
  failedCards: number;
  approvedFailedCards: number;
  perCardBonus: number;
  qualityBonus: number;
  total: number;
  status: 'unpaid' | 'paid';
  createdAt: string;
  updatedAt: string;
}

// ─── Legacy / kept for bio pages ─────────────────────────────────────────────

export interface Payout {
  id: string;
  userId: string;
  amount: number;
  periodLabel: string;
  status: 'pending' | 'paid';
  createdAt: string;
}

// ─── Bio Page ─────────────────────────────────────────────────────────────────

export type BioTheme = 'vibrant_pink' | 'tech_noir' | 'editorial' | 'ocean_wave';

export interface BioPage {
  id: string;
  userId: string;
  slug: string;
  displayName: string;
  tagline?: string;
  photoUrl?: string;
  whatsapp?: string;
  instagram?: string;
  telegram?: string;
  email?: string;
  customLinks: { label: string; url: string }[];
  theme: BioTheme;
  updatedAt: string;
}

export type ProfileTheme = 'aqua' | 'mono';

export type TypographyColorKey =
  | 'deep_teal'
  | 'ocean_blue'
  | 'forest'
  | 'slate'
  | 'indigo'
  | 'violet'
  | 'rose'
  | 'amber'
  | 'charcoal'
  | 'midnight';

export interface UiPreferences {
  language: string;
  theme: BioTheme;
  profileTheme: ProfileTheme;
  colorMode: 'light' | 'dark';
  typographyColor: TypographyColorKey;
}

// ─── Notifications ─────────────────────────────────────────────────────────────

export type NotificationPriority = 'low' | 'medium' | 'high';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  userId?: string;
  priority?: NotificationPriority;
  actionUrl?: string;
}

/** Roles that operate production floor equipment. */
export const PRINTER_OPERATOR_ROLES: UserRole[] = ['printer', 'printer_operator'];

export function isPrinterOperatorRole(role: UserRole | undefined) {
  return role !== undefined && PRINTER_OPERATOR_ROLES.includes(role);
}
