# UI Review

로컬에서 직접 확인하면서 수정하고 싶은 점을 체크/메모하세요.

## 직접 확인 우선순위

1. Login vertical spacing
2. Home Feed card 느낌
3. 사진 크기
4. Record form 밀도
5. Encyclopedia desktop width
6. Encyclopedia card 밀도
7. MY가 dashboard처럼 보이는지
8. Review 승인 버튼 위치
9. Bottom nav 높이

## Login
- [ ] 화면 첫인상
- [ ] 입력창 크기
- [ ] 로그인 버튼
- [ ] 오류 메시지

## Home
- [ ] Feed 밀도
- [ ] 사진 크기
- [ ] 글자 hierarchy
- [ ] 좋아요/댓글 위치

## Record
- [ ] 입력 순서
- [ ] species 검색
- [ ] 사진 선택
- [ ] CTA 위치

## Encyclopedia
- [ ] grid 밀도
- [ ] 검색
- [ ] filter
- [ ] 해금/미해금 차이

## MY
- [ ] profile hierarchy
- [ ] 통계
- [ ] logout

## Leader Review
- [ ] 판단에 필요한 정보가 먼저 보이는지
- [ ] 승인하기 편한지

## Visual Style

### Global
- [ ] 전체가 white/cool-gray 중심으로 느껴지는가?
- [ ] beige/yellow tone이 남아있지 않은가?
- [ ] green이 brand color처럼 사용되지 않는가?
- [ ] blue가 primary accent로 명확한가?
- [ ] 카드가 지나치게 많지 않은가?
- [ ] shadow가 과하지 않은가?

### Login
- [ ] Apple 계열의 깨끗한 첫인상인가?
- [ ] 흰색 공간이 충분한가?
- [ ] login CTA만 적절히 blue로 강조되는가?

### Home
- [ ] UI보다 사진/콘텐츠가 먼저 보이는가?
- [ ] feed 사이 간격이 자연스러운가?

### Record
- [ ] form이 복잡해 보이지 않는가?
- [ ] 선택 상태가 blue 중심으로 표현되는가?

### Encyclopedia
- [ ] 597종이 답답해 보이지 않는가?
- [ ] 관찰/미관찰 구분이 과한 색 없이 이해되는가?

### MY
- [ ] dashboard처럼 보이지 않는가?
- [ ] blue accent가 제한적으로 사용되는가?

### Review
- [ ] 관리 시스템처럼 딱딱해 보이지 않는가?
- [ ] 승인 action이 명확한가?

## Phase 3.8 직접 확인

### Responsive
- [ ] mobile에서 한 손 사용이 편한가?
- [ ] tablet이 mobile 확대처럼 보이지 않는가?
- [ ] desktop이 빈 화면처럼 보이지 않는가?
- [ ] desktop navigation이 자연스러운가?

### Date
- [ ] 오늘 기록이 클릭 없이 가능한가?
- [ ] 어제 선택이 빠른가?
- [ ] 다른 날짜 선택이 직관적인가?
- [ ] 날짜 표시가 보기 좋은가?

### Visual
- [ ] 전체가 여전히 너무 심심하지 않은가?
- [ ] blue accent가 적절히 보이는가?
- [ ] 사진과 콘텐츠가 UI보다 먼저 보이는가?
- [ ] 화면마다 밀도 차이가 자연스러운가?

## 알려진 남은 이슈 (참고용)
- dark mode는 이번 Phase에서 제거했다(light mode 우선). 필요하면 별도 Phase에서 `--surface-secondary` 등 새 토큰까지 포함한 dark palette를 다시 설계해야 한다.
- (Phase 3.8) Home/Record/MY/Review는 `lg:` 이상에서 sidebar 또는 2-column 레이아웃, Encyclopedia는 기존 wide grid(2/3/4/5)를 유지한다. Record CTA는 bottom nav와 겹칠 위험이 있어 sticky footer 대신 기존 정적 위치를 유지했다(추후 필요시 재검토).

## Phase 3.9 직접 확인

### 멤버 페이지
- [x] 정렬이 EXP 내림차순인가 (김민수 Lv.3 → 이지현 Lv.1(76exp) → 박회장/leader 순서로 확인됨)
- [x] 현재 사용자가 blue border + "나" 배지로 강조되는가 (member1/leader 계정 각각 확인)
- [x] 메달/순위 숫자/podium UI가 없는가
- [x] mobile 단일 컬럼 카드 리스트가 375~390px에서 읽기 편한가
- [x] desktop top nav에서 "멤버" 진입 가능한가, mobile bottom nav는 6~7개로 붐비지 않는가 (desktop 전용 노출로 처리)

### 계정 설정
- [x] 닉네임 inline editing 저장/취소 동작
- [x] 닉네임 변경이 MY/Feed(작성자명, 인삿말)/멤버 페이지에 즉시 반영되는가 (새로고침 없이 확인됨)
- [x] 닉네임이 새로고침 후에도 유지되는가 (localStorage override 확인)
- [x] 비밀번호 변경 — 현재 비밀번호 오류 처리, 성공 메시지, 로그아웃 후 새 비밀번호로만 로그인되는가 (기존 비밀번호 거부 확인)

### 날짜 선택
- [x] "날짜 선택" 클릭 시 native date input이 focus + showPicker() 호출되는가 (콘솔 에러 없음)
- [x] 선택한 날짜가 요약/제출 값에 정확히 반영되는가 (2026-09-05 제출 → 회장 검토 화면에 동일 날짜로 노출 확인)
- [x] `max=오늘`로 미래 날짜가 제한되는가

## 알려진 남은 이슈 (Phase 3.9)
- Playwright(Chromium headless)에서는 native `<input type="date">`의 캘린더 팝업 자체가 스크린샷에 렌더링되지 않아, 팝업 UI를 육안으로는 검증하지 못했다. 대신 `showPicker()` 호출 성공(에러 없음), focus 상태, 값 변경 전파, 실제 제출까지 end-to-end로 검증했다. 실기기(특히 iOS Safari)에서 한 번 더 확인 권장.

## Phase 3.10 직접 확인

### 탐조
- [x] 기록하기 버튼이 쉽게 보이는가? (PageHeader 우측 action, 375px에서도 한 줄에 표시됨)
- [x] 기간 조회가 직관적인가?
- [x] 전체/7일/30일/직접 기간 선택이 편한가? (전체 4건 → 최근 7일 1건으로 정상 필터링 확인)
- [x] 기록 탭이 사라져도 불편하지 않은가? (탐조 hub의 "기록하기"로 대체, /record 기존 flow 그대로 재사용)

### 날짜
- [x] 날짜 선택을 연속으로 반복해서 열 수 있는가? (`showPicker()` 호출 횟수를 spy로 계측 — 클릭마다 매번 새로 호출됨을 확인, 4회 연속 클릭 검증)
- [x] picker를 닫은 후 즉시 다시 열 수 있는가? (같은 mode에서 재클릭 시 ref.open() 경로로 재호출됨)
- [x] 오늘/어제 전환 후 날짜 선택이 정상인가? (오늘→날짜선택, 어제→날짜선택 각각 정상 재오픈 확인)

