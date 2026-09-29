// Supabase 연결에 필요한 환경변수를 한 곳에서 검증한다.
// 값이 없을 때 silent fallback(mock 전환) 하지 않고 명확한 에러를 던진다 (docs/DECISIONS.md Phase 4 참고).
//
// 주의: Next.js는 NEXT_PUBLIC_* 값을 브라우저 번들에 inline할 때 `process.env.NEXT_PUBLIC_X`처럼
// 정적으로 참조된 경우만 치환한다. `process.env[name]`같은 동적 접근은 브라우저에서 항상 undefined가 된다
// (서버에서는 실제 process.env가 있어 정상 동작하므로 이 버그는 서버 실행만으로는 드러나지 않는다).
// 그래서 두 값을 각각 정적으로 참조하는 별도 함수로 둔다.

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `[jodongari] 환경변수 ${name}가 설정되지 않았어요. .env.local.example을 참고해 .env.local을 만들어 주세요.`
    );
  }
  return value;
}

export function getSupabaseUrl(): string {
  return requireEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getSupabaseAnonKey(): string {
  return requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
