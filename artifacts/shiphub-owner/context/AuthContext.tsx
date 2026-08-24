import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setTokenGetter } from '@/lib/api';
import type { User } from '@/lib/types';

type RegisterData = { name: string; email: string; password: string; company?: string };
type AuthValue = { user: User | null; isLoading: boolean; login: (email: string, password: string) => Promise<void>; register: (data: RegisterData) => Promise<void>; logout: () => Promise<void> };
const Context = createContext<AuthValue | null>(null);
const TOKEN_KEY = 'shiphub_owner_token';
const USER_KEY = 'shiphub_owner_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);
  const token = useRef<string | null>(null);

  useEffect(() => {
    setTokenGetter(() => token.current);
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([AsyncStorage.getItem(TOKEN_KEY), AsyncStorage.getItem(USER_KEY)]);
        if (storedToken && storedUser) {
          const parsed = JSON.parse(storedUser) as User;
          if (parsed.role === 'owner' || parsed.role === 'admin') { token.current = storedToken; setUser(parsed); }
        }
      } finally { setLoading(false); }
    })();
    return () => setTokenGetter(null);
  }, []);

  const store = useCallback(async (nextToken: string, nextUser: User) => {
    if (nextUser.role !== 'owner' && nextUser.role !== 'admin') throw new Error('This app is only available to owner and admin accounts.');
    token.current = nextToken;
    setUser(nextUser);
    await AsyncStorage.multiSet([[TOKEN_KEY, nextToken], [USER_KEY, JSON.stringify(nextUser)]]);
  }, []);
  const login = useCallback(async (email: string, password: string) => { const result = await api.auth.login(email, password); await store(result.token, result.user); }, [store]);
  const register = useCallback(async (data: RegisterData) => { const result = await api.auth.register({ ...data, role: 'owner' }); await store(result.token, result.user); }, [store]);
  const logout = useCallback(async () => { token.current = null; setUser(null); await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]); }, []);

  return <Context.Provider value={{ user, isLoading, login, register, logout }}>{children}</Context.Provider>;
}

export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error('AuthProvider is missing');
  return value;
}