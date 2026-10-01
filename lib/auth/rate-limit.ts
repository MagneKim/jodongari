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
  // x-forwarded-for는 client가 임의로 보낼 수 있어 그 값을 그대로 믿으면 rate limit을
  // 헤더 값만 바꿔가며 우회할 수 있다. Netlify가 edge에서 직접 설정하는
  // x-nf-client-connection-ip(client가 덮어쓸 수 없음)를 우선 사용한다.
  return request.headers.get("x-nf-client-connection-ip") ?? "unknown";
}
