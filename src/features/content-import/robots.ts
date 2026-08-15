export type RobotsPolicy = {
  fetched: boolean;
  allowsAll: boolean;
  disallows: string[];
  allows: string[];
};

export function parseRobotsTxt(body: string, userAgent = '*'): RobotsPolicy {
  const lines = body.split(/\r?\n/).map((line) => line.replace(/#.*$/, '').trim());
  let inGroup = false;
  let matchedStar = false;
  const disallows: string[] = [];
  const allows: string[] = [];

  for (const line of lines) {
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (key === 'user-agent') {
      const agent = value.toLowerCase();
      inGroup = agent === '*' || agent === userAgent.toLowerCase();
      if (agent === '*') matchedStar = true;
      continue;
    }
    if (!inGroup) continue;
    if (key === 'disallow') disallows.push(value);
    if (key === 'allow') allows.push(value);
  }

  return {
    fetched: true,
    allowsAll: !matchedStar && disallows.length === 0,
    disallows,
    allows,
  };
}

export function isPathAllowed(pathname: string, policy: RobotsPolicy | null): boolean {
  if (!policy || !policy.fetched) return true;
  const path = pathname || '/';

  let bestAllow = -1;
  let bestDisallow = -1;
  for (const rule of policy.allows) {
    if (rule && path.startsWith(rule)) bestAllow = Math.max(bestAllow, rule.length);
  }
  for (const rule of policy.disallows) {
    if (rule === '') continue;
    if (path.startsWith(rule)) bestDisallow = Math.max(bestDisallow, rule.length);
  }
  if (bestDisallow < 0) return true;
  return bestAllow > bestDisallow;
}

export const OPEN_ROBOTS: RobotsPolicy = {
  fetched: false,
  allowsAll: true,
  disallows: [],
  allows: [],
};
