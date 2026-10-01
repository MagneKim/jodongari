# TODO.md

## 현재
- Phase 4B-7 완료: public self-signup 폐지, 초대제 전환. admin/leader가 `/manage/users/new`(→ `POST /api/manage/users`)로 신규 회원을 직접 생성한다. SMTP 없이 운영 — admin의 "임시 비밀번호 재설정"이 비밀번호 분실 fallback.
- Netlify production: https://tpkr-jodongari.netlify.app

## 다음 — 사용자 직접 수행 필요
1. **Supabase Dashboard 수동 설정 (필수)**: Authentication → Sign In / Providers → Email에서 "Allow new users to sign up"을 비활성화. (Admin API `createUser`는 이 설정과 무관하게 계속 동작한다.)
2. bootstrap admin 계정으로 `/manage/users/new`에서 실제 테스트 회원 생성 → 로그인 → MY에서 ID/닉네임/비밀번호 변경까지 실 계정으로 E2E 검증.
3. leader 계정이 있다면 동일 화면에서 role이 member로 고정되는지, API에 role:"admin"을 직접 보내도 403이 나는지 확인.
4. 기존 OTP/Magic Link 테스트 중 생성된 `onboarding_completed=false` 계정이 있는지 `profiles` 조회로 개수 확인(삭제는 보류, 필요 시 admin이 수동 판단).
5. RLS negative test 지속: member 계정으로 `/api/manage/users` 직접 호출 시 403, 다른 사람의 draft/pending sighting 접근 시도 등.

## 다음 — 그 외 코드 작업
- (선택) 초기 10명 이상 대량 등록이 필요해지면 `lib/supabase/admin.ts`를 재사용하는 one-time CSV import script(dry-run 포함) 추가 — 지금은 `/manage/users/new`로 한 명씩 등록해도 충분한 규모.
- (선택) self-signup/초대 메일 발송, custom SMTP 연동 (이번 phase에서 의도적으로 보류)
- (선택) audit log table (지금은 server console.log만 남김)
- `lib/local-auth-provider.tsx`/`lib/mock-data.ts`/`lib/profile-store.ts` 제거 (실제 계정 E2E 검증 완료 후)
- Home/Encyclopedia/MY/Review/Admin의 hero composition·카드 밀도 재설계 (Phase 3.11에서 범위 제외, `docs/UI_REVIEW.md` 참고)
- (선택) `supabase/migrations/`에 0002/0003을 로컬 파일로 백필해 remote와 완전히 동기화
- (선택) Netlify 사이트에 GitHub 연동을 붙이면 이후 `git push`만으로 자동 배포된다 — 지금은 Netlify CLI 수동 배포(`netlify deploy --build --prod`)로만 연결되어 있다.
