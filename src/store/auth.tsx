// src/store/auth.tsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AuthAPI, UsersAPI } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

export type Role = 'student' | 'alumni' | 'admin' | 'super_admin';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  notifications?: number;
  messages?: number;
  onboardingCompleted?: boolean;
  onboardingStep?: number;
  onboardingRequired?: boolean;
  bio?: string;
  interests?: string[];
  preferredIndustries?: string[];
  skillsToDevelop?: string[];
  mentorshipPreferences?: any;
}

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  registerStudent: (payload: any) => Promise<void>;
  registerAlumni: (payload: any) => Promise<void>;
  completeOnboarding: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const refresh = async () => {
    try {
      const { user } = await UsersAPI.me();
      const updatedUser = {
        ...user,
        avatar: (user as any).profilePicture ?? (user as any).avatar,
        notifications: user.notifications || 0,
        messages: user.messages || 0,
        onboardingCompleted: user.onboardingCompleted || false,
        onboardingStep: user.onboardingStep || 0,
        onboardingRequired: (user as any).onboardingRequired || false,
      };
      setUser(updatedUser);
      return updatedUser;
    } catch (e) {
      setUser(null);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh().catch(() => {
      // Not logged in / session expired is expected here; routing will send user to /login.
    });
  }, []);

  const login = async (email: string, password: string) => {
    await AuthAPI.login({ email, password });
    // Fetch full user from /me to ensure onboarding fields are present
    const { user } = await UsersAPI.me();
    const updatedUser = {
      ...user,
      avatar: (user as any).profilePicture ?? (user as any).avatar,
      notifications: user.notifications || 0,
      messages: user.messages || 0,
      onboardingCompleted: user.onboardingCompleted || false,
      onboardingStep: user.onboardingStep || 0,
      onboardingRequired: (user as any).onboardingRequired || false,
    };
    setUser(updatedUser);
    // Navigate to home page after successful login
    navigate('/');
    return updatedUser;
  };

  const logout = async () => {
    await AuthAPI.logout();
    setUser(null);
    navigate('/login');
  };

  const completeOnboarding = async (data: any) => {
    try {
      const { user } = await UsersAPI.updateMe({
        ...data,
        onboardingCompleted: true,
        onboardingStep: 5
      });
      setUser(prev => prev ? { ...prev, ...user, onboardingCompleted: true, onboardingRequired: false } : null);
      return user;
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      throw error;
    }
  };

  const registerStudent = async (payload: any) => {
    const { user } = await AuthAPI.register(payload);
    const updatedUser = {
      ...user,
      avatar: (user as any).profilePicture ?? (user as any).avatar,
      notifications: 0,
      messages: 0,
      onboardingCompleted: false,
      onboardingStep: 0,
      onboardingRequired: true,
    };
    setUser(updatedUser);
    return updatedUser;
  };

  const registerAlumni = async (payload: any) => {
    const { user } = await AuthAPI.register(payload);
    const updatedUser = {
      ...user,
      avatar: (user as any).profilePicture ?? (user as any).avatar,
      notifications: 0,
      messages: 0,
      onboardingCompleted: false,
      onboardingStep: 0,
      onboardingRequired: true,
    };
    setUser(updatedUser);
    return updatedUser;
  };

  const value = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    refresh,
    registerStudent,
    registerAlumni,
    completeOnboarding
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}