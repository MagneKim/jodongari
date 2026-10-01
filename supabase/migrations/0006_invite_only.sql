-- jodongari Phase 4B-7: 초대제 회원 운영
-- 참고: docs/DECISIONS.md, docs/ARCHITECTURE.md
--
-- public self-signup을 중단하고 admin/leader가 server-side privileged API로 신규 회원을 만든다.
-- 생성 직후 계정은 임시 비밀번호 상태이므로 must_change_password로 표시해 MY에서 soft reminder를 띄운다.

alter table public.profiles add column must_change_password boolean not null default false;
