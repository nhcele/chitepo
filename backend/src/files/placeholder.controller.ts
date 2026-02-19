import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';

function toNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const n = parseInt(value, 10);
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

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= maxCharsPerLine) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  
  return lines.slice(0, 2);
}

@Controller('placeholder')
export class PlaceholderController {
  @Get(':width/:height')
  getPlaceholder(
    @Param('width') width: string,
    @Param('height') height: string,
    @Query('t') t: string | undefined,
    @Res() res: Response,
  ) {
    const w = Math.max(1, toNumber(width, 400));
    const h = Math.max(1, toNumber(height, 225));
    const title = typeof t === 'string' ? t : '';

    const bg1 = '#0f172a'; // slate-900
    const bg2 = '#2563eb'; // blue-600
    const accent = '#f59e0b'; // amber-500
    const radius = Math.min(w, h) * 0.08;

    const baseLabelSize = Math.max(11, Math.round(h * 0.11));
    const avgCharWidth = baseLabelSize * 0.6;
    const maxWidth = w * 0.85;
    const maxCharsPerLine = Math.floor(maxWidth / avgCharWidth);
    const lines = title ? wrapText(title, maxCharsPerLine) : [];
    
    const labelSize = lines.length > 1 ? Math.max(10, baseLabelSize - 2) : baseLabelSize;
    const brandSize = Math.max(16, Math.round(h * 0.18));
    const lineHeight = labelSize * 1.3;

    const textStartY = lines.length > 1 ? h * 0.66 : h * 0.73;

    const textElements = lines.map((line, index) => {
      const yPos = textStartY + (index * lineHeight);
      return `<text x="${w / 2}" y="${yPos.toFixed(2)}" text-anchor="middle" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="${labelSize}" fill="#e5e7eb" font-weight="500">${sanitize(line)}</text>`;
    }).join('\n    ');

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${sanitize(title || 'Chitepo Course')}">
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
    ${textElements}
  </g>
</svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=86400');
    return res.status(200).send(svg);
  }
}
