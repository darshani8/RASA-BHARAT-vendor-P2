import type { CSSProperties } from 'react';

// The dc-runtime templates carried full CSS strings in `style="…"`. To port the
// markup 1:1 without hand-translating every declaration (and risking drift), we
// parse those exact strings into a React style object. Standard props are
// camelCased; CSS custom properties (--x) are passed through untouched, which
// React supports. Values never contain ';' or ':' in this design, so a simple
// split is safe.
export function css(text: string): CSSProperties {
  const out: Record<string, string> = {};
  for (const decl of text.split(';')) {
    const i = decl.indexOf(':');
    if (i === -1) continue;
    const prop = decl.slice(0, i).trim();
    const val = decl.slice(i + 1).trim();
    if (!prop) continue;
    const key = prop.startsWith('--') ? prop : prop.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase());
    out[key] = val;
  }
  return out as CSSProperties;
}
