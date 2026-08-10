/**
 * Merges CSS class names helper
 */
export function cn(...classes: Array<string | undefined | null | false | 0 | ''>) {
  return classes.filter(Boolean).join(' ');
}
