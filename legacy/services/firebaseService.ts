import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { AttendanceRecord } from '@/types/attendance';
import { User } from '@/types/auth';
import { AppNotification } from '@/types/notifications';
import { AttendanceGroup, GroupAttendanceQR, GroupJoinRequest, GroupMember } from '@/types/groups';
import { PaymentOption, PrinterJob, ProductType, PayoutSummary, SalesOrder } from '@/types/salesPrinter';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/lib/firebase';

const nowIso = () => new Date().toISOString();

const toIso = (value: any) => {
  if (!value) return nowIso();
  if (typeof value === 'string') return value;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return nowIso();
};

const mapUser = (id: string, data: any): User => ({
  id,
  email: data.email,
  name: data.name,
  employeeId: data.employeeId,
  role: data.role,
  username: data.username,
  contact: data.contact,
  designation: data.designation,
  address: data.address,
  profileImage: data.profileImage,
  timeZone: data.timeZone,
  language: data.language,
  joinedGroups: data.joinedGroups || [],
  personalQRCode: data.personalQRCode,
  twoFactorEnabled: data.twoFactorEnabled || false,
  notificationSettings: data.notificationSettings,
  workStartTime: data.workStartTime || '09:00',
  workEndTime: data.workEndTime || '17:00',
  isActive: data.isActive ?? true,
  emailVerified: data.emailVerified ?? false,
  createdAt: toIso(data.createdAt),
  updatedAt: toIso(data.updatedAt),
});

