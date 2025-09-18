import { useAuth } from '@/context/AuthContext';
import { AntDesign } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

export default function LoginScreen() {
  const { googleLogin } = useAuth();
  const [loading, setLoading] = useState(false);

  const onGoogle = async () => {
    try {
      setLoading(true);
      await googleLogin();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.container}>
      <View style={s.card}>
        {/* <Image source={require('@/assets/icon.png')} style={{ width: 72, height: 72, borderRadius: 16 }} /> */}
        <Text style={s.title}>SafeDocs</Text>
        <Text style={s.subtitle}>Securely store, scan and share your documents.</Text>

        <Pressable style={s.googleBtn} onPress={onGoogle} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <AntDesign name="google" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={s.googleText}>Continue with Google</Text>
            </>
          )}
        </Pressable>

        <Text style={s.terms}>By continuing, you agree to our Terms & Privacy.</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1020', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 420, backgroundColor: '#121833', borderRadius: 20, padding: 24, alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#1f2747' },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginTop: 8 },
  subtitle: { textAlign: 'center', color: '#9fb0ff' },
  googleBtn: { marginTop: 8, width: '100%', backgroundColor: '#3366FF', paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  googleText: { color: '#fff', fontWeight: '600' },
  terms: { color: '#7f8bb3', fontSize: 12, marginTop: 6, textAlign: 'center' },
});
