import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, setToken } from '../api/client';

export interface VitalisUser {
  id: string;
  username: string;
  email: string;
  age: number;
  gender: string;
  height_cm: number;
  weight_kg: number;
  activity_level: string;
}

interface AuthContextValue {
  user: VitalisUser | null;
  goals: string[];
  loading: boolean;
  signup: (payload: Record<string, unknown>) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<VitalisUser | null>(null);
  const [goals, setGoals] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const data = await api.get('/api/auth/me');
      setUser(data.user);
      setGoals(data.goals);
    } catch {
      setUser(null);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('vitalis_token');
    if (token) refresh();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signup(payload: Record<string, unknown>) {
    const data = await api.post('/api/auth/signup', payload);
    setToken(data.token);
    setUser(data.user);
    setGoals((payload.goals as string[]) || []);
  }

  async function login(email: string, password: string) {
    const data = await api.post('/api/auth/login', { email, password });
    setToken(data.token);
    setUser(data.user);
    await refresh();
  }

  function logout() {
    setToken(null);
    setUser(null);
    setGoals([]);
  }

  return (
    <AuthContext.Provider value={{ user, goals, loading, signup, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
