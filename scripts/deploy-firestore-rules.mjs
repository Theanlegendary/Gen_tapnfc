/**
 * Deploy firestore.rules to Firebase without requiring global firebase CLI login.
 *
 * Auth (first match wins):
 *   1. FIREBASE_TOKEN — CI token from `firebase login:ci`
 *   2. GOOGLE_APPLICATION_CREDENTIALS — path to service account JSON
 *   3. ./firebase-service-account.json in project root
 *   4. Firebase Rules REST API via google-auth-library (same service account paths)
 *
 * Manual fallback: https://console.firebase.google.com/project/sitehub-8dd56/firestore/rules
 */

import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const projectId = 'sitehub-8dd56';
const rulesPath = join(root, 'firestore.rules');
const rulesContent = readFileSync(rulesPath, 'utf8');

function serviceAccountPath() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    return process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }
  const local = join(root, 'firebase-service-account.json');
  if (existsSync(local)) return local;
  return null;
}

async function deployViaRulesApi(credentialsPath) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
  const { GoogleAuth } = await import('google-auth-library');
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await auth.getClient();
  const headers = {
    Authorization: `Bearer ${(await client.getAccessToken()).token}`,
    'Content-Type': 'application/json',
  };

  const createRes = await fetch(
    `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        source: {
          files: [{ name: 'firestore.rules', content: rulesContent }],
        },
      }),
    }
  );
  const createBody = await createRes.json();
  if (!createRes.ok) {
    throw new Error(createBody.error?.message ?? JSON.stringify(createBody));
  }

  const rulesetName = createBody.name;
  const releaseBody = {
    release: {
      name: `projects/${projectId}/releases/cloud.firestore`,
      rulesetName,
    },
    updateMask: 'rulesetName',
  };

  const releaseNames = [
    `projects/${projectId}/releases/cloud.firestore`,
    `projects/${projectId}/releases/cloud.firestore/(default)`,
  ];

  let lastErr;
  for (const releaseName of releaseNames) {
    releaseBody.release.name = releaseName;
    const releaseRes = await fetch(
      `https://firebaserules.googleapis.com/v1/${releaseName}?updateMask=rulesetName`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify(releaseBody),
      }
    );
    const releaseJson = await releaseRes.json();
    if (releaseRes.ok) {
      console.log(`✅ Firestore rules deployed via Rules API (${rulesetName})`);
      return;
    }
    lastErr = releaseJson.error?.message ?? JSON.stringify(releaseJson);
  }
  throw new Error(lastErr ?? 'Release patch failed');
}

function deployViaFirebaseCliToken(token) {
  const result = spawnSync(
    'npx',
    ['firebase', 'deploy', '--only', 'firestore:rules', '--project', projectId, '--token', token],
    { cwd: root, stdio: 'inherit', shell: true }
  );
  if (result.status !== 0) {
    throw new Error('firebase deploy failed');
  }
  console.log('✅ Firestore rules deployed via Firebase CLI token');
}

async function main() {
  console.log(`Deploying firestore.rules → ${projectId}`);

  if (process.env.FIREBASE_TOKEN) {
    deployViaFirebaseCliToken(process.env.FIREBASE_TOKEN);
    return;
  }

  const creds = serviceAccountPath();
  if (creds) {
    await deployViaRulesApi(creds);
    return;
  }

  const cliLogin = spawnSync('npx', ['firebase', 'login:list'], { cwd: root, encoding: 'utf8', shell: true });
  if (cliLogin.stdout?.includes('@')) {
    const result = spawnSync('npx', ['firebase', 'deploy', '--only', 'firestore:rules'], {
      cwd: root,
      stdio: 'inherit',
      shell: true,
    });
    if (result.status === 0) {
      console.log('✅ Firestore rules deployed via Firebase CLI login');
      return;
    }
  }

  console.error(`
Could not deploy — no Firebase credentials found.

Option A — Firebase CLI (one-time):
  npx firebase login
  npm run deploy:rules

Option B — CI token:
  npx firebase login:ci
  set FIREBASE_TOKEN=<token>   (PowerShell: $env:FIREBASE_TOKEN="<token>")
  npm run deploy:rules

Option C — Service account:
  Firebase Console → Project settings → Service accounts → Generate new private key
  Save as firebase-service-account.json in project root (gitignored)
  npm run deploy:rules

Option D — Manual paste (fastest):
  https://console.firebase.google.com/project/${projectId}/firestore/rules
  Copy firestore.rules from this repo → Publish
`);
  process.exit(1);
}

main().catch((err) => {
  console.error('Deploy failed:', err.message ?? err);
  process.exit(1);
});
