/**
 * SiteHub — Full launch verification (all roles + E2E flows)
 *
 * Usage:
 *   node scripts/launch-verification.mjs
 *   npm run test:launch
 *
 * Prerequisite:
 *   npm run seed:demo
 */

import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const firebaseConfig = {
  apiKey: 'AIzaSyBJZa1RLcbZtFsfizGJadlLNnNgUVsUByw',
  authDomain: 'sitehub-8dd56.firebaseapp.com',
  projectId: 'sitehub-8dd56',
  storageBucket: 'sitehub-8dd56.firebasestorage.app',
  messagingSenderId: '145010162726',
  appId: '1:145010162726:web:8a7accc56cdc4e1fd23ae7',
};

const PASSWORD = 'demo1234';
const RUN_ID = Date.now().toString(36).toUpperCase();

const ACCOUNTS = {
  admin: { email: 'admin@demo.com', password: PASSWORD },
  sales: { email: 'sales@demo.com', password: PASSWORD },
  printer: { email: 'printer@demo.com', password: PASSWORD },
  qa: { email: 'qa@demo.com', password: PASSWORD },
  shipping: { email: 'shipping@demo.com', password: PASSWORD },
  customer: { email: 'customer@demo.com', password: PASSWORD },
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const results = [];
const cleanup = [];

function pass(section, name, detail = '') {
  results.push({ section, name, ok: true, detail });
  console.log(`  ✅ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(section, name, error) {
  const msg = error instanceof Error ? error.message : String(error);
  results.push({ section, name, ok: false, detail: msg });
  console.log(`  ❌ ${name} — ${msg}`);
}

async function signInAs(key) {
  const { email, password } = ACCOUNTS[key];
  await signOut(auth);
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user.uid;
}

async function resolveDefaultSalesUid() {
  try {
    const ops = await getDoc(doc(db, 'app_config', 'ops'));
    const fromConfig = ops.data()?.defaultSalesUid;
    if (typeof fromConfig === 'string' && fromConfig.trim()) return fromConfig.trim();
  } catch {
    // app_config rules may not be deployed yet
  }
  return signInAs('sales');
}

function cardCode(prefix = 'LAUNCH') {
  return `${prefix}-${RUN_ID}`;
}

async function tryDelete(ref) {
  try {
    await deleteDoc(ref);
    return true;
  } catch {
    return false;
  }
}

/** Mirrors SalesBulkUpload.parseEmployeeCsv (minimal). */
function parseEmployeeCsv(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const parseLine = (line) => {
    const out = [];
    let cur = '';
    let q = false;
    for (const ch of line) {
      if (ch === '"') { q = !q; continue; }
      if (ch === ',' && !q) { out.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    out.push(cur.trim());
    return out;
  };
  const headers = parseLine(lines[0]).map((h) => h.toLowerCase());
  const idx = (...needles) => headers.findIndex((h) => needles.some((n) => h.includes(n)));
  const nameIdx = idx('name', 'customer');
  const phoneIdx = idx('phone', 'mobile');
  return lines.slice(1).map((line) => {
    const cols = parseLine(line);
    return {
      customerName: cols[nameIdx >= 0 ? nameIdx : 0] ?? '',
      phone: cols[phoneIdx >= 0 ? phoneIdx : 1] ?? '',
      productType: cols[idx('product', 'card') >= 0 ? idx('product', 'card') : 2] ?? 'wood_card',
    };
  });
}

// ─── Auth per role ───────────────────────────────────────────────────────────

async function testAuthAllRoles() {
  console.log('\n── Auth sign-in (all roles) ──');
  for (const [role, cred] of Object.entries(ACCOUNTS)) {
    try {
      await signOut(auth);
      const c = await signInWithEmailAndPassword(auth, cred.email, cred.password);
      const snap = await getDoc(doc(db, 'users', c.user.uid));
      if (!snap.exists()) throw new Error('users doc missing');
      const r = snap.data().role;
      pass('auth', `${role} sign-in`, `${cred.email} (${r})`);
    } catch (e) {
      fail('auth', `${role} sign-in`, e);
    }
  }
}

// ─── Guest / customer order create ───────────────────────────────────────────

async function testGuestOrderPath() {
  console.log('\n── Guest / customer order create ──');
  let uid;
  try {
    uid = await signInAs('customer');
    pass('guest', 'Customer auth', uid.slice(0, 8));
  } catch (e) {
    fail('guest', 'Customer auth', e);
    return;
  }

  const code = cardCode('GUEST');
  const salesUid = await resolveDefaultSalesUid();
  try {
    await signInAs('customer');
    uid = auth.currentUser.uid;
    const ref = await addDoc(collection(db, 'orders'), {
      customerName: `Launch Guest ${RUN_ID}`,
      phone: '+855900111222',
      email: `guest.${RUN_ID.toLowerCase()}@test.local`,
      productType: 'pvc_card',
      quantity: 1,
      cardDesign: 'classic_black',
      cardCode: code,
      profileUrl: `https://biocloud.app/c/${code}`,
      status: 'new',
      cardStatus: 'active',
      paymentStatus: 'unpaid',
      paymentMethod: 'later_manual',
      fulfillment: 'physical',
      nfcEnabled: true,
      qrPrinted: true,
      assignedSalesman: salesUid,
      createdBy: uid,
      updatedBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    cleanup.push(ref);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('order not found');
    pass('guest', 'Customer order CREATE', ref.id);
  } catch (e) {
    fail('guest', 'Customer order CREATE', e);
  }

  try {
    const q = query(collection(db, 'orders'), where('createdBy', '==', uid));
    const snap = await getDocs(q);
    const found = snap.docs.some((d) => d.data().cardCode === code);
    if (!found) throw new Error('created order not in customer list');
    pass('guest', 'Customer order READ (own)', `${snap.size} orders`);
  } catch (e) {
    fail('guest', 'Customer order READ (own)', e);
  }
}

// ─── Guest payment methods (matches GuestPostLoginChoiceScreen) ─────────────

const PAYMENT_METHODS = ['aba_pay', 'khqr', 'acleda', 'wing', 'cash_on_delivery'];

async function testGuestPaymentFlows() {
  console.log('\n── Guest payment + checkout ──');
  let uid;
  try {
    uid = await signInAs('customer');
    pass('payment', 'Customer login (email/password)', ACCOUNTS.customer.email);
  } catch (e) {
    fail('payment', 'Customer login (email/password)', e);
    return;
  }

  const salesUid = await resolveDefaultSalesUid();

  for (const method of PAYMENT_METHODS) {
    const isCod = method === 'cash_on_delivery';
    const paymentStatus = isCod ? 'unpaid' : 'paid';
    const productType = isCod ? 'physical_nfc' : 'ecard';
    const status = isCod ? 'new' : 'ready';
    const code = cardCode('PAY');
    try {
      const ref = await addDoc(collection(db, 'orders'), {
        customerName: `Payment Test ${method}`,
        phone: '+855900222333',
        email: ACCOUNTS.customer.email,
        productType,
        quantity: 1,
        cardDesign: 'classic_black',
        cardCode: code,
        profileUrl: `https://biocloud.app/c/${code}`,
        status,
        cardStatus: 'active',
        paymentStatus,
        paymentMethod: method,
        amount: 29,
        currency: 'USD',
        fulfillment: isCod ? 'physical' : 'digital',
        nfcEnabled: true,
        qrPrinted: true,
        notes: `STUB-${method.toUpperCase()}-ref`,
        assignedSalesman: salesUid,
        createdBy: uid,
        updatedBy: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      cleanup.push(ref);
      const snap = await getDoc(ref);
      const d = snap.data();
      if (d.paymentStatus !== paymentStatus) throw new Error(`expected ${paymentStatus}, got ${d.paymentStatus}`);
      pass('payment', `${method} → order ${paymentStatus}`, ref.id.slice(0, 10));
    } catch (e) {
      const hint = method !== 'cash_on_delivery'
        ? ' — republish firestore.rules (customer paid orders + sales assign)'
        : ' — republish firestore.rules (customer → sales assign)';
      fail('payment', `${method} checkout`, `${e.message ?? e}${hint}`);
    }
  }

  // Customer order visible to assigned sales rep
  const handoffCode = cardCode('HAND');
  let handoffId;
  try {
    await signInAs('customer');
    const ref = await addDoc(collection(db, 'orders'), {
      customerName: `Sales handoff ${RUN_ID}`,
      phone: '+855900444555',
      email: ACCOUNTS.customer.email,
      productType: 'physical_nfc',
      quantity: 1,
      cardDesign: 'classic_black',
      cardCode: handoffCode,
      profileUrl: `https://biocloud.app/c/${handoffCode}`,
      status: 'new',
      cardStatus: 'active',
      paymentStatus: 'paid',
      paymentMethod: 'aba_pay',
      amount: 49,
      currency: 'USD',
      fulfillment: 'physical',
      nfcEnabled: true,
      qrPrinted: true,
      assignedSalesman: salesUid,
      createdBy: uid,
      updatedBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    handoffId = ref.id;
    cleanup.push(ref);
    pass('payment', 'Customer order → assigned to sales', salesUid.slice(0, 8));
  } catch (e) {
    fail('payment', 'Customer order → assigned to sales', e);
    return;
  }

  try {
    const salesRepUid = await signInAs('sales');
    const snap = await getDoc(doc(db, 'orders', handoffId));
    if (!snap.exists()) throw new Error('order not found for sales');
    if (snap.data().assignedSalesman !== salesRepUid) {
      throw new Error('assignedSalesman mismatch — check app_config/ops defaultSalesUid');
    }
    pass('payment', 'Sales READ customer order', snap.data().customerName);
  } catch (e) {
    fail('payment', 'Sales READ customer order', e);
  }

  try {
    const salesRepUid = await signInAs('sales');
    await updateDoc(doc(db, 'orders', handoffId), {
      notes: 'Sales acknowledged web order',
      updatedBy: salesRepUid,
      updatedAt: serverTimestamp(),
    });
    pass('payment', 'Sales UPDATE customer order', 'notes');
  } catch (e) {
    fail('payment', 'Sales UPDATE customer order', e);
  }
}

// ─── Sales ───────────────────────────────────────────────────────────────────

async function testSalesFlows() {
  console.log('\n── Sales ──');
  let uid;
  try {
    uid = await signInAs('sales');
    pass('sales', 'Sales auth', 'sales@demo.com');
  } catch (e) {
    fail('sales', 'Sales auth', e);
    return;
  }

  const code = cardCode('SALES');
  let orderId;
  try {
    const ref = await addDoc(collection(db, 'orders'), {
      customerName: `Launch Sales ${RUN_ID}`,
      phone: '+855900333444',
      telegram: '@launchtest',
      productType: 'wood_card',
      quantity: 2,
      cardDesign: 'classic_black',
      cardCode: code,
      profileUrl: `https://biocloud.app/c/${code}`,
      status: 'new',
      cardStatus: 'active',
      paymentStatus: 'partial',
      paymentMethod: 'deposit',
      nfcEnabled: true,
      qrPrinted: true,
      priority: 'standard',
      assignedSalesman: uid,
      createdBy: uid,
      updatedBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    orderId = ref.id;
    cleanup.push(ref);
    pass('sales', 'Sales order CREATE', orderId);
  } catch (e) {
    fail('sales', 'Sales order CREATE', e);
  }

  if (orderId) {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        notes: 'Updated by sales smoke test',
        updatedBy: uid,
        updatedAt: serverTimestamp(),
      });
      pass('sales', 'Sales order UPDATE (details)', 'notes');
    } catch (e) {
      fail('sales', 'Sales order UPDATE (details)', e);
    }
  }

  const csv = `name,phone,product\nBulk One,+855111111111,wood_card\nBulk Two,+855222222222,metal_card`;
  try {
    const rows = parseEmployeeCsv(csv);
    if (rows.length !== 2 || !rows[0].customerName) throw new Error('CSV parse failed');
    pass('sales', 'Bulk CSV parse validation', `${rows.length} rows`);
  } catch (e) {
    fail('sales', 'Bulk CSV parse validation', e);
  }

  try {
    const q = query(collection(db, 'orders'), where('assignedSalesman', '==', uid));
    const snap = await getDocs(q);
    pass('sales', 'Sales orders LIST', `${snap.size} assigned`);
  } catch (e) {
    fail('sales', 'Sales orders LIST', e);
  }
}

// ─── Admin ───────────────────────────────────────────────────────────────────

async function testAdminFlows() {
  console.log('\n── Admin ──');
  let uid;
  try {
    uid = await signInAs('admin');
    pass('admin', 'Admin auth', uid.slice(0, 8));
  } catch (e) {
    fail('admin', 'Admin auth', e);
    return;
  }

  let batchId;
  try {
    const ref = await addDoc(collection(db, 'production_batches'), {
      batchNumber: `LAUNCH-BATCH-${RUN_ID}`,
      material: 'pvc_card',
      printerType: 'nfc_thermal',
      status: 'draft',
      orderIds: [],
      branch: 'Head Office',
      createdBy: uid,
      updatedBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batchId = ref.id;
    cleanup.push(ref);
    pass('admin', 'Production batch CREATE', batchId);
  } catch (e) {
    fail('admin', 'Production batch CREATE', e);
  }

  try {
    const snap = await getDocs(collection(db, 'audit_logs'));
    pass('admin', 'Audit logs READ', `${snap.size} entries`);
  } catch (e) {
    fail('admin', 'Audit logs READ', e);
  }

  try {
    const [orders, batches, jobs] = await Promise.all([
      getDocs(collection(db, 'orders')),
      getDocs(collection(db, 'production_batches')),
      getDocs(collection(db, 'printer_jobs')),
    ]);
    pass('admin', 'Production stats READ', `orders=${orders.size} batches=${batches.size} jobs=${jobs.size}`);
  } catch (e) {
    fail('admin', 'Production stats READ', e);
  }

  return { uid, batchId };
}

// ─── Printer + QA + Shipping pipeline ────────────────────────────────────────

async function testProductionPipeline(adminUid) {
  console.log('\n── Printer → QA → Shipping pipeline ──');

  const code = cardCode('PIPE');
  let orderId;
  let jobId;

  // Admin seeds order at nfc_verification + job
  try {
    await signInAs('admin');
    const orderRef = await addDoc(collection(db, 'orders'), {
      customerName: `Launch Pipeline ${RUN_ID}`,
      phone: '+855900555666',
      productType: 'metal_card',
      quantity: 1,
      cardDesign: 'classic_black',
      cardCode: code,
      profileUrl: `https://biocloud.app/c/${code}`,
      status: 'nfc_verification',
      cardStatus: 'active',
      paymentStatus: 'paid',
      paymentMethod: 'online',
      branch: 'Workshop A',
      assignedSalesman: adminUid,
      createdBy: adminUid,
      updatedBy: adminUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    orderId = orderRef.id;
    cleanup.push(orderRef);

    const printerUid = (await signInWithEmailAndPassword(auth, ACCOUNTS.printer.email, PASSWORD)).user.uid;
    const jobRef = await addDoc(collection(db, 'printer_jobs'), {
      orderId,
      printerId: printerUid,
      queueNumber: Date.now(),
      stage: 'nfc_verification',
      cardsPrinted: 1,
      failedCards: 0,
      reprintedCards: 0,
      failedCardsApproved: false,
      perCardBonus: 0.5,
      perOrderBonus: 0,
      salaryStatus: 'unpaid',
      branch: 'Workshop A',
      createdBy: adminUid,
      updatedBy: adminUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    jobId = jobRef.id;
    cleanup.push(jobRef);
    pass('printer', 'Pipeline setup (admin)', `order=${orderId}`);
  } catch (e) {
    fail('printer', 'Pipeline setup (admin)', e);
    return;
  }

  // Printer: advance to QA
  try {
    const printerUid = await signInAs('printer');
    await updateDoc(doc(db, 'printer_jobs', jobId), {
      stage: 'awaiting_qa',
      updatedBy: printerUid,
      updatedAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'orders', orderId), {
      status: 'qa_pending',
      updatedBy: printerUid,
      updatedAt: serverTimestamp(),
    });
    pass('printer', 'Job → awaiting_qa + order qa_pending', jobId);
  } catch (e) {
    fail('printer', 'Job → awaiting_qa + order qa_pending', e);
  }

  // QA pass → ready_to_ship
  try {
    const qaUid = await signInAs('qa');
    await updateDoc(doc(db, 'orders', orderId), {
      status: 'ready_to_ship',
      updatedBy: qaUid,
      updatedAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'printer_jobs', jobId), {
      stage: 'done',
      updatedBy: qaUid,
      updatedAt: serverTimestamp(),
    });
    const snap = await getDoc(doc(db, 'orders', orderId));
    if (snap.data().status !== 'ready_to_ship') throw new Error('status not ready_to_ship');
    pass('qa', 'QA pass → ready_to_ship', orderId);
  } catch (e) {
    fail('qa', 'QA pass → ready_to_ship', e);
  }

  // QA fail path (separate order)
  const failCode = cardCode('QAFAIL');
  try {
    await signInAs('admin');
    const failOrder = await addDoc(collection(db, 'orders'), {
      customerName: `Launch QA Fail ${RUN_ID}`,
      phone: '+855900777888',
      productType: 'wood_card',
      quantity: 1,
      cardDesign: 'classic_black',
      cardCode: failCode,
      profileUrl: `https://biocloud.app/c/${failCode}`,
      status: 'qa_pending',
      cardStatus: 'active',
      paymentStatus: 'paid',
      branch: 'Workshop A',
      assignedSalesman: adminUid,
      createdBy: adminUid,
      updatedBy: adminUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    cleanup.push(failOrder);

    const qaUid = await signInAs('qa');
    await updateDoc(doc(db, 'orders', failOrder.id), {
      status: 'qa_failed',
      updatedBy: qaUid,
      updatedAt: serverTimestamp(),
    });
    const snap = await getDoc(failOrder);
    if (snap.data().status !== 'qa_failed') throw new Error('qa_failed not set');
    pass('qa', 'QA fail → qa_failed', failOrder.id);
  } catch (e) {
    fail('qa', 'QA fail → qa_failed', e);
  }

  // Shipping: ready_to_ship → shipped
  try {
    const shipUid = await signInAs('shipping');
    await updateDoc(doc(db, 'orders', orderId), {
      status: 'shipped',
      updatedBy: shipUid,
      updatedAt: serverTimestamp(),
    });
    const snap = await getDoc(doc(db, 'orders', orderId));
    if (snap.data().status !== 'shipped') throw new Error('not shipped');
    pass('shipping', 'Mark shipped', orderId);
  } catch (e) {
    fail('shipping', 'Mark shipped', e);
  }

  try {
    const shipUid = await signInAs('shipping');
    const snap = await getDocs(collection(db, 'orders'));
    const ready = snap.docs.filter((d) => {
      const s = d.data().status;
      return s === 'ready_to_ship' || s === 'ready';
    });
    pass('shipping', 'Shipping queue READ', `${ready.length} ready`);
  } catch (e) {
    fail('shipping', 'Shipping queue READ', e);
  }
}

// ─── Bio pages ───────────────────────────────────────────────────────────────

async function canReadBioPagesAnonymously() {
  await signOut(auth);
  try {
    await getDocs(query(collection(db, 'bio_pages'), where('slug', '==', '__launch_probe__')));
    return true;
  } catch {
    return false;
  }
}

function tryDeployFirestoreRules() {
  const result = spawnSync('node', [join(__dirname, 'deploy-firestore-rules.mjs')], {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (result.status === 0) {
    console.log('  ℹ️  Deployed firestore.rules (public bio reads enabled)');
    return true;
  }
  return false;
}

async function testBioPages() {
  console.log('\n── Bio pages ──');
  const bioId = `launch-bio-${RUN_ID.toLowerCase()}`;
  const slug = `launch-${RUN_ID.toLowerCase()}`;

  let ownerUid;
  try {
    ownerUid = await signInAs('customer');
    await setDoc(doc(db, 'bio_pages', ownerUid), {
      userId: ownerUid,
      slug,
      displayName: 'Launch Bio Test',
      tagline: 'Verification profile',
      theme: 'vibrant_pink',
      customLinks: [],
      updatedAt: serverTimestamp(),
    });
    cleanup.push(doc(db, 'bio_pages', ownerUid));
    pass('bio', 'Bio page UPSERT (owner)', ownerUid.slice(0, 8));
  } catch (e) {
    fail('bio', 'Bio page UPSERT (owner)', e);
    return;
  }

  try {
    const q = query(collection(db, 'bio_pages'), where('slug', '==', slug));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('slug query empty');
    pass('bio', 'Bio page READ by slug (auth)', snap.docs[0].data().displayName);
  } catch (e) {
    fail('bio', 'Bio page READ by slug (auth)', e);
  }

  if (!(await canReadBioPagesAnonymously())) {
    console.log('  ⚠️  Anonymous bio reads blocked — attempting rules deploy…');
    if (tryDeployFirestoreRules()) {
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  const deployHint = 'run: npx firebase login && npm run deploy:rules';
  try {
    await signOut(auth);
    const snap = await getDoc(doc(db, 'bio_pages', ownerUid));
    if (!snap.exists()) throw new Error('doc missing');
    pass('bio', 'Bio page READ (anonymous get)', snap.data().displayName);
  } catch (e) {
    fail('bio', 'Bio page READ (anonymous get)', `${e.message} — ${deployHint}`);
  }

  try {
    await signOut(auth);
    const q = query(collection(db, 'bio_pages'), where('slug', '==', slug));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('slug query empty');
    pass('bio', 'Bio page READ (anonymous slug query)', snap.docs[0].data().displayName);
  } catch (e) {
    fail('bio', 'Bio page READ (anonymous slug query)', `${e.message} — ${deployHint}`);
  }

  try {
    const adminUid = await signInAs('admin');
    await setDoc(doc(db, 'bio_pages', bioId), {
      userId: bioId,
      slug: `admin-${slug}`,
      displayName: 'Admin Bio Test',
      theme: 'classic',
      customLinks: [],
      updatedAt: serverTimestamp(),
    });
    cleanup.push(doc(db, 'bio_pages', bioId));
    pass('bio', 'Bio page UPSERT (admin)', bioId);
  } catch (e) {
    fail('bio', 'Bio page UPSERT (admin)', e);
  }
}

// ─── Cleanup ─────────────────────────────────────────────────────────────────

async function runCleanup() {
  console.log('\n── Cleanup ──');
  await signInAs('admin');
  let removed = 0;
  for (const ref of cleanup) {
    if (await tryDelete(ref)) removed += 1;
  }
  pass('cleanup', 'DELETE launch test docs', `${removed}/${cleanup.length} removed`);
}

function printSummary() {
  const bySection = {};
  for (const r of results) {
    if (!bySection[r.section]) bySection[r.section] = { pass: 0, fail: 0 };
    if (r.ok) bySection[r.section].pass += 1;
    else bySection[r.section].fail += 1;
  }

  console.log('\n══════════════════════════════════════');
  console.log('Launch verification summary');
  console.log('══════════════════════════════════════');
  for (const [section, counts] of Object.entries(bySection)) {
    const icon = counts.fail === 0 ? '✅' : '⚠️';
    console.log(`${icon} ${section}: ${counts.pass} passed, ${counts.fail} failed`);
  }
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\nTotal: ${passed} passed, ${failed} failed`);
  return failed;
}

function runCrudSmoke() {
  return new Promise((resolve) => {
    console.log('\n── Admin CRUD smoke (crud-smoke-test.mjs) ──\n');
    const child = spawn('node', [join(__dirname, 'crud-smoke-test.mjs')], {
      cwd: ROOT,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    child.on('close', (code) => resolve(code ?? 1));
  });
}

async function main() {
  console.log('\n🚀 SiteHub launch verification');
  console.log(`Run ID: ${RUN_ID}\n`);

  await testAuthAllRoles();
  await testGuestOrderPath();
  await testGuestPaymentFlows();
  await testSalesFlows();
  const { uid: adminUid } = (await testAdminFlows()) ?? {};
  if (adminUid) await testProductionPipeline(adminUid);
  await testBioPages();
  await runCleanup();

  const launchFailed = printSummary();

  const crudCode = await runCrudSmoke();
  const exitCode = launchFailed > 0 || crudCode !== 0 ? 1 : 0;
  if (exitCode === 0) {
    console.log('\n✅ Launch verification passed (all roles + admin CRUD).\n');
  } else {
    console.log('\n❌ Launch verification failed — fix items above, then re-run: npm run test:launch\n');
  }
  process.exit(exitCode);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
