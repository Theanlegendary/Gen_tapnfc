const DEMO_ACCOUNT_EMAILS = new Set([
  'sales@demo.com',
  'sales2@demo.com',
  'printer@demo.com',
  'printer2@demo.com',
  'admin@demo.com',
  'super@demo.com',
  'customer@demo.com',
  'empty@demo.com',
]);

export function isDemoAccountEmail(email?: string | null): boolean {
  if (!email) return false;
  return DEMO_ACCOUNT_EMAILS.has(email.trim().toLowerCase());
}
