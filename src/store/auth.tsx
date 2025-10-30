import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AuthAPI } from '@/lib/api';

export type Role = 'student' | 'alumni' | 'admin' | 'super_admin';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  notifications?: number;
  messages?: number;
}

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  registerStudent: (payload: {
    name: string;
    email: string;
    password: string;
    role: 'student';
    sapId: string;
    batchSeason: 'Spring' | 'Fall';
    batchYear: number;
  }) => Promise<void>;
  registerAlumni: (payload: {
    name: string;
    email: string;
    password: string;
    role: 'alumni';
    gradSeason: 'Spring' | 'Fall';
    gradYear: number;
    linkedinId?: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { user } = await AuthAPI.me();
        setUser({ ...user, notifications: 2, messages: 1 });
      } catch (e) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const { user } = await AuthAPI.login({ email, password });
    setUser({ ...user, notifications: 2, messages: 1 });
    const preferredTab = user.role === 'admin' ? 'dashboard' : 'home';
    localStorage.setItem('preferredTab', preferredTab);
  };

  const logout = async () => {
    await AuthAPI.logout();
    setUser(null);
    localStorage.removeItem('preferredTab');
  };

  const registerStudent: AuthContextValue['registerStudent'] = async (payload) => {
    const { user } = await AuthAPI.register(payload);
    setUser({ ...user, notifications: 0, messages: 0 });
    localStorage.setItem('preferredTab', 'home');
  };

  const registerAlumni: AuthContextValue['registerAlumni'] = async (payload) => {
    const { user } = await AuthAPI.register(payload);
    setUser({ ...user, notifications: 0, messages: 0 });
    localStorage.setItem('preferredTab', 'home');
  };

  const value = useMemo(() => ({ user, loading, login, logout, registerStudent, registerAlumni }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
