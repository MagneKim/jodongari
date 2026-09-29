-- jodongari Phase 4A-2: corporate email 인증 + custom login_id/password 로그인 + bootstrap admin
-- 참고: docs/DECISIONS.md, docs/ARCHITECTURE.md
-- 현재 remote는 0001_init.sql까지 적용되어 있었고(0002/0003은 Phase 4A audit로 이 project에 직접 적용,
-- 로컬 migration 파일로는 아직 백필되지 않은 상태 — 이번 작업 범위 밖이라 건드리지 않음), 이 migration은 0004다.

-- ============================================================
-- profiles.login_id — 실제 로그인 식별자. email은 인증 수단일 뿐 로그인 ID로 쓰지 않는다.
-- ============================================================

alter table public.profiles add column login_id text;

-- case-insensitive 중복 방지. 별도 normalized column 없이 expression index로 처리한다.
create unique index profiles_login_id_key on public.profiles (lower(login_id));

-- format/reserved word/중복 검증을 한 곳(trigger)에서 강제한다. client validation(lib/auth/login-id.ts)과
-- 규칙을 동일하게 유지해야 한다 — 이 함수가 최종 source of truth.
create function public.validate_login_id()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  trimmed text := trim(coalesce(new.login_id, ''));
begin
  if trimmed = '' then
    raise exception '아이디를 입력해 주세요.';
  end if;
  if trimmed !~ '^[A-Za-z0-9_-]{4,20}$' then
    raise exception '아이디는 4~20자의 영문, 숫자, _, -만 사용할 수 있어요.';
  end if;
  if lower(trimmed) = any (array['admin', 'administrator', 'root', 'system', 'support', 'jodongari']) then
    raise exception '사용할 수 없는 아이디예요.';
  end if;
  -- 동시 가입 race condition의 최종 방어는 profiles_login_id_key unique index다.
  -- 이 exists 체크는 일반적인 경우에 친절한 한국어 메시지를 주기 위한 것이다.
  if exists (
    select 1 from public.profiles
    where lower(login_id) = lower(trimmed) and user_id <> new.user_id
  ) then
    raise exception '이미 사용 중인 아이디입니다.';
  end if;
  new.login_id := trimmed;
  return new;
end;
$$;

create trigger validate_login_id_trigger
  before insert or update of login_id on public.profiles
  for each row execute function public.validate_login_id();

-- 기존 row가 없으므로(신규 accounts 아직 없음) 바로 not null로 강제한다.
alter table public.profiles alter column login_id set not null;

-- ============================================================
-- handle_new_user 갱신 — login_id/nickname은 signup metadata, role은 client를 신뢰하지 않고
-- NEW.email 기반으로 DB가 직접 결정한다 (bootstrap admin 규칙 포함).
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, login_id, nickname, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'login_id',
    coalesce(new.raw_user_meta_data ->> 'nickname', split_part(new.email, '@', 1)),
    case
      when lower(trim(new.email)) = 'mingyo.kim@tanabe-pharma.com' then 'admin'
      else 'member'
    end
  );
  return new;
end;
$$;

-- ============================================================
-- Before User Created hook — tanabe-pharma.com 외 도메인 가입을 Auth 단계에서 차단.
-- substring 비교가 아니라 정확한 suffix 비교("@tanabe-pharma.com"으로 끝나는지)만 사용한다.
--
-- 중요: 이 함수를 만드는 것만으로는 아직 동작하지 않는다. Supabase Dashboard →
-- Authentication → Hooks → "Before User Created"에서 Postgres Hook으로 이 함수
-- (public.hook_restrict_signup_by_email_domain)를 직접 선택/활성화해야 한다.
-- 이 설정은 Management API/SQL로 제공되지 않는 dashboard 전용 설정이라 여기서 자동화할 수 없다
-- (docs/TODO.md에 대기 항목으로 기록).
-- ============================================================

create or replace function public.hook_restrict_signup_by_email_domain(event jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  email text := lower(trim(event -> 'user' ->> 'email'));
  allowed_domain constant text := '@tanabe-pharma.com';
begin
  if email is null or right(email, length(allowed_domain)) <> allowed_domain then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 400,
        'message', '회사 이메일(@tanabe-pharma.com)만 가입할 수 있습니다.'
      )
    );
  end if;
  return '{}'::jsonb;
end;
$$;

grant execute on function public.hook_restrict_signup_by_email_domain(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_restrict_signup_by_email_domain(jsonb) from authenticated, anon, public;
