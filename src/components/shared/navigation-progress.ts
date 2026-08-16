export function shouldTrackNavigationClick(
  event: {
    defaultPrevented: boolean;
    button: number;
    metaKey: boolean;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
  },
  anchor: { href: string; target: string; hasAttribute: (name: string) => boolean },
  currentUrl: URL
): boolean {
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  if (anchor.target && anchor.target !== '_self') return false;
  if (anchor.hasAttribute('download')) return false;

  let next: URL;
  try {
    next = new URL(anchor.href, currentUrl);
  } catch {
    return false;
  }

  if (!/^https?:$/.test(next.protocol)) return false;
  if (next.origin !== currentUrl.origin) return false;

  const samePath = next.pathname === currentUrl.pathname && next.search === currentUrl.search;
  if (samePath) return false;
  return true;
}
