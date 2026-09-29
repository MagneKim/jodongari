// 로그인 ID validation 규칙 — 단일 source of truth.
// DB trigger(supabase/migrations/0004_auth_identity.sql의 validate_login_id())가
// 최종 강제자이며, 이 파일과 동일한 규칙을 유지해야 한다.

const LOGIN_ID_PATTERN = /^[A-Za-z0-9_-]{4,20}$/;
const RESERVED_LOGIN_IDS = new Set(["admin", "administrator", "root", "system", "support", "jodongari"]);

export type LoginIdValidation = { ok: true; value: string } | { ok: false; error: string };

export function validateLoginId(raw: string): LoginIdValidation {
  const value = raw.trim();
  if (!value) return { ok: false, error: "아이디를 입력해 주세요." };
  if (!LOGIN_ID_PATTERN.test(value)) {
    return { ok: false, error: "아이디는 4~20자의 영문, 숫자, _, -만 사용할 수 있어요." };
  }
  if (RESERVED_LOGIN_IDS.has(value.toLowerCase())) {
    return { ok: false, error: "사용할 수 없는 아이디예요." };
  }
  return { ok: true, value };
}
