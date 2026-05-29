/**
 * Creates the super admin account for theancoc69@gmail.com
 * Run: node scripts/create-super-admin.mjs
 */
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

const SUPER_ADMIN_EMAIL = 'theancoc69@gmail.com';
const SUPER_ADMIN_PASSWORD = process.argv[2]; // pass as argument

if (!SUPER_ADMIN_PASSWORD) {
  console.error('Usage: node scripts/create-super-admin.mjs <password>');
  process.exit(1);
}

try {
  let uid;
  try {
    const cred = await createUserWithEmailAndPassword(auth, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD);
    uid = cred.user.uid;
    console.log('✅ Created Firebase Auth account');
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      const cred = await signInWithEmailAndPassword(auth, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD);
      uid = cred.user.uid;
      console.log('♻️  Auth account already exists, updating profile...');
    } else throw err;
  }

  await setDoc(doc(db, 'users', uid), {
    email: SUPER_ADMIN_EMAIL,
    displayName: 'Thean (Admin)',
    role: 'admin',
    language: 'en',
    isActive: true,
    branch: 'Head Office',
    phone: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });

  console.log(`\n✅ Super admin ready!`);
  console.log(`   Email:    ${SUPER_ADMIN_EMAIL}`);
  console.log(`   Password: ${SUPER_ADMIN_PASSWORD}`);
  console.log(`   Role:     admin`);
} catch (err) {
  console.error('❌ Failed:', err.message);
}

process.exit(0);
