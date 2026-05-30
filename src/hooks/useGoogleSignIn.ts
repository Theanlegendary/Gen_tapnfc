import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { isGoogleSignInConfigured } from '@/src/services/socialAuthService';
import {
  getGoogleAndroidClientId,
  getGoogleIosClientId,
  getGoogleOAuthRedirectUri,
  getGoogleWebClientId,
  isExpoGo,
} from '@/src/utils/googleAuthConfig';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleSignIn() {
  const webClientId = getGoogleWebClientId();
  const iosClientId = getGoogleIosClientId();
  const androidClientId = getGoogleAndroidClientId();
  const redirectUri = getGoogleOAuthRedirectUri();

  // Expo Go must use the Web OAuth client + auth.expo.io redirect (see googleAuthConfig).
  const effectiveIosClientId = isExpoGo() ? webClientId : iosClientId || webClientId;
  const effectiveAndroidClientId = isExpoGo() ? webClientId : androidClientId || webClientId;

  const [request, , promptAsync] = Google.useIdTokenAuthRequest(
    {
      webClientId,
      iosClientId: effectiveIosClientId || undefined,
      androidClientId: effectiveAndroidClientId || undefined,
      redirectUri,
    },
    { scheme: 'biocloud', path: 'oauthredirect' }
  );

  return {
    promptAsync,
    isConfigured: isGoogleSignInConfigured(),
    isReady: Boolean(request && webClientId),
    redirectUri,
  };
}