### 미디어
- [x] 사진 추가가 편한가?
- [x] 영상 preview가 자연스러운가? (`<video controls>` 썸네일 및 재생 확인)
- [x] 녹음 파일을 쉽게 재생할 수 있는가? (compact audio row, 🎧 아이콘)
- [x] 혼합 media가 지저분해 보이지 않는가? (image/video는 grid, audio는 별도 row로 분리)
- [x] 최대 개수(5개)/용량 초과/미지원 형식 오류 메시지 확인 (실제 mp4/mp3/jpg/txt 파일로 검증)

### Brand
- [x] jodongari 대표 이미지가 앱 정체성과 잘 어울리는가? (`img/jodongari.jpeg` 원본, 로고+워드마크 포함)
- [x] Login에서 크기가 적절한가? (96×96, 원본 1:1 비율 유지, 왜곡 없음)
- [x] desktop nav / Home 사용이 과하지 않은가? (desktop TopNav에만 32×32로 추가, Home은 기존 텍스트 타이틀 유지해 중복 노출 피함)

### 관리자
- [x] 사용자/role을 빠르게 확인할 수 있는가? (닉네임/이메일/상태/역할 select 한 화면에)
- [x] 모바일에서도 관리하기 편한가? (375px 카드 리스트, table 미사용)
- [x] 회장 검토와 관리자 기능의 차이가 명확한가? (MY "운영" 섹션에 각각 별도 링크)
- [x] 마지막 관리자 role 변경/비활성화 방지 동작 (각각 에러 메시지로 차단 확인)
- [x] 비활성 계정 로그인 차단 (에러 메시지 확인, 재활성화 후 로그인 정상 복귀 확인)

## Phase 3.11 — Custom Calendar + UX/UI 재설계

### Calendar
- [x] Record 날짜 선택이 언제든 다시 열리는가? (`DatePicker`의 `isOpen`은 순수 React state — toggle/재클릭 5회+ 검증)
- [x] native browser 달력 느낌이 제거됐는가? (`<input type="date">`, `showPicker()` 완전 제거, `components/DateField.tsx` 삭제)
- [x] 날짜 선택 UI가 앱 디자인과 일관적인가? (white surface, large radius, Apple blue selected, subtle shadow)
- [x] mobile bottom sheet가 편한가? (390px 실기기 크기로 확인 — 하단 시트 + dim backdrop + 완료 버튼)
- [x] desktop popover 위치가 자연스러운가? (trigger 바로 아래 anchor, 1280px에서 확인)

### Period filter
- [x] 기간 필터가 한 줄에서 자연스럽게 보이는가? (전체/7일/30일/기간 segmented, `기간`도 같은 popover 트리거)
- [x] 시작일/종료일 input 두 개가 항상 노출되지 않는가? (별도 두 줄 제거, popover 안에서만 노출)
- [x] range 선택이 직관적인가? (첫 클릭 시작일 → 두번째 클릭 종료일, 역순 클릭 시 자동 정렬)
- [x] 선택 기간을 즉시 이해할 수 있는가? (`9월 14일 – 9월 27일` compact label로 대체)

### Layout
- [x] desktop의 의미 없는 빈 공간이 줄었는가? (Sightings/Record 헤더-버튼 baseline 정렬, segmented control w-fit로 축소)
- [x] left edge alignment가 일관적인가?
- [x] controls가 필요 이상으로 넓지 않은가? (segmented control `flex-1` 제거 → `w-fit`)
- [x] 카드 반복이 줄었는가? (Sightings/Members를 개별 rounded card → divider 기반 단일 리스트로 전환)
- [x] 화면마다 density가 목적에 맞는가?

### Visual identity
- [x] generic SaaS 느낌이 줄었는가? (raw ISO 날짜 노출 제거, status를 metadata 톤으로 유지)
- [ ] Apple-inspired precision 및 jodongari identity — Login/Record/Sightings/Members 중심으로 개선했고, Home/Encyclopedia/MY/Review/Admin은 기존 Phase 3.10 디자인을 유지함(아래 이슈 참고).
- [ ] 대표 이미지가 자연스럽게 활용되는가? — 기존 Login/TopNav 사용 유지, 추가 hero 활용은 이번 Phase에서 진행하지 않음.

## 알려진 남은 이슈 (Phase 3.11)
- 이번 Phase는 "가장 중요한 변경"(native date UI 제거 + custom calendar + 기간 필터)과 이를 직접 사용하는 Record/Sightings/Members 화면에 재설계 리소스를 집중했다. Home, Encyclopedia, MY, Review, Admin은 날짜 UI를 사용하지 않아 이번 QA 범위에서 스타일만 가볍게 점검했고, spec에서 제시한 hero composition·카드 밀도 재설계 수준까지는 손대지 않았다. 후속 Phase에서 이어서 진행 필요.
- Range calendar 내부 "최근 7일/30일" 프리셋은 상단 segmented control과 기능이 겹친다 — 중복이 실사용에서 불편하면 다음 Phase에서 제거 검토.

## Phase 3.12 Visual Identity

### Home
- [x] 첫 화면에서 조동아리의 정체성이 느껴지는가? (black cinematic hero + 대형 headline + 브랜드 이미지)
- [x] hero가 과하지 않은가? (desktop ~72vh, mobile은 로고 축소로 compact하게 조정)
- [x] headline이 충분히 세련됐는가? ("오늘 만난 새를, 오래 기억하는 방법." 56~72px)
- [x] 대표 이미지 사용이 자연스러운가? (1:1 로고를 왜곡 없이 rounded square로 배치)
- [x] Feed 접근이 너무 늦지 않는가? (hero 바로 아래 feed 시작, scroll 한 번으로 도달)

### Overall
- [x] generic SaaS 느낌이 크게 줄었는가? (Feed/Sightings/Members 카드 제거 → divider 리스트)
- [x] card 반복이 줄었는가?
- [x] typography hierarchy가 강해졌는가? (PageHeader 32~40px, 도감 숫자 56px)
- [x] black/white/blue의 contrast가 세련됐는가? (--cinematic-bg/--cinematic-text 토큰 도입)
- [x] page별 identity가 느껴지는가?
- [x] Apple-inspired하지만 Apple 복제품처럼 보이지 않는가?

### Encyclopedia
- [x] 관찰한 새가 미관찰 종보다 자연스럽게 강조되는가? (observed는 큰 아이콘+실선, locked는 40% opacity 축소)
- [x] 597개 tile 반복이 덜 답답한가? (전체 필터에서 관찰종 우선 정렬)

### Members
- [x] 경험치를 비교하기 쉬운가? (thin progress bar + EXP 텍스트 한 줄)
- [x] spreadsheet처럼 보이지 않는가? (outer card 제거, divider list)

### MY
- [x] dashboard가 아니라 개인 profile처럼 보이는가? (닉네임 32px 대형 제목 + editorial 구성)

### Record
- [x] form이 업무용 입력화면처럼 보이지 않는가? (editorial headline + section rhythm 유지)
- [x] 날짜/calendar가 세련됐는가? (Phase 3.11 custom calendar 유지, 기존 기능 변경 없음)

