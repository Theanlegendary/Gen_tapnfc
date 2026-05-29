import { PropsWithChildren } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { theme } from '@/src/constants/theme';
import { useAuth } from '@/src/hooks/useAuth';
import { UserRole } from '@/src/types/models';
import { canAccessRole, getDashboardRoute } from '@/src/utils/authFlow';

interface AuthGateProps {
  allowedRoles?: UserRole[];
}

export function AuthGate({ allowedRoles, children }: PropsWithChildren<AuthGateProps>) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} />
        <AppText variant="caption" tone="muted">
          Checking session...
        </AppText>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  if (!canAccessRole(user, allowedRoles)) {
    return <Redirect href={getDashboardRoute(user)} />;
  }

  return <>{children}</>;
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
