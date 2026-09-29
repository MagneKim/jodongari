# ARCHITECTURE.md

## Auth Identity 모델 (Phase 4A-2)

```text
회사 이메일(@tanabe-pharma.com)  — Supabase Auth의 identity, "소속 인증 수단"일 뿐 로그인 ID로 쓰지 않는다.
  ↓ Before User Created hook(public.hook_restrict_signup_by_email_domain, SQL, Dashboard에서 활성화 필요)
  ↓ auth.users insert → handle_new_user() trigger
profiles.login_id / nickname / role / status  — 실제 로그인 식별자와 커뮤니티 표시 이름은 profiles에만 있다.
  ↓
POST /api/auth/login (server-only) — login_id → email resolve(service_role) → signInWithPassword
```

- email은 profiles에 저장하지 않는다(Phase 4 결정 유지). 본인 email은 client가 `supabase.auth.getUser()`로 직접 조회할 수 있지만(MY 화면 표시용), 다른 사용자의 email은 service_role 없이는 조회 불가능하다.
- login_id → email mapping은 client에 노출되지 않는다. `lib/supabase/admin.ts`(service_role, server-only)가 `app/api/auth/login/route.ts`/`app/api/auth/resend-confirmation/route.ts` 안에서만 이 mapping을 resolve한다.
- role은 client metadata를 신뢰하지 않는다. `handle_new_user()`가 `NEW.email`을 DB에서 직접 비교해 결정한다(`mingyo.kim@tanabe-pharma.com` → admin, 그 외 정상 도메인 → member).
- login_id validation(4~20자 영문/숫자/_/-, reserved word, 중복)은 `lib/auth/login-id.ts`(client)와 `public.validate_login_id()` trigger(DB, 최종 source of truth) 두 곳에 동일 규칙으로 존재한다.
- email 미인증 session은 로그인한 것으로 취급하지 않는다 — `SupabaseAuthProvider`가 `session.user.email_confirmed_at`이 없으면 profile을 불러오지 않고 `user=null`로 둔다(RouteGuard가 자동으로 `/login`으로 보냄).

## 현재 상태 (Phase 4A)

- Next.js (App Router) + TypeScript + Tailwind CSS
- 실제 Supabase project(jodongari, `wbxgezueodkuklgtvska`)에 연결 완료. `app/layout.tsx`는 `SupabaseAuthProvider`(`lib/supabase/auth-provider.tsx`)를 기본 Auth로 쓰고, `AppDataProvider`(`lib/app-data-context.tsx`)는 `profiles`/`sightings`/`sighting_participants`/`sighting_species`/`sighting_media`/`sighting_likes`/`sighting_comments` 테이블과 `sighting-media` storage bucket을 직접 읽고 쓴다.
- `LocalAuthProvider`/`lib/mock-data.ts`/`lib/profile-store.ts`는 아직 파일로는 남아있지만 어떤 활성 경로에서도 import되지 않는다 — 실제 계정으로 E2E 검증이 끝나면 삭제 예정(`docs/TODO.md` 참고).

## 현재 상태 (Phase 1, 아래 내용은 credential 연결 전까지 유효)

- Supabase / Netlify 미연결. 실제 backend 없음.
- Mock data + `AppDataProvider` (React Context, `lib/app-data-context.tsx`)가 sightings 상태와
  변경 action(submit/approve/requestRevision)을 제공. 새로고침 시 초기화됨 (persistence 없음).
- Route: `/` 홈, `/sightings` 탐조 목록, `/record` 기록 작성, `/encyclopedia` 도감, `/my` MY,
  `/review` 회장 검토 (leader mock user만 접근).
- `lib/types.ts`에 `SightingRepository`/`BirdRepository` 최소 interface 정의 (향후 Supabase 교체 대비).
  현재는 Context 내부에서 직접 구현.

## 레이어 구조 (예정)

```text
UI (app/)
  ↓
service (앱 로직: 경험치 계산, 정렬/필터 등)
  ↓
repository interface
  ↓
mock repository (현재) → Supabase repository (추후 교체)
```

