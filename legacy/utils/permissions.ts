import { Alert, Linking, Platform } from 'react-native';
import * as Camera from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';

export interface PermissionResult {
  granted: boolean;
  canAskAgain?: boolean;
  status: string;
}

export const permissions = {
  // Camera permissions
  async requestCamera(): Promise<PermissionResult> {
    try {
      const { status, canAskAgain } = await Camera.requestCameraPermissionsAsync();
      return {
        granted: status === 'granted',
        canAskAgain,
        status,
      };
    } catch {
      return { granted: false, status: 'error' };
    }
  },

  async checkCamera(): Promise<PermissionResult> {
    try {
      const { status, canAskAgain } = await Camera.getCameraPermissionsAsync();
      return {
        granted: status === 'granted',
        canAskAgain,
        status,
      };
    } catch {
      return { granted: false, status: 'error' };
    }
  },

  // Media library permissions
  async requestMediaLibrary(): Promise<PermissionResult> {
    try {
      const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return {
        granted: status === 'granted',
        canAskAgain,
        status,
      };
    } catch {
      return { granted: false, status: 'error' };
    }
  },

  // Notification permissions
  async requestNotifications(): Promise<PermissionResult> {
    if (Platform.OS === 'web') {
      return { granted: true, status: 'granted' };
    }

    try {
      const { status, canAskAgain } = await Notifications.requestPermissionsAsync();
      return {
        granted: status === 'granted',
        canAskAgain,
        status,
      };
    } catch {
      return { granted: false, status: 'error' };
    }
  },

  // Check all permissions at once
  async checkAllPermissions() {
    const [camera, notifications] = await Promise.all([
      this.checkCamera(),
      Platform.OS !== 'web' ? this.requestNotifications() : { granted: true, status: 'granted' },
    ]);

    return {
      camera,
      notifications,
    };
  },

  // Show permission denied alert with settings option
  showPermissionDeniedAlert(permissionType: string) {
    Alert.alert(
      'Permission Required',
      `${permissionType} permission is required for this feature to work properly.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          },
        },
      ]
    );
  },

  // Request permission with user-friendly messaging
  async requestWithFallback(
    permissionType: 'camera' | 'mediaLibrary' | 'notifications',
    feature: string
  ): Promise<boolean> {
    let result: PermissionResult;

    switch (permissionType) {
      case 'camera':
        result = await this.requestCamera();
        break;
      case 'mediaLibrary':
        result = await this.requestMediaLibrary();
        break;
      case 'notifications':
        result = await this.requestNotifications();
        break;
      default:
        return false;
    }

    if (!result.granted) {
      if (result.canAskAgain === false) {
        this.showPermissionDeniedAlert(permissionType);
      } else {
        Alert.alert(
          'Permission Required',
          `${feature} requires ${permissionType} permission to function properly.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Grant Permission',
              onPress: () => this.requestWithFallback(permissionType, feature),
            },
          ]
        );
      }
    }

    return result.granted;
  },
};

// Permission status constants
export const PERMISSION_STATUS = {
  GRANTED: 'granted',
  DENIED: 'denied',
  UNDETERMINED: 'undetermined',
  RESTRICTED: 'restricted',
} as const;

// Helper functions
export const isPermissionGranted = (status: string): boolean => {
  return status === PERMISSION_STATUS.GRANTED;
};

export const canRequestPermission = (status: string): boolean => {
  return status === PERMISSION_STATUS.UNDETERMINED;
};

export const isPermissionDenied = (status: string): boolean => {
  return status === PERMISSION_STATUS.DENIED || status === PERMISSION_STATUS.RESTRICTED;
};
