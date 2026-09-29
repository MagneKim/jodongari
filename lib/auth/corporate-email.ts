// 회사 이메일 도메인 체크 — UX validation 전용이다. 실제 enforcement는
// Supabase Auth "Before User Created" hook(public.hook_restrict_signup_by_email_domain)이 담당한다.

const ALLOWED_DOMAIN = "@tanabe-pharma.com";

export function isCorporateEmail(raw: string): boolean {
  return raw.trim().toLowerCase().endsWith(ALLOWED_DOMAIN);
}