Supabase 연결 시에도 UI/service는 repository interface에만 의존하도록 유지한다.

## 조류 master dataset (Phase 3B 적용 완료)

```text
official XLSX (국립생물자원관 국가생물종목록, data/source/, git 미포함)
  ↓
scripts/import-birds.mjs (조류 sheet 검사 → species rank filter → normalize → validation)
  ↓
data/birds.json (597종 정적 파일) + data/bird-dataset-meta.json (source metadata)
  ↓
lib/app-data-context.tsx가 birds.json을 직접 import → UI 그대로 사용
```

`lib/mock-data.ts`는 이제 `MOCK_USERS`/`MOCK_SIGHTINGS`만 유지한다 (bird master는 실제 dataset).

## Local Auth (Phase 3.5)

```text
UI
  ↓
AuthContextValue (user / isLoading / login / logout)
  ↓
LocalAuthProvider (lib/local-auth-provider.tsx, 현재)  → SupabaseAuthProvider (추후, 동일 interface)
```

- `LocalAuthProvider`가 앱 최상단(`app/layout.tsx`)에서 `AppDataProvider`를 감싼다. `AppDataProvider`는 더 이상 `currentUser`를 자체 관리하지 않고 `useAuth().user`를 그대로 사용한다.
- session은 `localStorage`(`jodongari_auth_user_id`)에 사용자 id만 저장, 새로고침 후에도 유지된다.
- `components/RouteGuard.tsx`가 client-side에서 route 접근을 제어한다: 비로그인 → `/login`, 로그인 상태의 `/login` 접근 → `/`, `/review`는 `leader`만 접근 가능.
- 공개 route는 `/login` 하나뿐이며, 나머지 route(`/`, `/sightings`, `/record`, `/encyclopedia`, `/my`, `/review`)는 모두 보호 대상이다.

## Admin / Role (Phase 3.10)

```text
User.role: member | leader | admin, User.status: active | inactive
  ↓
lib/profile-store.ts (nickname/passwordHash/role/status override, 단일 localStorage key)
  ↓
AppDataProvider.updateUserRole / updateUserStatus (마지막 admin 보호 포함)
  ↓
/admin (admin 전용, RouteGuard + 화면 내 role 체크 이중 방어)
```

`LocalAuthProvider.login`은 override된 role/status를 반영한 `findUser()` 결과로 비활성 계정 로그인을 차단한다.

## Local Media (Phase 3.10)

```text
<input type="file" accept="image/*,video/*,audio/*" multiple>
  ↓
lib/media.ts: mediaTypeOf(mime) → 개수/용량 validation → buildSightingMedia(file)
  ↓
image: lib/photo.ts resize/compress → data URL (localStorage에 실릴 수 있는 크기)
video/audio: URL.createObjectURL(file) (새로고침 시 소실, revokeObjectURL로 cleanup)
  ↓
Sighting.media: SightingMedia[] → components/MediaViewer.tsx (Feed/탐조/검토에서 공용 표시)
```

## Custom Calendar (Phase 3.11)

```text
components/date/Calendar.tsx        — 월 grid core (single/range 공용, 외부 상태 없음)
components/date/CalendarPopover.tsx — desktop popover / mobile bottom sheet shell (반응형 CSS, JS breakpoint 없음)
components/date/DatePicker.tsx      — 단일 날짜 trigger + popover
components/date/DateRangePicker.tsx — 기간 trigger + popover (pending start/end, 정렬 포함)
  ↓
components/QuickDateField.tsx (Record "언제") / app/sightings/page.tsx (기간 필터)에서 사용
```

native `<input type="date">`/`showPicker()`는 더 이상 사용하지 않는다. 열림 상태는 각 wrapper의 `isOpen` React state로만 관리한다.

## 클라이언트 vs 서버

레벨 계산, EXP 표시, 정렬/필터, 날짜 formatting, 이미지 preview/resize,
form validation은 클라이언트에서 처리한다. 보안/데이터 무결성이 필요한
작업만 서버(Supabase)에서 보완한다.

## Supabase Backend (Phase 4A, 실제 연결됨)