## 알려진 남은 이슈 (Phase 3.12)
- Review/Admin은 spec대로 기능성 우선 polish만 적용했다(divider 기반 list로 전환, typography만 조정). Cinematic 처리는 하지 않음.
- 도감/MY의 새 아이콘은 여전히 🐦 emoji placeholder다. 실제 조류 사진 asset이 들어오면 자연스럽게 hero가 되도록 구조(원형 프레임)만 마련해뒀다.

## 알려진 남은 이슈 (Phase 3.10)
- 반응형 QA 중 640–1023px 구간(예: 768×1024)에서 `app/layout.tsx`의 `main` padding이 `sm:pb-6`로 줄어드는데 `BottomNav`는 `lg:hidden`이라 그 구간까지 계속 떠 있어, 고정 하단 nav가 페이지 하단 버튼(예: Record "검토 요청")을 가려 클릭을 가로채는 사전 버그를 발견해 함께 수정했다(`pb-24`를 `lg`까지 유지). Phase 3.10 범위 밖 회귀이지만 이번 QA 없이는 발견되지 않았을 문제라 기록해 둔다.
- leader mock 계정(`leader@jodongari.local`)은 이전 세션에서 닉네임/비밀번호가 override된 상태라(localStorage), 이번 session에서 실제 로그인으로 desktop leader nav를 재검증하지 못했다. 동일 권한 분기 로직을 admin 계정으로 검증했고 코드 경로가 leader와 완전히 같아(`canReview = role === "leader" || role === "admin"`) 위험은 낮다고 판단.

## Phase 3.13

### Home
- [x] 흰 배경이 브랜드 이미지와 자연스럽게 연결되는가? (rounded card/shadow 제거, 이미지 자체의 흰 배경이 페이지 흰 배경과 이어짐 — 1440px, 390px 확인)
- [x] headline의 blue 사용이 세련됐는가? (2줄 중 "오래 기억하는 방법."만 accent blue, 나머지는 foreground 유지)
- [x] 너무 SaaS landing page처럼 보이지 않는가? (강한 gradient/card 없이 whitespace + typography 중심)
- [x] 충분한 visual impact가 있는가? (우상단 8% opacity radial blue glow로 최소한의 빛만 추가)

### Login
- [x] black panel 제거 후 브랜드가 더 자연스러운가? (왼쪽 패널을 `--surface-blue` + 미세한 radial glow로 교체, 로고 card 제거)
- [x] left/right balance가 좋은가? (1440px에서 확인, split composition 유지)
- [x] 로그인 버튼만 과도하게 튀지 않는가? (accent blue 버튼 하나만 유지, 나머지는 neutral)

### Global
- [x] black background가 불필요하게 남아 있지 않은가? (`bg-cinematic`/`text-cinematic`/`bg-black`/`#000000` 전체 grep — Home/Login 외 사용처 없음 확인, `--cinematic-*` 토큰 삭제)
- [x] white/gray/pale-blue/blue hierarchy가 일관적인가? (`--surface-blue` 신규 토큰으로 Home/Login 통일)
- [x] blue가 너무 많이 사용되지 않았는가? (Encyclopedia 등 기존 화면은 변경하지 않고 그대로 확인 — 이미 blue를 focal accent로만 사용 중)
- [x] 화면이 밝고 공기감 있게 느껴지는가? (1440px, 390px Home/Login 스크린샷으로 확인)

## Phase 3.14

### Home
- [x] 새 이미지가 충분히 크게 보이는가? (desktop hero 폭 대비 약 38%, mobile 폭 대비 약 70%)
- [x] headline과 이미지가 하나의 composition처럼 느껴지는가? (같은 relative container 안에서 illustration이 우측 하단에 겹쳐 배치됨)
- [x] 오른쪽에 로고만 덩그러니 놓인 느낌이 사라졌는가? (2-column template 제거, bottom-anchored 배치로 텍스트와 시각적으로 연결)
- [x] 흰 배경과 이미지가 자연스럽게 연결되는가? (투명 PNG, box 없음, 미세한 radial blue glow만 적용)
- [x] hero 높이가 적절한가? (`min-h` 강제값 제거, padding 기반으로 조정 — 1440px에서 Feed가 스크롤 없이 바로 이어짐)

### Login
- [x] 좌측 brand / 우측 form 역할이 명확한가? (`--surface-blue` vs `--background`, 45/55 split)
- [x] pale-blue와 white의 경계가 자연스러운가? (hard border 없음, 색상 차이로만 구분)
- [x] 새 이미지 크기가 적절한가? (left panel 폭 대비 약 60%, 기존 120px 로고 대비 크게 확대)
- [x] form이 허공에 떠 보이지 않는가? ("로그인" heading + subtitle 추가로 목적성 보강)
- [x] mobile에서도 brand 영역이 과하지 않은가? (모바일은 split 제거, illustration → 타이틀 → subtitle → form 세로 흐름, 390×844에서 로그인 버튼까지 스크롤 없이 보임)

## 알려진 남은 이슈 (Phase 3.14)
- 기존 원형 로고(`jodongari.jpeg`)는 nav 전용으로만 남기고 Home/Login에서는 완전히 제거했다. 다른 화면(Sightings/Record/Calendar/Encyclopedia/Members/MY/Review/Admin)은 이번 Phase 범위 밖이라 변경하지 않았다.

## Phase 3.15

### Login
- [x] heading은 center, form controls는 left인가? (desktop `로그인`/subtitle text-center, 이메일/비밀번호/버튼은 좌측 정렬 유지 — 1440px 확인)

### Home
- [x] illustration이 잘리지 않고 온전히 보이는가? (absolute bottom-anchor → flex row + object-contain으로 교체, 1440px/768px/390px 모두 전체 형태 노출 확인)
- [x] headline과 이미지의 관계가 자연스러운가? (같은 flex row 안에서 `items-end`로 baseline 정렬)

### Record
- [x] 함께 탐조한 멤버 입력이 쉬운가? (종 선택 아래 chip 토글, mobile 390px에서도 탭으로 선택/해제 확인)

### Review
- [x] 수정 요청보다 종 정정 후 승인 흐름이 더 자연스러운가? (chip 제거/검색 추가로 종 정정 후 "정정 후 승인" 단일 액션 — 수정 요청 UI 완전 제거)

### Shared activity
- [x] 공동 탐조 기록이 작성자/동행자 모두에게 올바르게 반영되는가? (여의도 샛강 기록: 이지현 작성 + 김민수 동행 → 리더 승인 시 종 1개(논병아리 제거) 반영, 두 사용자 모두 EXP +32/탐조 +1/도감 +1종 동일하게 확인 — Members 화면에서 검증)

## 알려진 남은 이슈 (Phase 3.15)
- 공동 탐조는 최소 버전(작성자/동행자 동일 EXP 기준)만 구현했다. 참여자별 기여도 차등, 동행 요청/수락 흐름은 이번 Phase 범위 밖.
- 리더의 "메모"는 승인 시점에만 입력 가능하고 이후 수정 UI는 없다(요구사항에 없던 범위).

