import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export type GuestCardImagePickResult = {
  uri: string;
  base64?: string;
};

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  aspect: [16, 10],
  quality: 0.85,
  base64: true,
};

/** Pick or capture a photo for guest card custom background. Returns null if cancelled or denied. */
export async function pickGuestCardImage(fromCamera: boolean): Promise<GuestCardImagePickResult | null> {
  try {
    if (fromCamera) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Camera access needed',
          'Allow camera access in Settings to take a photo for your card design.',
        );
        return null;
      }
    } else {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Photos access needed',
          'Allow photo library access in Settings to choose an image for your card design.',
        );
        return null;
      }
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
      : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);

    if (result.canceled || !result.assets[0]) return null;

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      base64: asset.base64 ?? undefined,
    };
  } catch {
    Alert.alert('Could not load image', 'Try again or choose a different photo.');
    return null;
  }
}

/** Prefer persisted base64 when the file URI may no longer be valid (e.g. after app restart). */
export function resolveGuestCustomImageUri(
  uri: string | undefined,
  base64: string | undefined,
): string | null {
  if (uri?.trim()) return uri.trim();
  if (base64?.trim()) {
    const raw = base64.trim();
    if (raw.startsWith('data:')) return raw;
    return `data:image/jpeg;base64,${raw}`;
  }
  return null;
}
