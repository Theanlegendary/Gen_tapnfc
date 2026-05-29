import { OrderStatus } from '@/src/types/models';

/** Primary linear progression; legacy `ready` uses ORDER_STATUS_TRANSITIONS. */
export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'new',
  'design',
  'ready_to_print',
  'printing',
  'nfc_writing',
  'nfc_verification',
  'qa_pending',
  'ready_to_ship',
  'shipped',
  'delivered',
];

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ['design'],
  design: ['ready_to_print', 'printing'],
  ready_to_print: ['printing'],
  printing: ['nfc_writing'],
  nfc_writing: ['nfc_verification'],
  nfc_verification: ['qa_pending'],
  qa_pending: ['ready_to_ship', 'qa_failed'],
  qa_failed: ['ready_to_print', 'printing'],
  ready: ['ready_to_ship', 'delivered'],
  ready_to_ship: ['shipped'],
  shipped: ['delivered'],
  delivered: [],
};

export function canTransitionOrderStatus(current: OrderStatus, next: OrderStatus): boolean {
  if (current === next) return true;
  const allowed = ORDER_STATUS_TRANSITIONS[current];
  return allowed?.includes(next) ?? false;
}

export function getNextOrderStatus(status: OrderStatus): OrderStatus | null {
  const index = ORDER_STATUS_FLOW.indexOf(status);
  if (index >= 0 && index < ORDER_STATUS_FLOW.length - 1) {
    return ORDER_STATUS_FLOW[index + 1];
  }
  if (status === 'ready') return 'ready_to_ship';
  if (status === 'qa_failed') return 'printing';
  return null;
}

/** Job stages operators may advance without QA approval. */
export const OPERATOR_JOB_TERMINAL_STAGE = 'awaiting_qa' as const;