## Phase 3.16

### Home
- [x] Feed가 제거되어 화면 목적이 명확한가? (FeedCard/좋아요·댓글 반복 제거, brand hero + 개인 요약만 남음 — 1440px/390px 확인)
- [x] Hero와 personal summary가 자연스럽게 연결되는가? (`border-t` + 여백으로만 구분, 별도 card 없음)
- [x] 불필요하게 빈 공간을 card로 채우지 않았는가? (leader/admin처럼 기록이 적은 계정도 동일 구조 유지 — 박회장 계정 "2종 발견 · 탐조 1회"로 확인, admin 예시와 동일한 단순 구조)

### Sightings
- [x] 내 기록 / 전체 기록 구분이 명확한가? (segmented toggle, 기본값 `내 기록`)
- [x] 공동 탐조 기록이 내 기록에 포함되는가? (이지현 작성 + 김민수 참여 pending 기록이 김민수 로그인 시 "내 기록"에 정상 노출됨을 확인)
- [x] date filter와 scope filter 조합이 자연스러운가? (내 기록+7일, 전체 기록+기간 선택 각각 0건/N건 정상 반영 확인)
- [x] 각 기록의 경계가 명확한가? (흰 배경 + `border-border` + `rounded-[16px]` record surface, outer list card 없음)
- [x] 각 기록이 클릭 가능해 보이는가? (전체 record가 `<Link>`, hover 시 `bg-surface-hover`, 390px에서 탭 영역 충분)

### Sighting Detail
- [x] 기록 전체 내용을 자연스럽게 읽을 수 있는가? (작성자 → 함께한 멤버 → 관찰한 새 → 미디어 → 한마디 → 좋아요/댓글 순서, `/sightings/[id]`)
- [x] 함께한 멤버 전체를 확인할 수 있는가? (축약 없이 전체 이름 pill로 노출)
- [x] media가 있을 때 충분한 visual priority를 가지는가? (기존 `MediaViewer` grid/video/audio 그대로 재사용, mock 데이터엔 media가 없어 실제 사진 QA는 후속 확인 필요)

### Review
- [x] 검토 목록이 간결한가? (작성자/날짜·장소/species summary/함께한 멤버 + "검토 대기 ›"만 노출, `/review`)
- [x] 기록 클릭 후 상세에서 검토하는 흐름이 자연스러운가? (`/review/[id]`로 이동, 승인 후 `/review`로 복귀하며 목록에서 사라짐 확인)
- [x] 미디어 확인 → 종 정정 → 승인 순서가 이해하기 쉬운가? (미디어 → 작성자가 기록한 종 → 최종 종 편집 → 회장 메모 → 승인하기)

### 권한
- [x] 다른 멤버의 pending 기록에 `/sightings/[id]`로 직접 접근 시 차단되는가? (member 계정으로 타인 단독 pending id 접근 → "기록을 찾을 수 없어요." 확인)
- [x] member가 `/review/[id]`에 직접 접근 시 차단되는가? (RouteGuard가 `/review`와 동일하게 `/`로 redirect)
- [x] 승인된 기록은 기여자가 아니어도 조회 가능한가? (leader 계정으로 본인이 관여하지 않은 approved 기록 상세 조회 확인)

## 알려진 남은 이슈 (Phase 3.16)
- 기존 mock sighting 데이터에 media가 전혀 없어(모두 `media: []`), Sighting Detail/Review Detail의 실제 사진·영상·오디오 레이아웃은 이번 QA에서 시각적으로 검증하지 못했다. `MediaViewer` 컴포넌트 자체는 변경하지 않고 그대로 재사용했으므로 위험은 낮다고 판단하나, 실제 미디어 첨부 기록으로 후속 확인 권장.
- Sighting Detail/Review Detail 사이의 코드 중복(작성자/날짜·장소 header, 함께한 멤버, 미디어, 한마디 블록)은 공통 컴포넌트로 추출하지 않고 각 파일에 그대로 유지했다. 두 화면이 요구하는 species 표시 방식(읽기 전용 vs 편집 가능)이 달라 완전히 같지 않고, 분량도 과도한 추상화를 정당화할 만큼 크지 않다고 판단했다(CLAUDE.md "과도한 추상화 금지").

## Phase 3.17 — Layout System Audit

### Layout System
- [x] nav height와 page offset이 공통 관리되는가? (`--nav-height-desktop: 52px` CSS var 추가, Record summary sticky offset에서 사용)
- [x] desktop page gutter가 일관적인가? (main의 `px-4/sm:px-6/lg:px-10` 공통 적용은 기존과 동일하게 유지, 회귀 없음)
- [x] mobile safe-area가 정상인가? (BottomNav `env(safe-area-inset-bottom)`, main `pb-24` 기존 값 확인, 390px에서 CTA/nav 겹침 없음)
- [x] 불필요한 100vh/absolute positioning이 없는가? (app/components 전체 grep, Login의 `min-h-[calc(100vh-4rem)]`/CalendarPopover의 fixed/absolute는 의도된 사용으로 확인, 제거 대상 없음)

### Home
- [x] hero vertical space가 과하지 않은가? (`-mx/-mt` 취소 트릭과 `py-14/py-20` 제거, content-based 여백으로 축소)
- [x] snapshot이 viewport 하단에 잘리지 않는가? (1440×900 확인, CTA 정상 노출)
- [x] hero/snapshot horizontal grid가 자연스러운가? (두 section 모두 `max-w-[1200px]` 공통 container로 통일, 좌우 기준선 일치)

### Record
- [x] heading 전체가 nav 아래에서 보이는가? (heading을 grid 밖으로 분리, 항상 최상단에 전체 노출)
- [x] main/summary top alignment가 맞는가? (heading을 공유 header로 분리하고 grid는 그 아래에서 시작하도록 재구성)
- [x] summary가 sticky nav에 가려지지 않는가? (sticky `top`을 `calc(var(--nav-height-desktop) + 24px)`로 계산, 스크롤 시 "작성 요약" 제목 겹침 해결)
- [x] section spacing이 일정한가? (기존 `border-t pt-6` 패턴 유지, 회귀 없음)

### Other Pages
- [x] title/filter/list left edge가 일관적인가? (Sightings/Encyclopedia/Members/Review/Admin 확인, MY 페이지의 `mx-auto` 중앙 정렬 제거해 다른 페이지와 동일한 좌측 기준선으로 정렬)
- [x] detail page의 reading width가 적절한가? (Sighting Detail/Review Detail `max-w-2xl` 유지, 문제 없음)
- [x] bottom nav와 content가 겹치지 않는가? (390px Record 하단 스크린샷 확인)

## 알려진 남은 이슈 (Phase 3.13)
- 이번 Phase는 spec에서 명시한 black cinematic 제거 범위(Home/Login)에 집중했다. Sightings/Record/Encyclopedia/Members/MY/Review/Admin은 Phase 3.12부터 이미 white+blue 기반이라 black 관련 변경 사항이 없었고, 이번 Phase에서 재검증만 했다(768×1024 tablet, 1440×900 desktop, 390×844 mobile 별도 스크린샷 QA는 Home/Login/Encyclopedia만 진행).

