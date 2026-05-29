# Expo Native Setup (iOS + Android)

This app is **Expo React Native** with **Expo Router** and **TypeScript**.
It is not a Vite web app.

## 1) Full setup commands

```bash
# create native app
npx create-expo-app@latest bio-cloud-native --template
cd bio-cloud-native

# router + native runtime packages
npx expo install expo-router expo-constants expo-font expo-splash-screen
npx expo install react-native-safe-area-context react-native-screens react-native-gesture-handler
npx expo install @react-native-async-storage/async-storage expo-image-picker @expo/vector-icons

# backend + typography
npm install firebase @expo-google-fonts/inter

# EAS build
npm install -D eas-cli
npx eas login
npx eas build:configure
```

## 2) Environment variables

Create `.env`:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

## 3) Run the app

```bash
npx expo start
```

## 4) Folder structure

```txt
app/
src/
  components/
  features/
  services/
  constants/
  hooks/
  types/
```

