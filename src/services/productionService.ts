import {
  Timestamp,
  addDoc,
  collection,
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
  getOrder,
  getPrinterJobByOrderId,
  mapOrder,
  mapPrinterJob,
  updateOrderStatus,
} from '@/src/services/firestoreService';
import {
  AuditLogEntry,
  Order,
  OrderStatus,
  PrinterHealthRecord,
  PrinterJob,
  PrinterJobStage,
  ProductionBatch,
  ProductionBatchStatus,
  ProductionStatsSnapshot,
  QaDecision,
  ReprintRecord,
  UserRole,
} from '@/src/types/models';
import { canTransitionOrderStatus } from '@/src/utils/orderStatusFlow';

function actorId(fallback?: string) {
  return auth.currentUser?.uid || fallback || '';
}

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

function withoutUndefined<T extends Record<string, unknown>>(payload: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

function assertNonEmpty(value: string | undefined, message: string) {
  if (!value?.trim()) throw new Error(message);
}

export function mapProductionBatch(id: string, data: Record<string, unknown>): ProductionBatch {
  return {
    id,
    batchNumber: String(data.batchNumber ?? ''),
    material: String(data.material ?? ''),
    printerType: String(data.printerType ?? ''),
    status: (data.status as ProductionBatchStatus) ?? 'draft',
    orderIds: Array.isArray(data.orderIds) ? (data.orderIds as string[]) : [],
    branch: String(data.branch ?? ''),
    activeOperatorId: data.activeOperatorId as string | undefined,
    notes: data.notes as string | undefined,
    createdBy: String(data.createdBy ?? ''),
    updatedBy: data.updatedBy as string | undefined,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

export function mapAuditLog(id: string, data: Record<string, unknown>): AuditLogEntry {
  return {
    id,
    action: String(data.action ?? ''),
    entityType: (data.entityType as AuditLogEntry['entityType']) ?? 'order',
    entityId: String(data.entityId ?? ''),
    actorId: String(data.actorId ?? ''),
    actorRole: data.actorRole as AuditLogEntry['actorRole'],
    branch: data.branch as string | undefined,
    metadata: data.metadata as AuditLogEntry['metadata'],
    createdAt: toIso(data.createdAt),
  };
}

export async function writeAuditLog(input: Omit<AuditLogEntry, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, firebaseCollections.auditLogs), {
    ...input,
    actorId: input.actorId || actorId(),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
  const snap = await getDocs(collection(db, firebaseCollections.auditLogs));
  return snap.docs
    .map((d) => mapAuditLog(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export function subscribeAuditLogs(callback: (items: AuditLogEntry[]) => void, onError?: (e: Error) => void) {
  return onSnapshot(
    collection(db, firebaseCollections.auditLogs),
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => mapAuditLog(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      callback(items);
    },
    (error) => {
      callback([]);
      onError?.(error);
    }
  );
}

export type CreateBatchInput = {
  batchNumber: string;
  material: string;
  printerType: string;
  branch: string;
  notes?: string;
  createdBy?: string;
};

export async function createProductionBatch(input: CreateBatchInput): Promise<string> {
  assertNonEmpty(input.batchNumber, 'Batch number is required.');
  assertNonEmpty(input.material, 'Material is required.');
  assertNonEmpty(input.printerType, 'Printer type is required.');
  const staffId = actorId(input.createdBy);
  const ref = await addDoc(
    collection(db, firebaseCollections.productionBatches),
    withoutUndefined({
      batchNumber: input.batchNumber.trim(),
      material: input.material.trim(),
      printerType: input.printerType.trim(),
      status: 'draft' as ProductionBatchStatus,
      orderIds: [],
      branch: input.branch?.trim() || '',
      notes: input.notes?.trim(),
      createdBy: staffId,
      updatedBy: staffId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  );
  await writeAuditLog({
    action: 'batch_created',
    entityType: 'batch',
    entityId: ref.id,
    actorId: staffId,
    metadata: { batchNumber: input.batchNumber },
  });
  return ref.id;
}

export async function getProductionBatch(batchId: string): Promise<ProductionBatch | null> {
  const snap = await getDoc(doc(db, firebaseCollections.productionBatches, batchId));
  if (!snap.exists()) return null;
  return mapProductionBatch(snap.id, snap.data() as Record<string, unknown>);
}

export async function listProductionBatches(branch?: string): Promise<ProductionBatch[]> {
  const snap = await getDocs(collection(db, firebaseCollections.productionBatches));
  let items = snap.docs.map((d) => mapProductionBatch(d.id, d.data() as Record<string, unknown>));
  if (branch?.trim()) {
    items = items.filter((b) => !b.branch || b.branch === branch);
  }
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function subscribeProductionBatches(
  branch: string | undefined,
  callback: (batches: ProductionBatch[]) => void,
  onError?: (e: Error) => void
) {
  return onSnapshot(
    collection(db, firebaseCollections.productionBatches),
    (snapshot) => {
      let items = snapshot.docs.map((d) => mapProductionBatch(d.id, d.data() as Record<string, unknown>));
      if (branch?.trim()) {
        items = items.filter((b) => !b.branch || b.branch === branch);
      }
      callback(items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    },
    (error) => {
      callback([]);
      onError?.(error);
    }
  );
}

export async function setBatchStatus(
  batchId: string,
  status: ProductionBatchStatus,
  extra?: { activeOperatorId?: string | null },
  updatedBy?: string
): Promise<void> {
  const userId = actorId(updatedBy);
  const payload: Record<string, unknown> = {
    status,
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  };
  if (extra?.activeOperatorId !== undefined) {
    payload.activeOperatorId = extra.activeOperatorId || null;
  }
  await updateDoc(doc(db, firebaseCollections.productionBatches, batchId), payload);
  await writeAuditLog({
    action: `batch_${status}`,
    entityType: 'batch',
    entityId: batchId,
    actorId: userId,
    metadata: { status },
  });
}

export async function assignOrderToBatch(
  batchId: string,
  orderId: string,
  updatedBy?: string
): Promise<PrinterJob> {
  const batch = await getProductionBatch(batchId);
  if (!batch) throw new Error('Batch not found.');
  if (batch.status === 'completed' || batch.status === 'cancelled') {
    throw new Error('Cannot add orders to a closed batch.');
  }

  const order = await getOrder(orderId);
  if (!order) throw new Error('Order not found.');
  if (order.paymentStatus !== 'paid') {
    throw new Error('Order must be paid before batch assignment.');
  }
  if (order.batchId && order.batchId !== batchId) {
    throw new Error('Order is already assigned to another batch.');
  }

  const existingJob = await getPrinterJobByOrderId(orderId);
  if (existingJob && !existingJob.isReprint) {
    if (existingJob.batchId === batchId) return existingJob;
    throw new Error('Order already has an active printer job.');
  }

  const userId = actorId(updatedBy);
  const statusUpdate: Partial<{ status: OrderStatus }> = {};
  if (canTransitionOrderStatus(order.status, 'ready_to_print')) {
    statusUpdate.status = 'ready_to_print';
  } else if (order.status === 'qa_failed' && canTransitionOrderStatus('qa_failed', 'printing')) {
    statusUpdate.status = 'printing';
  }

  await updateDoc(doc(db, firebaseCollections.orders, orderId), {
    batchId,
    branch: batch.branch || order.branch,
    ...statusUpdate,
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });

  const orderIds = batch.orderIds.includes(orderId) ? batch.orderIds : [...batch.orderIds, orderId];
  await updateDoc(doc(db, firebaseCollections.productionBatches, batchId), {
    orderIds,
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });

  const jobRef = await addDoc(collection(db, firebaseCollections.printerJobs), {
    orderId,
    batchId,
    printerId: '',
    queueNumber: Date.now(),
    stage: 'queued' as PrinterJobStage,
    cardsPrinted: 0,
    failedCards: 0,
    reprintedCards: 0,
    failedCardsApproved: false,
    perCardBonus: 0.5,
    perOrderBonus: 0,
    salaryStatus: 'unpaid',
    createdBy: userId,
    updatedBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await writeAuditLog({
    action: 'order_assigned_to_batch',
    entityType: 'order',
    entityId: orderId,
    actorId: userId,
    metadata: { batchId, jobId: jobRef.id },
  });

  const jobSnap = await getDoc(jobRef);
  return mapPrinterJob(jobSnap.id, jobSnap.data() as Record<string, unknown>);
}

export async function removeOrderFromBatch(batchId: string, orderId: string, updatedBy?: string): Promise<void> {
  const batch = await getProductionBatch(batchId);
  if (!batch) throw new Error('Batch not found.');
  const userId = actorId(updatedBy);
  await updateDoc(doc(db, firebaseCollections.productionBatches, batchId), {
    orderIds: batch.orderIds.filter((id) => id !== orderId),
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, firebaseCollections.orders, orderId), {
    batchId: null,
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeBatchPrinterJobs(
  batchId: string,
  callback: (jobs: PrinterJob[]) => void,
  onError?: (e: Error) => void
) {
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
        .map((d) => mapPrinterJob(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => a.queueNumber - b.queueNumber);
      callback(jobs);
    },
    (error) => {
      callback([]);
      onError?.(error);
    }
  );
}

export async function submitQaDecision(
  orderId: string,
  jobId: string,
  decision: QaDecision,
  reason?: string,
  updatedBy?: string
): Promise<void> {
  const userId = actorId(updatedBy);
  const order = await getOrder(orderId);
  if (!order) throw new Error('Order not found.');
  if (order.status !== 'qa_pending') {
    throw new Error('Order is not awaiting QA.');
  }

  if (decision === 'pass') {
    await updateOrderStatus(orderId, 'ready_to_ship', userId);
    await updateDoc(doc(db, firebaseCollections.printerJobs, jobId), {
      stage: 'done',
      updatedBy: userId,
      updatedAt: serverTimestamp(),
    });
    await writeAuditLog({
      action: 'qa_passed',
      entityType: 'qa',
      entityId: orderId,
      actorId: userId,
      metadata: { jobId },
    });
    return;
  }

  await updateOrderStatus(orderId, 'qa_failed', userId);
  await updateDoc(doc(db, firebaseCollections.printerJobs, jobId), {
    stage: 'failed',
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });
  await writeAuditLog({
    action: 'qa_failed',
    entityType: 'qa',
    entityId: orderId,
    actorId: userId,
    metadata: { jobId, reason: reason ?? '' },
  });
  await createReprintJob(orderId, jobId, reason ?? 'QA failed', userId);
}

export async function createReprintJob(
  orderId: string,
  originalJobId: string,
  reason: string,
  createdBy?: string
): Promise<string> {
  const userId = actorId(createdBy);
  const order = await getOrder(orderId);
  if (!order) throw new Error('Order not found.');

  const jobRef = await addDoc(collection(db, firebaseCollections.printerJobs), {
    orderId,
    batchId: order.batchId ?? null,
    printerId: '',
    queueNumber: Date.now(),
    stage: 'reprint' as PrinterJobStage,
    cardsPrinted: 0,
    failedCards: 0,
    reprintedCards: 0,
    failedCardsApproved: false,
    perCardBonus: 0.5,
    perOrderBonus: 0,
    salaryStatus: 'unpaid',
    isReprint: true,
    reprintOfJobId: originalJobId,
    notes: reason,
    createdBy: userId,
    updatedBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await addDoc(collection(db, firebaseCollections.reprintRecords), {
    orderId,
    originalJobId,
    newJobId: jobRef.id,
    batchId: order.batchId ?? null,
    reason,
    createdBy: userId,
    createdAt: serverTimestamp(),
  });

  if (canTransitionOrderStatus(order.status, 'printing')) {
    await updateOrderStatus(orderId, 'printing', userId);
  }

  await writeAuditLog({
    action: 'reprint_created',
    entityType: 'reprint',
    entityId: jobRef.id,
    actorId: userId,
    metadata: { orderId, originalJobId, reason },
  });

  return jobRef.id;
}

export async function markOrderShipped(orderId: string, trackingNote?: string, updatedBy?: string): Promise<void> {
  const order = await getOrder(orderId);
  if (!order) throw new Error('Order not found.');
  if (order.status !== 'ready_to_ship' && order.status !== 'ready') {
    throw new Error('Order must be ready to ship.');
  }
  const userId = actorId(updatedBy);
  const next: OrderStatus = order.status === 'ready' ? 'delivered' : 'shipped';
  await updateOrderStatus(orderId, next, userId);
  if (next === 'shipped') {
    await writeAuditLog({
      action: 'order_shipped',
      entityType: 'shipping',
      entityId: orderId,
      actorId: userId,
      metadata: { trackingNote: trackingNote ?? '' },
    });
  }
}

export async function markOrderDelivered(orderId: string, updatedBy?: string): Promise<void> {
  const order = await getOrder(orderId);
  if (!order) throw new Error('Order not found.');
  if (order.status !== 'shipped' && order.status !== 'ready') {
    throw new Error('Order must be shipped first.');
  }
  await updateOrderStatus(orderId, 'delivered', actorId(updatedBy));
}

export async function listOrdersReadyToShip(branch?: string): Promise<Order[]> {
  const snap = await getDocs(collection(db, firebaseCollections.orders));
  return snap.docs
    .map((d) => mapOrder(d.id, d.data() as Record<string, unknown>))
    .filter((o) => {
      const ready = o.status === 'ready_to_ship' || o.status === 'ready';
      if (!ready) return false;
      if (branch?.trim() && o.branch && o.branch !== branch) return false;
      return true;
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listOrdersAwaitingQa(): Promise<Order[]> {
  const snap = await getDocs(
    query(collection(db, firebaseCollections.orders), where('status', '==', 'qa_pending'))
  );
  return snap.docs
    .map((d) => mapOrder(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getProductionStats(): Promise<ProductionStatsSnapshot> {
  const today = new Date().toISOString().slice(0, 10);
  const [batchSnap, orderSnap, jobSnap, auditSnap, reprintSnap] = await Promise.all([
    getDocs(collection(db, firebaseCollections.productionBatches)),
    getDocs(collection(db, firebaseCollections.orders)),
    getDocs(collection(db, firebaseCollections.printerJobs)),
    getDocs(collection(db, firebaseCollections.auditLogs)),
    getDocs(collection(db, firebaseCollections.reprintRecords)),
  ]);
  const batches = batchSnap.docs.map((d) => mapProductionBatch(d.id, d.data() as Record<string, unknown>));
  const orders = orderSnap.docs.map((d) => mapOrder(d.id, d.data() as Record<string, unknown>));
  const jobs = jobSnap.docs.map((d) => mapPrinterJob(d.id, d.data() as Record<string, unknown>));
  const auditLogs = auditSnap.docs.map((d) => mapAuditLog(d.id, d.data() as Record<string, unknown>));

  const qaPassedToday = auditLogs.filter((l) => l.action === 'qa_passed' && l.createdAt.startsWith(today)).length;
  const qaFailedToday = auditLogs.filter((l) => l.action === 'qa_failed' && l.createdAt.startsWith(today)).length;
  const qaDecisionsToday = qaPassedToday + qaFailedToday;

  const reprintsToday = reprintSnap.docs.filter((d) => {
    const createdAt = d.data().createdAt;
    const iso = createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : toIso(createdAt);
    return iso.startsWith(today);
  }).length;

  return {
    cardsToday: orders
      .filter((o) => o.createdAt.startsWith(today))
      .reduce((sum, o) => sum + (o.quantity ?? 1), 0),
    batchesActive: batches.filter((b) => b.status === 'active').length,
    ordersInProduction: orders.filter((o) =>
      ['printing', 'nfc_writing', 'nfc_verification', 'qa_pending'].includes(o.status)
    ).length,
    jobsInQueue: jobs.filter((j) => j.stage === 'queued' || j.stage === 'reprint').length,
    qaPending: orders.filter((o) => o.status === 'qa_pending').length,
    qaPassRate: qaDecisionsToday > 0 ? Math.round((qaPassedToday / qaDecisionsToday) * 100) : 100,
    readyToShip: orders.filter((o) => o.status === 'ready_to_ship' || o.status === 'ready').length,
    shippedToday: orders.filter((o) => o.status === 'shipped' && o.updatedAt.startsWith(today)).length,
    reprintsToday,
    capturedAt: new Date().toISOString(),
  };
}

export async function upsertPrinterHealthPlaceholder(
  printerId: string,
  printerName: string,
  branch: string
): Promise<void> {
  await setDoc(
    doc(db, firebaseCollections.printerHealth, printerId),
    {
      printerId,
      printerName,
      branch,
      status: 'unknown',
      lastSeenAt: serverTimestamp(),
      jobsToday: 0,
      failureRate: 0,
      notes: 'Placeholder — connect device telemetry',
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function listReprintRecords(limit = 50): Promise<ReprintRecord[]> {
  const snap = await getDocs(collection(db, firebaseCollections.reprintRecords));
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        orderId: String(data.orderId ?? ''),
        originalJobId: String(data.originalJobId ?? ''),
        newJobId: String(data.newJobId ?? ''),
        batchId: data.batchId as string | undefined,
        reason: String(data.reason ?? ''),
        createdBy: String(data.createdBy ?? ''),
        createdAt: toIso(data.createdAt),
      } as ReprintRecord;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export async function listPrinterHealthRecords(): Promise<PrinterHealthRecord[]> {
  const snap = await getDocs(collection(db, firebaseCollections.printerHealth));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      printerId: String(data.printerId ?? d.id),
      printerName: String(data.printerName ?? ''),
      branch: String(data.branch ?? ''),
      status: (data.status as PrinterHealthRecord['status']) ?? 'unknown',
      lastSeenAt: toIso(data.lastSeenAt),
      jobsToday: Number(data.jobsToday ?? 0),
      failureRate: Number(data.failureRate ?? 0),
      notes: data.notes as string | undefined,
      updatedAt: toIso(data.updatedAt),
    };
  });
}

export async function listPaidOrdersUnbatched(branch?: string): Promise<Order[]> {
  const snap = await getDocs(
    query(collection(db, firebaseCollections.orders), where('paymentStatus', '==', 'paid'))
  );
  return snap.docs
    .map((d) => mapOrder(d.id, d.data() as Record<string, unknown>))
    .filter((o) => {
      if (o.batchId) return false;
      if (o.status === 'delivered' || o.cardStatus === 'closed') return false;
      if (branch?.trim() && o.branch && o.branch !== branch) return false;
      return ['design', 'ready_to_print', 'new'].includes(o.status) || o.status === 'qa_failed';
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
