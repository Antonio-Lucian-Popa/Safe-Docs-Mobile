import * as DocumentPicker from 'expo-document-picker';
import * as Print from 'expo-print';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Image as RNImage,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DocumentScanner from 'react-native-document-scanner-plugin';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RNFilePart } from '@/api/document';
import { documentsApi } from '@/api/document';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ScannedImg = { uri: string; width?: number; height?: number };

export default function AddDocScreen() {
  const scheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [pages, setPages] = useState<ScannedImg[]>([]);
  const [uploading, setUploading] = useState(false);

  const ui = useMemo(() => {
    const dark = scheme === 'dark';
    return {
      bg: dark ? '#0F1114' : '#F7F7F8',
      card: dark ? '#17191D' : '#FFFFFF',
      border: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      txt: dark ? '#E6E7EB' : '#111827',
      sub: dark ? '#9AA0A6' : '#6B7280',
      primary: dark ? '#8AB4F8' : '#2563EB',
      btnBg: dark ? '#1C2127' : '#F3F4F6',
      shadow: dark ? '#00000066' : '#0000001A',
    };
  }, [scheme]);

  const onScan = useCallback(async () => {
    try {
      const { scannedImages } = await DocumentScanner.scanDocument();
      if (!scannedImages?.length) return;
      setPages(scannedImages.map((uri: string) => ({ uri })));
      if (!title) setTitle('Scan');
    } catch (e) {
      console.warn('scan error', e);
      Alert.alert('Scan failed', 'Please try again.');
    }
  }, [title]);

  const onPickFile = useCallback(async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;
      const file = res.assets[0];

      if (file.mimeType?.startsWith('image/')) {
        setPages([{ uri: file.uri }]);
        if (!title) setTitle(trimName(file.name || 'Image'));
      } else {
        await uploadSingleFile({
          uri: file.uri,
          name: file.name ?? 'document.pdf',
          type: file.mimeType ?? 'application/pdf',
        });
      }
    } catch (e) {
      console.warn('pick error', e);
      Alert.alert('Could not pick file');
    }
  }, [title]);

  const buildPdfFromImages = useCallback(async (imgs: ScannedImg[]) => {
    const html = `
      <html><head><meta charset="utf-8" />
      <style>
        body { margin:0; padding:0; }
        .page { page-break-after: always; display:flex; align-items:center; justify-content:center; }
        img { width:100%; height:auto; }
      </style></head>
      <body>${imgs.map(i => `<div class="page"><img src="${i.uri}" /></div>`).join('')}</body>
      </html>`;
    const { uri } = await Print.printToFileAsync({ html });
    return uri; // file://...pdf
  }, []);

  const uploadSingleFile = useCallback(
    async (file: RNFilePart) => {
      setUploading(true);
      try {
        const name = title?.trim() || defaultTitleFromFile(file.name);
        const created = await documentsApi.create({ title: name });
        await documentsApi.uploadFile(created.id, file);
        Alert.alert('Uploaded', 'Document saved successfully.');
        setPages([]);
        setTitle('');
      } catch (e: any) {
        console.error('upload error', e?.response?.data || e?.message);
        Alert.alert('Upload failed', 'Please try again.');
      } finally {
        setUploading(false);
      }
    },
    [title]
  );

  const onSave = useCallback(async () => {
    if (pages.length === 0) {
      Alert.alert('Nothing to upload', 'Scan or choose a file first.');
      return;
    }
    try {
      if (pages.length === 1) {
        const one = pages[0];
        const name = (title?.trim() || 'Scan') + guessExt(one.uri);
        await uploadSingleFile({ uri: one.uri, name, type: guessMime(one.uri) });
      } else {
        const pdfUri = await buildPdfFromImages(pages);
        const name = (title?.trim() || 'Scan') + '.pdf';
        await uploadSingleFile({ uri: pdfUri, name, type: 'application/pdf' });
      }
    } catch (e) {
      console.warn('save error', e);
      Alert.alert('Could not save');
    }
  }, [pages, title, buildPdfFromImages, uploadSingleFile]);

  const onClear = useCallback(() => {
    setPages([]);
    setTitle('');
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: ui.bg }]} edges={['top', 'bottom']}>
      <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: ui.card,
              borderColor: ui.border,
              shadowColor: ui.shadow,
            },
          ]}
        >
          <Text style={[styles.heading, { color: ui.txt }]}>New document</Text>

          <Text style={[styles.label, { color: ui.sub }]}>Title</Text>
          <TextInput
            placeholder="e.g. Contract, ID card"
            placeholderTextColor={ui.sub}
            value={title}
            onChangeText={setTitle}
            style={[
              styles.input,
              {
                color: ui.txt,
                borderColor: ui.border,
                backgroundColor: scheme === 'dark' ? '#0E1013' : '#FFFFFF',
              },
            ]}
          />

          <View style={styles.row}>
            <ActionButton label="Scan" onPress={onScan} color={ui.primary} />
            <ActionButton label="Pick file" onPress={onPickFile} />
            {pages.length > 0 && <ActionButton label="Clear" onPress={onClear} />}
          </View>

          {pages.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: ui.txt }]}>
                Preview ({pages.length} {pages.length === 1 ? 'page' : 'pages'})
              </Text>
              <View style={styles.grid}>
                {pages.map((p, idx) => (
                  <View key={p.uri + idx} style={[styles.thumbBox, { borderColor: ui.border }]}>
                    <RNImage source={{ uri: p.uri }} style={styles.thumb} />
                    <Text style={[styles.thumbIdx, { color: ui.sub }]}>#{idx + 1}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <Pressable
            onPress={onSave}
            disabled={uploading || pages.length === 0}
            style={({ pressed }) => [
              styles.primaryBtn,
              {
                backgroundColor: ui.primary,
                opacity: uploading || pages.length === 0 ? 0.6 : pressed ? 0.9 : 1,
              },
            ]}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryTxt}>
                {pages.length <= 1 ? 'Upload Image' : 'Create PDF & Upload'}
              </Text>
            )}
          </Pressable>
        </View>

        <Text style={[styles.hint, { color: ui.sub }]}>
          If you scan multiple pages, we’ll automatically build a PDF.
        </Text>
      </View>
    </SafeAreaView>
  );
}

