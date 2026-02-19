import { useCallback } from 'react';
import { getSignedUrl } from '@/lib/api/files';

const extractKeyFromUrl = (value: string): string => {
  if (!value) return value;
  try {
    const url = new URL(value);
    return url.pathname.replace(/^\/+/, '');
  } catch {
    return value;
  }
};

export function useSignedDownload(courseId?: string) {
  return useCallback(
    async (fileUrlOrKey: string, overrideCourseId?: string) => {
      const key = extractKeyFromUrl(fileUrlOrKey);
      const signedUrl = await getSignedUrl(key, overrideCourseId ?? courseId);
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    },
    [courseId],
  );
}
