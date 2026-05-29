import { AppUser, UserRole } from '@/src/types/models';

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  displayName: string;
  role: UserRole;
}

export interface AuthContextValue {
  user: AppUser | null;
  isLoading: boolean;
  error: string | null;
  signIn: (input: LoginInput) => Promise<AppUser>;
  signUp: (input: RegisterInput) => Promise<AppUser>;
  signInAsGuest: () => Promise<void>;
  signOutUser: () => Promise<void>;
}
