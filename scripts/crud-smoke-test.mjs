/**
 * SiteHub — Firebase CRUD smoke test
 *
 * Usage:
 *   node scripts/crud-smoke-test.mjs
 *
 * Requires demo staff in Firebase (run once):
 *   node scripts/seed-demo-data.mjs seed
 *
 * Uses the same Firebase project as seed-demo-data.mjs.
 * Creates temporary docs prefixed CRUD-TEST- and removes them when possible.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
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

const firebaseConfig = {
  apiKey: 'AIzaSyBJZa1RLcbZtFsfizGJadlLNnNgUVsUByw',
  authDomain: 'sitehub-8dd56.firebaseapp.com',
  projectId: 'sitehub-8dd56',
  storageBucket: 'sitehub-8dd56.firebasestorage.app',
  messagingSenderId: '145010162726',
  appId: '1:145010162726:web:8a7accc56cdc4e1fd23ae7',
};

const ADMIN = { email: 'admin@demo.com', password: 'demo1234' };
const RUN_ID = Date.now().toString(36).toUpperCase();

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const results = [];

function pass(name, detail = '') {
  results.push({ name, ok: true, detail });
  console.log(`  ✅ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, error) {
  const msg = error instanceof Error ? error.message : String(error);
  results.push({ name, ok: false, detail: msg });
  console.log(`  ❌ ${name} — ${msg}`);
}

async function tryDelete(ref) {
  try {
    await deleteDoc(ref);
    return true;
  } catch {
    return false;
  }
}

function cardCode() {
  return `CRUD-${RUN_ID}`;
}

async function main() {
  console.log('\nSiteHub Firebase CRUD smoke test');
  console.log(`Run ID: ${RUN_ID}\n`);

  let adminUid;
  try {
    const cred = await signInWithEmailAndPassword(auth, ADMIN.email, ADMIN.password);
    adminUid = cred.user.uid;
    pass('Auth — admin sign in', ADMIN.email);
  } catch (e) {
    fail('Auth — admin sign in', e);
    console.log('\n→ Run: node scripts/seed-demo-data.mjs seed\n');
    printSummary();
    process.exit(1);
  }

  // ─── User READ ───
  try {
    const snap = await getDoc(doc(db, 'users', adminUid));
    if (!snap.exists()) throw new Error('users doc missing');
    pass('Users — READ profile', snap.data().role ?? 'unknown role');
  } catch (e) {
    fail('Users — READ profile', e);
  }

  // ─── Order CREATE + READ + UPDATE ───
  let orderId;
  const code = cardCode();
  try {
    const ref = await addDoc(collection(db, 'orders'), {
      customerName: `CRUD Test ${RUN_ID}`,
      phone: `+855900${RUN_ID.slice(-6)}`,
      email: `crud.${RUN_ID.toLowerCase()}@test.local`,
      productType: 'pvc_card',
      quantity: 1,
      cardDesign: 'classic_black',
      cardCode: code,
      profileUrl: `https://biocloud.app/c/${code}`,
      status: 'new',
      cardStatus: 'active',
      paymentStatus: 'paid',
      paymentMethod: 'online',
      nfcEnabled: true,
      qrPrinted: true,
      priority: 'standard',
      assignedSalesman: adminUid,
      createdBy: adminUid,
      updatedBy: adminUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    orderId = ref.id;
    pass('Orders — CREATE', orderId);
  } catch (e) {
    fail('Orders — CREATE', e);
  }

  if (orderId) {
    try {
      const snap = await getDoc(doc(db, 'orders', orderId));
      if (!snap.exists()) throw new Error('not found');
      pass('Orders — READ', snap.data().customerName);
    } catch (e) {
      fail('Orders — READ', e);
    }

    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'ready_to_print',
        updatedBy: adminUid,
        updatedAt: serverTimestamp(),
      });
      const snap = await getDoc(doc(db, 'orders', orderId));
      if (snap.data().status !== 'ready_to_print') throw new Error('status not updated');
      pass('Orders — UPDATE status', 'ready_to_print');
    } catch (e) {
      fail('Orders — UPDATE status', e);
    }
  }

  // ─── Production batch CREATE + READ + UPDATE ───
  let batchId;
  try {
    const ref = await addDoc(collection(db, 'production_batches'), {
      batchNumber: `CRUD-BATCH-${RUN_ID}`,
      material: 'pvc_card',
      printerType: 'nfc_thermal',
      status: 'draft',
      orderIds: [],
      branch: 'Head Office',
      createdBy: adminUid,
      updatedBy: adminUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batchId = ref.id;
    pass('Batches — CREATE', batchId);
  } catch (e) {
    fail('Batches — CREATE', e);
  }

  if (batchId) {
    try {
      const snap = await getDoc(doc(db, 'production_batches', batchId));
      if (!snap.exists()) throw new Error('not found');
      pass('Batches — READ', snap.data().batchNumber);
    } catch (e) {
      fail('Batches — READ', e);
    }

    try {
      await updateDoc(doc(db, 'production_batches', batchId), {
        status: 'open',
        updatedAt: serverTimestamp(),
      });
      pass('Batches — UPDATE status', 'open');
    } catch (e) {
      fail('Batches — UPDATE status', e);
    }
  }

  // ─── Assign order → printer job CREATE ───
  let jobId;
  if (orderId && batchId) {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        batchId,
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'production_batches', batchId), {
        orderIds: [orderId],
        updatedAt: serverTimestamp(),
      });
      const jobRef = await addDoc(collection(db, 'printer_jobs'), {
        orderId,
        batchId,
        printerId: '',
        queueNumber: Date.now(),
        stage: 'queued',
        cardsPrinted: 0,
        failedCards: 0,
        reprintedCards: 0,
        failedCardsApproved: false,
        perCardBonus: 0.5,
        perOrderBonus: 0,
        salaryStatus: 'unpaid',
        createdBy: adminUid,
        updatedBy: adminUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      jobId = jobRef.id;
      pass('Printer jobs — CREATE (via batch assign)', jobId);
    } catch (e) {
      fail('Printer jobs — CREATE (via batch assign)', e);
    }

    if (jobId) {
      try {
        const q = query(collection(db, 'printer_jobs'), where('orderId', '==', orderId));
        const snap = await getDocs(q);
        if (snap.empty) throw new Error('job not found');
        pass('Printer jobs — READ', snap.docs[0].data().stage);
      } catch (e) {
        fail('Printer jobs — READ', e);
      }

      try {
        await updateDoc(doc(db, 'printer_jobs', jobId), {
          stage: 'printing',
          updatedAt: serverTimestamp(),
        });
        pass('Printer jobs — UPDATE stage', 'printing');
      } catch (e) {
        fail('Printer jobs — UPDATE stage', e);
      }
    }
  }

  // ─── Bio page UPSERT + READ ───
  const bioUserId = `crud-test-${RUN_ID.toLowerCase()}`;
  try {
    await setDoc(doc(db, 'bio_pages', bioUserId), {
      userId: bioUserId,
      slug: `crud-${RUN_ID.toLowerCase()}`,
      displayName: 'CRUD Bio Test',
      tagline: 'Smoke test profile',
      theme: 'vibrant_pink',
      customLinks: [],
      updatedAt: serverTimestamp(),
    });
    pass('Bio pages — CREATE/UPSERT', bioUserId);
  } catch (e) {
    fail('Bio pages — CREATE/UPSERT', e);
  }

  try {
    const q = query(collection(db, 'bio_pages'), where('slug', '==', `crud-${RUN_ID.toLowerCase()}`));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('slug query empty');
    pass('Bio pages — READ by slug', snap.docs[0].data().displayName);
  } catch (e) {
    fail('Bio pages — READ by slug', e);
  }

  // ─── Audit log READ ───
  try {
    const snap = await getDocs(collection(db, 'audit_logs'));
    pass('Audit logs — READ list', `${snap.size} entries (may be 0 if none yet)`);
  } catch (e) {
    fail('Audit logs — READ list', e);
  }

  // ─── DELETE cleanup (app has no delete UI; rules may block) ───
  console.log('\nCleanup (DELETE if rules allow):');
  const cleaned = [];
  if (jobId) cleaned.push(await tryDelete(doc(db, 'printer_jobs', jobId)));
  if (orderId) cleaned.push(await tryDelete(doc(db, 'orders', orderId)));
  if (batchId) cleaned.push(await tryDelete(doc(db, 'production_batches', batchId)));
  cleaned.push(await tryDelete(doc(db, 'bio_pages', bioUserId)));

  if (cleaned.every(Boolean)) {
    pass('Cleanup — DELETE test docs', 'all removed');
  } else if (cleaned.some(Boolean)) {
    pass('Cleanup — DELETE test docs', 'partial (some blocked by rules — OK)');
  } else {
    pass('Cleanup — skipped', 'delete blocked by rules; remove CRUD-* docs in Firebase console if needed');
  }

  printSummary();
  const failed = results.filter((r) => !r.ok).length;
  process.exit(failed > 0 ? 1 : 0);
}

function printSummary() {
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log('\n────────────────────────────────────');
  console.log(`Result: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log('Firebase CRUD looks healthy for admin operations.\n');
  } else {
    console.log('Fix failures above (auth, rules, or seed data).\n');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
