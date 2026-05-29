import { Stack } from 'expo-router';
import { AuthGate } from '@/src/components/AuthGate';

export default function AdminLayout() {
  return (
    <AuthGate allowedRoles={['admin', 'super_admin']}>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthGate>
  );
}