## Phase 3.18

### MY
- [x] desktop에서 왼쪽에 쏠리지 않는가? (`mx-auto max-w-[1080px]`로 교체, 1440px에서 중앙 정렬 + 2-column 확인)
- [x] profile 영역이 충분한 visual hierarchy를 갖는가? (닉네임/역할 → Lv·EXP progress → "N종 발견 · 탐조 N회" 한 줄로 cohesive하게 구성)
- [x] 최근 발견/운영/계정 배치가 자연스러운가? (lg 이상 2-column: 좌 최근 발견, 우 운영+계정)
- [x] bottom whitespace가 충분한가? (전역 `main` desktop bottom padding 64px로 상향)
- [x] mobile에서 마지막 항목이 bottom nav와 겹치지 않는가? (390px full-page 스크린샷으로 로그아웃 행까지 확인)

### Global Layout
- [x] 1440px 전체 페이지를 실제 screenshot으로 검증했는가? (Home/Sightings/Encyclopedia/Members/Record/Review/Review Detail/Admin/Sighting Detail/MY 실제 렌더링 확인)
- [x] 비정상적인 left/right dead space가 없는가? (MY 제외 전부 기존과 동일하게 정상, MY는 이번 Phase에서 수정)
- [x] 마지막 content의 bottom breathing room이 충분한가? (Record 390px 스크롤 후 검토 요청 버튼-bottom nav 간격 확인. fullPage 스크린샷은 fixed nav가 중간에 겹쳐 보이는 렌더링 아티팩트가 있어, 실제 스크롤 후 뷰포트 스크린샷으로 재확인함)
- [x] nav/sticky/content overlap이 없는가? (Record sticky 요약 확인, 문제 없음)

### Shared Sighting (E2E, mock 실사용)
- [x] author EXP가 승인 후 반영되는가? (박회장 54→86 EXP)
- [x] participant EXP도 승인 후 반영되는가? (관리자 0→32 EXP)
- [x] participant 개인 도감이 unlock되는가? (관리자 도감 0→1종, 물까치 1회 관찰)
- [x] participant 탐조 횟수에 포함되는가? (관리자 0→1회)
- [x] Members/MY/Home의 숫자가 일치하는가? (박회장 기준 Members "86/100 EXP·3종·탐조2회" = MY 동일 = Home과 정합)
- [x] reload/navigation으로 EXP 중복 계산이 발생하지 않는가? (derived pure calc이라 구조적으로 중복 불가 — mock 데이터가 in-memory라 하드 리로드는 오히려 fixture로 초기화됨을 확인)

## 발견 및 수정된 버그 (Phase 3.18)
- Home/MY "탐조 횟수"가 pending/draft를 포함해 셌고 Members는 approved만 세던 불일치 → `countApprovedSightings` 단일 helper로 통일.
- MY 컨테이너에 `mx-auto`가 빠져 있던 것이 desktop 좌측 쏠림의 실제 원인(Phase 3.17 보고서 오류).

## 알려진 남은 이슈 (Phase 3.18)
- 리더 본인이 작성한 기록을 리더 스스로 검토/승인할 수 있는 흐름(self-review)이 막혀 있지 않다. 이번 Phase 범위(layout + EXP 정합성)와 무관해 별도 이슈로만 남긴다.

## Phase 3.19

### MY IA
- [x] desktop에서 profile rail + content 구조가 자연스러운가? (`grid-cols-[320px_1fr]` gap 80px로 profile rail과 오른쪽 콘텐츠를 명확히 분리, divider 없이 whitespace만으로 구분)
- [x] EXP bar가 profile context 안에 머무는가? (progress bar를 profile rail 폭(320px 이내)으로 제한, nickname/Lv/EXP가 하나의 cluster로 보임)
- [x] member/leader/admin에 따라 빈 영역이 생기지 않는가? (섹션 없는 경우 완전히 제거 — conditional flow. admin은 최근 발견 없이 운영→계정이 바로 이어지고, member는 운영 없이 최근 발견→계정으로 이어짐)
- [x] 최근 발견 종들이 규칙적으로 정렬되는가? (`grid grid-cols-2 sm:grid-cols-3`로 정렬된 compact list, 넓은 영역에 흩뿌려지지 않음)
- [x] 운영은 권한이 있을 때만 표시되는가? (기존 `showOperation` 조건 유지, member에서 heading 자체 미표시 확인)
- [x] 계정 section은 Settings-style hierarchy를 가지는가? (기존 divider 기반 row 유지, 변경 없음 — 요청 범위 밖)
- [x] mobile에서는 자연스러운 single-column인가? (390px에서 profile→최근 발견→운영→계정 순서로 stacking 확인)
- [x] bottom spacing이 충분한가? (컨테이너 `pb-8` + 전역 `main` bottom padding 유지로 desktop/mobile 모두 확보)

### 발견 및 수정된 버그 (Phase 3.19)
- EXP progress bar에 걸려 있던 `max-w-[320px]`가 lg 미만에서도 적용돼 mobile(390px)에서 full width가 아닌 320px로 잘려 보임 → `lg:max-w-[320px]`로 breakpoint 한정.

### Role QA (1440×900)
- member: 최근 발견(2-col) + 계정. 운영 섹션 없음.
- leader: 최근 발견 + 운영 + 계정.
- admin: 최근 발견 없음(0종) → 운영 + 계정이 바로 이어짐, 왼쪽/오른쪽 dead space 없음.

### Responsive QA
- 768×1024 (leader): single-column, profile→최근 발견→운영→계정, horizontal overflow 없음.
- 390×844 (leader): single-column, bottom nav와 로그아웃 행 겹침 없음, EXP bar full width.

### Shared EXP Regression
- member(김민수): 10종 발견 · 탐조 4회, Lv.3 60/100 EXP — Phase 3.18 검증값과 일치.
- leader(박회장): 2종 발견 · 탐조 1회, Lv.1 54/100 EXP — 정상 표시.

### 검증
- lint: 통과
- build: 통과 (12 routes 정상 생성)
- console: 에러/경고 없음 (member/leader/admin 각 페이지 확인)

### 알려진 남은 이슈
- 없음.

## Phase 3.20 — Minimal MY

- [x] member/leader/admin 구조가 동일한가? (세 role 모두 identity→Lv/EXP→활동 요약→계정 동일 순서, 조건부 section 없음. 차이는 role label 텍스트뿐)
- [x] recent discovery가 제거됐는가? (`buildEncyclopedia` 기반 최근 발견 목록/section 완전 삭제)
- [x] 운영 shortcut이 제거됐는가? (탐조 기록 검토/관리자 링크 및 `showOperation` 분기 삭제, global nav로 책임 이관)
- [x] centered single-column인가? (`mx-auto max-w-[720px] flex flex-col`, desktop에서도 grid 미사용)
- [x] identity/EXP/stats가 하나의 cluster인가? (닉네임→role→Lv/EXP(mt-8)→stats(mt-6)까지 한 section 안에서 이어짐)
- [x] account row alignment가 정확한가? (닉네임/비밀번호 row를 `label(w-20) · value(flex-1) · 변경(shrink-0)` 3-column으로 통일, min-h 56px)
- [x] bottom spacing이 충분한가? (container `pb-8` + 전역 `main` desktop `lg:pb-16` 유지 → 이전 Phase에서 이미 검증된 값)
- [x] mobile에서도 같은 information hierarchy인가? (390px에서 순서 동일, EXP bar full width, bottom nav와 겹침 없음)

