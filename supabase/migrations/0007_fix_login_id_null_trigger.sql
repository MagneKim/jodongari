-- jodongari Phase 4B-8: go-live smoke test에서 발견한 버그 수정
-- 참고: docs/DECISIONS.md
--
-- 0005에서 profiles.login_id를 nullable로 바꿔 "profile shell" insert(handle_new_user, login_id 없음)를
-- 허용했지만, validate_login_id() 트리거는 null을 빈 문자열로 취급해 무조건 예외를 던졌다
-- (validate_nickname()은 이미 null early-return이 있어 같은 문제가 없었다).
-- 결과: auth.users insert 때마다 handle_new_user() → profiles insert → 트리거 예외로 모든 신규 계정
-- 생성이 500으로 실패했다 (admin.auth.admin.createUser 포함).

create or replace function public.validate_login_id()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  trimmed text := trim(coalesce(new.login_id, ''));
begin
  if new.login_id is null then
    return new;
  end if;
  if trimmed = '' then
    raise exception '아이디를 입력해 주세요.';
  end if;
  if trimmed !~ '^[A-Za-z0-9_-]{4,20}$' then
    raise exception '아이디는 4~20자의 영문, 숫자, _, -만 사용할 수 있어요.';
  end if;
  if lower(trimmed) = any (array['admin', 'administrator', 'root', 'system', 'support', 'jodongari']) then
    raise exception '사용할 수 없는 아이디예요.';
  end if;
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
