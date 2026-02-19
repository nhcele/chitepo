import { apiClient } from './client';
import { UserRole } from '@mindelta/shared';

export type DocumentState = 'ACTIVE' | 'ARCHIVED';

export interface DocumentResource {
  id: string;
  tenantId?: string;
  title: string;
  description?: string;
  tags?: string[];
  ownerId?: string;
  department?: string;
  retentionUntil?: string;
  classification?: string;
  version?: number;
  checksum?: string;
  source?: string;
  accessRoles?: UserRole[];
  accessDepartments?: string[];
  fileUrl: string;
  fileKey?: string;
  mimeType?: string;
  sizeBytes?: number;
  state: DocumentState;
  metadata?: Record<string, any>;
  textContent?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ListDocumentsParams {
  q?: string;
  tags?: string[];
  state?: DocumentState;
  department?: string;
}

export interface UploadDocumentInput {
  file: File;
  title: string;
  description?: string;
  tags?: string[];
  department?: string;
  retentionUntil?: string;
  classification?: string;
  accessRoles?: UserRole[];
  accessDepartments?: string[];
  scanIntake?: boolean;
}

export async function listDocuments(params: ListDocumentsParams = {}): Promise<DocumentResource[]> {
  const res = await apiClient.get<{ success: boolean; data: DocumentResource[] }>('/files/documents', {
    params: {
      q: params.q || undefined,
      tags: params.tags && params.tags.length ? params.tags.join(',') : undefined,
      state: params.state,
      department: params.department || undefined,
    },
  });

  return res.data || [];
}

export async function uploadDocument(input: UploadDocumentInput): Promise<DocumentResource> {
  const formData = new FormData();
  formData.append('file', input.file);
  formData.append('title', input.title);

  if (input.description) formData.append('description', input.description);
  if (input.department) formData.append('department', input.department);
  if (input.classification) formData.append('classification', input.classification);
  if (input.retentionUntil) formData.append('retentionUntil', input.retentionUntil);

  if (input.tags) {
    input.tags.filter(Boolean).forEach((tag) => formData.append('tags', tag));
  }

  if (input.accessRoles) {
    input.accessRoles.forEach((role) => formData.append('accessRoles', role));
  }

  if (input.accessDepartments) {
    input.accessDepartments.filter(Boolean).forEach((dept) => formData.append('accessDepartments', dept));
  }

  if (typeof input.scanIntake === 'boolean') {
    formData.append('scanIntake', String(input.scanIntake));
  }

  const res = await apiClient.post<{ success: boolean; data: DocumentResource }>(
    '/files/documents/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return res.data;
}

export async function updateDocument(
  id: string,
  updates: Partial<Pick<DocumentResource, 'title' | 'description' | 'tags' | 'department' | 'classification' | 'retentionUntil' | 'state'>>
): Promise<DocumentResource> {
  const res = await apiClient.patch<{ success: boolean; data: DocumentResource }>(`/files/documents/${id}`, updates);
  return res.data;
}

export async function archiveDocument(id: string): Promise<DocumentResource> {
  const res = await apiClient.post<{ success: boolean; data: DocumentResource }>(`/files/documents/${id}/archive`, {});
  return res.data;
}

export async function reindexDocument(id: string): Promise<DocumentResource> {
  const res = await apiClient.post<{ success: boolean; data: DocumentResource }>(`/files/documents/${id}/reindex`, {});
  return res.data;
}
