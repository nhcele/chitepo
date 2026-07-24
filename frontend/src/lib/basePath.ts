// Prefix a root-absolute app path with the deployment basePath (e.g. /chitepo).
// Next auto-prefixes <Link>, router and next/image, but NOT raw <a href>,
// window.location or fetch(). Use this for those cases.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function withBasePath(path: string): string {
  if (!path.startsWith('/')) path = '/' + path;
  if (BASE_PATH && path.startsWith(BASE_PATH + '/')) return path;
  return BASE_PATH + path;
}
