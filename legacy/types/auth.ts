export interface User {
  id: string;
  email: string;
  name: string;
  employeeId: string;
  role: 'user' | 'admin' | 'super_admin' | 'sales_rep' | 'printer_staff';
  username?: string;
  contact?: string;
  designation?: string;
  address?: string;
  profileImage?: string;
  timeZone?: string;
  language?: string;
  joinedGroups?: string[];
  personalQRCode?: string;
  twoFactorEnabled?: boolean;
  notificationSettings?: {
    attendance: boolean;
    events: boolean;
    groupInvites: boolean;
    systemUpdates: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
  workStartTime: string;
  workEndTime: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  employeeId: string;
  contact?: string;
  designation?: string;
  role?: 'user' | 'admin' | 'super_admin' | 'sales_rep' | 'printer_staff';
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (profileData: Partial<User>) => Promise<User | undefined>;
  resetPassword: (email: string) => Promise<void>;
}
