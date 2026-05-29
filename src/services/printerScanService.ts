import {
  assignCardCodeToOrder,
  getOrder,
  getOrderByCardCode,
  getPrinterJobByOrderId,
} from '@/src/services/firestoreService';
import { Order, PrinterJob } from '@/src/types/models';

export function extractScanUid(raw: string) {
  const value = raw.trim();
  const urlMatch = value.match(/\/c\/([^/?#]+)/i);
  const candidate = urlMatch?.[1] ?? value;
  return candidate.replace(/^URL:/i, '').replace(/:/g, '').trim().toUpperCase();
}

export type ScanMatchResult = {
  order: Order;
  job: PrinterJob;
  linkedToQueue: boolean;
};

function pickNextBatchJob(jobs: PrinterJob[]) {
  const candidates = jobs.filter(
    (job) =>
      job.batchId &&
      (job.stage === 'queued' ||
        job.stage === 'printing' ||
        job.stage === 'nfc_writing' ||
        job.stage === 'reprint')
  );
  return [...candidates].sort((a, b) => a.queueNumber - b.queueNumber)[0] ?? null;
}

/**
 * READ → MATCH: resolve UID to an order + printer job within the active batch only.
 * 1) If UID already on an order in this batch, use that job.
 * 2) Else link UID to the next queued job in the batch (no global FIFO).
 */
export async function matchScanToPrinterJob(
  rawUid: string,
  batchJobs: PrinterJob[],
  operatorId: string,
  activeBatchId: string
): Promise<ScanMatchResult | null> {
  const uid = extractScanUid(rawUid);
  if (!uid || !activeBatchId?.trim()) return null;

  const batchScoped = batchJobs.filter((j) => j.batchId === activeBatchId);

  const existingOrder = await getOrderByCardCode(uid);
  if (existingOrder) {
    const job = await getPrinterJobByOrderId(existingOrder.id);
    if (!job || job.batchId !== activeBatchId) return null;
    return { order: existingOrder, job, linkedToQueue: false };
  }

  const nextJob = pickNextBatchJob(batchScoped);
  if (!nextJob) return null;

  const order = await getOrder(nextJob.orderId);
  if (!order || order.batchId !== activeBatchId) return null;

  const linkedOrder =
    order.cardCode.toUpperCase() === uid
      ? order
      : await assignCardCodeToOrder(order.id, uid, operatorId);

  return { order: linkedOrder, job: nextJob, linkedToQueue: true };
}
