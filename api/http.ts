import axios, { AxiosError } from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

export const API_BASE_URL =
  (Constants.expoConfig?.extra as any)?.apiBaseUrl || 'http://localhost:8080';

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshingPromise: Promise<void> | null = null;

export function setTokens(access: string | null, refresh: string | null) {
  accessToken = access;
  refreshToken = refresh;
  if (access) {
    http.defaults.headers.common.Authorization = `Bearer ${access}`;
  } else {
    delete http.defaults.headers.common.Authorization;
  }
}

export async function login(email: string, password: string) {
  const { data } = await http.post('/auth/login', { email, password });
  return data as { accessToken: string; refreshToken: string };
}

export async function register(email: string, password: string, displayName?: string) {
  const { data } = await http.post('/auth/register', { email, password, displayName });
  return data as { accessToken: string; refreshToken: string };
}

export async function loadTokensFromStore() {
  const a = await SecureStore.getItemAsync('access_token');
  const r = await SecureStore.getItemAsync('refresh_token');
  setTokens(a, r);
}

async function saveTokens(a: string, r: string) {
  await SecureStore.setItemAsync('access_token', a);
  await SecureStore.setItemAsync('refresh_token', r);
  setTokens(a, r);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync('access_token');
  await SecureStore.deleteItemAsync('refresh_token');
  setTokens(null, null);
}

// Interceptor 401 → /auth/refresh
http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original: any = error.config;
    if (
      error.response?.status === 401 &&
      !original?._retry &&
      refreshToken // avem refresh
    ) {
      original._retry = true;
      if (!refreshingPromise) {
        refreshingPromise = (async () => {
          try {
            const { data } = await http.post('/auth/refresh', { refreshToken });
            const { accessToken: newA, refreshToken: newR } = data;
            await saveTokens(newA, newR);
          } finally {
            refreshingPromise = null;
          }
        })();
      }
      await refreshingPromise;
      return http(original);
    }
    return Promise.reject(error);
  }
);

// Helpers URL media
export const fileViewUrl = (id: string) => `${API_BASE_URL}/files/${id}/view`;
export const fileThumbnailUrl = (id: string, w = 600, h = 400) =>
  `${API_BASE_URL}/files/${id}/thumbnail?w=${w}&h=${h}`;

// Export pentru AuthContext
export const tokenStore = { saveTokens, clearTokens, loadTokensFromStore };
