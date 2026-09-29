-- jodongari Phase 4B-5: 회사 이메일 OTP 기반 onboarding
-- 참고: docs/DECISIONS.md, docs/ARCHITECTURE.md
--
-- 이번 phase부터 auth.users row는 OTP 요청 시점에 먼저 생성되고, login_id/nickname/password는
-- 이후 onboarding 화면에서 채워진다. 따라서 handle_new_user()는 더 이상 신규 가입 시점에
-- login_id/nickname metadata가 존재한다고 가정할 수 없다 — "profile shell" 상태로 생성하고
-- onboarding_completed=false로 표시한다.

-- ============================================================
-- login_id/nickname nullable화 (onboarding 전에는 비어 있을 수 있음)
-- ============================================================

alter table public.profiles alter column login_id drop not null;
alter table public.profiles alter column nickname drop not null;

-- ============================================================
-- onboarding_completed
-- 기존 row(bootstrap admin, 1건)는 이미 login_id/nickname/password를 모두 갖춘 완성된 계정이므로
-- default true로 추가해 자동 backfill한다. 신규 가입은 handle_new_user()가 명시적으로 false를 넣는다.
-- ============================================================

alter table public.profiles add column onboarding_completed boolean not null default true;

-- onboarding_completed=true인 row는 반드시 login_id/nickname을 갖춰야 한다 (partial finalization 방지).
alter table public.profiles add constraint profiles_onboarding_requires_identity
  check (not onboarding_completed or (login_id is not null and nickname is not null));

-- ============================================================
-- nickname 중복 방지 (trim + case-insensitive) — login_id와 동일 패턴.
-- ============================================================

create function public.validate_nickname()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  trimmed text := trim(coalesce(new.nickname, ''));
begin
  if new.nickname is null then
    return new;
  end if;
  if trimmed = '' then
    raise exception '닉네임을 입력해 주세요.';
  end if;
  if trimmed ~ '[[:cntrl:]]' then
    raise exception '닉네임에 사용할 수 없는 문자가 있어요.';
  end if;
  if char_length(trimmed) < 2 or char_length(trimmed) > 12 then
    raise exception '닉네임은 2~12자로 입력해 주세요.';
  end if;
  if exists (
    select 1 from public.profiles
    where lower(nickname) = lower(trimmed) and user_id <> new.user_id
  ) then
    raise exception '이미 사용 중인 닉네임입니다.';
  end if;
  new.nickname := trimmed;
  return new;
end;
$$;

create trigger validate_nickname_trigger
  before insert or update of nickname on public.profiles
  for each row execute function public.validate_nickname();

create unique index profiles_nickname_key on public.profiles (lower(nickname));

-- ============================================================
-- handle_new_user 갱신 — auth user 생성 시점에는 아직 login_id/nickname이 없다.
-- role은 기존과 동일하게 bootstrap admin 이메일 기준으로 DB가 직접 결정한다.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, role, onboarding_completed)
  values (
    new.id,
    case
      when lower(trim(new.email)) = 'mingyo.kim@tanabe-pharma.com' then 'admin'
      else 'member'
    end,
    false
  );
  return new;
end;
$$;
