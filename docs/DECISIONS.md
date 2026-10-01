# DECISIONS.md

2026-09
- Local-first / Mock-first 개발. Supabase/Netlify는 로컬 UI 완성 후 연결.
- 스택: Next.js (App Router) + TypeScript + Tailwind CSS.
- 탐조 기록은 종 단위가 아닌 "탐조 활동" 단위로 작성 (하나의 기록에 여러 종 포함).
- 레벨은 DB에 저장하지 않고 totalExp로부터 deterministic 계산.

2026-09 (Phase 1)
- 탐조 기록은 작성 즉시 확정되지 않고, 회장 승인 후 `approved` 상태로 확정된다.
- 사용자 역할은 `member` / `leader` 두 가지만 둔다. 실제 인증은 아직 없고 MY 화면의 mock 사용자 전환으로 테스트한다.
- 개인 도감은 전체 species master list 기반으로, `approved`된 species만 해금된다. `pending`/`revision_requested`는 해금되지 않는다.
- 종별 검토(`SightingSpeciesStatus`)는 데이터 모델에만 반영하고, 이번 Phase 승인/수정요청 액션은 탐조 기록 전체 단위로만 동작한다 (개별 species entry에도 동일 상태를 mirror).

2026-09 (Phase 2)
- 서비스명: 조동아리 / jodongari로 통일 (기존 오기 "조동가리" 수정).
- Apple-inspired visual design: system font stack, 최소 accent color 1개, card는 정보 단위일 때만 사용.
- mobile-first + UX convenience 우선, content-first Feed.
- 홈 화면을 커뮤니티 Feed로 전환하고, 기존 EXP/레벨 dashboard는 MY 화면(개인 profile)으로 이동.
- 좋아요/댓글은 local state로만 구현 (persistence 없음). 사진은 `lib/photo.ts`에서 canvas로 resize/compress 후 data URL로 로컬 보관, 실제 업로드는 하지 않음.
- 최소 입력 기반 탐조 기록: 날짜 기본값(오늘), species는 검색+chip 방식으로 확장성 확보.

2026-09 (Phase 3A)
- 국내 조류 master dataset의 primary source는 **국립생물자원관 국가생물종목록**으로 한다. 참고 검증 자료로 한국조류학회 「한국 조류 목록」을 사용할 수 있으나, 해당 자료 전체를 복제하지는 않는다.
- master dataset은 정적 로컬 파일(`data/birds.json` 등)로 관리한다. runtime external API 호출은 하지 않는다.
- 개인 도감(내 도감) unlock 여부는 `BirdSpecies` 자체에 저장하지 않고, `BirdSpecies × User × Approved Sighting` 조합으로 매번 계산한다 (기존 구조 유지).
- 기본 탐조 기록 단위는 종(species)이다. 아종(subspecies) 단위 해금은 초기 버전 목표로 하지 않는다. source에 아종 row가 존재하면 import 단계에서 제외/정리하되, 판정이 불확실한 taxonomy는 임의로 결정하지 않는다.
- 사용자가 직접 찍은 관찰 사진과 species reference 이미지(도감용)는 구분한다. species reference 이미지는 이번 phase에서 다루지 않는다 (copyright/저장 용량 문제 별도 검토).
- `BirdSpecies.id`는 국명/학명에 의존하지 않는 stable id로 유지한다. source dataset에 안정적인 species identifier가 없다면 import 시 `bird-000001` 형태의 deterministic id를 생성한다. 이 전략은 Supabase 연결 후에도 그대로 재사용한다.
- 도감 기본 정렬은 가나다순(`koreanName` 기준 `localeCompare("ko")`)으로 한다. taxonomy 순서는 기본 정렬로 강제하지 않으며, 향후 별도 정렬 옵션으로 추가할 수 있다.

