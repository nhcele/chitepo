import { apiClient } from './client';

export interface VideoUploadResponse {
  fileUrl: string;
  jobId: string;
}

export async function uploadVideo(file: File): Promise<VideoUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  return apiClient.post<VideoUploadResponse>('/files/upload/video', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 300000, // 5 minutes for large video files
  });
}

export async function uploadFile(file: File, folder?: string): Promise<{ fileUrl: string }> {
  const formData = new FormData();
  formData.append('file', file);
  if (folder) {
    formData.append('folder', folder);
  }

  return apiClient.post<{ fileUrl: string }>('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export async function getSignedUrl(key: string, courseId?: string): Promise<string> {
  const encodedKey = encodeURIComponent(key);
  const res = await apiClient.get<{ signedUrl: string }>(`/files/signed-url/${encodedKey}`, {
    params: {
      courseId: courseId || undefined,
    },
  });
  return res.signedUrl;
}
