import { Stack } from 'expo-router';
import { AuthGate } from '@/src/components/AuthGate';

export default function ShippingLayout() {
  return (
    <AuthGate allowedRoles={['shipping', 'admin', 'super_admin']}>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthGate>
  );
}
