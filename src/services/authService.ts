import {
  deleteApp,
  initializeApp,
} from 'firebase/app';
import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firebaseCollections } from '@/src/constants/collections';
import { auth, db, firebaseApp } from '@/src/services/firebaseClient';
import { LoginInput, RegisterInput } from '@/src/types/auth';
import { AppUser, UserRole } from '@/src/types/models';
import { normalizeRole } from '@/src/utils/authFlow';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SELF_SERVICE_ROLES: UserRole[] = ['customer', 'sales', 'printer'];

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toIso(value: any) {
  const date = value?.toDate?.() ?? (value instanceof Date ? value : new Date());
  return date.toISOString();
}

export function getAuthErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: unknown }).code) : '';
  const message = error instanceof Error ? error.message : '';

  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/user-not-found' ||
    code === 'auth/wrong-password'
  ) {
    return 'Email or password is incorrect.';
  }
  if (code === 'auth/network-request-failed' || message.toLowerCase().includes('network')) {
    return 'No internet connection. Check your connection and try again.';
  }
  if (code === 'unavailable') {
    return 'Firebase is temporarily unavailable. Check your connection and try again.';
  }
  if (code === 'deadline-exceeded') {
    return 'The request took too long. Check your connection and try again.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'That email is already registered.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. Wait a moment and try again.';
  }
  if (code === 'auth/account-exists-with-different-credential') {
    return 'An account already exists with this email using a different sign-in method. Try email and password instead.';
  }
  if (code === 'auth/popup-closed-by-user' || code === 'ERR_REQUEST_CANCELED') {
    return 'Sign-in was cancelled.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'This sign-in method is not enabled in Firebase. Enable it under Authentication → Sign-in method.';
  }
  if (code === 'auth/invalid-credential' && message.toLowerCase().includes('apple')) {
    return 'Apple sign-in failed. Check Firebase Apple provider settings and your bundle ID.';
  }
  if (code === 'permission-denied' || message.toLowerCase().includes('permission')) {
    return 'Permission denied. Your account does not have access to this action.';
  }
  if (code === 'unauthenticated') {
    return 'Your session expired. Sign in again and retry.';
  }
  return message || 'Unable to complete this request right now.';
}

function mapUser(id: string, data: any): AppUser {
  return {
    id,
    email: data.email ?? '',
    displayName: data.displayName ?? '',
    role: normalizeRole(data.role),
    language: data.language ?? 'en',
    phone: data.phone,
    branch: data.branch,
    isActive: data.isActive !== false,
    createdBy: data.createdBy,
    updatedBy: data.updatedBy,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

export async function getUserProfile(uid: string): Promise<AppUser | null> {
  const reference = doc(db, firebaseCollections.users, uid);
  const snapshot = await getDoc(reference);
  if (!snapshot.exists()) return null;
  return mapUser(snapshot.id, snapshot.data());
}

export async function signIn(input: LoginInput): Promise<AppUser> {
  const email = normalizeEmail(input.email);
  if (!EMAIL_PATTERN.test(email) || !input.password) {
    throw new Error('Enter a valid email and password.');
  }

  const credential = await signInWithEmailAndPassword(auth, email, input.password);
  const profile = await getUserProfile(credential.user.uid);

  if (!profile) {
    await signOut(auth);
    throw new Error('Account profile is missing. Ask an admin to finish backend setup.');
  }

  if (profile.isActive === false) {
    await signOut(auth);
    throw new Error('This account is inactive. Contact an admin.');
  }

  return profile;
}

export async function signUp(input: RegisterInput): Promise<AppUser> {
  const email = normalizeEmail(input.email);
  const displayName = input.displayName.trim();
  const role = SELF_SERVICE_ROLES.includes(input.role) ? input.role : 'customer';

  if (!displayName || !EMAIL_PATTERN.test(email) || input.password.length < 6) {
    throw new Error('Name, valid email, and 6+ character password are required.');
  }

  const credential = await createUserWithEmailAndPassword(auth, email, input.password);

  const profileDoc = {
    email,
    displayName,
    role,
    language: 'en',
    isActive: true,
    createdBy: credential.user.uid,
    updatedBy: credential.user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, firebaseCollections.users, credential.user.uid), profileDoc);

  return {
    id: credential.user.uid,
    email: profileDoc.email,
    displayName: profileDoc.displayName,
    role: profileDoc.role,
    language: profileDoc.language,
    isActive: true,
    createdBy: credential.user.uid,
    updatedBy: credential.user.uid,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export interface CreateManagedUserInput {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  branch?: string;
  createdBy: string;
}

export async function createManagedUser(input: CreateManagedUserInput): Promise<AppUser> {
  const email = normalizeEmail(input.email);
  const displayName = input.displayName.trim();
  const role = normalizeRole(input.role);

  if (!input.createdBy) {
    throw new Error('Admin session is required to create users.');
  }
  if (!displayName || !EMAIL_PATTERN.test(email) || input.password.length < 6) {
    throw new Error('Name, valid email, and 6+ character password are required.');
  }
  if (role === 'guest') {
    throw new Error('Guest accounts are preview-only and cannot be created.');
  }

  const secondaryApp = initializeApp(firebaseApp.options, `managed-user-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, input.password);
    const now = new Date().toISOString();
    const profileDoc = {
      email,
      displayName,
      role,
      phone: input.phone?.trim() || '',
      branch: input.branch?.trim() || '',
      language: 'en',
      isActive: true,
      createdBy: input.createdBy,
      updatedBy: input.createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, firebaseCollections.users, credential.user.uid), profileDoc);
    await signOut(secondaryAuth);

    return {
      id: credential.user.uid,
      email,
      displayName,
      role,
      phone: profileDoc.phone,
      branch: profileDoc.branch,
      language: 'en',
      isActive: true,
      createdBy: input.createdBy,
      updatedBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    } as AppUser;
  } finally {
    await deleteApp(secondaryApp);
  }
}

export function observeAuthState(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function signOutCurrentUser() {
  if (__DEV__) {
    console.debug('[auth/service] Firebase signOut request');
  }
  await signOut(auth);
  if (__DEV__) {
    console.debug('[auth/service] Firebase signOut complete');
  }
}
