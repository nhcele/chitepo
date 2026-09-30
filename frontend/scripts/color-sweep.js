const fs = require('fs');
const path = require('path');

const ROOTS = [path.join(__dirname, '..', 'src', 'pages'), path.join(__dirname, '..', 'src', 'components')];

// Neutral families -> design neutrals, keyed by utility prefix
const NEUTRALS = ['gray', 'slate', 'zinc', 'neutral'];
function neutralFor(prefix, shade) {
  const s = parseInt(shade, 10);
  switch (prefix) {
    case 'text':
      if (s >= 700) return 'text-charcoal';
      if (s >= 500) return 'text-stone';
      return 'text-pewter';
    case 'bg':
      if (s <= 50) return 'bg-paper';
      if (s <= 200) return 'bg-forest-100';
      if (s <= 600) return 'bg-stone';
      if (s === 700) return 'bg-ink-800';
      if (s === 800) return 'bg-ink-900';
      return 'bg-ink-950';
    case 'border': return 'border-border/60';
    case 'divide': return 'divide-border/60';
    case 'ring': return 'ring-border';
    case 'placeholder': return 'placeholder-pewter';
    case 'from': return s >= 700 ? 'from-ink-900' : 'from-forest-100';
    case 'via': return s >= 700 ? 'via-ink-800' : 'via-forest-100';
    case 'to': return s >= 700 ? 'to-ink-950' : 'to-forest-100';
    case 'stroke': return 'stroke-pewter';
    case 'fill': return 'fill-pewter';
    case 'decoration': return 'decoration-stone';
    default: return null;
  }
}

// Chromatic families -> brand families (shade preserved)
const FAMILY_MAP = {
  blue: 'forest', indigo: 'forest', sky: 'forest', cyan: 'forest',
  teal: 'forest', emerald: 'forest', green: 'forest', lime: 'forest',
  purple: 'terracotta', violet: 'terracotta', fuchsia: 'terracotta',
  pink: 'terracotta', rose: 'terracotta', red: 'terracotta',
  yellow: 'ochre', amber: 'ochre', orange: 'ochre',
};

// prefix-family-shade pattern; variant prefixes (hover:, focus:, dark:, sm: etc.) pass through untouched
const re = /\b(text|bg|border|divide|ring|placeholder|from|via|to|stroke|fill|decoration)-(gray|slate|zinc|neutral|blue|indigo|sky|cyan|teal|emerald|green|lime|purple|violet|fuchsia|pink|rose|red|yellow|amber|orange)-(\d{2,3})(\b|\/)/g;

function sweep(content) {
  let out = content.replace(re, (m, prefix, family, shade, tail) => {
    if (NEUTRALS.includes(family)) {
      const mapped = neutralFor(prefix, shade);
      return mapped ? mapped + (tail === '/' ? '/' : '') : m;
    }
    return `${prefix}-${FAMILY_MAP[family]}-${shade}${tail === '/' ? '/' : ''}`;
  });

  // Shape: soften radius + shadows toward editorial system
  out = out
    .replace(/\brounded-(3xl|2xl|xl|lg)\b/g, 'rounded-md')
    .replace(/\bshadow-(2xl|xl|lg|md)\b/g, 'shadow-sm');

  return out;
}

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) files.push(full);
  }
  return files;
}

let changed = 0;
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const src = fs.readFileSync(file, 'utf8');
    const next = sweep(src);
    if (next !== src) {
      fs.writeFileSync(file, next);
      changed++;
      console.log('updated', path.relative(process.cwd(), file));
    }
  }
}
console.log(`\n${changed} files updated`);