### 발견 및 수정된 버그 (Phase 3.20)
- 없음.

### Role QA (1440×900)
- member(김민수): 계정만 표시, 10종 발견 · 탐조 4회, Lv.3 60/100 EXP.
- leader(박회장): 계정만 표시(운영 링크 없음), 2종 발견 · 탐조 1회, Lv.1 54/100 EXP.
- admin(관리자): 계정만 표시(운영 링크 없음), 0종 발견 · 탐조 0회 — 별도 empty-state 없이 평범한 텍스트로 표시, dead space 없음.

### Responsive QA
- 768×1024 (member): single-column, global gutter 기준 좌측 정렬, overflow 없음.
- 390×844 (member/admin): single-column, EXP bar full width, bottom nav와 로그아웃 행 겹침 없음.

### Inline Editing Regression
- 닉네임 "변경" 클릭 시 기존 inline edit form(저장/취소)이 동일하게 동작, layout shift 과도하지 않음 확인.

### Shared EXP Display Regression
- EXP: member 60/100, leader 54/100, admin 0/100 — Phase 3.18/3.19 검증값과 일치.
- species: member 10종, leader 2종, admin 0종 — 동일.
- sightings: member 4회, leader 1회, admin 0회 — 동일.

### 검증
- lint: 통과
- build: 통과 (12 routes 정상 생성)
- console: 에러/경고 없음 (member/leader/admin 각 페이지, nickname 인라인 편집 포함 확인)

### 알려진 남은 이슈
- 없음.

## Phase 3.23

### Branding
- [x] Desktop nav에 새 transparent illustration이 적용됐는가? (`components/BottomNav.tsx`의 `TopNav`, `/img/jodongari-illustration.png` 32×32 `object-contain`)
- [x] old circular logo가 남아 있지 않은가? (`jodongari.jpeg` 사용처 grep 결과 nav뿐이라 파일째 삭제)
- [x] bird/text vertical alignment가 자연스러운가? (1440×900 스크린샷 확인, nav 높이(52px) 변화 없음)

### Media Picker
- [x] 파일 선택 click이 실제 input을 활성화하는가? (label htmlFor → sr-only input, Playwright 클릭으로 실제 file chooser 오픈 확인)
- [x] image 선택 가능
- [x] video 선택 가능
- [x] audio 선택 가능
- [x] multiple 가능 (video+audio 동시 선택)
- [x] 동일 파일 재선택 가능 (삭제 후 동일 이미지 재선택 시 정상 등록)
- [x] 제거 가능
- [x] media counter 정상 (선택/삭제에 따라 요약의 "미디어 N개" 즉시 반영)
- [x] mobile에서 touch target 충분 (label `h-11` = 44px, 390px 스크린샷 확인)

### Root Cause
- 기존 코드도 실제 `<input type="file">`였고 disabled/ref/hidden 문제는 없었다. Playwright로 실제 클릭 재현 시에도 file chooser가 정상 열려 이 커밋 기준으로는 재현되지 않았다. 다만 브라우저 기본 `::file-selector-button` 렌더링에 의존하던 구조를 iOS Safari 안정성을 위해 `<label htmlFor>` + `sr-only input`으로 교체했다.

### QA
- desktop file selection: 이미지 선택 → compression(535KB) → 미리보기 → 삭제 → 동일 파일 재선택 → video/audio 추가 선택까지 전부 확인, 종/장소 입력 후 "검토 요청" 제출 → 성공 화면 전환 확인.
- 390 mobile: `/record` 스크린샷 확인, 파일 선택 버튼 hit target 충분, bottom nav와 겹침 없음.
- navigation: Home/Login/TopNav 모두 동일 illustration + `조동아리` 텍스트 사용 확인.
- record submit: media 포함 제출 정상 동작, console 에러 없음.

### 검증
- lint: 통과
- build: 통과 (12 routes 정상 생성)
- console: 에러/경고 없음

### 알려진 남은 이슈
- 없음.

## Phase 3.24 — Media Source Picker

- [x] 미디어 추가 버튼이 source picker를 여는가?
- [x] 사진/영상 option이 동작하는가?
- [x] 카메라 option이 동작하는가?
- [x] 녹음 파일 option이 동작하는가?
- [x] 파일 option이 동작하는가?
- [x] 선택 후 preview가 보이는가?
- [x] 동일 파일 재선택 가능한가?
- [x] mobile safe-area가 정상인가?
- [x] 아무 반응 없는 action이 존재하지 않는가?

### QA
- desktop(Chrome): `미디어 추가` 클릭 → popover 오픈(사진 또는 영상 / 녹음 파일 / 파일에서 선택 3개, 카메라는 `sm:hidden`으로 제외) → `사진 또는 영상` 클릭 → 동기 `ref.click()`으로 실제 OS file chooser 오픈 → 이미지 선택 → compression 후 미리보기/요약(`미디어 1개`) 반영 확인.
- 삭제 후 동일 파일 재선택 → `e.target.value = ""` 초기화 덕분에 change 이벤트 재발생, 정상 재등록 확인.
- mobile(390×844): bottom sheet로 렌더링(rounded-t-3xl, dim backdrop, "취소"), `카메라로 촬영` 포함 4개 옵션 모두 노출 확인. `녹음 파일` 클릭 → `accept="audio/*"` input 기준 OS chooser 오픈 확인.
- console: 에러 없음.

### 검증
- lint: 통과
- build: 통과 (12 routes 정상 생성)
- console: 에러/경고 없음

### Manual device verification still required
- 실제 iPhone Safari에서 `카메라로 촬영`의 capture 동작(사진/영상 capture UX)과 각 native picker의 최종 UX는 기기에서 직접 확인 필요 — 웹 표준상 OS picker 자체를 코드로 강제하거나 자동화로 완전히 검증할 수 없다.

### 알려진 남은 이슈
- 없음.

## Phase 3.25 — Media Source Picker Layout Fix + Native Input Overlay

### Source Picker Layout
- [x] desktop 폭 320px 이상 (`sm:w-[340px]` 전용 shell)
- [x] 텍스트 세로 깨짐 없음 (1440×900 스크린샷으로 "사진 또는 영상" 등 전부 한 줄/두 줄 정상 표시 확인)
- [x] row 전체 click target (각 row 실측 338×60px, input이 그 영역 전체를 덮음)
- [x] popover가 page flow를 깨뜨리지 않음 (form/summary/CTA 위치 회귀 없음, 1440×900 스크린샷 확인)

