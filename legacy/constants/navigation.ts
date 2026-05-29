export const AppRoutes = {
  login: 'auth/login',
  register: 'auth/register',
  tabs: '(tabs)',
  qrScanner: 'qr-scanner',
  summary: 'summary',
  admin: 'admin',
  adminGroups: 'admin/groups',
  adminJoinRequests: 'admin/join-requests',
  notifications: 'notifications',
  testNotification: 'test-notification',
  notFound: '+not-found',
} as const;

export const TabRoutes = {
  home: 'index',
  attendance: 'attendance',
  profile: 'profile',
  settings: 'settings',
} as const;
