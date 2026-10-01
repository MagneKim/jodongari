-- jodongari Phase 4B-9: Account Recovery (SMTP 없이)
-- 참고: docs/DECISIONS.md, docs/ARCHITECTURE.md
--
-- 로그아웃 상태의 비밀번호 재설정은 Admin-mediated 방식이다: 사용자가 요청을 남기면
-- Admin이 직접 임시 비밀번호를 설정한다. email/nickname/password는 저장하지 않고
-- user_id로만 연결한다 — password_reset_requests 자체가 최소 audit 역할을 한다.

create table public.password_reset_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'cancelled')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles (user_id)
);

-- 동일 user의 중복 pending request를 막는다 (partial unique index).
create unique index password_reset_requests_one_pending_per_user
  on public.password_reset_requests (user_id)
  where status = 'pending';

alter table public.password_reset_requests enable row level security;

-- Admin만 조회/처리 가능. 일반 authenticated member는 전체 목록을 볼 수 없다.
-- insert는 service_role(server-only /api/account/password-reset-request)에서만 일어나므로
-- authenticated용 insert policy는 두지 않는다.
create policy password_reset_requests_select_admin on public.password_reset_requests
  for select to authenticated
  using (public.current_role() = 'admin');

create policy password_reset_requests_update_admin on public.password_reset_requests
  for update to authenticated
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');
