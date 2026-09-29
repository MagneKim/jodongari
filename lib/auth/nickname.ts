// 닉네임 validation 규칙 — 단일 source of truth.
// DB trigger(supabase/migrations/0005_onboarding.sql의 validate_nickname())가
// 최종 강제자이며, 이 파일과 동일한 규칙을 유지해야 한다.

const CONTROL_CHAR_PATTERN = /[\x00-\x1F\x7F]/;

export type NicknameValidation = { ok: true; value: string } | { ok: false; error: string };

export function validateNickname(raw: string): NicknameValidation {
  const value = raw.trim();
  if (!value) return { ok: false, error: "닉네임을 입력해 주세요." };
  if (CONTROL_CHAR_PATTERN.test(value)) return { ok: false, error: "닉네임에 사용할 수 없는 문자가 있어요." };
  if (value.length < 2 || value.length > 12) {
    return { ok: false, error: "닉네임은 2~12자로 입력해 주세요." };
  }
  return { ok: true, value };
}