```text
lib/supabase/env.ts     — NEXT_PUBLIC_SUPABASE_URL/ANON_KEY 검증 (정적 참조만 사용 — process.env[name] 동적 접근은
                            브라우저 번들에 inline되지 않아 항상 undefined가 되는 Next.js 특성 때문에 버그였음, Phase 4A에서 수정)
lib/supabase/client.ts  — browser client (createBrowserClient)
lib/supabase/server.ts  — server component/route handler client (createServerClient, cookie 기반)
proxy.ts                — 매 요청 auth cookie refresh (Next.js 16 middleware → proxy 컨벤션)
lib/supabase/auth-provider.tsx — SupabaseAuthProvider (`useAuth` export), app/layout.tsx의 기본 Auth
lib/supabase/database.types.ts — `supabase gen types typescript` generated type (project 연결 후 생성, 수동 편집 금지)
lib/supabase/mappers.ts — DB row(snake_case) → Sighting/User 매핑 (AppDataProvider가 사용)
lib/app-data-context.tsx — Supabase 기반 AppDataProvider. sightings는 participants/species/media/likes/comments를
                            nested select로 한 번에 조회하고, media storage_path는 batch로 signed URL(1시간)을 발급한다.
supabase/migrations/0001_init.sql — profiles/sightings/sighting_participants/sighting_species/sighting_media/
                                      sighting_likes/sighting_comments 테이블 + RLS policy + trigger + storage bucket/policy
                                      + updated_at 자동 갱신 trigger + anon RPC 직접 호출 차단 (Phase 4A audit로 추가)
```

- bird master(597종)는 이 schema에 포함하지 않는다. `sighting_species.species_id`가 `data/birds.json`의 `bird-<KTSN>` id를 FK 없이 그대로 참조한다.
- EXP(`lib/exp.ts`)/개인 도감(`lib/encyclopedia.ts`)/`isContributor`(`lib/types.ts`)/`isVisibleInAllScope`(`lib/sighting-access.ts`)는 모두 `Sighting[]`을 입력으로 받는 순수 함수이며, Supabase 연결 후에도 무변경으로 재사용되고 있다.
- Storage: `sighting-media` bucket(private), path `{user_id}/{sighting_id}/{media_id}-{safe_filename}`. `SightingMedia.blob`(client-only)에 담긴 압축 이미지/원본 video·audio를 `submitSighting`이 업로드하고, 조회 시에는 signed URL로만 노출한다.
- `submitSighting`/`approveSighting`/`addComment`/`updateNickname`/`updateUserRole`/`updateUserStatus`는 모두 async로 전환되어 실패 시 `{ok:false, error}`를 반환하고, 각 페이지가 alert() 없이 한국어 inline 에러로 표시한다.

## Corporate Onboarding (Phase 4B-5)

```text
supabase/migrations/0005_onboarding.sql
  — profiles.login_id/nickname nullable화, onboarding_completed(default true, 기존 row 자동 backfill)
  — profiles_onboarding_requires_identity check: onboarding_completed=true면 login_id/nickname not null 강제
  — validate_nickname() trigger + profiles_nickname_key unique index (trim + case-insensitive)
  — handle_new_user() 갱신: auth user 생성 시점에는 login_id/nickname 없이 "profile shell"만 만들고
    onboarding_completed=false로 시작 (role은 기존과 동일하게 NEW.email 기준 결정)
lib/auth/nickname.ts — nickname validation (client, DB trigger와 동일 규칙)
app/api/onboarding/check-login-id/route.ts — authenticated user 전용, available boolean만 반환
app/api/onboarding/check-nickname/route.ts — 위와 동일 패턴
app/signup/page.tsx         — STEP1(회사 이메일) + STEP2(OTP 인증), signInWithOtp/verifyOtp 사용
app/signup/profile/page.tsx — STEP3, 중복확인 후 auth.updateUser(password) → profiles 1회 update로 finalize
```

