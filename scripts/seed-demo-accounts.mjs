// Run with: node scripts/seed-demo-accounts.mjs
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

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

const demoAccounts = [
  { email: 'sales@demo.com',    password: 'demo1234', displayName: 'Demo Sales',    role: 'sales' },
  { email: 'printer@demo.com',  password: 'demo1234', displayName: 'Demo Printer',  role: 'printer' },
  { email: 'customer@demo.com', password: 'demo1234', displayName: 'Demo Customer', role: 'customer' },
  { email: 'admin@demo.com',    password: 'demo1234', displayName: 'Demo Admin',    role: 'admin' },
  { email: 'super@demo.com',    password: 'demo1234', displayName: 'Super Admin',   role: 'super_admin' },
];

async function createAccount({ email, password, displayName, role }) {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', credential.user.uid), {
      email,
      displayName,
      role,
      language: 'en',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`✅ Created: ${email} (${role})`);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      console.log(`⚠️  Already exists: ${email} — skipping`);
    } else {
      console.error(`❌ Failed ${email}:`, err.message);
    }
  }
}

console.log('Creating demo accounts...\n');
for (const account of demoAccounts) {
  await createAccount(account);
}

console.log('\nDone! Credentials:');
console.log('  sales@demo.com    / demo1234  (Sales role)');
console.log('  printer@demo.com  / demo1234  (Printer role)');
console.log('  customer@demo.com / demo1234  (Customer role)');
console.log('  super@demo.com    / demo1234  (Super Admin role)');
process.exit(0);
