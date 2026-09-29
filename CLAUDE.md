# CLAUDE.md

jodongari — 소규모 비공개 탐조 동호회 웹 앱. 상세 배경은 `docs/PROJECT.md` 참고.

## 항상 지킬 규칙

- 설명, 질문, 작업 보고는 한국어로. 코드/식별자/파일명/commit message는 영어.
- **Local-first**: Supabase 연결 전까지 mock data로 모든 기능을 로컬에서 완성한다.
- **Mock-first**: UI → service → repository interface → mock repository 구조를 따른다 (과도한 추상화는 금지).
- **Minimal architecture**: 소규모 동호회 앱 수준을 넘는 구조, 패턴, 추상화, dependency를 추가하지 않는다.
- **Task scope 준수**: 요청 범위 밖 파일 수정 금지, unrelated refactoring 금지.
- 작업 전 필요한 파일만 읽는다. 전체 repo 탐색은 명시적 요청이나 architecture 변경 시에만.
- 작업 후 보고는 짧게: 변경 파일, 검증 결과, 남은 이슈만.

## 문서

- `docs/PROJECT.md` — 목적과 핵심 컨셉
- `docs/ARCHITECTURE.md` — 현재 architecture
- `docs/FEATURES.md` — 기능 상태
- `docs/DECISIONS.md` — 주요 결정 기록
- `docs/TODO.md` — 현재/다음 작업