### Native Input
- [x] input은 display:none이 아님 (computed `display: block` 확인)
- [x] input은 option 전체를 overlay (338×60px, row와 동일 크기)
- [x] pointer-events 활성 (`pointer-events: auto` 확인)
- [x] disabled 아님
- [x] programmatic click 미사용 (`ref.click()` 완전 제거)
- [x] label activation 미사용
- [x] onChange 후 공통 processing (`handleMediaSelect` → `buildSightingMedia` 그대로 재사용)
- [x] 동일 파일 재선택 가능 (`onChange` 안에서 `e.target.value = ""` 유지)

### QA
- 1440×900: `미디어 추가` 클릭 → 340px 폭 popover가 trigger 바로 아래 정상 위치에 표시, "사진 또는 영상 / 녹음 파일 / 파일에서 선택" 3개 + "취소"만 노출(카메라는 `sm:hidden`), 모든 텍스트 가로 정렬 확인. DOM 검사로 photoVideo/audio/generic input이 각각 338×60px, `display:block`/`opacity:0`/`pointer-events:auto`/`disabled:false`임을 확인. camera input은 0×0(숨김)으로 정상.
- 390×844: bottom sheet로 렌더링, 사진 또는 영상 → 카메라로 촬영 → 녹음 파일 → 파일에서 선택 → 취소 순서로 4개 옵션 모두 정상 한 줄/두 줄 표시.
- Record page 회귀: form width/summary panel/submit button/nav/scrolling 모두 기존 위치 유지 확인.
- Calendar 회귀: `DatePicker`/`DateRangePicker`는 `CalendarPopover`를 그대로 사용 중이며 이번 변경(props 원복)으로 영향 없음 — 코드 경로 확인(별도 스크린샷 QA는 생략, prop signature만 되돌렸고 사용 값은 기존과 동일).

### Manual device verification still required
- 실제 Chrome/iPhone Safari에서 OS native file chooser가 실제로 열리는지는 자동화로 완전히 검증 불가능하다 — 대신 실제 input이 클릭 표면 전체를 덮고 trusted user gesture를 직접 받도록 구조적으로 보장했다.
- `capture="environment"` 카메라 촬영의 기기별 동작은 이번 Phase에서도 기기 확인 필요.

### 알려진 남은 이슈
- 없음.

## Phase 3.26 — File Input Diagnostic

- [x] raw native input chooser open
- [x] normal-flow overlay chooser open (raw input 자체가 normal flow이므로 TEST 1과 동일 결과)
- [x] picker overlay chooser open
- [x] root cause identified (코드 defect 아님으로 판정)
- [x] actual native chooser confirmed
- [ ] image selected (chooser open 확인이 목적이라 실제 파일 선택까지는 진행하지 않음)
- [ ] video selected
- [ ] audio selected
- [ ] same-file reselection
- [ ] cancel safe

### Diagnostic matrix
- TEST 1 (raw visible native input, `/record` 정상 flow 안에 임시 노출): **O** — 클릭 즉시 OS-level file chooser 이벤트 발생.
- TEST 2 (normal-flow transparent overlay): 별도 미실시 — TEST 1이 이미 normal-flow raw input이라 중복.
- TEST 3 (MediaSourcePicker 내부 overlay input, `사진 또는 영상` row): **O** — 동일하게 file chooser 정상 오픈.

### Event tracing
- row(트리거 버튼) pointerdown → mousedown → click, 이어서 overlay `<input>` pointerdown → mousedown → click까지 이벤트가 끊김 없이 도달.
- 어느 단계에서도 `event.defaultPrevented === true` 관측되지 않음.
- z-index: input이 row wrapper 안에서 `absolute inset-0`으로 자연스러운 DOM 순서상 최상단, 별도 z-index 지정 불필요하고 실제로도 문제 없음.
- backdrop: mobile 전용(`sm:hidden`)이라 desktop popover 클릭 경로와 무관, z-40/z-50류 충돌 없음.

### Root cause
- 이 코드베이스의 `MediaSourcePicker`/raw `<input type="file">`에는 native file chooser activation을 막는 구조적 원인이 없다. Playwright(Chromium)로 실제 클릭 재현 시 두 케이스 모두 정상 동작.
- 실사용자가 보고한 무반응은 이 diff에서는 재현 불가 — Claude in Chrome 확장이 이 세션에 연결되지 않아 사용자의 실제 데스크톱 Chrome 프로필로 직접 검증하지 못한 것이 한계. 브라우저 확장 간섭 / 캐시된 구버전 번들 / OS 권한 등 앱 코드 밖 환경 요인을 우선 의심해야 한다.

### 검증
- lint: 통과
- build: 통과 (12 routes 정상 생성)
- console: 에러/경고 없음 (진단용 이벤트 로거는 확인 후 제거)

### 알려진 남은 이슈
- 실제 사용자 데스크톱 Chrome에서 하드 리프레시(캐시 무시) 후에도 재현되면, 확장 프로그램을 모두 끈 시크릿 창에서 재확인 필요 — 이 Phase 안에서는 검증 채널이 없어 완료 처리하지 않는다.

## Phase 4B-1 — Mobile Date Field + App Icon

### Mobile Date
- [x] 390px에서 우측 여백 없음
- [x] 375px에서 정상 (390px과 동일 구조, 회귀 없음)
- [x] 430px에서 정상 (동일)
- [x] desktop 회귀 없음 (1440px에서 오히려 동일한 버그가 있었고 함께 해결됨)

Root cause: `components/date/DatePicker.tsx`의 trigger wrapper `<div className="relative inline-block">`가 `QuickDateField`의 `flex flex-col` 컨테이너 안에서 flex item으로 blockify되어 부모 폭만큼 늘어나지만, 내부 `<button>`에는 `w-full`이 없어 버튼이 자기 콘텐츠 크기로만 그려짐 — 그 결과 늘어난 wrapper와 좁은 button 사이의 차이가 오른쪽 여백으로 보였다. 실제 Tailwind 클래스를 그대로 쓴 격리 HTML로 390px/1440px 양쪽에서 재현 후 수정 확인(Playwright screenshot).

Fix: wrapper를 `relative`로, button에 `w-full` 추가 (`components/date/DatePicker.tsx`). Popover는 `sm:left-0`/`fixed inset-0`(mobile bottom sheet) 기준이라 trigger 폭 변경과 무관 — desktop popover 위치 영향 없음.

### App Icon
- [x] browser favicon 적용 (`app/icon.png`, `app/favicon.ico`)
- [x] Apple touch icon 적용 (`app/apple-icon.png`, 180×180)
- [x] icon crop/scale 자연스러움 (bird bbox 기준 centered, canvas의 ~76%)
- [x] 기존 brand illustration 유지 (`public/img/jodongari-illustration.png` 미변경, login/home 그대로 사용)
- [x] production cache 주의사항 기록 (아래)

`jodongari-img` 디렉터리는 repo에 없었다 — 가장 가까운 소스는 `img/icon.jpeg`(원형 뱃지 + 텍스트, 1254×1254)와 `img/jodongari.png`(새 캐릭터만, alpha 있음, `public/img/jodongari-illustration.png`와 동일). `icon.jpeg`는 텍스트가 favicon/32px 크기에서 읽히지 않아 원본 그대로 쓰지 않고, `img/jodongari.png`를 bbox로 tight-crop → 흰색 정사각 캔버스 중앙 배치(76% 비율)로 전용 app icon을 새로 생성했다.

