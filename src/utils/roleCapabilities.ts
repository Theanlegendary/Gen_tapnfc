import { UserRole } from '@/src/types/models';

export type RoleLike = UserRole | null | undefined;

interface RoleCapability {
  title: string;
  description: string;
}

const capabilities: Record<UserRole, RoleCapability[]> = {
  guest: [
    {
      title: 'Design & preview',
      description: 'Build a card layout, preview your NFC identity, and save a local draft on this device.',
    },
    {
      title: 'Checkout & tracking',
      description: 'Sign in to pay, create real Firebase orders, and track production status.',
    },
    {
      title: 'Explore & scan',
      description: 'Scan real profile QR codes, browse themes, and view your account stats after sign-in.',
    },
    {
      title: 'Staff areas blocked',
      description: 'Sales, printer, admin, and payout tools redirect to the guest consumer experience.',
    },
  ],
  customer: [
    {
      title: 'Own profile',
      description: 'Can manage personal bio, language, theme, and customer order requests.',
    },
    {
      title: 'Limited access',
      description: 'Cannot view staff wages, branch queues, or global admin settings.',
    },
  ],
  sales: [
    {
      title: 'Sales orders',
      description: 'Can create orders and see only orders assigned to this sales account.',
    },
    {
      title: 'Payout tracking',
      description: 'Can review own commission and payout status after orders are delivered.',
    },
    {
      title: 'Bulk employee upload',
      description: 'Can import territory client lists from CSV for faster onboarding.',
    },
  ],
  agent: [
    {
      title: 'Territory orders',
      description: 'Can create and manage orders for clients in your assigned territory only.',
    },
    {
      title: 'Client visibility',
      description: 'Sees orders and customers scoped to your branch and territory.',
    },
  ],
  printer: [
    {
      title: 'Batch production',
      description: 'Select an active batch before queue or scan work. No global auto-assign.',
    },
    {
      title: 'Print & encode',
      description: 'Scan cards, print, and write NFC within the active batch only.',
    },
    {
      title: 'No customer edits',
      description: 'Cannot change customer contact details or payment fields.',
    },
  ],
  printer_operator: [
    {
      title: 'Batch production',
      description: 'Select an active batch before queue or scan work. No global auto-assign.',
    },
    {
      title: 'Print & encode',
      description: 'Scan cards, print, and write NFC within the active batch only.',
    },
    {
      title: 'No customer edits',
      description: 'Cannot change customer contact details or payment fields.',
    },
  ],
  qa_inspector: [
    {
      title: 'QA approval',
      description: 'Review production output and pass or fail orders awaiting QA.',
    },
    {
      title: 'Reprint trigger',
      description: 'Failed QA creates a reprint job with audit trail — no floor production.',
    },
  ],
  shipping: [
    {
      title: 'Fulfillment',
      description: 'Mark ready orders as shipped and track delivery handoff.',
    },
    {
      title: 'Branch scoped',
      description: 'Sees ready-to-ship orders for your branch.',
    },
  ],
  admin: [
    {
      title: 'Global operations',
      description: 'Can manage users, orders, batches, NFC logs, salaries, products, reports, and settings.',
    },
    {
      title: 'Staff oversight',
      description: 'Can review printer and sales activity across every branch.',
    },
    {
      title: 'Audit logs',
      description: 'Can review production, QA, shipping, and reprint audit history.',
    },
  ],
  super_admin: [
    {
      title: 'Owner access',
      description: 'Should manage admins, staff roles, branches, rates, products, and backend configuration.',
    },
    {
      title: 'Audit authority',
      description: 'Should review all records and audit history across sales, printer, and admin accounts.',
    },
    {
      title: 'Production setup',
      description: 'Should be issued from trusted backend claims, not self-service registration.',
    },
  ],
};

export function getRoleLabel(role: RoleLike) {
  if (role === 'super_admin') return 'Super Admin';
  if (role === 'admin') return 'Admin';
  if (role === 'printer_operator') return 'Printer Operator';
  if (role === 'printer') return 'Printer';
  if (role === 'qa_inspector') return 'QA Inspector';
  if (role === 'shipping') return 'Shipping';
  if (role === 'agent') return 'Sales Agent';
  if (role === 'sales') return 'Sales Rep';
  if (role === 'customer') return 'Customer';
  return 'Guest';
}

export function getRoleCapabilities(role: RoleLike) {
  return capabilities[role ?? 'guest'] ?? capabilities.guest;
}

export function getRoleScopeSummary(role: RoleLike) {
  if (role === 'super_admin') return 'All branches, all users, backend-owned privileges.';
  if (role === 'admin') return 'All branches, batches, audit logs, and operational records.';
  if (role === 'printer' || role === 'printer_operator') return 'Active batch only — print, NFC encode, no customer edits.';
  if (role === 'qa_inspector') return 'QA pass/fail and reprint requests only.';
  if (role === 'shipping') return 'Ready-to-ship orders and delivery marking.';
  if (role === 'agent') return 'Territory-scoped customers, orders, and payouts.';
  if (role === 'sales') return 'Own assigned customers, orders, payouts, and CSV imports.';
  if (role === 'customer') return 'Own profile and customer-facing records.';
  return 'Limited preview only.';
}
