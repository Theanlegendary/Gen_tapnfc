import { useMemo } from 'react';
import { useAuth } from '@/src/hooks/useAuth';

export function useRoleFlags() {
  const { user } = useAuth();

  return useMemo(
    () => ({
      role: user?.role ?? 'guest',
      isSales: user?.role === 'sales' || user?.role === 'agent',
      isAgent: user?.role === 'agent',
      isPrinter: user?.role === 'printer' || user?.role === 'printer_operator',
      isQaInspector: user?.role === 'qa_inspector',
      isShipping: user?.role === 'shipping',
      isCustomer: user?.role === 'customer',
      isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
      isSuperAdmin: user?.role === 'super_admin',
      isGuest: !user || user.isGuest === true || user.role === 'guest',
    }),
    [user]
  );
}
