/**
 * SITEHUB — Full Demo Data Seed Script
 *
 * Usage:
 *   node scripts/seed-demo-data.mjs seed    → seed all demo data
 *   node scripts/seed-demo-data.mjs reset   → clear + re-seed
 *   node scripts/seed-demo-data.mjs clear   → delete all demo data only
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  getFirestore,
  doc, setDoc, addDoc, collection,
  getDocs, deleteDoc, Timestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBJZa1RLcbZtFsfizGJadlLNnNgUVsUByw',
  authDomain: 'sitehub-8dd56.firebaseapp.com',
  projectId: 'sitehub-8dd56',
  storageBucket: 'sitehub-8dd56.firebasestorage.app',
  messagingSenderId: '145010162726',
  appId: '1:145010162726:web:8a7accc56cdc4e1fd23ae7',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(n) {
  const d = new Date(); d.setDate(d.getDate() - n); return Timestamp.fromDate(d);
}

function cardCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c = 'BC-';
  for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

function orderStatusToJobStage(s) {
  return { new:'queued', design:'queued', printing:'printing', nfc_writing:'nfc_writing', nfc_verification:'nfc_verification', ready:'done', delivered:'done' }[s] ?? 'queued';
}

// ─── Staff ────────────────────────────────────────────────────────────────────

const STAFF = [
  { email: 'sales@demo.com',    password: 'demo1234', displayName: 'Phorn Penh',      role: 'sales',   branch: 'Phnom Penh HQ', phone: '+855 12 345 678' },
  { email: 'sales2@demo.com',   password: 'demo1234', displayName: 'Chan Thea',       role: 'sales',   branch: 'Siem Reap',     phone: '+855 17 234 567' },
  { email: 'printer@demo.com',  password: 'demo1234', displayName: 'Demo Printer',    role: 'printer', branch: 'Workshop A',    phone: '+855 11 111 111' },
  { email: 'printer2@demo.com', password: 'demo1234', displayName: 'Workshop Sothea', role: 'printer', branch: 'Workshop B',    phone: '+855 99 876 543' },
  { email: 'admin@demo.com',    password: 'demo1234', displayName: 'Manager Demo',    role: 'admin',   branch: 'Head Office',   phone: '+855 23 456 789' },
  { email: 'super@demo.com',    password: 'demo1234', displayName: 'Super Admin',     role: 'super_admin', branch: 'Head Office', phone: '+855 23 000 001' },
  { email: 'empty@demo.com',    password: 'demo1234', displayName: 'Empty Tester',    role: 'sales',   branch: 'Test Branch',   phone: '+855 00 000 000' },
];

// ─── Orders ───────────────────────────────────────────────────────────────────

const ORDERS = [
  { customerName:'Sok Dara',     phone:'+855 12 111 222', telegram:'@sokdara',    productType:'metal_card', quantity:2, paymentStatus:'paid',    paymentMethod:'online',       status:'delivered',        cardStatus:'closed', priority:'standard', notes:'Gold engraving',          daysAgo:14 },
  { customerName:'Chan Ratha',   phone:'+855 17 333 444', telegram:'@chanratha',  productType:'metal_card', quantity:1, paymentStatus:'partial',  paymentMethod:'deposit',      status:'printing',         cardStatus:'active', priority:'standard', notes:'',                        daysAgo:5  },
  { customerName:'Lin Veasna',   phone:'+855 11 555 666', telegram:'@linveasna',  productType:'wood_card',  quantity:3, paymentStatus:'unpaid',   paymentMethod:'later_manual', status:'new',              cardStatus:'active', priority:'standard', notes:'Bamboo finish',           daysAgo:1  },
  { customerName:'Phnom Sokha',  phone:'+855 99 777 888', telegram:'@phnomsokhaa',productType:'wood_card',  quantity:1, paymentStatus:'paid',    paymentMethod:'online',       status:'ready',            priority:'urgent',   notes:'Rush — event Friday',     daysAgo:3  },
  { customerName:'Keo Bopha',    phone:'+855 12 999 000', telegram:'@keobopha',   productType:'pvc_card',   quantity:5, paymentStatus:'paid',    paymentMethod:'paid',         status:'nfc_verification', cardStatus:'active', priority:'standard', notes:'Corporate bulk',          daysAgo:4  },
  { customerName:'Meas Chanthy', phone:'+855 17 123 456', telegram:'@measc',      productType:'metal_card', quantity:1, paymentStatus:'paid',    paymentMethod:'online',       status:'nfc_writing',      cardStatus:'active', priority:'urgent',   notes:'',                        daysAgo:2  },
  { customerName:'Heng Piseth',  phone:'+855 11 234 567', telegram:'@hengp',      productType:'wood_card',  quantity:2, paymentStatus:'partial',  paymentMethod:'deposit',      status:'design',           cardStatus:'frozen', freezeReason:'Waiting for customer logo approval', priority:'standard', notes:'Custom logo on front',    daysAgo:6  },
  { customerName:'Noun Sreymom', phone:'+855 99 345 678', telegram:'@sreymom',    productType:'pvc_card',   quantity:10,paymentStatus:'paid',    paymentMethod:'paid',         status:'delivered',        cardStatus:'closed', priority:'standard', notes:'School event cards',      daysAgo:20 },
  { customerName:'Tep Kosal',    phone:'+855 12 456 789', telegram:'@tepkosal',   productType:'metal_card', quantity:1, paymentStatus:'unpaid',   paymentMethod:'later_manual', status:'new',              cardStatus:'active', priority:'standard', notes:'',                        daysAgo:0  },
  { customerName:'Ros Sreynich', phone:'+855 17 567 890', telegram:'@rossrey',    productType:'wood_card',  quantity:1, paymentStatus:'paid',    paymentMethod:'online',       status:'printing',         priority:'urgent',   notes:'Urgent — wedding gift',   daysAgo:1  },
  { customerName:'Chhun Dara',   phone:'+855 11 678 901', telegram:'@chhundara',  productType:'pvc_card',   quantity:3, paymentStatus:'paid',    paymentMethod:'paid',         status:'ready',            cardStatus:'active', priority:'standard', notes:'',                        daysAgo:7  },
  { customerName:'Sar Kimheng',  phone:'+855 99 789 012', telegram:'@sarkimheng', productType:'metal_card', quantity:2, paymentStatus:'partial',  paymentMethod:'deposit',      status:'nfc_writing',      cardStatus:'active', priority:'standard', notes:'Mirror finish',           daysAgo:3  },
];

// ─── Ensure user ──────────────────────────────────────────────────────────────

async function ensureUser(staff) {
  let uid;
  try {
    const cred = await createUserWithEmailAndPassword(auth, staff.email, staff.password);
    uid = cred.user.uid;
    console.log(`  ✅ Created: ${staff.email}`);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      const cred = await signInWithEmailAndPassword(auth, staff.email, staff.password);
      uid = cred.user.uid;
      console.log(`  ♻️  Exists:  ${staff.email} (uid: ${uid.slice(0,8)}…)`);
    } else throw err;
  }
  await setDoc(doc(db, 'users', uid), {
    email: staff.email, displayName: staff.displayName, role: staff.role,
    branch: staff.branch, phone: staff.phone, language: 'en', isActive: true,
    createdAt: daysAgo(30), updatedAt: daysAgo(0),
  }, { merge: true });
  return uid;
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seedDemoData() {
  console.log('\n🌱 Seeding SITEHUB demo data…\n');

  // 1. Create/get all staff UIDs
  console.log('👥 Staff accounts…');
  const uids = {};
  for (const s of STAFF) uids[s.email] = await ensureUser(s);

  const salesmanId  = uids['sales@demo.com'];
  const salesman2Id = uids['sales2@demo.com'];
  const printerId   = uids['printer@demo.com'];
  const printer2Id  = uids['printer2@demo.com'];

  console.log(`\n   sales@demo.com    → ${salesmanId}`);
  console.log(`   sales2@demo.com   → ${salesman2Id}`);
  console.log(`   printer@demo.com  → ${printerId}`);

  // 2. Sign in as admin to write orders/jobs (bypasses rules)
  await signInWithEmailAndPassword(auth, 'admin@demo.com', 'demo1234');
  console.log('\n📦 Creating orders + printer jobs…');

  for (let i = 0; i < ORDERS.length; i++) {
    const t = ORDERS[i];
    const code = cardCode();
    const profileUrl = `https://biocloud.app/c/${code}`;
    // Alternate between the two salesmen so both have data
    const assignedSalesman = i % 2 === 0 ? salesmanId : salesman2Id;
    const assignedPrinter  = i % 2 === 0 ? printerId  : printer2Id;
    const cardStatus = t.cardStatus ?? 'active';

    const orderPayload = {
      customerName: t.customerName, phone: t.phone, telegram: t.telegram,
      productType: t.productType, quantity: t.quantity,
      cardDesign: 'classic_black', cardCode: code, profileUrl,
      nfcEnabled: true, nfcTargetUrl: profileUrl, qrPrinted: true,
      paymentStatus: t.paymentStatus, paymentMethod: t.paymentMethod,
      priority: t.priority, notes: t.notes, status: t.status, cardStatus,
      assignedSalesman, createdBy: assignedSalesman,
      updatedBy: assignedSalesman,
      createdAt: daysAgo(t.daysAgo), updatedAt: daysAgo(Math.max(0, t.daysAgo - 1)),
    };

    if (cardStatus === 'frozen') {
      orderPayload.freezeReason = t.freezeReason ?? 'Waiting for customer confirmation';
      orderPayload.frozenBy = assignedSalesman;
      orderPayload.frozenAt = daysAgo(Math.max(0, t.daysAgo - 1));
    }
    if (cardStatus === 'closed') {
      orderPayload.closedBy = assignedSalesman;
      orderPayload.closedAt = daysAgo(Math.max(0, t.daysAgo - 1));
    }

    const orderRef = await addDoc(collection(db, 'orders'), orderPayload);

    const stage = orderStatusToJobStage(t.status);
    const cardsPrinted = stage === 'done' ? t.quantity : stage === 'printing' ? 1 : 0;
    const failedCards  = stage === 'done' && i % 4 === 0 ? 1 : 0;

    await addDoc(collection(db, 'printer_jobs'), {
      orderId: orderRef.id, printerId: assignedPrinter,
      queueNumber: Date.now() + i, stage,
      cardsPrinted, failedCards, reprintedCards: failedCards,
      failedCardsApproved: false, perCardBonus: 0.5, perOrderBonus: stage === 'done' ? 2 : 0,
      salaryStatus: stage === 'done' && t.daysAgo > 7 ? 'paid' : 'unpaid',
      notes: t.notes || null,
      qaVideoUrl: stage === 'done' ? `https://storage.sitehub.app/qa/${orderRef.id}.mp4` : null,
      createdAt: daysAgo(t.daysAgo), updatedAt: daysAgo(Math.max(0, t.daysAgo - 1)),
    });

    if (['nfc_writing','nfc_verification','ready','delivered'].includes(t.status)) {
      await setDoc(doc(db, 'nfc_cards', code), {
        chipUID: `UID-${code}-${Math.random().toString(36).slice(2,8).toUpperCase()}`,
        profileUrl, orderId: orderRef.id, cardCode: code,
        writtenBy: assignedPrinter,
        writtenAt: daysAgo(Math.max(0, t.daysAgo - 1)),
        verificationStatus: t.status === 'nfc_writing' ? 'written' : 'verified',
        updatedAt: daysAgo(0),
      });
    }
    console.log(`  ✅ ${t.customerName} · ${t.productType} · ${t.status}`);
  }

  // 3. Payouts
  console.log('\n💰 Payouts…');
  const payouts = [
    { userId: salesmanId,  amount: 480.20, periodLabel: 'Nov 2025', status: 'pending' },
    { userId: salesmanId,  amount: 810.30, periodLabel: 'Oct 2025', status: 'paid'    },
    { userId: salesmanId,  amount: 320.00, periodLabel: 'Sep 2025', status: 'paid'    },
    { userId: salesman2Id, amount: 290.50, periodLabel: 'Nov 2025', status: 'pending' },
    { userId: salesman2Id, amount: 540.00, periodLabel: 'Oct 2025', status: 'paid'    },
  ];
  for (const p of payouts) {
    await addDoc(collection(db, 'payouts'), { ...p, createdAt: daysAgo(p.status === 'paid' ? 30 : 5) });
    console.log(`  ✅ ${p.periodLabel} $${p.amount} (${p.status})`);
  }

  // 4. Salary records
  console.log('\n🖨️  Salary records…');
  const salaries = [
    { printerId, printerName:'Demo Printer',    period:'2025-11', baseSalary:200, totalCards:18, failedCards:1, approvedFailedCards:0, perCardBonus:0.5, qualityBonus:5,  total:214, status:'unpaid' },
    { printerId, printerName:'Demo Printer',    period:'2025-10', baseSalary:200, totalCards:24, failedCards:2, approvedFailedCards:1, perCardBonus:0.5, qualityBonus:10, total:222, status:'paid'   },
    { printerId: printer2Id, printerName:'Workshop Sothea', period:'2025-11', baseSalary:200, totalCards:22, failedCards:0, approvedFailedCards:0, perCardBonus:0.5, qualityBonus:15, total:226, status:'unpaid' },
  ];
  for (const s of salaries) {
    await addDoc(collection(db, 'salary_records'), { ...s, createdAt: daysAgo(s.status === 'paid' ? 30 : 5), updatedAt: daysAgo(0) });
    console.log(`  ✅ ${s.printerName} ${s.period} $${s.total}`);
  }

  console.log('\n✅ Seed complete!\n');
  console.log('Demo accounts (password: demo1234):');
  console.log(`  sales@demo.com    → UID: ${salesmanId}`);
  console.log(`  sales2@demo.com   → UID: ${salesman2Id}`);
  console.log(`  printer@demo.com  → UID: ${printerId}`);
  console.log(`  printer2@demo.com → UID: ${printer2Id}`);
  console.log(`  admin@demo.com    → UID: ${uids['admin@demo.com']}`);
}

// ─── Clear ────────────────────────────────────────────────────────────────────

async function clearDemoData() {
  console.log('\n🗑️  Clearing demo data…');
  // Sign in as admin first
  try { await signInWithEmailAndPassword(auth, 'admin@demo.com', 'demo1234'); } catch {}

  for (const col of ['orders','printer_jobs','nfc_cards','payouts','salary_records']) {
    const snap = await getDocs(collection(db, col));
    for (const d of snap.docs) await deleteDoc(d.ref);
    console.log(`  🗑️  ${col}: ${snap.size} deleted`);
  }
  console.log('✅ Cleared.\n');
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

const cmd = process.argv[2] ?? 'seed';
if (cmd === 'seed')  await seedDemoData();
else if (cmd === 'clear') await clearDemoData();
else if (cmd === 'reset') { await clearDemoData(); await seedDemoData(); }
else console.log('Usage: node scripts/seed-demo-data.mjs [seed|clear|reset]');

process.exit(0);
