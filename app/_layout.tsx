import { Redirect, Slot, usePathname } from 'expo-router';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};


function Gate() {
  const { accessToken } = useAuth();
  const path = usePathname();
  const onAuthRoute = path?.startsWith('/login');

  if (!accessToken && !onAuthRoute) return <Redirect href="/login" />;
  if (accessToken && onAuthRoute) return <Redirect href="/(tabs)" />;

  return <Slot />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    // <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
    //   <Stack>
    //     <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    //     <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    //   </Stack>
    //   <StatusBar style="auto" />
    // </ThemeProvider>
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
