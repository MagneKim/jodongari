// 최소 server-side rate limit — 별도 infrastructure(Redis 등) 없이 in-memory로 처리한다.
// ponytail: per-instance in-memory 저장소라 서버리스 다중 인스턴스에서는 한도가 인스턴스별로 나뉜다.
// 계정 lookup/재설정 요청처럼 낮은 트래픽 public API에는 충분하지만, 진짜 분산 rate limit이
// 필요해지면(트래픽 증가, 다중 인스턴스 bypass 악용 등) Redis/Upstash 기반으로 교체한다.

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;

const hits = new Map<string, number[]>();

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > MAX_REQUESTS;
}

export function getClientKey(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}
