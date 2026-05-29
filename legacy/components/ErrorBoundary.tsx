import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.retry} />;
      }

      return <DefaultErrorFallback error={this.state.error} retry={this.retry} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, retry }: { error?: Error; retry: () => void }) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <AppIcon name="TriangleAlert" size={24} color="#ef4444" />
        </View>
        
        <AppText variant="h2" weight="bold" style={styles.title}>Something went wrong</AppText>
        <AppText variant="body" tone="muted" style={styles.message}>
          We encountered an unexpected error. Please try again.
        </AppText>
        
        {__DEV__ && error && (
          <View style={styles.errorDetails}>
            <AppText variant="caption" style={styles.errorText}>{error.message}</AppText>
          </View>
        )}
        
        <TouchableOpacity style={styles.retryButton} onPress={retry}>
          <AppIcon name="RefreshCw" size={20} color="#ffffff" />
          <AppText variant="body" tone="inverse" weight="semibold">Try Again</AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginBottom: 20,
  },
  errorDetails: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    width: '100%',
  },
  errorText: {
    color: '#dc2626',
  },
  retryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
