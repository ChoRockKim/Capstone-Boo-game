# Boo App Current Project Status

Last updated: 2026-06-09

이 문서는 현재 프론트엔드 코드 상태를 빠르게 공유하기 위한 운영 메모입니다. 학습용 상세 설명은 `docs/technical-learning-guide.md`, 서버 계약 상세는 `docs/api/server-api-summary.md`, 도메인별 구현/변천사는 `docs/domain-evolution-history.md`를 우선 확인하세요.

## Architecture

```text
[assets]
-> [constants / domain registries]
-> [utils / server adapters]
-> [stores]
-> [hooks]
-> [shared UI]
-> [feature panels]
-> [Expo Router routes]
```

- Expo Router가 `app/`의 파일 라우팅을 담당합니다.
- `app/_layout.tsx`는 앱 공통 Provider, Splash 제어, 폰트/이미지/사운드 preload를 담당합니다.
- 서버 요청은 `utils/serverApi.ts`에 모으고, snake_case 서버 응답은 adapter에서 UI/store 모델로 변환하는 방향을 유지합니다.
- 전역 게임 상태는 `stores/useGameStore.ts`의 Zustand persist store가 담당합니다.
- React Query는 서버 목록/상세 상태, refetch, optimistic cache update에 사용합니다.
- 화면 orchestration은 route 파일에서 담당하고, 패널 컴포넌트는 가능한 한 UI와 feature interaction에 집중합니다.

## Active Features

- 인증/회원가입/이메일 인증/로그인/로그아웃/토큰 갱신은 서버 API와 연결되어 있습니다.
- 로그인 후 `syncServerUserStats` 계열 동기화로 코인, 하트, XP, 유저 기본 정보, 캐릭터 정보를 서버 기준으로 맞춥니다.
- 학식 먹이기는 `/school-foods/today`, `/school-foods/feed-status`, `/school-foods/feed`를 사용합니다.
- 퀴즈는 로그인 상태에서 `/quizzes/play-status`, `/quizzes/next`, `/quizzes/submit`을 우선 사용합니다.
- 친구 목록, 친구 검색, 친구 요청, 요청 수락/거절, 친구 방 방문은 서버 API를 사용합니다.
- 마이룸 방 상태, 상점, 구매, 장착, 방명록은 서버 API와 연결되어 있습니다.
- 캐릭터 코스튬은 `equipped_skin_key`로 서버 저장/조회합니다.
- 졸업 화면은 `/graduation/confirm` 또는 `/graduation/summary` 응답을 우선 사용하고, 실패/게스트는 로컬 통계로 fallback합니다.
- 미니게임은 `/economy/minigame/start`, `/economy/minigame/reward`, `/minigames/results`, 랭킹 API를 사용합니다.
- 게스트 모드는 로컬 전용이며 친구/친구 방/방명록/친구 랭킹 API를 호출하지 않습니다.

## Optimistic Handling Status

완료된 낙관 처리:

- 학식 먹이기: 로컬 XP/상태를 먼저 반영하고 서버 실패 시 rollback합니다.
- 퀴즈 제출: 서버 정답이 있는 경우 선판정 후 서버 결과로 보정합니다.
- 미니게임 성공 보상: 코인을 먼저 반영하고 보상 API 실패 시 rollback합니다.
- 친구 삭제: 친구 목록 cache를 먼저 제거하고 실패 시 rollback합니다.
- 친구 요청 수락/거절: 받은 요청 목록을 즉시 제거하고, 수락 시 친구 목록 cache에 임시 친구를 추가한 뒤 실패 시 rollback합니다.
- 방명록 수정/삭제: 방명록 cache를 즉시 수정/삭제하고 실패 시 rollback합니다.
- 친구 방 방명록 작성: 임시 방명록 entry를 cache에 추가하고 서버 응답의 실제 entry id로 치환합니다.
- 방 가구/벽지 장착: 로컬 장착 상태를 먼저 바꾸고 서버 장착 실패 시 이전 상태로 rollback합니다.
- 캐릭터 코스튬 변경: 로컬 코스튬을 먼저 바꾸고 서버 저장 실패 시 이전 코스튬으로 rollback합니다.

낙관 처리하지 않는 영역:

