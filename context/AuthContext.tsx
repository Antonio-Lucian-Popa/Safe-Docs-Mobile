import { clearTokens as clearAll, http, setTokens, tokenStore } from '@/api/http';
import { makeRedirectUri } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

WebBrowser.maybeCompleteAuthSession();

type AuthCtx = {
  accessToken: string | null;
  refreshToken: string | null;
  googleLogin: () => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  accessToken: null,
  refreshToken: null,
  googleLogin: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  // restore
  useEffect(() => {
    (async () => {
      await tokenStore.loadTokensFromStore();
      const a = await SecureStore.getItemAsync('access_token');
      const r = await SecureStore.getItemAsync('refresh_token');
      setAccessToken(a);
      setRefreshToken(r);
    })();
  }, []);

  const extra = (Constants.expoConfig?.extra as any)?.google || {};
  const redirectUri = makeRedirectUri({}); // dev-friendly

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: extra.expoClientId,
    iosClientId: extra.iosClientId,
    androidClientId: extra.androidClientId,
    webClientId: extra.webClientId,
    scopes: ['profile', 'email'],
    responseType: 'id_token',
    redirectUri,
  });

  const googleLogin = async () => {
    // deschide fluxul
    const res = await promptAsync();
    if (res.type !== 'success') return;

    // id_token din răspuns
    const idToken =
      (res.params as any)?.id_token ||
      (res as any)?.authentication?.idToken;

    if (!idToken) throw new Error('no_id_token');

    // trimite la BE /auth/google
    const { data } = await http.post('/auth/google', { idToken });
    const { accessToken: a, refreshToken: r } = data as { accessToken: string; refreshToken: string };
    await SecureStore.setItemAsync('access_token', a);
    await SecureStore.setItemAsync('refresh_token', r);
    setTokens(a, r);
    setAccessToken(a);
    setRefreshToken(r);
  };

  const logout = async () => {
    try {
      const rt = await SecureStore.getItemAsync('refresh_token');
      if (rt) {
        await http.post('/auth/logout', { refreshToken: rt });
      }
    } catch {}
    await clearAll();
    setAccessToken(null);
    setRefreshToken(null);
  };

  const value = useMemo(
    () => ({ accessToken, refreshToken, googleLogin, logout }),
    [accessToken, refreshToken]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
