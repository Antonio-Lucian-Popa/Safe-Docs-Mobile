// app/preview/[id].tsx
import { ResizeMode, Video } from 'expo-av';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';


import { documentsApi, fileViewUrl } from '@/api/document';
import type { DocumentResponse } from '@/api/types';
import { useAuth } from '@/context/AuthContext';

export default function PreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { accessToken } = useAuth();

  const [doc, setDoc] = useState<DocumentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const viewUri = useMemo(() => (id ? fileViewUrl(id) : ''), [id]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErr(null);
    try {
      const d = await documentsApi.get(id);
      setDoc(d);
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const mime = doc?.mimeType || '';

  const isImage = mime.startsWith('image/');
  const isPdf = mime === 'application/pdf';
  const isVideo = mime.startsWith('video/');
  const isAudio = mime.startsWith('audio/');

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: doc?.title || 'Preview',
        }}
      />

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator />
          <ThemedText style={{ marginTop: 8 }}>Loading…</ThemedText>
        </View>
      )}

      {!loading && err && (
        <View style={styles.center}>
          <ThemedText type="title" style={{ marginBottom: 8 }}>
            Oops
          </ThemedText>
          <ThemedText>{err}</ThemedText>
        </View>
      )}

      {!loading && !err && doc && (
        <>
          {isImage && (
            <Image
              style={styles.fill}
              contentFit="contain"
              source={{
                uri: viewUri,
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
              }}
              transition={200}
            />
          )}

          {isPdf && (
            <WebView
              style={styles.fill}
              originWhitelist={['*']}
              // iOS & Android can render PDF in WebView when pointing to the URL
              // We pass our auth header so BE allows streaming.
              source={{
                uri: viewUri,
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
              }}
              // Helpful on Android to allow inline PDF zooming:
              allowsFullscreenVideo
              setSupportMultipleWindows={false}
              // Some Android WebViews need this for PDFs to scale well
              scalesPageToFit={Platform.OS === 'android'}
            />
          )}

          {(isVideo || isAudio) && (
            <Video
              style={styles.video}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              source={{
                uri: viewUri,
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
              }}
            />
          )}

          {!isImage && !isPdf && !isVideo && !isAudio && (
            <View style={styles.center}>
              <ThemedText type="title" style={{ marginBottom: 8 }}>
                No inline preview
              </ThemedText>
              <ThemedText>
                This file type cannot be previewed in-app. Try downloading it from the documents list.
              </ThemedText>
            </View>
          )}
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fill: { flex: 1, backgroundColor: 'black' },
  video: { flex: 1, backgroundColor: 'black' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
});
