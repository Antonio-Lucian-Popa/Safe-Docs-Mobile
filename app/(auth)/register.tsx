import { http } from '@/api/http';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function RegisterScreen() {
  const { setTokensInCtx } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onRegister = useCallback(async () => {
    if (!displayName || !email || !password) {
      Alert.alert('Completează câmpurile', 'Nume, email și parolă sunt obligatorii.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Parole diferite', 'Parola și confirmarea nu coincid.');
      return;
    }
    setSubmitting(true);
    try {
      // adaptează payload-ul la BE-ul tău
      const { data } = await http.post('/auth/register', { displayName, email, password });
      // dacă backend-ul tău NU returnează token-uri aici, înlocuiește cu `router.replace('/(auth)/login')`
      if (data?.accessToken && data?.refreshToken) {
        await setTokensInCtx(data.accessToken, data.refreshToken);
        router.replace('/');
      } else {
        Alert.alert('Account created', 'You can sign in now.');
        router.replace('/(auth)/login');

      }
    } catch (err: any) {
      console.error('/auth/register failed', err?.response?.data || err?.message);
      Alert.alert('Register failed', err?.response?.data?.message ?? 'Încearcă din nou.');
    } finally {
      setSubmitting(false);
    }
  }, [displayName, email, password, confirm, setTokensInCtx]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Create account</Text>

      <TextInput
        placeholder="Full name"
        style={styles.input}
        value={displayName}
        onChangeText={setDisplayName}
      />
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        placeholder="Confirm password"
        secureTextEntry
        style={styles.input}
        value={confirm}
        onChangeText={setConfirm}
      />

      <Pressable
        onPress={onRegister}
        disabled={submitting}
        style={({ pressed }) => [styles.primaryBtn, submitting && { opacity: 0.6 }, pressed && { opacity: 0.85 }]}
      >
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryTxt}>Create account</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  input: {
    width: '100%', maxWidth: 380,
    height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb',
    paddingHorizontal: 14, backgroundColor: '#fff',
  },
  primaryBtn: {
    width: '100%', maxWidth: 380, height: 48, borderRadius: 12,
    backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center',
  },
  primaryTxt: { color: '#fff', fontWeight: '600' },
});
