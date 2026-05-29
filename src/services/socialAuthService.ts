import {
  GoogleAuthProvider,
  OAuthProvider,
  User as FirebaseUser,
  signInWithCredential,
  signOut,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firebaseCollections } from '@/src/constants/collections';
import { auth, db } from '@/src/services/firebaseClient';
import { getUserProfile } from '@/src/services/authService';
import { AppUser } from '@/src/types/models';

const DEFAULT_OAUTH_ROLE = 'customer' as const;

function displayNameFromFirebaseUser(user: FirebaseUser): string {
  if (user.displayName?.trim()) return user.displayName.trim();
  const local = user.email?.split('@')[0]?.trim();
  if (local) return local;
  return 'User';
}

async function createOAuthUserProfile(user: FirebaseUser): Promise<AppUser> {
  const email = (user.email ?? '').trim().toLowerCase();
  const displayName = displayNameFromFirebaseUser(user);
  const profileDoc = {
    email,
    displayName,
    role: DEFAULT_OAUTH_ROLE,
    language: 'en',
    isActive: true,
    createdBy: user.uid,
    updatedBy: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, firebaseCollections.users, user.uid), profileDoc);

  return {
    id: user.uid,
    email: profileDoc.email,
    displayName: profileDoc.displayName,
    role: profileDoc.role,
    language: profileDoc.language,
    isActive: true,
    createdBy: user.uid,
    updatedBy: user.uid,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function resolveSignedInProfile(user: FirebaseUser): Promise<AppUser> {
  const existing = await getUserProfile(user.uid);

  if (existing) {
    if (existing.isActive === false) {
      await signOut(auth);
      throw new Error('This account is inactive. Contact an admin.');
    }
    return existing;
  }

  return createOAuthUserProfile(user);
}

export function isGoogleSignInConfigured(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim());
}

export async function signInWithGoogleIdToken(idToken: string): Promise<AppUser> {
  if (!idToken) {
    throw new Error('Google sign-in did not return a token. Try again.');
  }

  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return resolveSignedInProfile(result.user);
}

export async function signInWithAppleTokens(identityToken: string, rawNonce: string): Promise<AppUser> {
  if (!identityToken || !rawNonce) {
    throw new Error('Apple sign-in did not return required credentials. Try again.');
  }

  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({
    idToken: identityToken,
    rawNonce,
  });
  const result = await signInWithCredential(auth, credential);
  return resolveSignedInProfile(result.user);
}

export async function isAppleSignInAvailable(): Promise<boolean> {
  try {
    const AppleAuthentication = await import('expo-apple-authentication');
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}
