// 비밀번호 validation 규칙 — 단일 source of truth. Supabase Auth 자체 정책(최소 길이)과 동일하게 유지한다.

const MIN_LENGTH = 8;

export type PasswordValidation = { ok: true } | { ok: false; error: string };

export function validatePassword(raw: string): PasswordValidation {
  if (raw.length < MIN_LENGTH) return { ok: false, error: `비밀번호는 ${MIN_LENGTH}자 이상이어야 해요.` };
  return { ok: true };
}
