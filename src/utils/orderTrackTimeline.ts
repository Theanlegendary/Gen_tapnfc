import { ORDER_STATUS_FLOW } from '@/src/utils/orderStatusFlow';
import type { Order, OrderStatus } from '@/src/types/models';

const STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Order placed',
  design: 'Design in progress',
  ready_to_print: 'Ready to print',
  printing: 'In production',
  nfc_writing: 'NFC encoding',
  nfc_verification: 'NFC verification',
  qa_pending: 'QA check',
  qa_failed: 'QA — needs fix',
  ready: 'Digital profile ready',
  ready_to_ship: 'Ready to ship',
  shipped: 'Shipped',
  delivered: 'Delivered',
};

export type OrderTimelineItem = {
  step: string;
  at: string;
  done: boolean;
  active?: boolean;
};

export function buildOrderTimeline(order: Order): OrderTimelineItem[] {
  const flow: OrderStatus[] =
    order.status === 'ready' ? (['new', 'design', 'ready'] as OrderStatus[]) : ORDER_STATUS_FLOW;

  const statusIndex = flow.indexOf(order.status);
  const placed = new Date(order.createdAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return flow.map((status, index) => {
    const done = statusIndex >= 0 ? index <= statusIndex : false;
    const active = statusIndex >= 0 && index === statusIndex;
    return {
      step: STATUS_LABELS[status] ?? status,
      at: index === 0 ? placed : active ? 'In progress' : done ? 'Complete' : 'Pending',
      done,
      active,
    };
  });
}
