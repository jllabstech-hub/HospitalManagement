const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const ALLOWED_FONTS = new Set([
  'Inter',
  'Inter, sans-serif',
  'system-ui',
  'system-ui, sans-serif',
  'Georgia',
  'Georgia, serif',
  'serif',
  'sans-serif',
  'ui-sans-serif',
  'ui-sans-serif, system-ui, sans-serif',
  'var(--font-inter)',
  'var(--font-inter), sans-serif',
]);

export function sanitizeCssColor(value: string | null | undefined, fallback: string): string {
  const candidate = (value || '').trim();
  if (HEX_COLOR.test(candidate)) {
    return candidate.toLowerCase();
  }
  return fallback;
}

export function sanitizeCssFont(value: string | null | undefined, fallback: string): string {
  const candidate = (value || '').trim();
  if (ALLOWED_FONTS.has(candidate)) {
    return candidate;
  }
  return fallback;
}

export function brandingStyleVars(input: {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  fontFamily?: string | null;
}): string {
  const primary = sanitizeCssColor(input.primaryColor, '#0ea5e9');
  const secondary = sanitizeCssColor(input.secondaryColor, '#f43f5e');
  const font = sanitizeCssFont(input.fontFamily, 'var(--font-inter), sans-serif');
  return [
    `:root {`,
    `  --color-brand-500: ${primary};`,
    `  --color-brand-600: ${primary};`,
    `  --color-brand-700: ${primary};`,
    `  --color-accent-500: ${secondary};`,
    `  --font-sans: ${font};`,
    `}`,
  ].join('\n');
}
