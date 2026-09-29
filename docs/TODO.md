# TODO.md

## 현재
- Phase 4A-2 진행 중: corporate email 인증 + custom login_id/password 로그인 + bootstrap admin 코드/migration 작성 및 remote 적용 완료. **Before User Created hook 활성화(Dashboard 수동 설정)와 실제 계정 가입 전까지는 도메인 제한/로그인 E2E가 최종 검증되지 않은 상태.**
- Phase 4A 완료: 실제 Supabase project(jodongari) 연결, migration 적용, Auth/repository를 Supabase로 전환.

## 다음 — 사용자 직접 수행 필요 (순서대로)
1. **Before User Created hook 활성화** (필수, 이게 없으면 도메인 제한이 client validation만으로 끝난다): Supabase Dashboard → Authentication → Hooks → "Before User Created" → Postgres Hook으로 `public.hook_restrict_signup_by_email_domain` 함수 선택 후 저장.
2. **`SUPABASE_SERVICE_ROLE_KEY` 설정**: Dashboard → Settings → API → service_role secret key를 복사해 `.env.local`(로컬)과 Netlify 서버 환경변수(배포 시)에 추가. `NEXT_PUBLIC_` 접두사를 붙이면 안 됨. 이 키가 없으면 `/api/auth/login`이 500을 반환한다(로컬 QA에서 실제로 확인됨).
3. hook + service role key 설정 후, 다음 순서로 직접 가입/검증:
   - `mingyo.kim@tanabe-pharma.com`으로 `/signup` 가입 → 메일함에서 인증 링크 클릭 → 정한 login_id/password로 `/login` 로그인 → `/admin`, `/review` 접근 확인 (role=admin이 client 판단이 아니라 DB 기반인지 확인됨)
   - 외부 이메일(gmail.com 등)로 가입 시도 → 이번에는 Auth 단계에서도 실제로 차단되는지 확인 (hook 활성화 전에는 client validation만 통과 여부를 확인했음 — 로컬 QA로 이미 검증됨)
   - 추가 회사 이메일 계정(member 2 + leader 후보)을 가입시켜 leader 지정(Admin UI)까지 확인
4. 계정 준비되면 이어서: login_id 변경 E2E, password 변경 E2E, RLS negative test, shared EXP E2E, Storage E2E 진행

## 다음 — 그 외 코드 작업
- Netlify site 연결 여부 확인 후 Production/Deploy Preview env var 등록 시 `SUPABASE_SERVICE_ROLE_KEY`를 서버 전용 변수로 함께 등록 (Phase 4B)
- 실제 계정으로 핵심 flow(로그인/기록/검토/승인/좋아요/댓글) 검증 완료되면 `lib/local-auth-provider.tsx`/`lib/mock-data.ts`/`lib/profile-store.ts` 제거
- Netlify 배포 후 실제 iPhone Safari에서 `/record` 미디어 업로드 재검증 (Phase 4B)
- Home/Encyclopedia/MY/Review/Admin의 hero composition·카드 밀도 재설계 (Phase 3.11에서 범위 제외, `docs/UI_REVIEW.md` 참고)
- (선택, 이번 phase 범위 아님) `supabase/migrations/`에 0002/0003을 로컬 파일로 백필해 remote와 완전히 동기화 — 현재는 remote에만 적용되어 있고 로컬 저장소에는 0001/0004만 있다.
