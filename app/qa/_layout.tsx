import { Stack } from 'expo-router';
import { AuthGate } from '@/src/components/AuthGate';

export default function QaLayout() {
  return (
    <AuthGate allowedRoles={['qa_inspector', 'admin', 'super_admin']}>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthGate>
  );
}
