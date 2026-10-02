# TODO.md

## 현재
- Phase 4B-7 완료: public self-signup 폐지, 초대제 전환. admin/leader가 `/manage/users/new`(→ `POST /api/manage/users`)로 신규 회원을 직접 생성한다. SMTP 없이 운영 — admin의 "임시 비밀번호 재설정"이 비밀번호 분실 fallback.
- Phase 4B-8 완료: production go-live smoke test. 계정/핵심 플로우(기록→검토→승인→도감/EXP/통계)/권한(member·leader·admin)/모바일 3종 뷰포트/signup 안내/console·network 모두 정상. 발견한 신규 회원 생성 500 버그는 `0007_fix_login_id_null_trigger.sql`로 수정해 production 적용 완료.
- Phase 4B-9 완료: SMTP 없는 account recovery. 로그인 상태 비밀번호 변경 단순화(현재 비밀번호 불필요), `/account-help`(아이디 찾기·비밀번호 재설정 요청), `/manage/recovery`(Admin 처리), `scripts/reset-user-password.ts`(owner-only emergency CLI). migration `0008_account_recovery.sql` production 적용 완료.
- Phase 4B-14 완료(코드 구현 + migration production 적용, netlify 배포는 보류 — 아래 "다음" 참고): sighting 삭제(작성자/leader/admin) + 검토 반려(`revision` 상태 재사용, leaderNote 필수) + 수정 후 재제출(`/record?editId=`). migration `0009_sighting_delete_and_revision.sql` production 적용 완료. `npx tsc --noEmit`/`npm run lint`/`npm run build` 모두 통과.
- Phase 4B-16 완료: review action alignment + app-wide alignment polish. `/review/[id]` 승인/반려 버튼을 좌측 승인(blue fill)/우측 반려(red fill) 동일 width/height로 통일하고, review·sighting 상세의 "탐조 기록 삭제"를 하단 중앙 정렬로 변경. 다른 주요 페이지(my/manage/admin/modal 등)는 이미 동일 패턴이라 변경 없음. `npx tsc --noEmit`/`npm run lint`/`npm run build` 통과, production에서 직접 로그인해 모바일(375/390/430)·데스크톱 뷰 확인 완료. netlify 배포 완료.
- Phase 4B-17 완료: `/manage/recovery` pending list가 0건으로 잘못 표시되던 버그 수정. `password_reset_requests`가 `profiles`를 `user_id`/`resolved_by` 두 FK로 참조해 PostgREST embed가 ambiguous했고, query error를 버리던 코드가 실패를 빈 목록으로 표시하고 있었다. `profiles!password_reset_requests_user_id_fkey(...)`로 명시하고 `{ data, error }`를 모두 처리해 실패 시 재시도 버튼이 있는 error state를 보여주도록 수정. migration/RLS 변경 없음. `npx tsc --noEmit`/`npm run lint`/`npm run build` 통과, production에서 실제 admin 계정으로 badge 1건 → list 1건 표시 → 임시 비밀번호 재설정 처리 → list 0건 → badge 제거까지 전체 플로우 확인 완료. netlify 배포 완료.
- Netlify production: https://tpkr-jodongari.netlify.app

## 다음 — 사용자 직접 수행 필요
1. **Supabase Dashboard 수동 설정 (필수)**: Authentication → Sign In / Providers → Email에서 "Allow new users to sign up"을 비활성화. (Admin API `createUser`는 이 설정과 무관하게 계속 동작한다.)
2. **admin(chem_mg) 비밀번호 재설정 필요**: `npm run reset-user-password -- --login-id chem_mg`를 본인이 직접 실행해 임시 비밀번호를 설정할 것(비밀번호는 Claude가 생성/출력하지 않는다). 로그인 후 MY에서 본인 비밀번호로 다시 변경.
3. 기존 OTP/Magic Link 테스트 중 생성된 `onboarding_completed=false` 계정이 있는지 `profiles` 조회로 개수 확인(삭제는 보류, 필요 시 admin이 수동 판단).
4. RLS negative test 지속: 다른 사람의 draft/pending sighting 접근 시도 등 추가 negative case는 운영하면서 지속 확인.
5. 향후 SMTP 도입 시 self-service(익명) 비밀번호 재설정을 선택적으로 추가할 수 있다 — 이번 phase에서는 의도적으로 Admin-mediated 방식만 구현했다.

## 다음 — 그 외 코드 작업
- (선택) 초기 10명 이상 대량 등록이 필요해지면 `lib/supabase/admin.ts`를 재사용하는 one-time CSV import script(dry-run 포함) 추가 — 지금은 `/manage/users/new`로 한 명씩 등록해도 충분한 규모.
- (선택) self-signup/초대 메일 발송, custom SMTP 연동 (이번 phase에서 의도적으로 보류)
- (선택) audit log table (지금은 server console.log만 남김)
- `lib/local-auth-provider.tsx`/`lib/mock-data.ts`/`lib/profile-store.ts` 제거 (실제 계정 E2E 검증 완료 후)
- Home/Encyclopedia/MY/Review/Admin의 hero composition·카드 밀도 재설계 (Phase 3.11에서 범위 제외, `docs/UI_REVIEW.md` 참고)
- (선택) `supabase/migrations/`에 0002/0003을 로컬 파일로 백필해 remote와 완전히 동기화
- (선택) Netlify 사이트에 GitHub 연동을 붙이면 이후 `git push`만으로 자동 배포된다 — 지금은 Netlify CLI 수동 배포(`netlify deploy --build --prod`)로만 연결되어 있다.
