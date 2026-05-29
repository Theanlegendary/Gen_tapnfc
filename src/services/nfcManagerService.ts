import { Platform } from 'react-native';

type NfcManagerModule = typeof import('react-native-nfc-manager').default;
type NfcTechModule = typeof import('react-native-nfc-manager').NfcTech;
type NdefModule = typeof import('react-native-nfc-manager').Ndef;

type NfcModules = {
  NfcManager: NfcManagerModule;
  NfcTech: NfcTechModule;
  Ndef: NdefModule;
};

let modules: NfcModules | null = null;
let hasStarted = false;

async function loadNfcModules(): Promise<NfcModules | null> {
  if (Platform.OS === 'web') return null;
  if (modules) return modules;

  try {
    const nfc = await import('react-native-nfc-manager');
    modules = {
      NfcManager: nfc.default,
      NfcTech: nfc.NfcTech,
      Ndef: nfc.Ndef,
    };
    return modules;
  } catch {
    return null;
  }
}

export async function isNfcAvailable() {
  const nfc = await loadNfcModules();
  if (!nfc) return false;
  return nfc.NfcManager.isSupported();
}

export async function startNfcManager() {
  const nfc = await loadNfcModules();
  if (!nfc) throw new Error('NFC is only available in a native iOS or Android build.');
  if (hasStarted) return;
  await nfc.NfcManager.start();
  hasStarted = true;
}

export async function writeNfcUrl(url: string) {
  const nfc = await loadNfcModules();
  if (!nfc) {
    throw new Error('NFC writing is not available on web. Use a native development build or production app.');
  }

  await startNfcManager();
  const bytes = nfc.Ndef.encodeMessage([nfc.Ndef.uriRecord(url)]);
  if (!bytes) throw new Error('Unable to create NFC payload.');

  try {
    await nfc.NfcManager.requestTechnology(nfc.NfcTech.Ndef);
    await nfc.NfcManager.ndefHandler.writeNdefMessage(bytes);
  } finally {
    void nfc.NfcManager.cancelTechnologyRequest();
  }
}

export async function readNfcTag() {
  const nfc = await loadNfcModules();
  if (!nfc) {
    throw new Error('NFC reading is not available on web. Use a native development build or production app.');
  }

  await startNfcManager();
  try {
    await nfc.NfcManager.requestTechnology(nfc.NfcTech.Ndef);
    return await nfc.NfcManager.getTag();
  } finally {
    void nfc.NfcManager.cancelTechnologyRequest();
  }
}

/** Read chip UID from a blank or pre-encoded card (tries NDEF then NfcA). */
export async function readNfcUid(): Promise<string> {
  const nfc = await loadNfcModules();
  if (!nfc) {
    throw new Error('NFC reading is not available on web. Use a native development build or production app.');
  }

  const supported = await nfc.NfcManager.isSupported();
  if (!supported) {
    throw new Error('NFC is not supported on this device.');
  }

  await startNfcManager();
  try {
    try {
      await nfc.NfcManager.requestTechnology(nfc.NfcTech.Ndef);
    } catch {
      await nfc.NfcManager.requestTechnology(nfc.NfcTech.NfcA);
    }
    const tag = await nfc.NfcManager.getTag();
    const uid = tag?.id?.replace(/:/g, '').toUpperCase() ?? '';
    if (!uid) throw new Error('Could not read chip UID. Hold the card on the phone and try again.');
    return uid;
  } finally {
    void nfc.NfcManager.cancelTechnologyRequest();
  }
}
