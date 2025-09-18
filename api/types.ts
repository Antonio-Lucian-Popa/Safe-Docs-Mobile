export type DocumentResponse = {
  id: string;
  title: string;
  folderId?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  expiresAt?: string | null;
  createdAt?: string | null;
  tags?: Record<string, unknown>;
};

export type DocumentVersion = {
  versionNo: number;
  filePath: string;
  mimeType?: string | null;
  fileSize?: number | null;
  createdAt: string;
};

export type CreateDocumentRequest = {
  title: string;
  folderId?: string | null;
  expiresAt?: string | null;
  tags?: Record<string, unknown>;
};

export type ExpiringSoon = {
  documentId: string;
  title: string;
  expiresAt: string;
  daysLeft: number;
};
