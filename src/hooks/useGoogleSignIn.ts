import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { isGoogleSignInConfigured } from '@/src/services/socialAuthService';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleSignIn() {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ?? '';
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim();

  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    webClientId,
    iosClientId: iosClientId || undefined,
    androidClientId: androidClientId || undefined,
  });

  return {
    promptAsync,
    isConfigured: isGoogleSignInConfigured(),
    isReady: Boolean(request),
  };
}