- 회사 이메일 인증 수단이 confirmation link → email OTP로 바뀌었다: `supabase.auth.signInWithOtp({email, options:{shouldCreateUser:true}})`로 인증번호를 보내고 `supabase.auth.verifyOtp({email, token, type:"email"})`로 확인한다. `signInWithOtp`도 새 auth user 생성 시 Before User Created hook을 그대로 거치므로 도메인 차단은 변경 없이 유지된다(production에서 gmail.com/lookalike 도메인 모두 재검증 완료).
- OTP 인증 직후에는 `auth.users` row만 있고 `profiles.login_id`/`nickname`은 아직 비어 있다 (`onboarding_completed=false`). `RouteGuard`가 이 상태의 authenticated user를 `/signup/profile` 외 모든 route에서 차단한다(`useAuth().onboardingIncomplete`).
- finalization은 별도 RPC 없이 2단계로 처리한다: `auth.updateUser({password})` → `profiles` 단일 update(`login_id`, `nickname`, `onboarding_completed:true`). 이 update가 실패하면(중복 등) `onboarding_completed`는 여전히 false로 남아 사용자가 `/signup/profile`에서 재시도할 수 있다 — `profiles_update_self` RLS와 `profiles_onboarding_requires_identity` check만으로 partial-failure를 방어하므로 finalization RPC를 별도로 만들지 않았다.
- 멤버 목록/참여자 선택기는 `AppDataProvider.loadUsers`가 `onboarding_completed=true`만 조회하도록 필터링해 미완료 shell 계정이 노출되지 않는다.

## Corporate Email + Custom Login ID (Phase 4A-2)

```text
supabase/migrations/0004_auth_identity.sql
  — profiles.login_id 추가 + unique index(lower) + validate_login_id() trigger
  — handle_new_user() 갱신: role을 NEW.email 기반으로 DB가 직접 결정 (bootstrap admin 포함)
  — hook_restrict_signup_by_email_domain(event jsonb): Before User Created hook 함수
    (Dashboard > Authentication > Hooks에서 수동 활성화 필요 — API로 제공되지 않는 설정)
lib/auth/login-id.ts        — login_id validation (client, DB trigger와 동일 규칙)
lib/auth/corporate-email.ts — 회사 이메일 domain UX validation (client, enforcement 아님)
lib/supabase/admin.ts       — service_role server-only client (login_id→email resolve 전용)
app/api/auth/login/route.ts               — login_id+password → email 찾아 signInWithPassword, generic error
app/api/auth/resend-confirmation/route.ts — 인증 메일 재발송 (loginId만 받음, 존재 여부 무관 동일 응답)
app/signup/page.tsx — /signup, idle/submitting/verification-sent 상태
app/login/page.tsx  — email/password 대신 login_id/password, 로그인 성공 시 전체 새로고침(cookie 재동기화)
```

- `SupabaseAuthProvider.login`은 더 이상 supabase-js를 직접 호출하지 않고 `/api/auth/login`에 fetch한다 — 서버가 `lib/supabase/server.ts`(cookie 기반)로 `signInWithPassword`를 수행해 세션 cookie를 응답에 실어 보낸다. 클라이언트는 성공 후 `window.location.href = "/"`로 전체 새로고침해 `createBrowserClient`가 새 cookie를 다시 읽게 한다(부분 client-side navigation으로는 in-memory session이 서버발 로그인과 동기화되지 않는다).
- `SupabaseAuthProvider.signUp`은 `supabase.auth.signUp()`을 그대로 쓴다 — `options.data`로 `login_id`/`nickname`만 전달하고 role/status는 전달하지 않는다(client가 권한을 지정할 수 없게).
- email은 profiles에 저장하지 않는다(Phase 4 결정 유지). 본인 email은 client가 `supabase.auth.getUser()`로 직접 조회해 MY 화면에만 표시하고, 다른 사용자의 email은 service_role 없이는 조회 불가능하다.
- email 미인증 session은 로그인한 것으로 취급하지 않는다 — `SupabaseAuthProvider`가 `session.user.email_confirmed_at`이 없으면 profile을 불러오지 않고 `user=null`로 둔다(RouteGuard가 자동으로 `/login`으로 보냄).
