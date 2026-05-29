export const isAdminRole = (role?: string) => role === 'admin' || role === 'super_admin';
export const toNotificationAudience = (role?: string): 'admin' | 'user' =>
  role === 'admin' || role === 'super_admin' ? 'admin' : 'user';
