/**
 * Prints Google OAuth redirect URI and setup steps for this Expo project.
 * Run: node scripts/print-google-setup.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const appJson = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8'));
const owner = appJson.expo.owner ?? 'vct8888';
const slug = appJson.expo.slug ?? 'bio-cloud-native';
const scheme = appJson.expo.scheme ?? 'biocloud';
const iosBundle = appJson.expo.ios?.bundleIdentifier ?? 'com.sagozen.sitehubman';
const androidPackage = appJson.expo.android?.package ?? 'com.biocloud.nativeapp';

const expoGoRedirect = `https://auth.expo.io/@${owner}/${slug}`;
const devBuildRedirect = `${scheme}://oauthredirect`;

let hasWebId = false;
const envPath = join(root, '.env');
if (existsSync(envPath)) {
  const env = readFileSync(envPath, 'utf8');
  hasWebId = /EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=\S+/.test(env);
}

console.log(`
SiteHub — Google Sign-In setup
===============================

Firebase: https://console.firebase.google.com/project/sitehub-8dd56/authentication/providers

1. Enable Google provider → copy **Web client ID** (*.apps.googleusercontent.com)

2. Add to .env:
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<paste web client id here>

3. Google Cloud Console → Credentials → that **Web** OAuth client → Authorized redirect URIs:
   ${expoGoRedirect}
   ${devBuildRedirect}

4. (TestFlight / EAS builds) Create iOS OAuth client with bundle ID: ${iosBundle}
   Android OAuth client with package: ${androidPackage}
   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...
   EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=...

5. Restart Expo: npm run start:tunnel

Expo Go redirect: ${expoGoRedirect}
Dev build redirect: ${devBuildRedirect}
.env has GOOGLE_WEB_CLIENT_ID: ${hasWebId ? 'yes' : 'NO — add it'}
`);
