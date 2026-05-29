import { useCallback, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { useCameraPermissions } from 'expo-camera';

export function useCameraAccess() {
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const [requesting, setRequesting] = useState(false);

  const isWeb = Platform.OS === 'web';
  const isLoading = permission === null && !isWeb;
  const isGranted = Boolean(permission?.granted);
  const canAskAgain = permission?.canAskAgain !== false;

  const enableCamera = useCallback(async () => {
    if (isWeb) {
      Alert.alert(
        'Camera on web',
        'QR scanning works best in the mobile app. Enter the card UID manually, or use NFC tap on a device.'
      );
      return false;
    }

    setRequesting(true);
    try {
      const result = await requestPermission();
      if (result.granted) {
        return true;
      }

      if (!result.canAskAgain) {
        Alert.alert(
          'Camera permission blocked',
          'Enable camera access in your device settings to scan QR codes.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => void Linking.openSettings() },
          ]
        );
      } else {
        Alert.alert('Camera permission needed', 'Allow camera access to scan card QR codes.');
      }

      await getPermission();
      return false;
    } catch (error) {
      Alert.alert(
        'Camera error',
        error instanceof Error ? error.message : 'Unable to request camera permission.'
      );
      return false;
    } finally {
      setRequesting(false);
    }
  }, [getPermission, isWeb, requestPermission]);

  return {
    permission,
    isWeb,
    isLoading,
    isGranted,
    canAskAgain,
    requesting,
    enableCamera,
    getPermission,
  };
}
