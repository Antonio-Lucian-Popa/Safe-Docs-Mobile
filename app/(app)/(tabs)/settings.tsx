// app/(app)/(tabs)/settings.tsx
import { useAuth } from '@/context/AuthContext';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function SettingsScreen() {
  const { logout } = useAuth();
  return (
    <View style={styles.c}>
      <Pressable style={styles.btn} onPress={logout}>
        <Text style={styles.btnTxt}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  btn: { backgroundColor: '#ef4444', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  btnTxt: { color: '#fff', fontWeight: '600' },
});
