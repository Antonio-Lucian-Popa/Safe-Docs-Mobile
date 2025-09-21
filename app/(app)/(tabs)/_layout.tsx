// app/(app)/(tabs)/_layout.tsx
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AntDesign } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const scheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const ui = useMemo(() => {
    const isDark = scheme === 'dark';

    return {
      active: isDark ? '#8AB4F8' : '#2563EB',      // albastru soft în dark, albastru brand în light
      inactive: isDark ? '#A1A1AA' : '#94A3B8',    // gri-uri echilibrate
      bg: isDark ? 'rgba(16,16,16,0.92)' : 'rgba(255,255,255,0.92)',
      border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      // înălțime + padding în funcție de safe area
      height: 58 + insets.bottom,
      padBottom: Math.max(insets.bottom - 2, 8),
    };
  }, [scheme, insets.bottom]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: ui.active,
        tabBarInactiveTintColor: ui.inactive,
        tabBarButton: HapticTab,

        // Stil minimalist + respectă safe area pe iOS/Android
        tabBarStyle: [
          styles.tabBar,
          {
            height: ui.height,
            paddingBottom: ui.padBottom,
            // shadow/elevation “soft”
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOpacity: scheme === 'dark' ? 0.35 : 0.08,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: -4 },
              },
              android: { elevation: 12 },
            }),
          },
        ],

        // fundalul barei (full-width), cu border hairline
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: ui.bg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: ui.border }]} />
        ),

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <IconSymbol size={size ?? 26} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="add-doc"
        options={{
          title: 'Add Doc',
          tabBarIcon: ({ color, size }) => <AntDesign name="file" size={size ?? 26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <AntDesign name="setting" size={size ?? 26} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    // păstrăm full-width (stabil, fără “floating” margins)
    paddingTop: 8,
  },
});
