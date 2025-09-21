// src/context/AuthContext.tsx
import { clearTokens as clearAll, http, setTokens, tokenStore } from '@/api/http';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

WebBrowser.maybeCompleteAuthSession();

type AuthCtx = {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  logout: () => Promise<void>;
  setTokensInCtx: (access: string, refresh: string) => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  hydrated: false,
  logout: async () => {},
  setTokensInCtx: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Restore tokens on mount
  useEffect(() => {
    (async () => {
      try {
        await tokenStore.loadTokensFromStore?.();
        const [a, r] = await Promise.all([
          SecureStore.getItemAsync('access_token'),
          SecureStore.getItemAsync('refresh_token'),
        ]);
        if (a && r) {
          setTokens(a, r); // setează Authorization în axios
          setAccessToken(a);
          setRefreshToken(r);
        }
      } catch (e) {
        console.error('Failed to load tokens from storage', e);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const setTokensInCtx = useCallback(async (a: string, r: string) => {
    await SecureStore.setItemAsync('access_token', a);
    await SecureStore.setItemAsync('refresh_token', r);
    setTokens(a, r);
    setAccessToken(a);
    setRefreshToken(r);
  }, []);

  const logout = useCallback(async () => {
    try {
      const rt = await SecureStore.getItemAsync('refresh_token');
      if (rt) await http.post('/auth/logout', { refreshToken: rt });
    } catch {}
    await clearAll();
    setAccessToken(null);
    setRefreshToken(null);
  }, []);

  const value = useMemo(
    () => ({
      accessToken,
      refreshToken,
      isAuthenticated: !!accessToken,
      hydrated,
      logout,
      setTokensInCtx,
    }),
    [accessToken, refreshToken, hydrated, logout, setTokensInCtx]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
