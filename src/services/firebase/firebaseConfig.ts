interface FirebaseEnvValue {
  name: string;
  value: string | undefined;
}

function hasValue(value: string | undefined) {
  return Boolean(value?.trim());
}

export function getFirebaseConfig() {
  const env: Record<string, FirebaseEnvValue> = {
    apiKey: {
      name: 'EXPO_PUBLIC_FIREBASE_API_KEY',
      value: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    },
    authDomain: {
      name: 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
      value: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    },
    projectId: {
      name: 'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
      value: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    },
    storageBucket: {
      name: 'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
      value: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    },
    messagingSenderId: {
      name: 'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      value: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    },
    appId: {
      name: 'EXPO_PUBLIC_FIREBASE_APP_ID',
      value: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    },
  };

  const config = {
    apiKey: env.apiKey.value,
    authDomain: env.authDomain.value,
    projectId: env.projectId.value,
    storageBucket: env.storageBucket.value,
    messagingSenderId: env.messagingSenderId.value,
    appId: env.appId.value,
  };

  const missing = Object.values(env)
    .filter(({ value }) => !hasValue(value))
    .map(({ name }) => name);

  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase env vars: ${missing.join(', ')}. Copy .env.example to .env and paste values from Firebase Console -> Project settings -> Your apps.`
    );
  }

  return config;
}

export function isFirebaseConfigured(): boolean {
  return [
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  ].every(hasValue);
}