2026-09 (Phase 3B)
- master dataset source 확정: 기후에너지환경부 국립생물자원관_국가생물종목록_20241231 (파일명 "2025년 국가생물종목록_v1.0.xlsx", https://www.data.go.kr/data/15048041/fileData.do). 전체 62,604종 중 "조류" sheet(617 rows)만 사용.
- license: 공공저작물 제3유형 (출처표시, 변경금지). 원본 XLSX는 repo에 포함하지 않고 `data/source/`에 `.gitignore` 처리 (`data/source/README.md`에 재획득 방법 기록).
- species 판정은 source의 명시적 rank 컬럼(아종/변종/품종 학명 컬럼 값 유무)으로 하며, 이 컬럼이 모두 비어있는 617개 중 597개 row만 species로 채택했다. 학명 형태로 추측 판정하지 않았다.
- ID strategy: source가 제공하는 공식 stable identifier인 KTSN(국가생물종목록번호)을 그대로 사용해 `bird-<KTSN>` 형태로 id를 생성한다 (예: `bird-120000001894`). KTSN이 이미 안정적이므로 별도 sequential id를 생성하지 않는다.
- output 필드는 KTSN 순서가 아니라 `scientificName` → `koreanName` 순으로 재정렬해 저장한다 (표시/재현성 목적, id 자체는 KTSN 기반이라 안정성에 영향 없음).
- 최종 597 species에 duplicate id/국명/학명 없음 (import script 자체 validation 통과).
- 기존 mock sighting(20종)의 speciesId를 실제 dataset id로 매핑했다. 매핑 중 발견된 source 표기 차이:
  - "청딱따구리"/"오색딱따구리"(mock 표기) → source 표기는 "청딱다구리"/"오색딱다구리"(사이시옷 없음). 학명(Picus canus / Dendrocopos major) 기준으로 매핑했고, source 표기는 임의 교정하지 않았다.
  - "백할미새"(mock, 학명 Motacilla alba로 기재) → source에서 "백할미새"는 아종(Motacilla alba lugens) 국명이라 종 단위 목록에서 제외됨. 종 단위 국명은 "알락할미새"(Motacilla alba)이며, 학명이 정확히 일치해 해당 종으로 매핑했다.
  - "촉새"(mock, 학명 Emberiza fucata로 오기재) → source에서 Emberiza fucata의 국명은 "붉은뺨멧새"이고, 실제 "촉새"는 Emberiza spodocephala. mock의 국명("촉새")을 기준으로 올바른 species에 매핑했다.
  - "박새"(mock, 학명 Parus minor로 오기재) → source 학명은 Parus cinereus. 국명 기준으로 매핑.
- englishName은 source에 해당 컬럼이 없어 전 종 undefined로 유지한다.
- import script: `scripts/import-birds.mjs` (신규 devDependency `xlsx` 1개 추가, 런타임에는 사용하지 않음). 재실행 시 동일 input에 대해 byte-identical `data/birds.json`을 생성한다 (hash 비교로 확인).

2026-09 (Phase 3.5)
- Supabase Auth 연결 전, 로컬 UX 검증을 위한 mock 인증을 먼저 구현한다. `LocalAuthProvider`(`lib/local-auth-provider.tsx`)가 `AuthContextValue`(`user`/`isLoading`/`login`/`logout`) interface를 제공하고, 추후 동일 interface를 구현하는 `SupabaseAuthProvider`로 교체한다.
- 로그인 계정은 `member1@jodongari.local` / `member2@jodongari.local` / `leader@jodongari.local`, 공통 비밀번호 `bird1234`이며 기존 `MOCK_USERS`(u-member1/u-member2/u-leader)에 1:1 매핑된다. 이 credential은 로컬 UX 테스트용이며 실제 보안 기능이 아니다.
- session은 `localStorage`에 auth user id만 저장한다 (`jodongari_auth_user_id`). 비밀번호는 저장하지 않는다.
- `AppDataProvider`의 `currentUser`는 더 이상 자체 상태로 전환되지 않고 `LocalAuthProvider`의 로그인 사용자를 그대로 따른다. 기존 개발용 mock 사용자 전환 UI(`UserSwitcher`)는 제거했다 — 계정 전환은 로그아웃 후 다른 계정으로 로그인하는 방식으로 테스트한다.
- route 보호는 client-side `RouteGuard`(`components/RouteGuard.tsx`)가 담당한다: 비로그인 시 `/login`으로, 로그인 상태에서 `/login` 접근 시 `/`로, `/review`는 `leader` role이 아니면 `/`로 redirect한다. 이 Phase에는 middleware를 추가하지 않는다 (session이 client-only localStorage이므로 서버 middleware로는 판단할 수 없음).
- Apple HIG-inspired design 원칙: system font stack, 절제된 accent color 1개, 정보 단위일 때만 card 사용, 44px 수준 touch target, border/separator 우선·shadow는 최소화, bottom navigation 등 제한된 위치에만 옅은 translucent(backdrop-blur) 사용.
- semantic color token을 `app/globals.css`의 CSS 변수(`--background`, `--surface`, `--muted`, `--border`, `--accent`, `--danger`, `--warning`, `--success` 등)로 중앙 관리하고, dark mode는 `prefers-color-scheme: dark` media query로 자동 적용한다 (별도 theme toggle 없음). `:focus-visible`과 `prefers-reduced-motion`도 전역으로 처리한다.

2026-09 (Phase 3.9)
- 날짜 선택 버그 원인: `QuickDateField`에서 "날짜 선택"을 누르면 `DateField`(투명 `<input type="date">`)가 나타나지만, 이전에는 클릭이 focus만 시키고 native picker를 자동으로 열지 않아 사용자에게는 "아무 반응 없음"으로 보였다. `formatDateLabel`이 focus 전후 거의 동일한 텍스트를 보여줘 변화가 더 눈에 띄지 않았다. 수정: `DateField`가 mount 시 `HTMLInputElement.showPicker()`를 즉시 호출하고(`autoOpen` prop), 미지원/실패 시 `.focus()`로 fallback한다. `max` prop으로 오늘 이후 날짜를 선택하지 못하게 native `max` attribute를 사용한다 (기록 특성상 미래 날짜 불필요).
- 멤버 EXP 페이지(`/members`)는 기존 `lib/exp.ts`/`lib/encyclopedia.ts`를 그대로 재사용하고 새 계산 로직을 만들지 않는다. 정렬은 EXP 내림차순, 순위 숫자/메달/podium UI는 사용하지 않는다 (동호회 성격상 과도한 경쟁 강조 지양).
- Navigation: mobile bottom nav는 leader 기준 이미 6개 항목이라 "멤버"를 추가하면 7개로 좁아진다. 따라서 "멤버"는 desktop top nav에만 노출하고, mobile에서는 MY 페이지의 "멤버 활동 보기" 링크로 접근한다 (Option A).
- 닉네임/비밀번호 변경은 향후 Supabase Auth(`updateUser`)로 교체하기 쉽도록 최소 profile layer(`lib/profile-store.ts`)로 분리했다. localStorage key 하나(`jodongari_profile_overrides`)에 `{ [userId]: { nickname?, passwordHash? } }` 형태로 저장해 여러 key로 흩어지지 않게 했다.
- `AppDataProvider`가 소유하던 정적 `MOCK_USERS` 배열을 `useState`로 전환하고 nickname override를 mount 시 병합한다. `users` 배열이 유일한 참조원이므로 (`nameOf(users, id)` 패턴) nickname 변경이 Feed/멤버/검토 화면에 자동 반영된다. sighting 등 다른 local state와 동일하게 하드 리로드 시에는 초기화되지만, nickname/password는 localStorage override로 복원된다.
- 비밀번호는 local mock이라도 plaintext로 저장하지 않는다. Web Crypto `crypto.subtle.digest('SHA-256', ...)`로 hex hash만 저장하고 비교한다 (별도 라이브러리 추가 없음). 이는 production 보안 모델이 아니라 "MY 화면에서 값을 저장은 하되 평문은 피한다"는 최소 원칙이다.

2026-09 (Phase 3.10)
- role: `member` / `leader` / `admin` 3단계. admin은 사용자 관리(role/active-inactive) + 검토 접근까지 겸한다. leader와 admin 권한은 별도 유지(검토=신뢰성 검토, 관리자=사용자/앱 운영)하되 admin은 검토도 가능하다.
- admin scope는 이번 Phase에서 사용자 목록 확인/role 변경/active-inactive 전환까지만 다룬다. 초대/공지/시스템 설정 등은 다루지 않는다.
- role/status override는 기존 `lib/profile-store.ts`(닉네임/비밀번호 override와 동일한 localStorage key)를 확장해 저장한다. 새 key를 추가하지 않았다.
- 마지막 admin 보호: admin이 0명이 되는 것을 막기 위해 `updateUserRole`/`updateUserStatus`(`lib/app-data-context.tsx`)에서 "현재 대상이 admin이고, 변경 후 active admin이 0명이 되는 경우"를 차단한다.
- 관리자 화면에 표시하는 이메일은 `User`/profile에 저장하지 않고 `local-auth-provider`의 mock credential 목록에서 `CREDENTIAL_EMAILS`로 파생한다. Supabase 전환 시 email은 Auth 쪽 개념이라 profiles table에 넣지 않는 구조와 동일하게 유지하기 위함.
- 비활성(inactive) 계정은 로그인 자체를 차단한다(`LocalAuthProvider.login`). RouteGuard가 아니라 인증 단계에서 막는다 — 세션이 이미 있는 상태에서 상태만 바뀌는 경우까지 커버하지는 않는다(그 경우는 다음 로그인 시도부터 차단됨).
- 탐조/기록 navigation 통합: `기록`은 top-level route로는 유지하되(`/record`, 기존 flow 그대로) nav에서는 제거하고 탐조 hub의 "기록하기" CTA로만 진입한다. URL 구조 자체는 이번 Phase에서 바꾸지 않는다.
- 탐조 기간 필터(전체/최근 7일/최근 30일/기간 선택)는 순수 함수(`lib/period.ts`)로 분리해 local filtering과 UI를 분리했다. Supabase 전환 시 이 함수들을 그대로 query 조건으로 옮길 수 있도록 하기 위함이다.
- media 모델: `photos: string[]` → `media: SightingMedia[]` (`{ id, type: "image"|"video"|"audio", name, mimeType, size, url }`)로 확장했다. 사진/영상/오디오를 별도 배열로 나누지 않고 하나의 collection으로 관리한다.
- image는 기존과 동일하게 `lib/photo.ts`의 canvas resize/compress 결과(data URL)를 사용한다. video/audio는 큰 파일을 base64로 들고 있지 않기 위해 `URL.createObjectURL(file)`을 그대로 사용하고, 삭제/언마운트 시 `URL.revokeObjectURL()`로 해제한다. 즉 새로고침하면 video/audio preview는 사라진다(Phase 4 Storage 연결 전까지는 의도된 제한).
- media 제한값(개수 5, 이미지 10MB/영상 100MB/오디오 30MB)은 `lib/media.ts` 한 곳에서 상수로 관리한다. MIME type prefix(`image/`, `video/`, `audio/`) 기준으로 판정하고 특정 확장자를 하드코딩하지 않는다.
- 날짜 선택 반복 open 버그의 근본 원인: `QuickDateField`가 `customOpen` state가 이미 true인 상태에서 "날짜 선택"을 다시 눌러도 state가 바뀌지 않아 `DateField`가 remount되지 않고, mount-effect 기반 `autoOpen`이 재실행되지 않았다. 수정: `DateField`를 `forwardRef`로 감싸 `open()`을 imperative하게 노출하고, `QuickDateField`의 클릭 핸들러가 이미 열려 있는 경우 ref를 통해 매번 명시적으로 `showPicker()`를 재호출한다.
- Bottom nav는 항상 5개(홈/탐조/도감/멤버/MY)로 고정한다. leader의 "검토", admin의 "관리자"는 desktop TopNav에는 직접 노출하되(공간이 충분하므로), mobile bottom nav에는 추가하지 않고 MY 페이지 "운영" 섹션에서 접근한다.
- 브랜드 이미지: `img/jodongari.jpeg`(사용자 제공, 1254×1254 정사각형, 로고+워드마크 포함)를 원본 그대로 `public/img/jodongari.jpeg`에 복사해 사용한다(재인코딩 없음). 로고 자체에 "조동아리" 워드마크가 포함돼 있어 Login 화면에서는 별도 `<h1>` 텍스트를 시각적으로 중복 노출하지 않고 `sr-only`로만 유지한다. Home은 이미 텍스트 타이틀("조동아리")이 있어 이미지 사용을 추가하지 않았다(반복 노출 방지).

2026-09 (Phase 3.11)
- native `<input type="date">` + `showPicker()` 기반 날짜 UX를 완전히 제거했다. 브라우저별 appearance/positioning 차이가 근본 원인이었고, 새 library 없이 순수 React state로 대체 가능해 `components/DateField.tsx`를 삭제했다.
- Custom calendar system을 `components/date/`에 신설: `Calendar.tsx`(단일 날짜/기간 공용 core, 월 grid 렌더링만 담당), `CalendarPopover.tsx`(desktop popover / mobile bottom sheet 공용 shell — 바깥 클릭·Escape로 닫힘), `DatePicker.tsx`(단일 날짜), `DateRangePicker.tsx`(기간, 내부 pending state로 첫/두번째 클릭을 시작일/종료일로 정렬).
- Desktop popover와 mobile bottom sheet는 별도 컴포넌트가 아니라 반응형 Tailwind 클래스 하나로 구현했다(`sm:` 분기). `matchMedia`/JS 브레이크포인트 감지를 추가하지 않기 위한 선택.
- Calendar의 열림/닫힘은 각 wrapper 컴포넌트의 `isOpen` React state로만 관리한다. mount effect나 `autoOpen` side effect에 의존하지 않으므로 "닫은 뒤 즉시 재오픈"이 항상 동작한다(Phase 3.10에서 있었던 반복-오픈 버그의 재발 여지 자체가 없어짐).
- `QuickDateField`는 segmented control(오늘/어제/직접 선택)의 폭을 `flex-1`에서 `w-fit`으로 바꿔 화면 전체를 차지하지 않게 했고, 날짜 표시를 `9월 27일 · 일요일` 형태의 compact label로 이동했다.
- 탐조 기간 필터의 "기간" segment 버튼 자체가 `DateRangePicker`의 trigger를 겸한다(별도 시작일/종료일 필드 두 줄을 렌더링하지 않기 위함). 선택된 기간은 같은 자리에서 `9월 14일 – 9월 27일` compact label로 대체되어 필터 영역 높이가 변하지 않는다.
- `lib/period.ts`의 pure filtering 함수는 그대로 유지했다(`rangeForPreset`, `isWithinRange`) — UI 교체와 무관하게 Supabase 전환 시 query 조건으로 옮길 수 있는 구조를 지킨다.
- Sightings/Members 목록을 개별 rounded card 반복에서 `divide-y` 기반 단일 리스트로 전환해 카드 반복에 의한 catalog 느낌을 줄였다. Sightings 리스트의 raw ISO 날짜(`s.date` 그대로 노출)도 `formatShortKoreanDate`로 교체했다.
- 이번 Phase는 Record/Sightings/Members처럼 날짜 UI 또는 반복 리스트를 직접 사용하는 화면에 재설계를 집중했고, Home/Encyclopedia/MY/Review/Admin의 hero composition·카드 밀도 재설계는 범위에서 제외했다(`docs/UI_REVIEW.md` Phase 3.11 알려진 이슈 참고).

2026-09 (Phase 3.13)
- Phase 3.12에서 도입한 black cinematic hero(Home/Login)를 폐기하고 "Bright Apple + Air + Sky" 방향으로 교체했다. 조동아리 대표 이미지(`img/jodongari.jpeg`)가 흰색 배경을 포함하고 있어 검정 위에서 이미지의 흰 영역이 따로 떠 보였고, 탐조라는 서비스 성격에도 밝은 하늘/공기감이 검정보다 자연스럽다고 판단했다.
- `--cinematic-bg`/`--cinematic-text`/`--cinematic-secondary` 토큰을 삭제했다(사용처가 Home/Login 두 곳뿐이었고, 둘 다 white 기반으로 전환되어 더 이상 필요하지 않음). 대신 `--surface-blue`(#f5faff, air blue)와 `--accent-strong`(#0066cc, strong blue) 토큰을 추가해 white → gray → pale-blue → blue의 depth hierarchy를 하나로 통일했다.
- Home hero: 검정 배경 제거, 흰 배경 + 우상단 8% opacity radial blue glow(`rgba(0,113,227,.08)`)로 최소한의 빛만 남겼다. headline 2줄 중 두 번째 줄("오래 기억하는 방법.")만 accent blue로 강조하고 나머지는 `--foreground`를 유지해 전체를 파랗게 칠하지 않았다. 브랜드 이미지를 감싸던 rounded card + 진한 shadow를 제거해 이미지 자체의 흰 배경이 페이지 흰 배경과 자연스럽게 이어지도록 했다.
- Login: desktop 왼쪽 패널을 검정에서 `--surface-blue` + 미세한 radial blue glow로 교체했다. 로고를 감싸던 card(rounded + border)도 제거했다. 오른쪽 form은 기존 white 구조를 그대로 유지했다(변경 불필요).
- black cinematic panel을 사용하던 화면은 Home/Login 두 곳뿐이었음을 전체 grep으로 확인했다(`bg-cinematic`, `text-cinematic`, `bg-black`, `#000000` 검색). Sightings/Record/Encyclopedia/Members/MY/Review/Admin은 Phase 3.12부터 이미 white+blue 기반이라 이번 Phase에서 변경하지 않았다.

2026-09 (Phase 3.14)
- 사용자가 교체한 새 투명 배경 PNG(`img/jodongari.png`, 1254×1254, illustration 성격의 새 캐릭터, 텍스트 없음)를 Home/Login의 brand illustration으로 사용한다. `public/img/jodongari-illustration.png`로 원본 그대로 복사했다(재인코딩 없음).
- 기존 원형 로고(`public/img/jodongari.jpeg`, 워드마크 포함)는 삭제하지 않고 nav(TopNav/BottomNav)의 compact brand mark로 계속 사용한다 — nav는 brand identification, hero는 brand personality로 역할을 분리했다(navigation 24~32px 크기로 새 illustration을 억지로 축소하지 않기 위함).
- Home hero: 기존 "headline | 원형 로고" 2-column template을 버리고, headline+subtitle과 새 illustration을 하나의 relative container 안에 배치해 illustration이 우측 하단에 bottom-anchored로 겹치는 composition으로 바꿨다. 텍스트 위에 있던 작은 "조동아리" eyebrow label은 illustration 자체가 브랜드 정체성을 전달하므로 제거했다(nav 로고 + hero illustration + 텍스트 라벨 3중 노출 방지). `min-h` 강제값 대신 padding 기반 크기로 바꿔 hero 아래 빈 공간을 줄였다.
- Login: 기존 45/55 split과 `--surface-blue` 왼쪽 패널 구조는 유지하되, 왼쪽의 작은 로고 이미지를 새 illustration(패널 폭의 약 60%)으로 교체하고 하단에 크게 배치했다. 오른쪽 form 영역에는 "로그인 / 조동아리 멤버 계정으로 계속하세요." heading을 추가해 form의 목적성을 보강했다.
- 새 PNG는 투명 배경이므로 어느 쪽에서도 별도 box/원형 card로 감싸지 않았다(Phase 3.13에서 이미 카드/그림자 제거 원칙을 확립했고 이번 Phase도 동일하게 유지).

2026-09 (Phase 3.16)
- Home의 역할을 재정의했다: Home은 더 이상 social Feed 화면이 아니라 "브랜드 Hero + 내 탐조 요약(nickname/level/관찰 종 수/탐조 횟수/최근 발견)"만 담당한다. 멤버 탐조 기록 discovery/탐색은 전부 `/sightings`로 통합했다. Feed 전용이던 `components/FeedCard.tsx`는 삭제했고, 좋아요/댓글 기능은 Sighting Detail(`/sightings/[id]`)로 옮겨 그대로 유지했다.
- `/sightings`에 scope filter(`내 기록`/`전체 기록`, 기본값 `내 기록`)를 추가했다. `내 기록`은 기존 `isContributor` 기준(author 또는 participant) 그대로이고, `전체 기록`은 `status === "approved" || isContributor(...)`(다른 사람의 draft/pending은 제외)로 정의했다. 이 규칙은 `lib/sighting-access.ts`의 `isVisibleInAllScope`/`filterByScope` 순수 함수로 분리해 목록 필터링과 상세 접근 권한 판정 모두에서 재사용한다(spec 요구: "필터 로직을 UI 안에 중복 구현하지 않는다"). scope filter와 기존 date filter(`lib/period.ts`)는 서로 독립적으로 조합된다.
- 탐조 기록 목록을 divider 리스트에서 "명확한 clickable record surface"(흰 배경, `border-border`, `rounded-[16px]`, hover 시 `bg-surface-hover`)로 바꿨다. 전체 record가 `<Link>`이므로 별도 outer wrapping card 없이 keyboard/의미상 접근이 자연스럽다. 목록에서는 좋아요/댓글을 상호작용 버튼이 아니라 `♡ N` / `댓글 N` summary 텍스트로만 노출한다(실제 좋아요/댓글은 detail에서).
- 탐조 기록 상세 route `/sightings/[id]`를 신설했다. 접근 가능 여부는 `isVisibleInAllScope`와 동일 규칙(승인됨이거나 본인이 기여한 기록)이며, 조건을 만족하지 않거나 id가 없으면 크래시 없이 "기록을 찾을 수 없어요." 상태를 보여준다. 좋아요/댓글은 기존 `toggleLike`/`addComment`를 그대로 재사용한다.
- 리더 검토(`/review`)도 list → detail 구조로 전환했다. `/review`는 compact summary(작성자/날짜·장소/species summary/함께한 멤버/"검토 대기" 진입 화살표)만 보여주고, 실제 media 확인 → 작성자가 기록한 종 → 최종 종 편집(기존 Phase 3.15 검색/추가/제거 로직 그대로) → 회장 메모 → 승인은 `/review/[id]`에서 수행한다. 승인 성공 시 `/review`로 돌아가며, 이미 승인되었거나 존재하지 않는 id는 "검토할 기록을 찾을 수 없어요." 상태로 처리한다.
- route guard(`components/RouteGuard.tsx`)의 검토 보호 경로 판정을 `pathname === "/review"` 정확 일치에서 `pathname === "/review" || pathname.startsWith("/review/")`로 넓혀 `/review/[id]`도 leader/admin 전용으로 막는다. `/sightings/[id]`는 role이 아니라 기록별 조건이라 RouteGuard가 아니라 페이지 자체에서 판정한다(직접 URL 접근 시에도 not-found로 처리되어 우회되지 않음).
- Home의 "탐조 횟수"는 MY 페이지가 이미 쓰던 정의(`sightings.filter(isContributor).length`, 상태 무관)를 그대로 재사용했다 — 별도 계산 로직을 새로 만들지 않기 위함이다. "종 발견"은 기존 `buildEncyclopedia`의 unlocked count(approved 기준)를 그대로 쓴다. 이 두 숫자는 role과 무관하게 모든 사용자(member/leader/admin)에게 동일한 구조로 노출된다.

2026-09 (Phase 3.15)
- 공동 탐조: `Sighting`에 `participantUserIds`(작성자 제외, 함께 탐조한 멤버)를 추가했다. `isContributor(sighting, userId)` helper(`lib/types.ts`)로 "authorId 또는 participantUserIds에 포함"을 판정하고, EXP(`lib/exp.ts`)/도감(`lib/encyclopedia.ts`)/개인 활동 집계(MY, Sightings, Members)가 모두 이 helper 하나로 통일해 참조한다 — 작성자와 동행 멤버가 동일한 기준으로 EXP/해금/탐조 횟수를 받는다.
- `SightingSpeciesEntry`/`SightingSpeciesStatus`를 제거하고 `Sighting.species`를 `speciesIds: string[]`로 단순화했다. 기존 종별 status는 실제로는 항상 sighting 전체 status와 동일하게 mirror되기만 했던 미사용 abstraction이었고(Phase 1 DECISIONS 참고), 리더가 종 목록 자체를 add/remove/replace하는 이번 Phase 워크플로에서는 배열 하나가 훨씬 단순하다.
- 리더 검토 workflow를 "수정 요청" → "종 정정 후 승인"으로 전환했다. `revision_requested` 상태와 `requestRevision` action을 완전히 제거하고, `SightingStatus`는 `draft | pending | approved`만 남겼다. `approveSighting(sightingId, speciesIds, leaderNote?)`가 최종 species 목록과 선택적 메모를 함께 확정한다.
- `reviewComment`(반려 사유, danger 톤)를 `leaderNote`(승인 시 남기는 선택적 메모, neutral 톤)로 이름과 의미를 바꿨다. Sightings 개인 목록에서도 danger 배경 대신 `surface-secondary` 톤으로 표시한다.
- Login: desktop heading(`로그인` / `조동아리 멤버 계정으로 계속하세요.`)에 `text-center`를 추가했다. form control(label/input/button)은 기존 좌측 정렬을 그대로 유지한다.
- Home hero: 이미지를 absolute + `-right-4` bottom-anchor하던 방식을 버렸다. section의 `overflow-hidden`과 이미지 실제 렌더 높이가 어긋나며 위쪽이 잘려 보이는 layout overflow였다. flex row(`items-end justify-between`)로 텍스트와 이미지를 같은 문서 흐름에 두고 `object-contain`으로 교체해, 이미지 높이가 항상 section 안에 포함되도록 했다. 크기는 mobile 60%/tablet(`md:`) 38%/desktop(`lg:`) 30%로 가이드값에 맞췄다.

2026-09 (Phase 3.18)
- MY 페이지 왼쪽 쏠림의 실제 원인: Phase 3.17 보고서는 "다른 페이지와 동일한 좌측 기준선으로 정렬"하려고 MY의 `mx-auto`를 제거했다고 기록했지만, 실제로는 다른 모든 페이지(Home/Sightings/Members/Record/Encyclopedia/Review/Admin)가 전부 `mx-auto` + `max-w-*`로 가운데 정렬되어 있었다. MY만 `mx-auto` 없이 `max-w-[600px]`였기 때문에 `main`의 넓은 flex 영역 안에서 왼쪽에 붙어 보였다 — Phase 3.17 보고서의 "확인" 내용이 실제 코드 상태와 달랐던 사례.
- MY를 `mx-auto max-w-[1080px]`(medium-wide) 컨테이너로 바꾸고, profile(닉네임/역할/레벨·EXP progress/요약 stats)을 상단 full-width section으로, 그 아래를 `lg:grid-cols-[1fr_360px]` 2-column(좌: 최근 발견, 우: 운영+계정)으로 재구성했다. 1024px 미만에서는 grid가 자동으로 1-column stack된다.
- MY의 "관찰 종 수 / 탐조 횟수" 2블록 통계를 Home/Members와 동일한 "N종 발견 · 탐조 N회" 한 줄 표현으로 통일했다(용어 및 시각적 표현 일관성).
- **Cross-screen 수치 불일치 버그 발견 및 수정**: Home과 MY의 "탐조 횟수"는 `isContributor` 결과를 status 무관하게 전부 세고 있었던 반면, Members의 "탐조 N회"는 `status === "approved"`만 셌다. 즉 pending/draft 기록이 있으면 Home/MY와 Members에 서로 다른 숫자가 보이는 실제 버그였다. `lib/exp.ts`에 `countApprovedSightings(userId, sightings)` 단일 helper를 추가하고 Home/MY/Members 세 곳 모두 이 helper로 통일했다(개별 화면 patch 금지 원칙에 따라 공용 helper로 해결).
- 전역 `main`의 desktop bottom padding을 `lg:pb-10`(40px)에서 `lg:pb-16`(64px)으로 올렸다(spec 권장 64~96px 하한 충족). mobile은 기존 `pb-24` + `env(safe-area-inset-bottom)`로 이미 충분해 변경하지 않았다.
- Shared EXP E2E 재검증(author=박회장/leader, participant=관리자/admin, 종=물까치 신규): 승인 전 양쪽 수치 불변 확인 → 승인 후 두 계정 모두 EXP +32, 종 +1, 탐조 +1 정확히 일치, Members/MY/Home/Encyclopedia/Sightings 내 기록 전 화면에서 동일 값 확인. `isContributor` 단일 정의가 EXP/도감/탐조 횟수 전부에 이미 일관되게 쓰이고 있음을 실제 계정 승인 흐름으로 확인했다(코드 리뷰만으로 끝내지 않음).
- mock sighting 데이터는 in-memory 상태(localStorage 미사용)라 하드 리로드/재로그인 시 fixture 기본값으로 초기화된다. 이번 Phase에서 만든 테스트용 기록(한강공원·물까치)은 별도 정리 없이 자동으로 사라지며 기본 mock data 파일은 변경하지 않았다.

2026-09 (Phase 3.20)
- MY를 dashboard형 2-column(profile rail + 최근 발견/운영/계정)에서 모든 role이 동일한 minimal 구조(identity → Lv/EXP → 활동 요약 → 계정)로 되돌렸다. 최근 발견과 운영(탐조 기록 검토/관리자) shortcut을 완전히 제거했다 — 운영 기능은 global navigation이 이미 담당하고, 최근 발견은 도감 화면과 중복이었다.
- role별로 달라지는 요소는 닉네임 아래 role label 한 줄뿐이며, layout 자체는 member/leader/admin 모두 동일하다(section 조건 분기 없음).
- container를 `mx-auto max-w-[720px]` centered single-column으로 변경(desktop에서도 2-column grid 미사용).

2026-09 (Phase 3.22)
- **Sighting list/detail participant 불일치 버그 수정**: `/sightings` 목록의 "함께한 멤버"가 뷰어(currentUser) 기준으로 companion 목록을 재계산(`isAuthor ? participantUserIds : [authorId, ...participantUserIds].filter(id !== currentUser.id)`)하고 있었다. 뷰어가 작성자가 아닐 때 authorId를 companion 배열에 끼워 넣고 실제 participant는 자기 자신이라 필터링되어 사라지는 경우, 작성자 이름이 "함께한 멤버"로 잘못 표시됐다(s-6 사례). `/sightings/[id]`, `/review`, `/review/[id]`는 이미 `sighting.participantUserIds`를 뷰어와 무관하게 그대로 표시하고 있었으므로 목록만 다른 기준을 쓰고 있던 것이 원인.
- 수정: `/sightings` 목록도 `sighting.participantUserIds`를 뷰어 조건 없이 그대로 매핑하도록 통일했다. "Sighting이 source of truth"이며, author/participant/species 등 모든 표시값은 항상 `sighting.*` raw field에서 id 기반으로 파생한다 — 목록/상세/검토가 각자 다른 파생 로직을 만들지 않는다.

2026-09 (Phase 3.23)
- Home/Login이 쓰던 transparent bird illustration(`public/img/jodongari-illustration.png`)을 desktop top nav(`TopNav`)의 brand asset으로도 통일했다. nav에서는 이미지 안에 wordmark가 없어 기존처럼 `조동아리` 텍스트를 그대로 유지하고, 이미지만 32×32 `object-contain`으로 교체했다(기존에는 원형 크롭된 구형 `jodongari.jpeg` 사용). 구형 asset은 이 nav 외에 다른 곳에서 쓰이지 않는 것을 grep으로 확인 후 `public/img/jodongari.jpeg`를 삭제했다.
- **탐조 기록 파일 선택 버그**: `/record`의 미디어 input은 이미 실제 `<input type="file">`이었고(disabled/hidden/ref.click() 등 문제 없음), Playwright로 직접 클릭 → 실제 OS file chooser가 열리고 image/video/audio 선택·미리보기·같은 파일 재선택·제출까지 전부 정상 동작함을 확인했다 — 코드 검토만으로 "정상"이라 결론 내리지 않고 실제 인터랙션으로 재현을 시도했으나 재현되지 않았다. 다만 기존 구조는 브라우저 기본 `::file-selector-button`(영문 로케일에서 "Choose File") 렌더링에 의존하고 있어 스타일 커스터마이징이 제한적이고 iOS Safari에서 기본 버튼 렌더링이 기기/버전별로 다를 수 있어, 더 안정적인 `<label htmlFor>` + `sr-only` 처리된 `<input type="file">` 구조로 교체했다(input은 DOM에 그대로 존재, `ref.current.click()` 방식은 쓰지 않음). accept/multiple/기존 처리 로직(compression, object URL, 5개 제한)은 변경하지 않았다.

2026-09 (Phase 3.24)
- 실사용자 환경에서 Phase 3.23의 `label htmlFor` + 단일 mixed-accept(`image/*,video/*,audio/*`) input 구조가 여전히 무반응이었다는 보고에 따라, generic single media input 자체를 폐기했다. 대신 "무엇을 어디서 가져올지" 먼저 고르는 explicit source picker(`components/MediaSourcePicker.tsx`)를 도입했다: 사진 또는 영상 / 카메라로 촬영(모바일 전용) / 녹음 파일 / 파일에서 선택.
- media-type별로 `<input type="file">`을 4개로 분리했다(photo/video: `image/*,video/*` multiple, camera: `image/*,video/*` + `capture="environment"`, audio: `audio/*` multiple, generic: `image/*,video/*,audio/*` multiple — pdf 등 미지원 포맷은 애초에 허용하지 않음). 각 input은 `sr-only`로 DOM에 항상 존재하며, source picker의 각 action `onClick` 안에서 동기적으로 `inputRef.current.click()`을 호출한 뒤(await/setTimeout 없이) picker를 닫는다 — label activation이 실사용자 환경에서 불안정했던 전례가 있어, 명확한 user gesture(버튼 클릭) 안에서의 직접 `ref.click()`으로 전환했다.
- source picker UI는 새로 만들지 않고 `DatePicker`/`DateRangePicker`가 쓰던 `CalendarPopover`(desktop popover / mobile bottom sheet, backdrop, Escape, outside-click 처리)를 그대로 재사용했다. 다만 날짜 선택 맥락의 "완료" 라벨이 media picker에는 맞지 않아 `closeLabel` prop(기본값 "완료")만 추가해 "취소"로 override할 수 있게 했다.
- 파일 선택 이후 처리(type 판별, 용량 체크, compression, object URL, 5개 제한, 에러 메시지)는 기존 `lib/media.ts`의 `buildSightingMedia` 공통 handler를 그대로 쓴다 — input이 4개로 늘었다고 처리 로직을 복제하지 않았다. 각 input의 `onChange`는 `e.target`을 직접 초기화(`value = ""`)해 동일 파일 재선택도 change 이벤트가 발생하도록 했다.

2026-09 (Phase 3.25)
- **desktop layout 붕괴 원인**: `MediaSourcePicker`가 재사용하던 `CalendarPopover`는 `sm:w-auto`(내용 기준 shrink-to-fit)였는데, 실제 트리거를 감싼 `div.relative.w-fit`(버튼 크기만큼만 차지)이 popover의 containing block이 되면서 available width가 거의 0으로 좁혀졌다. 그 결과 각 row의 한글 title이 한 글자씩 줄바꿈되는 세로 텍스트 붕괴가 발생했다. `CalendarPopover`는 title/`closeLabel` prop을 원래대로 되돌리고(calendar 전용), `MediaSourcePicker`는 고정 폭(`sm:w-[340px]`)을 갖는 전용 shell을 직접 구현해 분리했다. `DatePicker`/`DateRangePicker`는 변경 없이 그대로 동작한다.
- **native file input activation 방식 전환**: Phase 3.24의 `inputRef.current.click()` programmatic activation을 완전히 폐기했다. 각 source row(`사진 또는 영상`/`카메라로 촬영`/`녹음 파일`/`파일에서 선택`)를 `position: relative` container로 만들고, 그 위에 실제 `<input type="file">`을 `absolute inset-0 opacity-0 cursor-pointer`로 투명하게 덮었다(`display:none`/`sr-only`/`pointer-events:none` 금지, z-index는 자연스러운 DOM 순서로 visible UI 위에 위치). 사용자의 실제 click이 항상 input element 자체에 trusted gesture로 전달되도록 해, programmatic click의 browser별/실기기별 불안정성을 구조적으로 제거했다.
- picker를 닫는 시점도 바꿨다: source row `onClick`에서 즉시 `setOpen(false)` 하던 것을 제거하고, input의 `onChange`(파일이 실제 선택됐을 때만 발생)에서 기존 처리 파이프라인 실행 후 picker를 닫는다. OS picker에서 사용자가 취소하면 `onChange`가 발생하지 않으므로 picker가 그대로 열려 있고, 사용자는 별도 `취소` 버튼으로 닫을 수 있다.
- `MediaSourcePicker`는 이제 `onSelect(kind)` 대신 `onFileChange(e)` 하나만 prop으로 받는다 — kind별 ref 분기를 부모(`app/record/page.tsx`)에서 없앴고, input 4개도 picker 내부로 옮겨 트리거 버튼 근처에 4개의 `sr-only` input을 흩어놓던 구조를 정리했다. `buildSightingMedia` 처리 파이프라인과 `handleMediaSelect`(용량/개수 제한, 에러 메시지, `value=""` 리셋)는 그대로 재사용했다.
- OS native file chooser 자체가 실제로 열리는지는 자동화 환경에서 완전히 검증할 수 없다 — Playwright/Chrome MCP로는 input이 `display:none`이 아니고, picker 전체를 실제로 덮고, `pointer-events`가 활성화되어 있고, disabled가 아님을 DOM 레벨에서 확인했다. `capture="environment"` 카메라 옵션의 실기기(iPhone Safari 등) 동작은 별도 기기 확인이 필요하다.

2026-09 (Phase 3.26)
- **File picker root-cause 진단 결과: 코드에는 defect가 없다.** `/record`에 스타일링 없는 raw `<input type="file">`(TEST 1)와 기존 `MediaSourcePicker` overlay input(TEST 3)을 Playwright(Chromium 엔진, real user gesture로 클릭)로 각각 직접 클릭한 결과 둘 다 OS native file chooser가 정상적으로 열렸다(TEST 1: O, TEST 3: O). document capture-phase에서 pointerdown/mousedown/click 이벤트를 실시간 로깅한 결과 `미디어 추가` 버튼 → overlay `<input>` 순으로 이벤트가 그대로 도달했고 `defaultPrevented`는 한 번도 true가 아니었다. `grep -rn preventDefault app components lib` 결과 `app/login/page.tsx`의 로그인 폼 제출 한 곳뿐이며 file input activation 경로와 무관하다.
- MediaSourcePicker DOM 구조 재확인: 각 row는 `<button>`/`<label>` 안에 `<input>`이 중첩되지 않은 순수 `<div>` wrapper이고, input은 `absolute inset-0 opacity-0 cursor-pointer`로 row 전체를 덮으며 `display:none`/`visibility:hidden`/`pointer-events:none`이 아니다. backdrop(`fixed inset-0 bg-black/25`)은 mobile(`sm:hidden`)에서만 렌더되고 panel(`z-50`)보다 낮은 스택이라 desktop popover 경로에는 관여하지 않는다. outside-click 핸들러(`document.mousedown`)는 `panelRef.contains(target)`이면 즉시 return하고 `preventDefault`를 호출하지 않는다.
- 결론: 이번 Phase의 diagnostic matrix(TEST 1 O, TEST 3 O, 이벤트 clean, preventDefault 없음)는 이 코드베이스의 `MediaSourcePicker` 자체가 native file input activation을 막는 구조적 결함이 아님을 가리킨다. 실사용자가 보고한 "아무 반응 없음"은 이 diff에서는 재현되지 않았다 — 실제 desktop Chrome 환경 요인(확장 프로그램 간섭, 캐시된 구버전 JS 번들, OS 파일 다이얼로그 권한/차단 등)일 가능성이 높다. 코드는 변경하지 않았고(진단용 raw input은 확인 후 제거), 사용자에게 실제 Chrome에서 하드 리프레시(캐시 무시) 및 확장 프로그램 비활성화 상태 재현을 요청한다.
- 참고: Claude in Chrome 확장(실사용자의 실제 브라우저 프로필)이 이 세션에 연결되지 않아 "사용자의 진짜 데스크톱 Chrome"에서 직접 클릭하는 것은 이번 Phase에서 수행하지 못했다 — Playwright의 별도 Chromium 인스턴스로 대체 검증했다는 한계를 명시한다.

2026-09 (Phase 4)
- Supabase backend를 채택한다. 패키지는 `@supabase/supabase-js` + `@supabase/ssr`(App Router 공식 패턴) 2개만 추가했다.
- bird master(597종)는 그대로 `data/birds.json` 정적 파일로 유지하고 DB에 복제하지 않는다. `sighting_species.species_id`는 local id(`bird-<KTSN>`)를 그대로 저장하며 FK는 걸지 않는다(spec 그대로).
- 탐조 기록을 `sightings` + `sighting_participants`(공동 탐조자) + `sighting_species`(종) + `sighting_media` 4개 relational table로 정규화했다 — 기존 mock의 배열 필드(`participantUserIds`, `speciesIds`, `media`)를 그대로 JSON 컬럼에 두지 않고 관계형으로 분리했다(spec 요구).
- EXP/레벨은 계속 `lib/exp.ts`의 순수 함수로 derived 계산한다. DB에 EXP 컬럼을 두지 않는다 — `sightings`를 그대로 읽어 넘기면 기존 함수가 무변경으로 동작한다.
- 개인 도감 unlock도 별도 table 없이 approved sighting(author 또는 participant)의 species union으로 계속 계산한다(`lib/encyclopedia.ts` 무변경 예정).
- 모든 user-facing table에 RLS를 활성화했다. sightings read 규칙은 기존 `lib/sighting-access.ts`(`isVisibleInAllScope`)와 동일하게 "approved이거나 본인이 author/participant"로 맞췄고, leader/admin은 status 무관 전체 read를 추가로 허용했다(review workflow에 필요).
- profiles의 role/status는 admin만 변경 가능하도록 trigger(`protect_profile_role_status`)로 강제하고, 마지막 admin 보호는 기존 application layer(`updateUserRole`/`updateUserStatus`) 로직과 동일한 조건을 DB trigger(`protect_last_admin`)로도 이중 방어했다.
- Storage bucket `sighting-media`는 private으로 생성하고, path를 `{user_id}/{sighting_id}/{media_id}-{safe_filename}`로 강제해 업로드 시 첫 segment가 `auth.uid()`와 일치하는지만 policy로 검증한다(사용자 파일명을 path에 그대로 신뢰하지 않기 위해 media_id를 prefix로 둔다).
- 로그인 방식은 email + password로 확정했다(동호회 규모상 magic link는 불필요, spec 명시). `SupabaseAuthProvider`(`lib/supabase/auth-provider.tsx`)가 기존 `LocalAuthProvider`와 동일한 `AuthContextValue` interface(`user`/`isLoading`/`login`/`logout`/`changePassword`)를 구현해 `RouteGuard`/`components/*`를 무변경으로 재사용할 수 있게 했다.
- profiles row는 `auth.users` insert 시 DB trigger(`handle_new_user`)로 자동 생성한다(nickname은 signup metadata 또는 이메일 local part, role=member, status=active 기본값) — application layer insert 대신 트리거를 선택했다(가입 경로가 Auth 하나뿐이라 단순함).
- **credential(Supabase project URL/anon key, Netlify 연결)이 없어 이번 Phase에서는 mock → Supabase 전환을 실제로 적용하지 않았다.** `app/layout.tsx`는 여전히 `LocalAuthProvider`/`AppDataProvider`(mock)를 쓴다. `lib/supabase/*`와 `supabase/migrations/0001_init.sql`은 credential 연결 후 바로 쓸 수 있는 상태로 작성했지만 실제 project에 적용/검증되지 않았다(section 66 원칙: 값을 추측하지 않고, 코드/스키마까지만 준비하고 정확한 요청 항목을 보고한다).
- `lib/supabase/database.types.ts`는 손으로 schema에 맞춰 작성한 type이다 — `supabase gen types typescript`로 생성한 것이 아님을 파일 상단에 명시했다. project ref 확보 후 실제 generated type으로 교체해야 한다.
- Next.js 16.3.6부터 `middleware.ts` 파일 컨벤션이 deprecated되어 `proxy.ts`(named export `proxy`)로 이름이 바뀌었다. Supabase SSR 공식 패턴(요청마다 auth cookie refresh)을 최신 컨벤션에 맞춰 `proxy.ts`로 작성했다.
- Netlify 관련 별도 `netlify.toml`은 추가하지 않았다 — Netlify가 Next.js App Router를 자동 감지하는 공식 Next Runtime을 그대로 쓰고, node 버전만 `package.json`의 `engines.node`(`>=20`)로 고정했다(불필요한 legacy adapter/설정 파일 금지 원칙).

2026-09-29 (Phase 4A)
- 사용자의 claude.ai Supabase 연동을 통해 실제 project(jodongari, ref `wbxgezueodkuklgtvska`, ap-northeast-2)를 확보했다. URL/anon key는 project API 설정에서 직접 조회해 `.env.local`에 채웠다(git 미포함).
- migration 적용 전 audit에서 실제 문제 2건을 수정했다: (1) `profiles`/`sightings`/`sighting_comments`의 `updated_at`을 자동 갱신하는 trigger가 없어 `set_updated_at()` 공용 함수 1개를 추가, (2) `protect_profile_role_status`/`protect_last_admin` trigger function에 `set search_path`가 없었다.
- migration 적용 후 Security Advisor에서 `current_role()`/`is_reviewer()`/`is_contributor()`/`handle_new_user()`가 `anon` role에도 REST RPC로 직접 호출 가능한 상태임을 발견했다. Supabase가 기본적으로 신규 함수에 `anon`/`authenticated`에 EXECUTE를 부여하기 때문이다. 이 함수들은 RLS policy 내부 전용이라 `anon`의 실행 권한을 전부 revoke했고, trigger 전용인 `handle_new_user`는 `authenticated`에서도 revoke했다(RLS policy 평가에 실제로 필요한 `authenticated`의 `current_role`/`is_reviewer`/`is_contributor`만 유지).
- Auth 전환과 data repository 전환을 실제로는 분리할 수 없었다 — `currentUser`가 `profiles` row 자체이므로(Phase 4 설계상 email은 profiles에 두지 않음), Auth만 먼저 바꾸면 `AppDataProvider`가 여전히 mock user 배열을 참조해 로그인한 사람과 무관한 엉뚱한 프로필이 표시되는 실제 버그가 생긴다. 따라서 `SupabaseAuthProvider` 전환과 `AppDataProvider`의 Supabase repository 전환을 한 커밋 단위로 함께 진행했다(section 11 정신은 "디버깅을 뒤섞지 않는다"이지 "동시에 작성하지 않는다"가 아니라고 해석했다).
- `lib/supabase/auth-provider.tsx`의 export를 `useSupabaseAuth` → `useAuth`로 통일해 7개 소비 파일(`app/layout.tsx`, `app/login/page.tsx`, `app/my/page.tsx`, `app/admin/page.tsx`, `components/BottomNav.tsx`, `components/RouteGuard.tsx`, `lib/app-data-context.tsx`)이 import 경로만 바꾸면 되도록 했다 — 새 인터페이스나 어댑터 계층을 만들지 않았다.
- Admin 화면의 이메일 표시(`CREDENTIAL_EMAILS`, mock 전용)를 제거했다. Supabase 전환 후에는 email이 `auth.users`에만 있고 `profiles`에는 의도적으로 없어(Phase 3.10 결정 유지) client에서 다른 사용자의 email을 조회할 안전한 방법이 없다 — service role 없이는 불가능하고, 이번 Phase 범위에서 admin API를 새로 만들지 않았다.
- `submitSighting`을 hard-delete 없이 구현하지 않고, participants/species insert가 실패하면 방금 만든 `sightings` row를 삭제하는 compensating delete를 넣었다. Postgres 트랜잭션을 REST 호출 여러 개에 걸쳐 묶을 수 없어 선택한 최소한의 정합성 보정이며, RPC(트랜잭션 함수)는 추가하지 않았다(section 25 원칙: 불일치 가능성이 크지 않으면 RPC를 강제하지 않는다).
- `approveSighting`의 species 갱신은 diff 계산 없이 delete-then-insert로 구현했다. 소규모 동호회 트래픽에서 동시 편집 충돌 가능성이 낮고, reviewer만 이 경로를 타므로(RLS로 강제) 단순 구현을 선택했다.
- **실제 코드 버그 발견 및 수정**: `lib/supabase/env.ts`가 `process.env[name]`처럼 변수로 환경변수 이름을 동적 접근했는데, Next.js/Turbopack은 `NEXT_PUBLIC_*` 값을 브라우저 번들에 inline할 때 `process.env.NEXT_PUBLIC_X` 형태의 정적 참조만 치환한다. 서버 사이드에서는 실제 `process.env` 객체가 있어 정상 동작했기 때문에 `npm run build`/`npm run dev` 서버 로그만으로는 드러나지 않았고, 실제로 Chrome에서 `/login`을 열어봤을 때 "환경변수가 설정되지 않았다"는 에러가 재현되어 발견했다. 두 값을 각각 정적으로 참조하도록 수정한 뒤 재현되지 않음을 확인했다 — "코드는 작성됐지만 테스트 못함 상태를 완료로 처리하지 않는다"는 원칙대로 실제 브라우저 실행까지 검증했다.
- `SightingMedia`에 client-only `blob?: Blob` 필드를 추가했다(서버에서 읽어온 항목에는 없음). `lib/media.ts`의 `buildSightingMedia`가 image는 압축된 jpeg blob을, video/audio는 원본 File을 그대로 담아 반환하고, `submitSighting`이 이 blob을 Storage에 업로드한다. `url`은 그 전까지의 로컬 미리보기(data URL/object URL)이고, 서버에서 다시 불러온 뒤에는 signed URL로 교체된다.
- media signed URL은 batch(`createSignedUrls`)로 한 번에 발급하고 TTL 1시간으로 뒀다. 만료 전 자동 갱신 타이머는 이번 Phase에서 추가하지 않았다(소규모 동호회 세션 특성상 우선순위가 낮다고 판단, 필요해지면 재조회 로직 추가).
- 잘못된 로그인 계정으로 실제 Supabase Auth에 요청을 보내 400 응답 → "이메일 또는 비밀번호를 확인해 주세요." 한국어 inline 에러가 alert() 없이 표시되는 것까지 Playwright로 확인했다. 실제 계정(Auth user) 생성은 Supabase Dashboard에서 사용자가 직접 해야 하는 단계라(section 15/16 원칙) 정상 로그인 플로우와 RLS negative test, shared EXP E2E는 계정 생성 후 이어서 진행한다.
- `LocalAuthProvider`/`lib/mock-data.ts`/`lib/profile-store.ts`는 아직 삭제하지 않았다 — 실제 계정으로 핵심 flow가 검증된 뒤 한 번에 제거한다(section 42 순서 유지, Auth/data 전환과 mock 삭제를 뒤섞지 않기 위함).

2026-09-29 (Phase 4A-2)
- 가입 가능 대상을 `@tanabe-pharma.com` 회사 이메일 실소유자로 제한한다. email은 소속 인증 수단일 뿐이고, 실제 로그인은 사용자가 정하는 `login_id` + password로 한다 — email을 로그인 ID로 쓰지 않는다(요구사항 1~4).
- `mingyo.kim@tanabe-pharma.com`으로 인증을 완료한 계정은 자동으로 admin이 된다(bootstrap). 그 외 정상 회사 이메일은 기본 member. 이 판정은 client가 아니라 `handle_new_user()` trigger가 `NEW.email`을 직접 비교해 DB에서 결정한다 — client가 signup metadata에 role을 실어 보내도 무시된다.
- 도메인 제한은 client validation(`lib/auth/corporate-email.ts`, UX 전용)만으로 끝내지 않고, Postgres Before User Created hook(`public.hook_restrict_signup_by_email_domain`)으로 Auth 단계에서 강제한다. substring 비교(`contains`)가 아니라 `right(email, len) = '@tanabe-pharma.com'` 형태의 정확한 suffix 비교를 써서 `user@tanabe-pharma.com.attacker.com` 같은 위장 주소를 막는다.
- **이 hook은 함수를 만드는 것만으로는 동작하지 않는다.** Supabase Dashboard의 Authentication > Hooks > "Before User Created"에서 이 함수를 Postgres Hook으로 직접 선택/활성화해야 하며, 이 설정은 Management API/SQL로 자동화할 수 없는 dashboard 전용 항목이다(공식 문서로 확인, `supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook`). 활성화 전까지는 client validation만 걸려 있는 상태이므로, 활성화와 실제 negative test(외부 도메인 가입 시도) 전까지는 "도메인 제한이 DB/Auth 단계에서 강제된다"고 완료 처리하지 않는다.
- `profiles.login_id`는 별도 normalized column 없이 `unique index ... (lower(login_id))` expression index로 case-insensitive 중복을 막는다(citext 등 새 extension을 추가하지 않았다). format(4~20자, 영문/숫자/_/-)과 reserved word(admin/administrator/root/system/support/jodongari) 검증은 `public.validate_login_id()` trigger가 최종 source of truth이고, `lib/auth/login-id.ts`가 client에서 동일 규칙을 미리 검사한다.
- 동시 가입 race condition의 실제 방어는 unique index다. trigger 안의 `exists` 사전 체크는 일반적인 경우에 "이미 사용 중인 아이디입니다." 같은 친절한 한국어 메시지를 주기 위한 것이고, 극히 드문 race에서는 Postgres의 raw unique_violation 메시지가 나갈 수 있다(그 경우 client는 일반 가입 실패 메시지로 fallback한다) — 별도 advisory lock/재시도 로직은 이번 phase 규모에 과하다고 판단해 추가하지 않았다.
- custom `login_id + password` 로그인을 위해 server-only bridge(`POST /api/auth/login`)를 추가했다. `lib/supabase/admin.ts`(service_role, `typeof window !== "undefined"` 가드로 client import 시 즉시 throw)가 login_id → user_id → email을 resolve하고, `lib/supabase/server.ts`(cookie 기반 서버 client)로 실제 `signInWithPassword`를 수행해 세션 cookie를 응답에 실어 보낸다. login_id → email mapping을 반환하는 public RPC/endpoint는 만들지 않았다(요구사항 21/25).
- 존재하지 않는 ID와 틀린 비밀번호는 항상 같은 메시지("아이디 또는 비밀번호를 확인해 주세요.")를 반환해 enumeration을 막는다. email 미인증 계정은 Supabase가 password 검증 이후에만 "Email not confirmed" 오류를 주는 동작에 의존해, loginId 존재만으로 인증 상태가 새어나가지 않게 했다(비밀번호가 맞아야만 "인증을 완료해 주세요" 메시지가 나온다).
- Rate limiting을 위한 별도 인프라(Redis 등)는 추가하지 않았다 — Supabase Auth 자체의 rate limit에 의존한다(요구사항 26 그대로).
- email 미인증 session은 로그인 상태로 취급하지 않는다. Supabase가 confirmation 필요 설정에서는 애초에 session을 주지 않지만, 혹시 모를 설정 차이에 대한 defense-in-depth로 `SupabaseAuthProvider`가 `session.user.email_confirmed_at`이 없으면 profile을 로드하지 않고 로그아웃 상태로 취급한다.
- login_id는 email과 달리 "노출하면 안 되는 정보"로 분류하지 않았다(spec 44/61이 강하게 보호하는 대상은 email이다). 기존 아키텍처 관례(`users` 배열 하나를 Members/Sightings/Review/Admin이 공용으로 참조)를 그대로 따르되, Members/Sightings/Review UI는 여전히 nickname만 표시하고 Admin 화면에서만 `@login_id`를 렌더링한다 — 별도 admin 전용 RPC/view는 만들지 않았다(spec 44의 "가능하면" 권고 수준, email처럼 하드 요구사항이 아니라고 판단).
- MY 화면의 "회사 이메일" 표시는 본인 session의 `supabase.auth.getUser()` 결과를 그대로 쓴다(자기 자신의 email을 보는 것은 privacy 위반이 아니다). email 변경 기능은 이번 Phase에서 만들지 않았다(요구사항 12/30).
- 로그인 성공 후 `router.replace()` 대신 `window.location.href = "/"`로 전체 새로고침한다 — `/api/auth/login`이 서버에서 cookie를 Set-Cookie로 내려줘도, 브라우저의 `createBrowserClient` 인스턴스가 이미 메모리에 들고 있는 session 상태와 동기화되려면 재초기화가 필요하기 때문이다(client-side navigation만으로는 로그인 상태가 반영되지 않는 실제 문제를 우회하지 않고 정면으로 해결한 선택). `next/next/no-location-assign-relative-destination` lint warning이 남지만 의도된 선택이라 유지했다.
- 0001_init.sql 이후 이 project의 remote에는 0002/0003(Phase 4A audit로 직접 적용한 EXECUTE 권한 정리)이 이미 적용돼 있었지만 로컬 migration 파일로는 존재하지 않았다. 이번 작업 범위가 아니라 백필하지 않았고, 새 migration은 `0004_auth_identity.sql`로 이어서 추가했다(`supabase migrations list`로 번호 충돌 없음을 확인).
- Before User Created hook을 사용자가 Dashboard에서 활성화한 뒤, 실제 Supabase Auth API에 직접 curl로 external/lookalike domain negative test를 수행해 400 차단을 확인했고(`auth.users`/`profiles` 모두 0행, orphan 없음), 정상 도메인 signup도 curl로 별도 검증한 뒤 즉시 admin API로 삭제해 정리했다(fake local part였을 뿐 실제 회사 mailbox로 메일을 보내는 요청이었으므로 테스트 후 남기지 않음).
- Netlify 배포(사이트: `jodongari-236`, Netlify CLI를 service-role 방식과 동일하게 Personal Access Token으로 non-interactive 인증해 생성/배포/env var 등록까지 수행)에서 처음 만든 사이트가 이 계정 team의 기본 설정(`sso_login`)으로 인해 모든 요청이 401(Netlify 자체 visitor-access 게이트)로 막혔다 — `PATCH /api/v1/sites/:id { sso_login: false }`로 해제해 공개 접근 가능하게 했다.
- signup 확인 메일의 redirect 주소가 Supabase 대시보드의 Site URL 설정 시점에 의존해 localhost로 발급된 문제가 실제로 발생했다(Site URL을 Netlify 주소로 바꾸기 *전에* 가입 요청이 먼저 나간 경우). Supabase는 이메일 링크 클릭 시 리다이렉트 전에 서버에서 먼저 토큰을 검증해 `email_confirmed_at`을 기록하므로 실제 인증 자체는 깨지지 않지만(리다이렉트 목적지만 접속 불가), UX상 사용자가 "인증 실패했다"고 오인하기 쉽다. 근본 수정: `signUp()` 호출 시 `options.emailRedirectTo`를 `window.location.origin`으로 명시해, 대시보드 Site URL 설정의 최신 여부와 무관하게 항상 "지금 가입을 시도한 origin"으로 돌아오도록 했다(Redirect URLs 허용 목록에는 여전히 등록되어 있어야 한다).
- 실제 bootstrap admin 계정(`mingyo.kim@tanabe-pharma.com` → nickname 김민교, login_id 설정)으로 가입 → 이메일 인증 → 배포 사이트(`https://jodongari-236.netlify.app`)에서 login_id+password 로그인 → `/admin`, `/review` 접근까지 실제 브라우저로 확인했다. DB 기준으로도 `email_confirmed_at` 존재, `profiles.role = admin`, `status = active`를 직접 조회해 재확인했다.
- App icon source of truth: `img/jodongari.png`(캐릭터만, transparent — `public/img/jodongari-illustration.png`와 동일)를 bbox tight-crop 후 흰색 정사각 캔버스에 중앙 배치해 `app/icon.png`/`app/apple-icon.png`/`app/favicon.ico`를 생성했다. `img/icon.jpeg`(원형 뱃지 + "조동아리" 텍스트)는 브랜드 뱃지 용도로 두고, favicon처럼 작은 크기에서 텍스트가 읽히지 않는 asset이라 app icon 원본으로는 쓰지 않았다.

2026-09-29 (Phase 4B-2)
- Media picker UX를 단순화했다: Desktop은 "파일 업로드" 단일 native `<input type="file" accept="image/*,video/*,audio/*" multiple>`을 미디어 섹션에 바로 노출해 1단계로 끝나고(popover 없음), Mobile은 "미디어 추가" 버튼 → bottom sheet에서 "파일 업로드" / "카메라로 촬영" 2개만 남긴다. 실제 iPhone Safari에서 "사진 또는 영상"/"녹음 파일"/"파일에서 선택"이 모두 동일한 native picker로 이어져 구분에 의미가 없었기 때문(사용자 실측). desktop/mobile 분기는 `sm:` Tailwind class로 처리하고 JS width 분기는 추가하지 않았다.
- Media type 판별은 이미 `File.type` 기준으로 `buildSightingMedia`(`lib/media.ts`)가 처리하고 있어 source가 하나로 합쳐져도 변경이 필요 없었다 — media limits/validation/Storage pipeline은 그대로다.

2026-09-30 (Phase 4B-4)
- Canonical production URL: `https://tpkr-jodongari.netlify.app` (기존 `jodongari-236` 사이트 이름만 변경, site ID/env var/deploy history는 그대로 유지).
- Netlify site naming은 hyphen을 사용한다(underscore 불가 — Netlify subdomain 제약).
- Mobile calendar 좌측 쏠림의 실제 root cause는 `Calendar.tsx`의 `w-[300px]` fixed-width wrapper에 `mx-auto`가 없어 전체 폭 bottom sheet 안에서 block 기본 좌측 정렬된 것이었다(DatePicker trigger width 문제였던 Phase 4B-1과 무관). month nav/weekday/date grid가 모두 이 하나의 wrapper 안에 있어 `mx-auto` 한 줄로 전체가 함께 중앙 정렬된다.

2026-09-30 (Phase 4B-5)
- 모바일에서 admin/leader가 검토·관리 기능에 진입할 수 없던 root cause는 role resolution 버그가 아니라 `BottomNav.tsx`의 의도적 설계였다 — `useNavItems(false)`로 mobile에서 role 메뉴를 아예 배제하고 "MY 운영 섹션"으로 대체한다는 주석만 남긴 채 실제 MY 화면에는 그 섹션이 없었다. 새 RPC/역할 로직을 추가하지 않고 기존 `currentUser.role`(profiles.role)을 그대로 재사용해 mobile bottom nav에 `관리` 탭 1개(leader/admin 한정)만 추가하고 `/manage`로 연결했다 — 별도 review/admin 항목을 mobile에 각각 노출하지 않은 이유는 6개 탭도 빠듯한 mobile 폭에서 항목 수를 최소로 유지하기 위해서다.
- `/manage`는 desktop에 이미 있는 검토/관리자 메뉴를 대체하지 않는 mobile 전용 hub다. desktop `TopNav`는 기존 `includeRoleMenus` 분기를 그대로 유지했다.
- onboarding finalization에 별도 RPC를 만들지 않았다 — `profiles_update_self` RLS(이미 본인 row의 모든 column을 update 가능)와 새 `profiles_onboarding_requires_identity` check 제약(onboarding_completed=true면 login_id/nickname not null 강제)만으로 "중복된 id/nickname으로 finalize 시도 → 예외 발생 → onboarding_completed는 false로 남아 재시도 가능"이 원자적으로 보장된다. `auth.updateUser({password})`와 `profiles` update는 서로 다른 시스템이라 하나의 DB transaction으로 묶을 수 없으므로, password를 먼저 설정하고 profiles update가 실패하면 사용자는 같은 비밀번호로 `/signup/profile`에서 재시도한다(password 재설정은 요구하지 않음 — 이미 성공했으므로).
- `onboarding_completed` column은 `not null default true`로 추가했다 — 기존 row(bootstrap admin 1건)가 이미 login_id/nickname/password를 모두 갖춘 완성 계정이라 자동으로 backfill되고, 신규 가입은 `handle_new_user()`가 명시적으로 `false`를 넣는다. 별도 backfill UPDATE 문을 추가하지 않았다.
- Email 인증 수단을 confirmation link에서 email OTP(`signInWithOtp`/`verifyOtp`)로 바꾼 뒤, production Supabase Auth REST endpoint에 직접 curl로 negative test를 수행해 Before User Created hook이 OTP 경로에서도 동일하게 동작함을 확인했다(`gmail.com`, `tanabe-pharma.com.example.com` 모두 400 차단, 실제 auth user 생성 없음).

2026-10-01 (Phase 4B-7)
- Public self-signup(OTP/Magic Link, `/signup/profile`, `/auth/confirm`, `sendConfirmationEmail`, `/api/auth/resend-confirmation`)을 전면 제거하고 초대제로 전환했다. 초기 회원이 10명 내외이고 앞으로도 admin/leader가 roster를 직접 통제하길 원했기 때문 — self-signup 유지와 invite-only 전환 중 요구사항이 명시적으로 invite-only를 선택했다.
- 신규 회원 생성은 `POST /api/manage/users`(server-only) 하나로만 가능하다. browser가 service_role을 쓸 수 없으므로 `lib/supabase/admin.ts`의 `createAdminClient()`를 이 route 안에서만 쓰고, `email_confirm:true`로 만들어 가입 메일 발송 자체를 없앴다(SMTP 미도입 상태에서도 운영 가능해야 한다는 요구사항 7).
- role 생성 권한은 client가 보낸 role 값이 아니라 호출자의 `profiles.role`을 서버가 직접 재조회해 검증한다 — leader가 devtools로 role:"admin"을 보내도 403으로 막힌다. `handle_new_user()` trigger가 만드는 profile shell(role=member)을 provisioning endpoint가 단일 UPDATE로 `login_id`/`nickname`/`role`/`onboarding_completed=true`/`must_change_password=true`까지 한 번에 확정한다 — 이 update가 기존 DB trigger(`validate_login_id`/`validate_nickname`/`protect_profile_role_status`)를 그대로 통과하는지 검증했다: service_role 호출에서는 `current_role()`이 `auth.uid()` 없이 NULL을 반환해 `protect_profile_role_status`의 `NULL <> 'admin'`이 NULL(falsy)로 평가되어 role 변경이 막히지 않는다(기존 handle_new_user()도 같은 방식으로 동작하므로 일관적이다).
- Partial failure(Auth user 생성 성공 + profiles update 실패) 시 같은 요청 안에서 `admin.auth.admin.deleteUser()`로 즉시 rollback한다 — orphan Auth user를 남기지 않는다. 별도 cleanup job/cron은 이번 규모에서 과하다고 판단해 추가하지 않았다.
- email/ID/닉네임 중복 확인은 새 endpoint를 만들지 않고 기존 `/api/onboarding/check-login-id`/`check-nickname`(authenticated user 누구나 호출 가능하게 이미 구현돼 있었음)을 그대로 재사용했다. email 중복은 별도 조회 없이 `createUser`가 반환하는 duplicate 에러를 그대로 해석한다 — `auth.users`를 직접 조회하는 추가 쿼리를 만들지 않았다(Admin API가 이미 이 정보를 준다).
- CSV 일괄 import script/browser upload UI는 이번 phase에서 만들지 않았다 — 초기 회원이 10명 내외라 `/manage/users/new` 화면으로 admin이 한 명씩 등록해도 충분하다고 판단했다(요구사항 38-43은 "유지한다"는 표현이라 필수 신규 구현이 아니라고 해석). 필요해지면 `lib/supabase/admin.ts`를 재사용하는 one-time server-only script로 추가할 수 있다.
- `must_change_password`는 soft reminder로만 쓴다(하드 블락 없음) — `components/PasswordReminderBanner.tsx`가 `/my`를 제외한 모든 페이지 상단에 띠 배너로 표시하고, MY 화면의 "비밀번호" 변경 버튼도 강조한다. Admin이 "임시 비밀번호 재설정"을 쓰면 다시 true로 돌아간다.
- `RouteGuard`의 onboarding-incomplete 분기(기존 OTP 테스트 중 생성된 `onboarding_completed=false` shell 계정)를 "완료 화면으로 보낸다" 대신 "로그인하지 않은 것으로 취급해 `/login`으로 보낸다"로 바꿨다 — 완료할 방법 자체가 없어진 계정을 위한 화면을 새로 만드는 대신, 더는 쓸 수 없는 상태로만 명확히 처리했다(요구사항 61: 삭제하지 않고 개수만 보고).

2026-10-02 (Phase 4B-8, go-live smoke test)
- production에서 신규 회원 생성(`POST /api/manage/users`, OTP 가입 경로 포함 모든 `auth.users` insert)이 전부 500으로 실패하는 버그를 발견했다. 원인: 0005에서 `profiles.login_id`를 nullable로 바꿔 `handle_new_user()`가 login_id 없이 "profile shell"을 insert하게 했지만, 0004의 `validate_login_id()` 트리거는 null을 빈 문자열로 취급해 무조건 예외를 던졌다(`validate_nickname()`은 이미 null early-return이 있어 같은 문제가 없었음). `supabase/migrations/0007_fix_login_id_null_trigger.sql`로 trigger에 동일한 null early-return을 추가해 수정, production에 즉시 적용했다.
- `eslint.config.mjs`의 globalIgnores에 `.netlify/**`가 빠져 있어 `npm run lint`가 Netlify 빌드 산출물(번들된 JS)까지 검사해 759개의 가짜 에러를 보고했다. ignore 목록에 추가해 수정.
- admin 계정 비밀번호를 분실한 상태로 테스트를 시작해, service_role key로 `auth.admin.updateUserById`를 직접 호출해 임시 비밀번호로 재설정했다(`must_change_password=true` 동반 설정) — 별도 recovery UI를 만들지 않고 1회성 운영 작업으로 처리했다.

2026-10-02 (Phase 4B-9)
- 로그인된 사용자의 비밀번호 변경에서 "현재 비밀번호" 요구를 없앴다 — 이미 authenticated session이 있으므로 `supabase.auth.updateUser({password})` 하나로 충분하고, 재인증을 추가하는 건 이 규모의 invite-only 앱에 과하다고 판단했다(요구사항 42, 향후 보안 수준 상향 시 재검토 가능).
- 로그아웃 상태의 복구는 두 단계로 분리했다: "아이디 찾기"(회사 이메일+닉네임 둘 다 일치해야 login_id를 바로 보여줌, password 권한 없음)와 "비밀번호 재설정 요청"(같은 조건으로 `password_reset_requests`에 pending row만 남기고 Admin이 처리). 두 API 모두 실패 원인(이메일 불일치/닉네임 불일치/inactive/미존재)을 구분하지 않고 동일한 generic 메시지를 반환해 enumeration을 막는다 — 공용 lookup 로직은 `lib/supabase/account-lookup.ts` 하나로 합쳤다.
- `password_reset_requests`는 email/nickname/password를 저장하지 않고 user_id + status(pending/resolved/cancelled)만 남긴다 — 별도 audit log table을 만들지 않고 이 table 자체가 최소 audit 역할을 하게 했다. 동일 user의 중복 pending request는 partial unique index(`status='pending'`)로 DB level에서 막았다.
- Admin의 재설정 처리는 기존 `POST /api/manage/users/[userId]/reset-password`를 재사용했다 — body에 `resetRequestId`가 있으면 같은 요청 안에서 해당 request를 resolved로 갱신한다. 새 처리용 endpoint를 따로 만들지 않았다.
- Leader는 여전히 비밀번호 재설정 권한이 없다 — 계정 탈취 가능성이 있는 privileged action이라 Admin 전용으로 유지(요구사항 17).
- public lookup API 2개에 Redis 등 외부 infra 없이 in-memory rate limit(`lib/auth/rate-limit.ts`, IP당 분당 5회)을 적용했다. ponytail 주석으로 명시했듯 서버리스 다중 인스턴스에서는 인스턴스별로 한도가 나뉘는 한계가 있다 — 지금 트래픽 규모(회원 10명 내외)에서는 충분하다고 판단했고, 진짜 분산 rate limit이 필요해지면 Redis/Upstash로 교체한다.
- 단독 Admin lockout 대비 `scripts/reset-user-password.ts`를 추가했다. 새 CLI dependency 없이 `@supabase/supabase-js`와 Node raw-mode stdin만으로 hidden password prompt를 구현했고, 비밀번호를 CLI argument로 받지 않는다(shell history 노출 방지). 이 script는 production Next 빌드에 포함되지 않는 순수 server-only 로컬 실행 파일이다.