export const FirebaseService = {
  onAuthStateChanged(callback: (firebaseUser: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  async login(email: string, password: string): Promise<User> {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return this.getUserProfile(credential.user.uid);
  },

  async register(data: {
    email: string;
    password: string;
    name: string;
    employeeId: string;
    contact?: string;
    designation?: string;
    role?: 'user' | 'admin' | 'super_admin' | 'sales_rep' | 'printer_staff';
  }): Promise<User> {
    const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);

    const profile: Omit<User, 'id'> = {
      email: data.email,
      name: data.name,
      employeeId: data.employeeId,
      role: data.role || 'sales_rep',
      contact: data.contact,
      designation: data.designation,
      workStartTime: '09:00',
      workEndTime: '17:00',
      isActive: true,
      emailVerified: credential.user.emailVerified,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    await setDoc(doc(db, 'users', credential.user.uid), {
      ...profile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { id: credential.user.uid, ...profile };
  },

  async logout() {
    await signOut(auth);
  },

  async resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email.trim());
  },

  async getUserProfile(uid: string): Promise<User> {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('User profile not found');
    return mapUser(snap.id, snap.data());
  },

  async updateUserProfile(uid: string, updates: Partial<User>): Promise<User> {
    const ref = doc(db, 'users', uid);
    await updateDoc(ref, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return this.getUserProfile(uid);
  },

  subscribeNotifications(userId: string, role: User['role'], cb: (items: AppNotification[]) => void) {
    const q = query(
      collection(db, 'notifications'),
      where('targetAudience', '==', role === 'user' ? 'user' : 'admin'),
      where(role === 'user' ? 'userId' : 'adminId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(250)
    );

    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          createdAt: toIso(data.createdAt),
        } as AppNotification;
      });
      cb(items);
    });
  },

  async createNotification(payload: Omit<AppNotification, 'id' | 'createdAt'>) {
    await addDoc(collection(db, 'notifications'), {
      ...payload,
      createdAt: serverTimestamp(),
    });
  },

  async markNotificationRead(id: string) {
    await updateDoc(doc(db, 'notifications', id), { isRead: true, updatedAt: serverTimestamp() });
  },

  async deleteNotification(id: string) {
    await deleteDoc(doc(db, 'notifications', id));
  },

  async markAllNotificationsRead(userId: string, role: User['role']) {
    const q = query(
      collection(db, 'notifications'),
      where('targetAudience', '==', role === 'user' ? 'user' : 'admin'),
      where(role === 'user' ? 'userId' : 'adminId', '==', userId),
      where('isRead', '==', false)
    );
    const snaps = await getDocs(q);
    await Promise.all(snaps.docs.map((d) => updateDoc(d.ref, { isRead: true, updatedAt: serverTimestamp() })));
  },

  async createGroup(payload: Omit<AttendanceGroup, 'id' | 'createdAt' | 'updatedAt' | 'memberCount'>) {
    const ref = await addDoc(collection(db, 'groups'), {
      ...payload,
      memberCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const snap = await getDoc(ref);
    return { id: ref.id, ...snap.data(), createdAt: toIso(snap.data()?.createdAt), updatedAt: toIso(snap.data()?.updatedAt) } as AttendanceGroup;
  },

  async updateGroup(groupId: string, updates: Partial<AttendanceGroup>) {
    await updateDoc(doc(db, 'groups', groupId), { ...updates, updatedAt: serverTimestamp() });
  },

  async deleteGroup(groupId: string) {
    await deleteDoc(doc(db, 'groups', groupId));
  },

  subscribeAdminGroups(adminId: string, cb: (groups: AttendanceGroup[]) => void) {
    const q = query(collection(db, 'groups'), where('adminId', '==', adminId), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      cb(snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: toIso(data.createdAt),
          updatedAt: toIso(data.updatedAt),
        } as AttendanceGroup;
      }));
    });
  },

  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const q = query(collection(db, 'group_memberships'), where('groupId', '==', groupId), orderBy('joinedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        joinedAt: toIso(data.joinedAt),
        approvedAt: toIso(data.approvedAt),
      } as GroupMember;
    });
  },

  async createJoinRequest(payload: Omit<GroupJoinRequest, 'id' | 'requestedAt' | 'status'>) {
    const ref = await addDoc(collection(db, 'join_requests'), {
      ...payload,
      status: 'pending',
      requestedAt: serverTimestamp(),
    });
    return ref.id;
  },

  subscribeJoinRequests(adminId: string, cb: (items: GroupJoinRequest[]) => void) {
    const q = query(collection(db, 'join_requests'), where('adminId', '==', adminId), orderBy('requestedAt', 'desc'));
    return onSnapshot(q, (snap) => {
      cb(snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          requestedAt: toIso(data.requestedAt),
          processedAt: toIso(data.processedAt),
        } as GroupJoinRequest;
      }));
    });
  },

  async processJoinRequest(requestId: string, status: 'approved' | 'rejected', processedBy: string, adminMessage?: string) {
    const ref = doc(db, 'join_requests', requestId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Join request not found');
    const request = snap.data() as GroupJoinRequest & { groupId: string; userId: string };

    await updateDoc(ref, {
      status,
      processedBy,
      processedAt: serverTimestamp(),
      adminMessage: adminMessage || null,
    });

    if (status === 'approved') {
      await setDoc(doc(db, 'group_memberships', `${request.groupId}_${request.userId}`), {
        groupId: request.groupId,
        userId: request.userId,
        userEmail: request.userEmail,
        userName: request.userName,
        employeeId: request.employeeId,
        status: 'approved',
        role: 'member',
        joinedAt: serverTimestamp(),
        approvedBy: processedBy,
        approvedAt: serverTimestamp(),
      });
    }
  },

  async createQRSession(payload: Omit<GroupAttendanceQR, 'id' | 'createdAt' | 'scanCount'>) {
    const ref = await addDoc(collection(db, 'qr_sessions'), {
      ...payload,
      scanCount: 0,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  },

  async validateAndRecordAttendance(user: User, qrSessionId: string, rawQRData: string) {
    const qrRef = doc(db, 'qr_sessions', qrSessionId);
    const qrSnap = await getDoc(qrRef);
    if (!qrSnap.exists()) throw new Error('QR session not found');

    const qrSession = qrSnap.data() as any;
    if (!qrSession.isActive) throw new Error('QR session is inactive');

    const now = new Date();
    const validFrom = new Date(qrSession.validFrom);
    const validUntil = new Date(qrSession.validUntil);
    if (now < validFrom || now > validUntil) throw new Error('QR session is expired or not active yet');

    const membershipRef = doc(db, 'group_memberships', `${qrSession.groupId}_${user.id}`);
    const membershipSnap = await getDoc(membershipRef);
    if (!membershipSnap.exists()) throw new Error('You are not an approved member of this group');

    const date = now.toISOString().slice(0, 10);
    const attendanceDocId = `${qrSession.groupId}_${qrSession.id}_${user.id}_${date}`;
    const attendanceRef = doc(db, 'attendance_records', attendanceDocId);
    const existing = await getDoc(attendanceRef);
    if (existing.exists()) throw new Error('Attendance already recorded for this session');

    const status = 'Present';
    const payload: AttendanceRecord = {
      id: attendanceDocId,
      userId: user.id,
      employeeId: user.employeeId,
      employeeName: user.name,
      date,
      checkInTime: now.toISOString(),
      status,
      qrCodeData: rawQRData,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    await setDoc(attendanceRef, {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      qrSessionId: qrSession.id,
      groupId: qrSession.groupId,
    });

    await updateDoc(qrRef, { scanCount: (qrSession.scanCount || 0) + 1, updatedAt: serverTimestamp() });

    return payload;
  },

  subscribeSalesOrders(salesRepId: string, cb: (orders: SalesOrder[]) => void) {
    const q = query(collection(db, 'orders'), where('salesRepId', '==', salesRepId), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      cb(snap.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: toIso(d.data().createdAt), updatedAt: toIso(d.data().updatedAt) } as SalesOrder)));
    });
  },

  subscribePrinterJobs(cb: (jobs: PrinterJob[]) => void) {
    const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      cb(snap.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: toIso(d.data().createdAt), updatedAt: toIso(d.data().updatedAt) } as PrinterJob)));
    });
  },

  async createSalesOrder(payload: {
    customerName: string;
    contact: string;
    productType: ProductType;
    paymentOption: PaymentOption;
    price: number;
    salesRepId: string;
    salesRepName: string;
  }) {
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    const commissionRate = 0.1;
    const commissionAmount = Math.round(payload.price * commissionRate * 100) / 100;

    const orderRef = await addDoc(collection(db, 'orders'), {
      ...payload,
      orderNumber,
      status: 'in_queue',
      commissionAmount,
      commissionUnlocked: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const jobRef = await addDoc(collection(db, 'jobs'), {
      orderId: orderRef.id,
      orderNumber,
      customerName: payload.customerName,
      productType: payload.productType,
      stage: 'pending',
      wage: payload.productType === 'metal_card' ? 6 : 4,
      priority: payload.paymentOption === 'online_discount' ? 'high' : 'normal',
      nfcLocked: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, 'orders', orderRef.id), { jobId: jobRef.id, updatedAt: serverTimestamp() });
    return { orderId: orderRef.id, jobId: jobRef.id, orderNumber };
  },

  async setJobStage(jobId: string, stage: 'pending' | 'programming' | 'ready') {
    const jobRef = doc(db, 'jobs', jobId);
    const jobSnap = await getDoc(jobRef);
    if (!jobSnap.exists()) throw new Error('Job not found');
    const job = jobSnap.data() as PrinterJob;

    await updateDoc(jobRef, { stage, updatedAt: serverTimestamp() });
    await updateDoc(doc(db, 'orders', job.orderId), {
      status: stage === 'pending' ? 'in_queue' : stage === 'programming' ? 'programming' : 'qa_pending',
      updatedAt: serverTimestamp(),
    });
  },

  async lockJobChip(jobId: string, userId: string) {
    const jobRef = doc(db, 'jobs', jobId);
    const jobSnap = await getDoc(jobRef);
    if (!jobSnap.exists()) throw new Error('Job not found');
    const job = jobSnap.data() as PrinterJob;
    if (job.nfcLocked) throw new Error('Chip already locked');

    await updateDoc(jobRef, { nfcLocked: true, stage: 'ready', updatedAt: serverTimestamp() });
    await setDoc(doc(db, 'nfc_status', jobId), {
      jobId,
      locked: true,
      lockedAt: serverTimestamp(),
      lockedBy: userId,
    });
    await updateDoc(doc(db, 'orders', job.orderId), { status: 'qa_pending', updatedAt: serverTimestamp() });
  },

  async uploadQaVideo(jobId: string, orderId: string, uri: string, recordedBy: string) {
    const fileRef = ref(storage, `qa-videos/${jobId}/${Date.now()}.mp4`);
    const blob = await (await fetch(uri)).blob();
    await uploadBytes(fileRef, blob, { contentType: 'video/mp4' });
    const url = await getDownloadURL(fileRef);

    await addDoc(collection(db, 'qa_videos'), {
      jobId,
      orderId,
      videoUrl: url,
      recordedBy,
      createdAt: serverTimestamp(),
    });

    await updateDoc(doc(db, 'jobs', jobId), { qaVideoUrl: url, updatedAt: serverTimestamp() });
    await updateDoc(doc(db, 'orders', orderId), {
      status: 'completed',
      commissionUnlocked: true,
      updatedAt: serverTimestamp(),
    });

    return url;
  },

  async getSalesPayoutSummary(salesRepId: string): Promise<PayoutSummary> {
    const q = query(collection(db, 'orders'), where('salesRepId', '==', salesRepId));
    const snap = await getDocs(q);
    const orders = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: toIso(data.createdAt),
        updatedAt: toIso(data.updatedAt),
      } as SalesOrder;
    });

    const totalCommission = orders.reduce((sum, o) => sum + (o.commissionAmount || 0), 0);
    const pendingApproval = orders.filter((o) => o.commissionUnlocked).reduce((sum, o) => sum + (o.commissionAmount || 0), 0);

    const payoutSnap = await getDocs(query(collection(db, 'payouts'), where('salesRepId', '==', salesRepId)));
    const paidOut = payoutSnap.docs.reduce((sum, d) => sum + (d.data().amount || 0), 0);

    return {
      totalCommission,
      pendingApproval,
      paidOut,
      recentUnlockedOrders: orders
        .filter((o) => o.commissionUnlocked)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 8)
        .map((o) => ({ orderId: o.id, customerName: o.customerName, commissionAmount: o.commissionAmount })),
    };
  },
};
