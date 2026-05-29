import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthContextType, AuthState, LoginCredentials, RegisterData, User } from '@/types/auth';
import { FirebaseService } from '@/services/firebaseService';
import { auth } from '@/lib/firebase';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    const unsub = FirebaseService.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        setAuthState({ user: null, isLoading: false, isAuthenticated: false });
        return;
      }

      try {
        const profile = await FirebaseService.getUserProfile(firebaseUser.uid);
        setAuthState({ user: profile, isLoading: false, isAuthenticated: true });
      } catch (error) {
        setAuthState({ user: null, isLoading: false, isAuthenticated: false });
      }
    });

    return unsub;
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));
    try {
      const user = await FirebaseService.login(credentials.email, credentials.password);
      setAuthState({ user, isLoading: false, isAuthenticated: true });
    } catch (error) {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));
    try {
      const user = await FirebaseService.register(data);
      setAuthState({ user, isLoading: false, isAuthenticated: true });
    } catch (error) {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = async () => {
    await FirebaseService.logout();
    setAuthState({ user: null, isLoading: false, isAuthenticated: false });
  };

  const refreshUser = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const user = await FirebaseService.getUserProfile(uid);
    setAuthState((prev) => ({ ...prev, user, isAuthenticated: true }));
  };

  const updateProfile = async (profileData: Partial<User>) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const user = await FirebaseService.updateUserProfile(uid, profileData);
    setAuthState((prev) => ({ ...prev, user }));
    return user;
  };

  const resetPassword = async (email: string) => {
    await FirebaseService.resetPassword(email);
  };

  return (
    <AuthContext.Provider
      value={{
        user: authState.user,
        isLoading: authState.isLoading,
        isAuthenticated: authState.isAuthenticated,
        login,
        register,
        logout,
        refreshUser,
        updateProfile,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
