import Constants, { ExecutionEnvironment } from 'expo-constants';

export function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

export function getGoogleWebClientId(): string {
  return process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ?? '';
}

export function getGoogleIosClientId(): string {
  return process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() ?? '';
}

export function getGoogleAndroidClientId(): string {
  return process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() ?? '';
}

/** Redirect URI to whitelist on the **Web** OAuth client in Google Cloud Console. */
export function getGoogleOAuthRedirectUri(): string {
  const owner = Constants.expoConfig?.owner ?? 'vct8888';
  const slug = Constants.expoConfig?.slug ?? 'bio-cloud-native';
  const scheme = Constants.expoConfig?.scheme ?? 'biocloud';

  if (isExpoGo()) {
    return `https://auth.expo.io/@${owner}/${slug}`;
  }

  return `${scheme}://oauthredirect`;
}

export function getGoogleOAuthSetupHint(): string {
  const redirect = getGoogleOAuthRedirectUri();
  return [
    '1. Firebase Console → Authentication → Sign-in method → Enable Google.',
    '2. Copy the Web client ID into .env as EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.',
    `3. Google Cloud → Credentials → Web client → Authorized redirect URIs → add:\n   ${redirect}`,
    isExpoGo()
      ? '4. In Expo Go, use the Web client ID (not iOS/Android-only clients).'
      : '4. For dev/production builds, also set EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID / ANDROID.',
    '5. Restart Expo after editing .env.',
  ].join('\n');
}
