import Image from 'next/image';

interface CourseCoverProps {
  title: string;
  src?: string;
  sizes?: string;
  className?: string;
}

function hash(input: string): number {
  return Math.abs(input.split('').reduce((acc, ch) => ((acc << 5) - acc + ch.charCodeAt(0)) | 0, 0));
}

function titleLines(title: string): string[] {
  const words = title.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > 26 && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
    if (lines.length === 2) break;
  }
  if (line && lines.length < 3) lines.push(line);
  return lines.slice(0, 3);
}

export default function CourseCover({ title, src, sizes, className = '' }: CourseCoverProps) {
  const isGenerated = !src || src.includes('chitepo-logo');
  const usesLogo = src?.includes('chitepo-logo');

  if (!isGenerated && src) {
    return (
      <Image
        src={src}
        alt={title}
        fill
        className={`${usesLogo ? 'object-contain bg-white p-4' : 'object-cover'} ${className}`}
        sizes={sizes}
        unoptimized={src.startsWith('/api/')}
      />
    );
  }

  const palettes = [
    ['#0f5132', '#0b1f17', '#d99a21'],
    ['#155e38', '#111111', '#b9432f'],
    ['#234f1e', '#111111', '#e4b33d'],
    ['#0b3d2e', '#1f2933', '#d6a02f'],
  ];
  const [primary, dark, accent] = palettes[hash(title) % palettes.length];
  const lines = titleLines(title);

  return (
    <div
      className={`absolute inset-0 overflow-hidden ${className}`}
      style={{ background: `linear-gradient(135deg, ${primary}, ${dark})` }}
      aria-label={title}
      role="img"
    >
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,.5) 1px, transparent 1px)',
          backgroundSize: '42px 42px',
        }}
      />
      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-80" style={{ backgroundColor: accent }} />
      <div className="absolute bottom-0 left-0 right-0 h-24 opacity-90" style={{ backgroundColor: accent, clipPath: 'polygon(0 55%, 100% 0, 100% 100%, 0 100%)' }} />
      <div className="absolute inset-0 flex flex-col justify-center px-7">
        <div className="mb-4 h-1.5 w-16" style={{ backgroundColor: accent }} />
        <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-white/85">
          Chitepo School
        </div>
        <div className="space-y-1">
          {lines.map((line) => (
            <div key={line} className="font-serif text-xl font-bold leading-tight text-white sm:text-2xl">
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
