import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setTokenGetter, setUnauthorizedHandler } from '@/lib/api';
import type { User } from '@/lib/types';

// Auth now belongs to the Owners API. Version the keys so stale tokens issued
// by the retired local service cannot be sent to the external marketplace.
const TOKEN_KEY = 'shiphub_charterer_owners_auth_token';
const USER_KEY = 'shiphub_charterer_owners_auth_user';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    role?: string;
    company?: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Keep a ref for the token getter so it's always up-to-date
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    // Wire the token getter for the API client
    setTokenGetter(() => tokenRef.current);
    return () => setTokenGetter(null);
  }, []);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // Load persisted auth on mount
  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);
        if (storedToken && storedUser) {
          const parsedUser: User = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
          tokenRef.current = storedToken;
        }
      } catch {
        // ignore storage errors
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (t: string, u: User) => {
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, t),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(u)),
    ]);
    tokenRef.current = t;
    setToken(t);
    setUser(u);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { token: t, user: u } = await api.auth.login(email, password);
      await persist(t, u);
    },
    [persist],
  );

  const register = useCallback(
    async (data: Parameters<typeof api.auth.register>[0]) => {
      const { token: t, user: u } = await api.auth.register(data);
      await persist(t, u);
    },
    [persist],
  );

  const logout = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
    tokenRef.current = null;
    setToken(null);
    setUser(null);
  }, []);

  const deleteAccount = useCallback(async () => {
    await api.auth.deleteAccount();
    await logout();
  }, [logout]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void logout();
    });
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
