# TODO.md

## 현재
- Phase 4A-2 완료: corporate email 인증(Before User Created hook 활성화 확인) + custom login_id/password 로그인 + bootstrap admin 코드/migration/배포 모두 실제 계정으로 검증 완료.
- Netlify 배포 완료: https://jodongari-236.netlify.app (production). Supabase Auth URL Configuration도 이 주소로 등록됨.
- bootstrap admin 계정(닉네임 "김민교") 가입 → 이메일 인증 → login_id/password 로그인 → `/admin`, `/review` 접근까지 실제 브라우저로 확인 완료.

## 다음 — 사용자 직접 수행 필요
1. 추가 회사 이메일 계정(member 2 + leader 후보)을 `/signup`에서 직접 가입시키기 (외부/dummy 도메인 금지)
2. 가입된 계정으로: login_id 변경 E2E, password 변경 E2E, Admin UI에서 role을 member → leader로 변경, shared EXP(공동 탐조) E2E, sighting 등록/승인/좋아요/댓글, Storage 업로드까지 실제 흐름 검증
3. RLS negative test: member 계정으로 다른 사람의 draft/pending sighting 접근 시도, admin이 아닌 계정으로 role 변경 시도 등이 실제로 막히는지 확인

## 다음 — 그 외 코드 작업
- 실제 계정으로 핵심 flow(로그인/기록/검토/승인/좋아요/댓글) 검증 완료되면 `lib/local-auth-provider.tsx`/`lib/mock-data.ts`/`lib/profile-store.ts` 제거
- Netlify 배포 후 실제 iPhone Safari에서 `/record` 미디어 업로드 재검증 (Phase 4B)
- Home/Encyclopedia/MY/Review/Admin의 hero composition·카드 밀도 재설계 (Phase 3.11에서 범위 제외, `docs/UI_REVIEW.md` 참고)
- (선택) `supabase/migrations/`에 0002/0003을 로컬 파일로 백필해 remote와 완전히 동기화 — 현재는 remote에만 적용되어 있고 로컬 저장소에는 0001/0004만 있다
- (선택) Netlify 사이트에 GitHub 연동을 붙이면 이후 `git push`만으로 자동 배포된다 — 지금은 Netlify CLI 수동 배포(`netlify deploy --build --prod`)로만 연결되어 있다. Netlify 대시보드 → Site configuration → Build & deploy → Link repository에서 연결 가능
- (선택) 커스텀 도메인 연결 시 Supabase Auth URL Configuration의 Site URL/Redirect URLs도 새 도메인으로 갱신 필요
