import { http } from './http';
import type {
    CreateDocumentRequest,
    DocumentResponse,
    DocumentVersion,
    ExpiringSoon,
} from './types';

export type RNFilePart = { uri: string; name: string; type: string };

export const documentsApi = {
  async create(data: CreateDocumentRequest): Promise<DocumentResponse> {
    const { data: res } = await http.post('/documents', data);
    return res;
  },

  async get(id: string): Promise<DocumentResponse> {
    const { data } = await http.get(`/documents/${id}`);
    return data;
  },

  async uploadFile(
    documentId: string,
    file: RNFilePart
  ): Promise<{ path: string; mime: string; size: number }> {
    const form = new FormData();
    // @ts-ignore — RN acceptă { uri, name, type }
    form.append('file', { uri: file.uri, name: file.name, type: file.type });

    const { data } = await http.post(`/documents/${documentId}/file`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async getVersions(documentId: string): Promise<DocumentVersion[]> {
    const { data } = await http.get(`/documents/${documentId}/versions`);
    return data;
  },

  async addVersion(documentId: string, file: RNFilePart): Promise<DocumentVersion> {
    const form = new FormData();
    // @ts-ignore
    form.append('file', { uri: file.uri, name: file.name, type: file.type });

    const { data } = await http.post(`/documents/${documentId}/versions`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async revertVersion(
    documentId: string,
    versionNo: number
  ): Promise<{ currentPath: string; versionSetTo: number }> {
    const { data } = await http.post(`/documents/${documentId}/versions/${versionNo}/revert`);
    return data;
  },

  async download(documentId: string): Promise<ArrayBuffer> {
    const { data } = await http.get(`/files/${documentId}/download`, {
      responseType: 'arraybuffer',
    });
    return data;
  },

  async search(
    query?: string,
    tagKey?: string,
    tagValue?: string
  ): Promise<DocumentResponse[]> {
    const params: Record<string, string> = {};
    if (query) params.q = query;
    if (tagKey) params.tagKey = tagKey;
    if (tagValue) params.tagValue = tagValue;

    const { data } = await http.get('/documents/search', { params });
    return data;
  },

  async expiringSoon(): Promise<ExpiringSoon[]> {
    const { data } = await http.get('/documents/expiring-soon');
    return data;
  },
};

export { fileThumbnailUrl, fileViewUrl } from './http';

