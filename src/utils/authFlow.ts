import type { Href } from 'expo-router';
import { AppUser, UserRole, isPrinterOperatorRole } from '@/src/types/models';

export const AUTH_ROLES: UserRole[] = [
  'guest',
  'customer',
  'sales',
  'agent',
  'printer',
  'printer_operator',
  'qa_inspector',
  'shipping',
  'admin',
  'super_admin',
];

export const STAFF_ROLES: UserRole[] = ['sales', 'agent', 'printer', 'printer_operator', 'qa_inspector', 'shipping'];

export function normalizeRole(role: unknown): UserRole {
  if (role === 'super_admin') return 'super_admin';
  if (role === 'admin') return 'admin';
  if (role === 'printer_operator' || role === 'printer_staff') return 'printer_operator';
  if (role === 'printer') return 'printer';
  if (role === 'qa_inspector' || role === 'qa') return 'qa_inspector';
  if (role === 'shipping' || role === 'courier') return 'shipping';
  if (role === 'agent' || role === 'sales_agent') return 'agent';
  if (role === 'sales' || role === 'sales_rep') return 'sales';
  if (role === 'customer' || role === 'user') return 'customer';
  return 'guest';
}

export function getDashboardRoute(user: AppUser | null): Href {
  if (!user) return '/auth/login';
  if (user.role === 'admin' || user.role === 'super_admin') return '/admin';
  if (isPrinterOperatorRole(user.role) || user.role === 'printer') return '/printer/batch-select';
  if (user.role === 'qa_inspector') return '/qa' as Href;
  if (user.role === 'shipping') return '/shipping' as Href;
  if (user.role === 'sales' || user.role === 'agent') return '/sales';
  return '/(tabs)';
}

export function canAccessRole(user: AppUser | null, allowedRoles?: UserRole[]) {
  if (!allowedRoles || allowedRoles.length === 0) return Boolean(user);
  if (!user) return false;
  if (user.role === 'super_admin' && allowedRoles.includes('admin')) return true;
  if (
    (user.role === 'printer' || user.role === 'printer_operator') &&
    allowedRoles.some((r) => r === 'printer' || r === 'printer_operator')
  ) {
    return true;
  }
  return allowedRoles.includes(user.role);
}

export function isGuestUser(user: AppUser | null) {
  return !user || user.isGuest === true || user.role === 'guest';
}

export function isStaffRole(role: UserRole) {
  return STAFF_ROLES.includes(role);
}
