# FEATURES.md

## 핵심 기능 (예정)

- [x] 탐조 기록 (하나의 탐조 활동 = 하나의 기록, 여러 종 포함) — mock 기반, 회장 승인 필요
- [x] 개인 도감 (관찰 종/횟수/최초·최근 관찰일 자동 집계) — mock 기반
- [x] 커뮤니티 Feed (좋아요, 댓글, 사진) — mock/local, persistence 없음
- [x] 경험치 / 레벨 (deterministic `getLevel(totalExp)`)
- [ ] 새 맞히기 게임
- [x] 사진 선택 + 브라우저 resize/compression (미리보기까지, 실제 Storage 업로드는 추후)
- [ ] 채팅 (추후)

## Phase 0

- [x] Next.js + TypeScript + Tailwind 초기 구성
- [x] 프로젝트 문서 (`CLAUDE.md`, `docs/*`)

## Phase 1

- [x] 탐조 기록 승인 workflow (draft → pending → approved/revision_requested)
- [x] species 단위 상태 필드 (`SightingSpeciesStatus`) — 데이터 모델만, UI는 기록 단위 검토
- [x] 국내 조류 mock master list (20종) + 도감 해금 로직 → Phase 3B에서 실제 국가생물종목록 597종으로 교체
- [x] EXP/레벨 계산 (`lib/exp.ts`)
- [x] 회장 검토 화면 (`/review`)
- [x] 모바일 bottom navigation (홈/탐조/기록/도감/MY, leader는 검토 탭 추가)
- [x] mock 사용자 전환 UI (MY 화면)

## Phase 2

- [x] 홈 = 커뮤니티 Feed (승인된 기록 + 본인 pending 기록, 좋아요/댓글)
- [x] 기록 작성: 날짜→장소→species 검색·선택→사진→메모→검토 요청 순서로 재구성
- [x] 사진 선택(최대 5장) + `lib/photo.ts` 브라우저 resize/compression, preview/순서/제거
- [x] Apple-inspired 디자인 정돈 (system font, design token, bottom nav 아이콘)
- [x] 도감 미해금 species도 이름 표시(muted)로 변경

## Phase 3B

- [x] 국립생물자원관 국가생물종목록(2024-12-31 기준) 실제 조류 597종 master dataset 적용
- [x] 도감/기록 작성 검색을 실제 597종 대상으로 전환, 도감에 검색창 추가
- [x] 조류 목록 출처 표기 (도감 하단)

## Phase 3.5

- [x] 로컬 인증: `/login`, session persistence(localStorage), logout, route guard(비로그인/leader 전용 route)
- [x] mock 사용자 전환 UI 제거, 로그인 사용자 = 현재 사용자로 통일
- [x] Apple HIG-inspired semantic color token, dark mode(`prefers-color-scheme`), focus-visible, reduced-motion 전역 적용
- [x] 로그인 화면 Apple-inspired 레이아웃(label 입력, 비밀번호 보기/숨기기, validation, loading state)

## Phase 3.9

- [x] 멤버 EXP overview (`/members`) — 닉네임/역할/레벨/EXP/관찰 종/탐조 횟수, EXP 내림차순 정렬, 현재 사용자 강조(파란 테두리 + "나" 배지), podium/순위 강조 없음
- [x] 기록 화면 날짜 선택 버그 수정 — `showPicker()` 자동 호출 + `max=오늘` 미래 날짜 제한 (`components/DateField.tsx`)
- [x] MY 페이지 계정 설정: 닉네임 변경(inline editing, 20자 제한), 비밀번호 변경(inline form, 8자 이상, SHA-256 해시 저장)

## Phase 3.10

- [x] 관리자(admin) role 추가 — 사용자 목록/role 변경/active-inactive 관리 (`/admin`), 마지막 관리자 보호
- [x] 탐조/기록 navigation 통합 — 탐조가 "기록하기" CTA + 기간 조회(전체/7일/30일/기간 선택)를 갖춘 Sighting Hub로 재구성, `기록` top-level nav 제거
- [x] 날짜 선택(`DateField`/`QuickDateField`) 반복 open 버그 근본 수정 — 클릭마다 imperative `showPicker()` 재호출
- [x] 탐조 기록 media를 사진 → 사진/영상/오디오 통합 모델(`SightingMedia`)로 확장, video/audio는 object URL(비영속) 기반 preview
- [x] `img/jodongari.jpeg` 브랜드 로고를 Login/desktop TopNav에 적용
- [x] mobile bottom nav 기본 5개(홈/탐조/도감/멤버/MY) 고정, leader/admin 전용 메뉴(검토/관리자)는 desktop nav 직접 노출 + MY "운영" 섹션으로 접근

## Phase 3.11

- [x] native `<input type="date">`/`showPicker()` 제거, custom calendar system(`components/date/`) 도입 — 단일 날짜/기간 공용 core
- [x] Record "언제" 및 탐조 기간 필터를 동일 calendar system으로 통합 (desktop popover / mobile bottom sheet)
- [x] 탐조 기간 필터 UX 재구성 — 시작일/종료일 두 줄 노출 제거, compact `9월 14일 – 9월 27일` label로 대체
- [x] Sightings/Members 목록을 카드 반복 → divider 기반 리스트로 전환, raw ISO 날짜 노출 제거
