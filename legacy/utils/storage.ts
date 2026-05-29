import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const STORAGE_KEYS = {
  USER: 'user',
  SETTINGS: 'userSettings',
  NOTIFICATIONS: 'notifications',
  ATTENDANCE_CACHE: 'attendanceCache',
  QR_CACHE: 'qrCache',
  THEME: 'theme',
  LANGUAGE: 'language',
} as const;

// Generic storage utilities
export const storage = {
  // Get item from storage
  async get<T>(key: string): Promise<T | null> {
    try {
      const item = await AsyncStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  // Set item in storage
  async set<T>(key: string, value: T): Promise<boolean> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  // Remove item from storage
  async remove(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },

  // Clear all storage
  async clear(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      return true;
    } catch {
      return false;
    }
  },

  // Get multiple items
  async getMultiple(keys: string[]): Promise<Record<string, any>> {
    try {
      const items = await AsyncStorage.multiGet(keys);
      const result: Record<string, any> = {};
      
      items.forEach(([key, value]) => {
        result[key] = value ? JSON.parse(value) : null;
      });
      
      return result;
    } catch {
      return {};
    }
  },

  // Set multiple items
  async setMultiple(items: Array<[string, any]>): Promise<boolean> {
    try {
      const stringifiedItems = items.map(([key, value]) => [key, JSON.stringify(value)]);
      await AsyncStorage.multiSet(stringifiedItems);
      return true;
    } catch {
      return false;
    }
  },
};

// Specific storage functions
export const userStorage = {
  async getUser() {
    return storage.get(STORAGE_KEYS.USER);
  },

  async setUser(user: any) {
    return storage.set(STORAGE_KEYS.USER, user);
  },

  async removeUser() {
    return storage.remove(STORAGE_KEYS.USER);
  },
};

export const settingsStorage = {
  async getSettings() {
    return storage.get(STORAGE_KEYS.SETTINGS);
  },

  async setSettings(settings: any) {
    return storage.set(STORAGE_KEYS.SETTINGS, settings);
  },

  async updateSetting(key: string, value: any) {
    const settings = await this.getSettings() || {};
    settings[key] = value;
    return this.setSettings(settings);
  },
};

export const notificationStorage = {
  async getNotifications() {
    return storage.get(STORAGE_KEYS.NOTIFICATIONS) || [];
  },

  async setNotifications(notifications: any[]) {
    return storage.set(STORAGE_KEYS.NOTIFICATIONS, notifications);
  },

  async addNotification(notification: any) {
    const notifications = await this.getNotifications();
    notifications.unshift(notification);
    return this.setNotifications(notifications);
  },

  async markAsRead(notificationId: string) {
    const notifications = await this.getNotifications();
    const updated = notifications.map((notif: any) =>
      notif.id === notificationId ? { ...notif, isRead: true } : notif
    );
    return this.setNotifications(updated);
  },

  async clearAll() {
    return storage.remove(STORAGE_KEYS.NOTIFICATIONS);
  },
};

export const attendanceStorage = {
  async cacheAttendanceData(data: any) {
    return storage.set(STORAGE_KEYS.ATTENDANCE_CACHE, {
      data,
      timestamp: Date.now(),
    });
  },

  async getCachedAttendanceData() {
    const cached = await storage.get(STORAGE_KEYS.ATTENDANCE_CACHE);
    if (!cached) return null;

    // Check if cache is older than 1 hour
    const isExpired = Date.now() - cached.timestamp > 60 * 60 * 1000;
    return isExpired ? null : cached.data;
  },

  async clearCache() {
    return storage.remove(STORAGE_KEYS.ATTENDANCE_CACHE);
  },
};

// Cache management
export const cacheManager = {
  async clearExpiredCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.includes('_cache'));
      
      for (const key of cacheKeys) {
        const cached = await storage.get(key);
        if (cached && cached.timestamp) {
          // Remove cache older than 24 hours
          const isExpired = Date.now() - cached.timestamp > 24 * 60 * 60 * 1000;
          if (isExpired) {
            await storage.remove(key);
          }
        }
      }
    } catch {
    }
  },

  async getCacheSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);
      
      let totalSize = 0;
      items.forEach(([_, value]) => {
        if (value) {
          totalSize += value.length;
        }
      });
      
      return totalSize;
    } catch {
      return 0;
    }
  },
};
