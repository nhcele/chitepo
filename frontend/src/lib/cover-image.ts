export function getCourseCoverImage(
  title: string,
  coverImageUrl?: string
): string {
  const placeholder = `/api/placeholder/400/225?t=${encodeURIComponent(title || 'Course')}`;

  if (!coverImageUrl || coverImageUrl.trim().length === 0) return placeholder;

  const url = coverImageUrl.trim();

  // If the provided URL points to missing local course images, fallback to generated placeholder
  if (url.startsWith('/images/courses/') || url.startsWith('images/courses/')) {
    return placeholder;
  }

  return url;
}
