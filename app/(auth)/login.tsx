import { http } from '@/api/http';
import { useAuth } from '@/context/AuthContext';
import { makeRedirectUri } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { Link, router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { setTokensInCtx } = useAuth();
  const extra = (Constants.expoConfig?.extra as any) ?? {};

  // ------ state email/parolă
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ------ Google
  const [authing, setAuthing] = useState(false);
  const redirectUri = makeRedirectUri({ scheme: 'safedocsmobile' });

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: extra.google?.GOOGLE_CLIENT_ID_IOS,
    androidClientId: extra.google?.GOOGLE_CLIENT_ID_ANDROID,
    clientId: extra.google?.expoClientId,   // fallback pt. Expo Go
    redirectUri,
  });

  useEffect(() => {
    (async () => {
      if (response?.type !== 'success') return;
      const idToken = response.params?.id_token;
      if (!idToken) return;

      try {
        const { data } = await http.post('/auth/google', { idToken });
        await setTokensInCtx(data.accessToken, data.refreshToken);
        router.replace('/'); // intră în app
      } catch (err: any) {
        console.error('Auth /auth/google failed', err?.response?.data || err?.message);
        Alert.alert('Login failed', 'Google authentication failed.');
      } finally {
        setAuthing(false);
      }
    })();
  }, [response, setTokensInCtx]);

  const onGooglePress = useCallback(async () => {
    if (!request || authing) return;
    try {
      setAuthing(true);
      await (promptAsync as any)({ useProxy: true, showInRecents: true });
    } catch (e) {
      console.error('promptAsync error', e);
      setAuthing(false);
    }
  }, [request, promptAsync, authing]);

  // ------ login clasic
  const onEmailLogin = useCallback(async () => {
    if (!email || !password) {
      Alert.alert('Completează câmpurile', 'Email și parolă sunt obligatorii.');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await http.post('/auth/login', { email, password });
      await setTokensInCtx(data.accessToken, data.refreshToken);
      router.replace('/');
    } catch (err: any) {
      console.error('/auth/login failed', err?.response?.data || err?.message);
      Alert.alert('Login failed', err?.response?.data?.message ?? 'Verifică email/parola.');
    } finally {
      setSubmitting(false);
    }
  }, [email, password, setTokensInCtx]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>SafeDocs</Text>

      {/* Email */}
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />
      {/* Parolă */}
      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      <Pressable
        onPress={onEmailLogin}
        disabled={submitting}
        style={({ pressed }) => [styles.primaryBtn, submitting && { opacity: 0.6 }, pressed && { opacity: 0.85 }]}
      >
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryTxt}>Sign in</Text>}
      </Pressable>

      <View style={{ height: 16 }} />

      <Pressable
        onPress={onGooglePress}
        disabled={!request || authing}
        style={({ pressed }) => [styles.googleBtn, (!request || authing) && { opacity: 0.6 }, pressed && { opacity: 0.85 }]}
      >
        {authing ? <ActivityIndicator color="#fff" /> : <Text style={styles.googleTxt}>Continue with Google</Text>}
      </Pressable>

      <View style={{ height: 16 }} />
      <Text style={{ opacity: 0.7 }}>
        New here? <Link href="/(auth)/register" style={styles.link}>Create an account</Link>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  input: {
    width: '100%',
    maxWidth: 380,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    backgroundColor: '#fff',
  },
  primaryBtn: {
    width: '100%', maxWidth: 380, height: 48, borderRadius: 12,
    backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center',
  },
  primaryTxt: { color: '#fff', fontWeight: '600' },
  googleBtn: {
    width: '100%', maxWidth: 380, height: 48, borderRadius: 12,
    backgroundColor: '#1a73e8', justifyContent: 'center', alignItems: 'center',
  },
  googleTxt: { color: '#fff', fontWeight: '600' },
  link: { color: '#1a73e8', fontWeight: '600' },
});
