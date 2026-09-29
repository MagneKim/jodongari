# TODO.md

## 현재
- Phase 4B-5 완료: 모바일 관리 탭(`/manage`) 추가, 회사 이메일 email OTP 기반 onboarding(STEP1 이메일 → STEP2 OTP → STEP3 아이디/닉네임/비밀번호) 코드/migration/배포까지 완료.
- Netlify production: https://tpkr-jodongari.netlify.app

## 다음 — 사용자 직접 수행 필요
1. **Supabase Dashboard 수동 설정 (필수)**: Authentication → Email Templates → "Magic Link"(email OTP가 사용하는 템플릿)를 `{{ .Token }}`을 포함하도록 수정. 지금 템플릿이 confirmation link만 담고 있으면 OTP 입력 화면 자체가 무의미해진다.
2. 새 회사 이메일 계정으로 실제 STEP1~4 가입 E2E(이메일 → OTP 수신/입력 → 아이디/닉네임 중복확인 → 비밀번호 → 로그인)를 브라우저로 검증
3. bootstrap admin 계정으로 iPhone(또는 375/390/430 반응형)에서 `관리` 탭 → `/manage` → 검토/사용자 관리 진입을 실제 확인
4. RLS negative test 지속: member 계정으로 다른 사람의 draft/pending sighting 접근 시도, admin이 아닌 계정으로 role 변경 시도 등

## 다음 — 그 외 코드 작업
- 실제 계정으로 핵심 flow 검증 완료되면 `lib/local-auth-provider.tsx`/`lib/mock-data.ts`/`lib/profile-store.ts` 제거
- Home/Encyclopedia/MY/Review/Admin의 hero composition·카드 밀도 재설계 (Phase 3.11에서 범위 제외, `docs/UI_REVIEW.md` 참고)
- (선택) `supabase/migrations/`에 0002/0003을 로컬 파일로 백필해 remote와 완전히 동기화
- (선택) Netlify 사이트에 GitHub 연동을 붙이면 이후 `git push`만으로 자동 배포된다 — 지금은 Netlify CLI 수동 배포(`netlify deploy --build --prod`)로만 연결되어 있다.
- (선택) onboarding 미완료 계정을 admin에서 별도로 조회/정리하는 UI (이번 Phase 범위 밖)
