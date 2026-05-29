import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { theme } from '@/src/constants/theme';
import { useAuth } from '@/src/hooks/useAuth';
import { getDashboardRoute } from '@/src/utils/authFlow';

export default function IndexRoute() {
  const { user, isLoading } = useAuth();

  // When user becomes null (sign out), redirect to login
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/auth/login');
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} />
        <AppText variant="caption" tone="muted">
          Restoring session...
        </AppText>
      </View>
    );
  }

  return <Redirect href={getDashboardRoute(user)} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
});
