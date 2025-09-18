// app/(auth)/login.tsx
import { http } from '@/api/http';
import { useAuth } from '@/context/AuthContext';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

WebBrowser.maybeCompleteAuthSession(); // IMPORTANT: pune asta și în entry-ul global (_layout/index)

export default function LoginScreen() {
  const { setTokensInCtx } = useAuth(); // definește în AuthContext: setTokens({ access, refresh })
  const extra = Constants.expoConfig?.extra ?? {};
  const [authing, setAuthing] = useState(false);

  // inițializează “request”-ul Google
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    androidClientId: extra.google.GOOGLE_CLIENT_ID_ANDROID,
    iosClientId: extra.google.GOOGLE_CLIENT_ID_IOS,
    // redirectUri se deduce automat când ai "scheme" în app.json; dacă vrei explicit:
    // redirectUri: makeRedirectUri({ scheme: 'safedocs' }),
  });

  // când Google răspunde, trimite idToken la backendul tău
  useEffect(() => {
    (async () => {
      if (response?.type !== 'success') return;
      const idToken = response.params?.id_token;
      if (!idToken) return;

      try {
        const { data } = await http.post('/auth/google', { idToken });
        // backendul tău răspunde cu: { accessToken, refreshToken }
        setTokensInCtx(data.accessToken, data.refreshToken);
      } catch (err) {
        console.error('Auth /auth/google failed', err);
      } finally {
        setAuthing(false);
      }
    })();
  }, [response, setTokensInCtx]);

  const onGooglePress = useCallback(async () => {
    // NU porni dacă request nu e pregătit sau deja rulează
    if (!request || authing) return;

    try {
      setAuthing(true);
      // Pentru Expo Go, uneori ajută proxy-ul:
      await promptAsync({ showInRecents: true });
    } catch (e) {
      console.error('promptAsync error', e);
      setAuthing(false);
    }
  }, [request, promptAsync, authing]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>SafeDocs</Text>

      <Pressable
        onPress={onGooglePress}
        disabled={!request || authing}
        style={({ pressed }) => [
          styles.googleBtn,
          (!request || authing) && { opacity: 0.6 },
          pressed && { opacity: 0.8 },
        ]}
      >
        {authing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.googleTxt}>Continue with Google</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 24 },
  googleBtn: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 260,
  },
  googleTxt: { color: '#fff', fontWeight: '600' },
});
