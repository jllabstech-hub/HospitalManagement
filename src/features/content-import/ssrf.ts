import { lookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';

const blocked = new BlockList();
blocked.addSubnet('0.0.0.0', 8, 'ipv4');
blocked.addSubnet('10.0.0.0', 8, 'ipv4');
blocked.addSubnet('100.64.0.0', 10, 'ipv4');
blocked.addSubnet('127.0.0.0', 8, 'ipv4');
blocked.addSubnet('169.254.0.0', 16, 'ipv4');
blocked.addSubnet('172.16.0.0', 12, 'ipv4');
blocked.addSubnet('192.0.0.0', 24, 'ipv4');
blocked.addSubnet('192.0.2.0', 24, 'ipv4');
blocked.addSubnet('192.168.0.0', 16, 'ipv4');
blocked.addSubnet('198.18.0.0', 15, 'ipv4');
blocked.addSubnet('198.51.100.0', 24, 'ipv4');
blocked.addSubnet('203.0.113.0', 24, 'ipv4');
blocked.addSubnet('224.0.0.0', 4, 'ipv4');
blocked.addSubnet('240.0.0.0', 4, 'ipv4');
blocked.addAddress('::1', 'ipv6');
blocked.addSubnet('::', 128, 'ipv6');
blocked.addSubnet('fc00::', 7, 'ipv6');
blocked.addSubnet('fe80::', 10, 'ipv6');
blocked.addSubnet('ff00::', 8, 'ipv6');

const BLOCKED_HOSTS = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata.internal',
  'instance-data',
]);

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsafeUrlError';
  }
}

export function ipIsPrivate(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) return blocked.check(ip, 'ipv4');
  if (version === 6) {
    const mapped = ipv4FromMapped(ip);
    if (mapped) return ipIsPrivate(mapped);
    return blocked.check(ip, 'ipv6');
  }
  return true;
}

function ipv4FromMapped(ip: string): string | null {
  const lower = ip.toLowerCase();
  if (lower.startsWith('::ffff:')) {
    const rest = lower.slice(7);
    if (isIP(rest) === 4) return rest;
  }
  return null;
}

export function hostnameIsBlocked(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/\.$/, '').replace(/^\[/, '').replace(/\]$/, '');
  if (!host) return true;
  if (BLOCKED_HOSTS.has(host)) return true;
  if (host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    return true;
  }
  if (host === '::1' || host === '0.0.0.0') return true;
  if (isIP(host) && ipIsPrivate(host)) return true;
  return false;
}

export function parseHttpUrl(raw: string): URL {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new UnsafeUrlError('Enter a hospital website URL.');
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new UnsafeUrlError('Enter a valid http or https URL.');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new UnsafeUrlError('Only HTTP and HTTPS URLs are allowed.');
  }
  if (parsed.username || parsed.password) {
    throw new UnsafeUrlError('URLs with credentials are not allowed.');
  }
  if (hostnameIsBlocked(parsed.hostname)) {
    throw new UnsafeUrlError('That host cannot be crawled.');
  }
  return parsed;
}

export type LookupFn = typeof lookup;

export async function assertSafeFetchUrl(raw: string, dnsLookup: LookupFn = lookup): Promise<URL> {
  const url = parseHttpUrl(raw);
  const host = url.hostname.replace(/^\[/, '').replace(/\]$/, '');
  const records = await dnsLookup(host, { all: true, verbatim: true });
  if (!records.length) {
    throw new UnsafeUrlError('The website host could not be resolved.');
  }
  for (const record of records) {
    if (ipIsPrivate(record.address)) {
      throw new UnsafeUrlError('That host resolves to a private or internal address.');
    }
  }
  return url;
}
