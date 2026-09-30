import { withBasePath } from './basePath';

export function getCourseCoverImage(
  title: string,
  coverImageUrl?: string,
): string {
  const placeholder = withBasePath('/chitepo-logo.jpg');
  if (!coverImageUrl || coverImageUrl.trim().length === 0) return placeholder;
  const url = coverImageUrl.trim();
  if (url.startsWith('/images/courses/') || url.startsWith('images/courses/')) {
    return placeholder;
  }
  return url.includes('chitepo-logo') ? withBasePath('/chitepo-logo.jpg') : url;
}
