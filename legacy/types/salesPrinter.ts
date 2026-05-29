export type AppRole = 'sales_rep' | 'printer_staff' | 'admin' | 'user' | 'super_admin';

export type OrderStatus = 'new' | 'in_queue' | 'programming' | 'qa_pending' | 'completed';
export type ProductType = 'wood_card' | 'metal_card';
export type PaymentOption = 'online_discount' | 'later_manual';
export type JobStage = 'pending' | 'programming' | 'ready';
export type Priority = 'low' | 'normal' | 'high';

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  contact: string;
  productType: ProductType;
  paymentOption: PaymentOption;
  price: number;
  status: OrderStatus;
  salesRepId: string;
  salesRepName: string;
  jobId?: string;
  commissionAmount: number;
  commissionUnlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PrinterJob {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  productType: ProductType;
  stage: JobStage;
  wage: number;
  priority: Priority;
  assignedTo?: string;
  nfcLocked: boolean;
  qaVideoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayoutSummary {
  totalCommission: number;
  pendingApproval: number;
  paidOut: number;
  recentUnlockedOrders: Array<{ orderId: string; customerName: string; commissionAmount: number }>;
}