Cache 주의사항: favicon/apple-icon은 브라우저·iOS에 강하게 캐시된다. 배포 후 확인 시 hard refresh/시크릿 창이 필요할 수 있고, 이미 홈 화면에 추가된 shortcut은 삭제 후 재추가해야 새 아이콘이 반영된다.

## Phase 4B-2 — Media Picker 단순화 (File Upload + Camera)

- [x] desktop file upload 1개 (popover 없이 `record/page.tsx`의 미디어 섹션에 직접 노출)
- [x] mobile file upload + camera (bottom sheet 2개 옵션)
- [x] redundant media options 제거 (사진 또는 영상 / 녹음 파일 / 파일에서 선택 → 파일 업로드로 통합)
- [x] image/video/audio upload 정상 (`accept="image/*,video/*,audio/*"`, `buildSightingMedia`가 `File.type` 기준으로 그대로 분류)
- [x] camera 정상 (`accept="image/*" capture="environment"`, mobile bottom sheet에만 존재)
- [x] Storage regression 없음 (media pipeline/`lib/media.ts` 미변경)

## Phase 4B-3 — Production Deploy + iPhone Safari Verification

### Deploy
- [x] Netlify 사이트가 GitHub repo와 연결되어 있지 않음 확인 (`build_settings: {}`, 기존 deploy 전부 `deploy_source: "cli"`) → git push는 자동 배포를 트리거하지 않으므로 `netlify deploy --prod --build`로 기존 site(jodongari-236)에 수동 production 배포 진행
- [x] Netlify env 확인: `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`는 이미 존재, `SUPABASE_SERVICE_ROLE_KEY`는 누락되어 있어 배포 전 등록 요청 → 등록 완료 확인 후 진행
- [x] tsc/lint/build 로컬 통과 (lint 오류는 전부 gitignored `.netlify/` 빌드 산출물에서만 발생, 실제 소스는 경고 1개(`app/login/page.tsx`, 기존 코드, 이번 변경과 무관)뿐)

### Production Smoke Test
- [x] `/`, `/login`, `/signup`, `/record`, `/my`, `/admin`, `/sightings`, `/members`, `/review`, `/encyclopedia` 모두 200 응답
- [x] `/icon.png`, `/apple-icon.png`, `/favicon.ico` 모두 200, 올바른 content-type
- [x] `POST /api/auth/login` 정상 동작 (존재하지 않는 계정으로 400 "아이디 또는 비밀번호를 확인해 주세요." 응답 — 500이 아니므로 `SUPABASE_SERVICE_ROLE_KEY` 정상 인식 확인)
- [x] client JS 번들 11개 전체에 `service_role` 문자열 없음 확인 (service role key 노출 없음)
- [x] signup redirect: `emailRedirectTo`가 `window.location.origin` 기반이라 production에서 자동으로 `https://jodongari-236.netlify.app` 사용 (코드 확인, Phase 4A-2에서 이미 수정됨)

### Manual iPhone Safari verification still required (실기기 확인 필요, 여기서는 체크하지 않음)
- [ ] 375/390/430 mobile viewport에서 날짜 field 오른쪽 여백 없음 + 캘린더 정상 동작
- [ ] mobile 미디어 추가 → 파일 업로드 / 카메라로 촬영 2개 옵션만 노출
- [ ] 실제 카메라 촬영 + preview
- [ ] Safari → 홈 화면에 추가 시 새 app icon 정상 반영 (기존 shortcut이 있다면 삭제 후 재추가 필요)
- [ ] custom ID 로그인 실기기 확인

## Phase 4B-4 — Mobile Calendar Centering + Netlify Site Rename

### Calendar
- [x] Root cause: `components/date/Calendar.tsx`의 wrapper `div`가 `w-[300px]`(fixed) block인데 `mx-auto`가 없어, 전체 폭인 mobile bottom sheet 안에서 기본 좌측 정렬됨. Desktop popover는 `CalendarPopover`가 `sm:w-auto`로 content-width 축소돼 눈에 띄지 않았음. Phase 4B-1의 DatePicker trigger width 문제와는 무관.
- [x] Fix: wrapper에 `mx-auto` 한 줄 추가. month nav / weekday row / date grid가 모두 이 하나의 wrapper 안에 있어 셋이 함께 중앙 정렬됨(개별 조정 불필요).
- [x] `qacalendartmp` 임시 route + `RouteGuard.tsx` public path 임시 추가로 로컬에서 `DatePicker`를 직접 렌더링해 375/390/430 확인 후 되돌림(production에는 배포되지 않음, 배포는 그 전에 시작됨 — `/qacalendartmp` production 404 확인).
- [x] 375×812: 좌우 여백 대칭, header/weekday/grid/selected circle 모두 중앙
- [x] 390×844: 동일하게 정상
- [x] 430×932: 동일하게 정상
- [x] Desktop(1440×900) popover: 기존과 동일하게 정상, 폭 변화 없음
- [x] `DateRangePicker`도 동일한 `Calendar` 컴포넌트를 공유해서 사용하므로 자동으로 함께 수정됨(범위 선택 footer 프리셋 버튼 포함, 별도 코드 변경 없음)

### Netlify site rename
- [x] 기존 site(`jodongari-236`, ID `e63401f4-7135-4bb2-a141-0275e3d6f24f`) 그대로 유지, `netlify api updateSite`로 이름만 `tpkr-jodongari`로 변경 (새 project 생성 없음)
- [x] Production URL: `https://tpkr-jodongari.netlify.app`
- [x] Env var(`NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY`) rename 후에도 3개 모두 유지 확인
- [x] `.netlify/state.json`의 site ID 기준으로 CLI link 그대로 유지됨 (`netlify status`로 재확인)
- [x] 코드 전역에 `jodongari-236`/`.netlify.app` hardcoded 문자열 없음 확인 (signup `emailRedirectTo`가 이미 `window.location.origin` 기반이라 코드 변경 불필요)
- [x] Production smoke test: `/`, `/login`, `/signup`, `/record`, `/icon.png`, `/apple-icon.png`, `/favicon.ico` 모두 200
- [x] `POST /api/auth/login` 존재하지 않는 계정으로 400 응답(500 아님 → service role key 정상 인식)
- [x] Old URL(`https://jodongari-236.netlify.app`) rename 후 404 확인 — 더 이상 canonical로 사용하지 않음

### Manual action remaining (Dashboard 수동 설정 필요, CLI/MCP로 변경 불가)
- [ ] Supabase Dashboard → Authentication → URL Configuration → **Site URL**을 `https://tpkr-jodongari.netlify.app`로 변경
- [ ] 같은 화면 **Redirect URLs**에 `https://tpkr-jodongari.netlify.app/**` 추가, `http://localhost:3000/**`는 유지, `https://jodongari-236.netlify.app/**`는 새 URL 검증 후 제거 권장
- [ ] iPhone Safari 실기기에서 375/390/430 캘린더 육안 확인 (에뮬레이션으로는 확인했지만 사용자가 보고한 실기기 재현이 아직 없음)
