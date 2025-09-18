// src/context/AuthContext.tsx
import { clearTokens as clearAll, http, setTokens, tokenStore } from '@/api/http';
import { makeRedirectUri } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

WebBrowser.maybeCompleteAuthSession();

type AuthCtx = {
  accessToken: string | null;
  refreshToken: string | null;
  /** Opens Google flow, exchanges idToken at /auth/google, stores tokens */
  googleLogin: () => Promise<void>;
  /** Clears tokens both locally and on backend (/auth/logout), if possible */
  logout: () => Promise<void>;
  /** Optional escape hatch: manually set tokens if you obtained them elsewhere */
  setTokensInCtx: (access: string, refresh: string) => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  accessToken: null,
  refreshToken: null,
  googleLogin: async () => {},
  logout: async () => {},
  setTokensInCtx: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  // Restore tokens on mount
  useEffect(() => {
    (async () => {
      await tokenStore.loadTokensFromStore?.(); // ok if no-op in your impl
      const a = await SecureStore.getItemAsync('access_token');
      const r = await SecureStore.getItemAsync('refresh_token');
      if (a && r) {
        setTokens(a, r); // set default axios headers
        setAccessToken(a);
        setRefreshToken(r);
      }
    })();
  }, []);

  // Google OAuth request config
  const extra = (Constants.expoConfig?.extra as any) ?? {};
  const googleCfg = extra.google ?? {};
  const redirectUri = makeRedirectUri({
    scheme: 'safedocs', // ensure "scheme": "safedocs" exists in app.json/app.config
  });

  const [request, , promptAsync] = Google.useAuthRequest({
    clientId: googleCfg.expoClientId,      // optional fallback for Expo Go/web
    iosClientId: googleCfg.iosClientId,
    androidClientId: googleCfg.androidClientId,
    webClientId: googleCfg.webClientId,    // optional
    scopes: ['profile', 'email'],
    responseType: 'id_token',
    redirectUri,
    usePKCE: true,
  });

  const setTokensInCtx = useCallback(async (a: string, r: string) => {
    await SecureStore.setItemAsync('access_token', a);
    await SecureStore.setItemAsync('refresh_token', r);
    setTokens(a, r);             // update axios defaults
    setAccessToken(a);
    setRefreshToken(r);
  }, []);

  const doRefresh = useCallback(async () => {
    const rt = await SecureStore.getItemAsync('refresh_token');
    if (!rt) return;
    try {
      const { data } = await http.post('/auth/refresh', { refreshToken: rt });
      const { accessToken: a, refreshToken: r } = data as { accessToken: string; refreshToken: string };
      await setTokensInCtx(a, r);
    } catch {
      await clearAll();
      setAccessToken(null);
      setRefreshToken(null);
    }
  }, [setTokensInCtx]);

  const googleLogin = useCallback(async () => {
    if (!request) return; // wait until hook is ready
    const res = await promptAsync({ showInRecents: true }); // useProxy is stable in Expo Go
    if (res.type !== 'success') return;

    const idToken =
      (res.params as any)?.id_token ||
      (res as any)?.authentication?.idToken;

    if (!idToken) throw new Error('no_id_token');

    // Exchange Google idToken -> our backend tokens
    const { data } = await http.post('/auth/google', { idToken });
    const { accessToken: a, refreshToken: r } = data as { accessToken: string; refreshToken: string };
    await setTokensInCtx(a, r);
  }, [promptAsync, request, setTokensInCtx]);

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
      googleLogin,
      logout,
      setTokensInCtx,
    }),
    [accessToken, refreshToken, googleLogin, logout, setTokensInCtx]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
