# Firebase Auth Setup (step-by-step)

Follow these steps in order. Your app code is already wired for Firebase Auth + Firestore.

## Step 1 — Create a Firebase project

1. Open [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or open an existing project).
3. Finish the wizard (Google Analytics is optional).

## Step 2 — Enable Email/Password sign-in

1. In the left menu: **Build → Authentication**.
2. Click **Get started** (if needed).
3. Open the **Sign-in method** tab.
4. Enable **Email/Password** (first toggle only is enough).
5. Save.

## Step 2b — Enable Google and Apple sign-in

1. **Authentication → Sign-in method**.
2. Enable **Google** — set support email, save. Copy the **Web client ID** (ends with `.apps.googleusercontent.com`).
3. Enable **Apple** — save (requires Apple Developer account for production iOS builds).

### Google OAuth client IDs (Google Cloud Console)

1. Open [Google Cloud Console](https://console.cloud.google.com/) → select the Firebase-linked project.
2. **APIs & Services → Credentials**.
3. Create OAuth clients as needed:
   - **Web** — used by Expo Go and `expo-auth-session` (this is `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`).
   - **iOS** — bundle ID `com.biocloud.nativeapp`.
   - **Android** — package `com.biocloud.nativeapp`; add SHA-1 from your EAS/debug keystore.

Add to `.env`:

```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=123456789-ios.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=123456789-android.apps.googleusercontent.com
```

Restart Expo after changing `.env`.

### Apple Sign-In (iOS only)

- Works on **physical iOS devices** and the **iOS Simulator** (Apple ID required).
- **Not available on Android or web** in this app — use Google or email/password there.
- In [Apple Developer](https://developer.apple.com/): enable **Sign In with Apple** for App ID `com.biocloud.nativeapp`.
- In Firebase **Apple** provider: add your Apple **Services ID**, **Team ID**, **Key ID**, and private key (`.p8`) for production token exchange.
- `app.json` sets `ios.usesAppleSignIn: true` and the `expo-apple-authentication` plugin.

First-time Google/Apple users get a Firestore `users/{uid}` document with `role: customer` (same self-service roles as email signup).

## Step 3 — Create a Firestore database

1. **Build → Firestore Database → Create database**.
2. For development, you can pick a nearby region and start in **test mode** temporarily.
3. Before production, deploy the rules in this repo (Step 6).

## Step 4 — Register a Web app and copy config

1. Click the **gear icon** → **Project settings**.
2. Scroll to **Your apps** → click the **Web** icon `</>`.
3. App nickname: e.g. `qrscanner` → **Register app**.
4. Copy the `firebaseConfig` object values into your local `.env` file:

| Firebase config key | `.env` variable |
|---------------------|-----------------|
| `apiKey` | `EXPO_PUBLIC_FIREBASE_API_KEY` |
| `authDomain` | `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `EXPO_PUBLIC_FIREBASE_PROJECT_ID` |
| `storageBucket` | `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `EXPO_PUBLIC_FIREBASE_APP_ID` |

A `.env` file was created from `.env.example` — paste your values there (no quotes needed).

Example:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

## Step 5 — Run the app and create your first user

```bash
npx expo start
```

1. Open the app → **Create Account**.
2. Register with email + password.
3. In Firebase Console → **Authentication → Users** — you should see the new user.
4. In **Firestore → users** — you should see a document whose ID matches that user’s **UID**.

## Step 6 — Deploy Firestore security rules

This repo includes `firestore.rules` and `firebase.json`.

**Option A — Firebase Console (no CLI)**

1. Open **Firestore → Rules**.
2. Copy the contents of `firestore.rules` from this project.
3. Paste into the editor → **Publish**.

**Option B — Firebase CLI**

```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules
```

## Step 7 — Make your first admin

New accounts always get `role: "user"`. To promote someone to admin:

1. Register the account in the app (or create it in **Authentication**).
2. Copy the user’s **UID** from Authentication.
3. **Firestore → users → {UID}** → edit field `role` → set to `admin` or `super_admin`.
4. Log out and log back in (or restart the app).

Admin screens (groups, join requests, QR sessions) require `admin` or `super_admin`.

## Step 8 — Password reset (in app)

On the login screen, tap **Forgot password?** and enter your email. Firebase sends a reset link.

## Collections used by the app

| Collection | Purpose |
|------------|---------|
| `users/{uid}` | Profile + `role` |
| `groups/{groupId}` | Attendance groups |
| `group_memberships/{groupId_userId}` | Approved members |
| `join_requests/{requestId}` | Join requests |
| `qr_sessions/{sessionId}` | QR check-in sessions |
| `attendance_records/{recordId}` | Scan results |
| `notifications/{notificationId}` | In-app notifications |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| App crashes on start with “Missing Firebase env vars” | Fill all six values in `.env`, then restart Expo |
| `auth/invalid-api-key` | Wrong `EXPO_PUBLIC_FIREBASE_API_KEY` in `.env` |
| `permission-denied` on Firestore | Deploy `firestore.rules` (Step 6) |
| Login works but app shows logged out | Firestore `users/{uid}` doc missing — re-register or create the doc manually |
| Google sign-in fails / no token | Check `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, authorized redirect URI, and that Google is enabled in Firebase |
| Apple sign-in fails on device | Enable Apple in Firebase + Apple Developer; use a dev/production build (not Expo Go without config) |
| `auth/account-exists-with-different-credential` | Same email was registered with password — use email sign-in or link accounts in Firebase |
| Admin menu not visible | Set `role` to `admin` in Firestore (Step 7) |

## Optional: Cloud Functions

For production hardening, consider Cloud Functions for:

- Signed QR validation
- Attendance deduplication / anti-replay
- Notification fan-out
