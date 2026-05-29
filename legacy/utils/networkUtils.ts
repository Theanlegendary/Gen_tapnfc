import { Alert } from 'react-native';

// Network connectivity and API utilities

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
}

export const networkUtils = {
  // Check if device is online
  async isOnline(): Promise<boolean> {
    try {
      // Simple connectivity check
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  // Retry mechanism for API calls
  async retryRequest<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }

    throw lastError!;
  },

  // Show network error alert
  showNetworkError(error?: Error) {
    Alert.alert(
      'Network Error',
      error?.message || 'Please check your internet connection and try again.',
      [
        { text: 'OK' },
        { text: 'Retry', onPress: () => window.location.reload() },
      ]
    );
  },

  // Handle API errors gracefully
  handleApiError(error: any, context: string = 'operation') {
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      this.showNetworkError(error);
      return;
    }

    Alert.alert(
      'Error',
      error.message || `An error occurred during ${context}. Please try again.`,
      [{ text: 'OK' }]
    );
  },

  // Check if error is network-related
  isNetworkError(error: any): boolean {
    const networkErrorMessages = [
      'network request failed',
      'fetch failed',
      'no internet connection',
      'connection timeout',
      'network error',
    ];

    const errorMessage = error?.message?.toLowerCase() || '';
    return networkErrorMessages.some(msg => errorMessage.includes(msg));
  },

  // Create timeout wrapper for requests
  withTimeout<T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
      ),
    ]);
  },
};

// API request wrapper with error handling
export const apiRequest = async <T>(
  requestFn: () => Promise<T>,
  options: {
    retries?: number;
    timeout?: number;
    showErrorAlert?: boolean;
    context?: string;
  } = {}
): Promise<T | null> => {
  const {
    retries = 2,
    timeout = 10000,
    showErrorAlert = true,
    context = 'API request',
  } = options;

  try {
    const result = await networkUtils.retryRequest(
      () => networkUtils.withTimeout(requestFn(), timeout),
      retries
    );
    return result;
  } catch (error) {
    if (showErrorAlert) {
      networkUtils.handleApiError(error, context);
    }
    return null;
  }
};

// Offline queue for failed requests
class OfflineQueue {
  private queue: Array<{
    id: string;
    requestFn: () => Promise<any>;
    context: string;
    timestamp: number;
  }> = [];

  add(requestFn: () => Promise<any>, context: string = 'queued request') {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.queue.push({
      id,
      requestFn,
      context,
      timestamp: Date.now(),
    });
    return id;
  }

  async processQueue(): Promise<void> {
    if (this.queue.length === 0) return;

    const isOnline = await networkUtils.isOnline();
    if (!isOnline) return;

    const queueCopy = [...this.queue];
    this.queue = [];

    for (const item of queueCopy) {
      try {
        await item.requestFn();
      } catch {
        // Re-add to queue if not too old (24 hours)
        const isNotTooOld = Date.now() - item.timestamp < 24 * 60 * 60 * 1000;
        if (isNotTooOld) {
          this.queue.push(item);
        }
      }
    }
  }

  clear() {
    this.queue = [];
  }

  getQueueSize(): number {
    return this.queue.length;
  }
}

export const offlineQueue = new OfflineQueue();

// Auto-process queue when app comes online
export const startOfflineQueueProcessor = () => {
  setInterval(async () => {
    await offlineQueue.processQueue();
  }, 30000); // Check every 30 seconds
};
