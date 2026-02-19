import type { NextApiRequest, NextApiResponse } from 'next';

function toNumber(value: string | string[] | undefined, fallback: number): number {
  if (!value) return fallback;
  const v = Array.isArray(value) ? value[0] : value;
  const n = parseInt(v as string, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function sanitize(input: string): string {
  return input.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case '\'': return '&#39;';
      default: return ch;
    }
  });
}

function truncate(input: string, maxLen: number): string {
  return input.length > maxLen ? input.slice(0, maxLen - 1) + '…' : input;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { width, height, t } = req.query;

  const w = Math.max(1, toNumber(width, 400));
  const h = Math.max(1, toNumber(height, 225));
  const title = typeof t === 'string' ? t : '';

  const bg1 = '#0f172a'; // slate-900
  const bg2 = '#2563eb'; // blue-600
  const accent = '#f59e0b'; // amber-500
  const radius = Math.min(w, h) * 0.08;

  const label = title ? truncate(title, 50) : '';
  const labelSize = Math.max(12, Math.round(h * 0.12));
  const brandSize = Math.max(16, Math.round(h * 0.18));

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${sanitize(label || 'Chitepo Course')}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg1}" />
      <stop offset="100%" stop-color="${bg2}" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${w}" height="${h}" rx="${radius}" ry="${radius}" fill="url(#bg)" />
  <g opacity="0.14" fill="${accent}">
    <circle cx="${(w * 0.85).toFixed(2)}" cy="${(h * 0.25).toFixed(2)}" r="${(Math.min(w, h) * 0.35).toFixed(2)}" />
    <circle cx="${(w * 0.2).toFixed(2)}" cy="${(h * 0.85).toFixed(2)}" r="${(Math.min(w, h) * 0.2).toFixed(2)}" />
  </g>
  <g>
    <text x="${w / 2}" y="${(h * 0.46).toFixed(2)}" text-anchor="middle" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="${brandSize}" fill="#ffffff" font-weight="700">Chitepo</text>
    ${label ? `<text x="${w / 2}" y="${(h * 0.73).toFixed(2)}" text-anchor="middle" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="${labelSize}" fill="#e5e7eb" font-weight="500">${sanitize(label)}</text>` : ''}
  </g>
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=86400');
  res.status(200).send(svg);
}
