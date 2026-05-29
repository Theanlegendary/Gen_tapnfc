import type { Order, OrderStatus, PaymentStatus, PrinterJob } from '@/src/types/models';

export type StatusBadgeTone = 'success' | 'active' | 'warning' | 'error' | 'neutral' | 'pending';

export function orderStatusBadgeTone(status: OrderStatus): StatusBadgeTone {
  if (status === 'ready' || status === 'ready_to_ship' || status === 'delivered' || status === 'shipped') {
    return 'success';
  }
  if (status === 'qa_failed') return 'error';
  if (status === 'qa_pending') return 'pending';
  if (status === 'printing' || status === 'nfc_writing' || status === 'nfc_verification') return 'active';
  if (status === 'new' || status === 'design' || status === 'ready_to_print') return 'warning';
  return 'neutral';
}

export function paymentStatusBadgeTone(status: PaymentStatus): StatusBadgeTone {
  if (status === 'paid') return 'success';
  if (status === 'partial' || status === 'unpaid') return 'warning';
  return 'neutral';
}

export function nfcProfileBadgeTone(order: Order): StatusBadgeTone {
  if (order.nfcEnabled === false) return 'neutral';
  return 'neutral';
}

export function printerJobStageBadgeTone(stage: PrinterJob['stage']): StatusBadgeTone {
  if (stage === 'done') return 'success';
  if (stage === 'failed' || stage === 'reprint') return 'error';
  if (stage === 'awaiting_qa') return 'pending';
  if (stage === 'queued') return 'warning';
  if (stage === 'printing' || stage === 'nfc_writing' || stage === 'nfc_verification') return 'active';
  return 'neutral';
}