- 미니게임 시작/하트 차감은 서버 세션과 하트 권위가 중요하므로 loading/pending UI를 사용합니다.
- 상점 구매는 코인/소유권이 걸린 경제성 작업이므로 서버 성공 후 반영합니다.
- 로그아웃/회원탈퇴는 destructive 계정 작업이므로 optimistic UI보다 명확한 pending/error 처리를 우선합니다.

## Completed Work

- `docs/api/openapi.json`을 최신 OpenAPI 기준으로 갱신했습니다.
- `docs/api/server-api-summary.md`에 2026-06-08 백엔드 계약 상태를 정리했습니다.
- `docs/domain-evolution-history.md`에 도메인별 사용 기술, 구현 방식, 업그레이드 과정, 어려움을 정리했습니다.
- 캐릭터 코스튬 서버 저장/조회 흐름을 프론트에 연결했습니다.
- 친구 방에서 서버 `RoomCharacterOut.equipped_skin_key`를 읽어 코스튬을 렌더링합니다.
- 졸업 화면이 서버 summary를 우선 사용하도록 연결했습니다.
- 미니게임 보상 요청에 `success: true`를 명시하도록 정리했습니다.
- DeveloperPanel의 코인/XP/학년/상태 디버그 조작을 `/debug/me`로 연결했습니다.
- 자유투 플레이 시작/재시작 준비 단계에 로딩 오버레이를 추가했습니다.
- 자유투 슛 순간의 검은색 게이지 바 위치가 슛 애니메이션 동안 유지되도록 수정했습니다.
- 친구 요청, 방명록, 방 장착에 rollback 가능한 낙관 처리를 추가했습니다.

## Known Errors And Risks

- 마이룸 상점 구매에서 로컬 `RoomData` id/label과 서버 shop item 매칭이 실패할 수 있습니다. `item_key`를 로컬 asset id와 1:1로 내려주는 서버 계약이 가장 안정적입니다.
- 서버 응답 필드는 snake_case가 많습니다. UI/store에 직접 흘리지 말고 `utils/*Adapter.ts`에서 camelCase 또는 기존 로컬 모델로 변환해야 합니다.
- 자동 로그인 직후 서버 stats sync를 기다리면 초기 진입이 느릴 수 있습니다. timeout/background sync 분리는 추후 개선 후보입니다.
- 졸업 리포트의 일부 누적 통계는 서버 summary가 실패하면 로컬 통계로 fallback합니다.
- 기존 AsyncStorage에 남은 더미 친구/방명록 데이터는 persist 때문에 남아 있을 수 있습니다. 로그인 화면에서는 더미 표시를 막았지만 마이그레이션 정리는 별도 작업입니다.
- `npm run lint`는 실행 가능하지만 React hooks 계열 기존 lint error가 남아 있을 수 있습니다. 변경 검증 기본값은 `npx tsc --noEmit`입니다.
- `node_modules`나 assets/native 폴더에 ` 2`, ` 3` suffix 복제물이 남아 있으면 Metro cache 단계가 느려지거나 꼬일 수 있습니다.

## Cautions

- 도메인 registry인 `components/MiniGame/MiniGameData.ts`, `components/Room/RoomData.ts`, 캐릭터/학식/업적 데이터는 기획값의 진실 공급원으로 취급합니다.
- 보상 수치, 하트 정책, 장소/게임 매핑, XP 임계치, 업적 조건은 명시 요청 없이 변경하지 않습니다.
- 서버 경제성 작업은 서버 성공 응답을 권위값으로 봅니다. 구매, 하트 차감, 보상 지급은 optimistic UI로 덮지 않습니다.
- `app/game/index.tsx`, `app/miniGame/*Play.tsx`, `app/room/index.tsx`는 orchestration 레이어입니다. timer, audio, router, store, server session cleanup을 함께 확인해야 합니다.
- 새 로딩 오버레이 이미지는 `components/LoadingOverlay/LoadingOverlayAssets.ts` registry를 통해 preload해야 합니다.
- Node 20 환경에서 Expo/Metro를 실행하세요. Node 26/Homebrew Node는 optional native dependency 이슈가 날 수 있습니다.
- native 폴더가 존재하므로 `expo prebuild` 전후 diff를 확인해야 합니다.
