type RateEntry = { count: number; resetAt: number };

const rateMap = new Map<string, RateEntry>();
const MAX_KEYS = 10_000;

function pruneExpired(now: number) {
  if (rateMap.size < MAX_KEYS) return;
  for (const [key, entry] of rateMap) {
    if (now > entry.resetAt) {
      rateMap.delete(key);
    }
  }
  // Hard cap: drop oldest-ish keys if still oversized
  if (rateMap.size >= MAX_KEYS) {
    const excess = rateMap.size - Math.floor(MAX_KEYS * 0.8);
    let i = 0;
    for (const key of rateMap.keys()) {
      if (i++ >= excess) break;
      rateMap.delete(key);
    }
  }
}

export function rateLimit(
  ip: string,
  maxRequests = 5,
  windowMs = 60_000
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  pruneExpired(now);

  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
  }
  entry.count++;
  return {
    allowed: entry.count <= maxRequests,
    remaining: Math.max(0, maxRequests - entry.count),
    resetIn: entry.resetAt - now,
  };
}
