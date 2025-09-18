// app/(tabs)/index.tsx
import { formatDistanceToNow } from 'date-fns';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';


import { documentsApi } from '@/api/document';
import { fileThumbnailUrl } from '@/api/http';
import type { DocumentResponse } from '@/api/types';
import { useAuth } from '@/context/AuthContext';

// --- CARD pentru un document (thumbnail + titlu + meta)
function DocCard({
  doc,
  accessToken,
  onPress,
}: {
  doc: DocumentResponse;
  accessToken: string | null;
  onPress: (doc: DocumentResponse) => void;
}) {
  const thumbUri = useMemo(() => fileThumbnailUrl(doc.id, 600, 400), [doc.id]);

  return (
    <Pressable style={styles.card} onPress={() => onPress(doc)}>
      {/* <Image
        source={{
          uri: thumbUri,
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        }}
        contentFit="cover"
        transition={200}
        placeholder={require('@/assets/images/placeholder.png')}
        style={styles.thumb}
      /> */}

      <View style={styles.cardBody}>
        <ThemedText numberOfLines={1} style={styles.title}>
          {doc.title}
        </ThemedText>

        <View style={styles.metaRow}>
          {!!doc.fileSize && (
            <ThemedText type="default" style={styles.meta}>
              {formatBytes(doc.fileSize)}
            </ThemedText>
          )}
          {!!doc.createdAt && <ThemedText type="default" style={styles.metaDot}>•</ThemedText>}
          {!!doc.createdAt && (
            <ThemedText type="default" style={styles.meta}>
              {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
            </ThemedText>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { accessToken } = useAuth();
  const router = useRouter();

  const [docs, setDocs] = useState<DocumentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await documentsApi.search(); // "ultimele 50" din BE
      setDocs(res);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await documentsApi.search();
      setDocs(res);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const onOpenDoc = useCallback((doc: DocumentResponse) => {
    router.push(`/preview/${doc.id}`); // creezi app/preview/[id].tsx
  }, [router]);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingBox}>
          <ActivityIndicator />
          <ThemedText style={{ marginTop: 8 }}>Loading documents…</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (docs.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.emptyBox}>
          {/* <Image
            source={require('@/assets/images/placeholder.png')}
            style={{ width: 120, height: 120, marginBottom: 12, opacity: 0.5 }}
          /> */}
          <ThemedText type="title" style={{ marginBottom: 4 }}>
            No documents yet
          </ThemedText>
          <ThemedText type="default" style={{ textAlign: 'center', opacity: 0.7 }}>
            Upload or scan your first document to get started.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={docs}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => (
          <DocCard doc={item} accessToken={accessToken} onPress={onOpenDoc} />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </ThemedView>
  );
}

/* helpers */
function formatBytes(bytes: number) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(1)} ${units[i]}`;
}

/* styles */
const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },

  card: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 14,
    overflow: 'hidden',
  },
  thumb: {
    width: '100%',
    aspectRatio: 3 / 2, // 600x400
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  cardBody: { padding: 10, gap: 4 },
  title: { fontSize: 14, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  meta: { fontSize: 12, opacity: 0.7 },
  metaDot: { fontSize: 12, opacity: 0.4 },
});
