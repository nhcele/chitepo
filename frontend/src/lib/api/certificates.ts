import { apiClient } from './client';

export interface CertificateDTO {
  id: string;
  userId: string;
  courseId: string;
  serial: string;
  finalScore: number;
  skillsTags?: string[] | null;
  issuedAt: string;
  course?: { id: string; title: string };
}

export async function listMyCertificates(): Promise<CertificateDTO[]> {
  // Backend returns an array of certificates (possibly with {success,data}); handle both
  const res = await apiClient.get<any>('/api/certificates/me');
  return Array.isArray(res) ? res : res?.data ?? [];
}

export async function downloadCertificate(id: string): Promise<void> {
  const blob = await apiClient.get<Blob>(`/api/certificates/${id}/download`, {
    // @ts-ignore allow axios responseType passthrough
    responseType: 'blob',
  } as any);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `certificate-${id}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