/* — helpers — */
function guessExt(uri: string) {
  const u = uri.toLowerCase();
  if (u.endsWith('.png')) return '.png';
  return '.jpg';
}
function guessMime(uri: string) {
  const u = uri.toLowerCase();
  if (u.endsWith('.png')) return 'image/png';
  return 'image/jpeg';
}
function defaultTitleFromFile(name: string) {
  return trimName(name.replace(/\.(pdf|jpg|jpeg|png)$/i, ''));
}
function trimName(s?: string) {
  return (s || '').trim().replace(/\s+/g, ' ').slice(0, 80);
}

/* — UI — */
function ActionButton({
  label,
  onPress,
  color,
}: {
  label: string;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionBtn,
        pressed && { opacity: 0.85 },
        color ? { borderColor: color } : null,
      ]}
    >
      <Text style={[styles.actionTxt, color ? { color } : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  wrap: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 2,
  },
  heading: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  row: { flexDirection: 'row', gap: 10, marginTop: 6 },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  actionTxt: { fontWeight: '700' },
  sectionTitle: { marginTop: 8, fontSize: 16, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  thumbBox: {
    width: '31%',
    aspectRatio: 3 / 4,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  thumb: { width: '100%', height: '100%' },
  thumbIdx: { position: 'absolute', bottom: 6, right: 8, fontSize: 12, fontWeight: '600' },
  primaryBtn: {
    marginTop: 10,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryTxt: { color: '#fff', fontWeight: '700' },
  hint: { textAlign: 'center', marginTop: 12, fontSize: 12 },
});
