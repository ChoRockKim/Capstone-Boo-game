# Boo App Domain Evolution History

Last updated: 2026-06-09

이 문서는 현재 저장소에 남아 있는 기록을 기준으로, `부 키우기` 앱의 각 도메인이 무엇으로 만들어졌고, 어떤 과정을 거쳐 현재 구조까지 업그레이드되었고, 그 과정에서 어떤 어려움이 있었는지를 정리한 문서입니다.

## Source Records

확인한 근거:

- Git commit history
  - `2026-05-04 first commit`
  - `2026-05-04 main screen completed`
  - `2026-05-06 register design completed`
  - `2026-05-07 main ui completed`
  - `2026-05-10 미니게임 빼고 다 구현`
  - `2026-05-10 진짜 기본 기능 거의 다 넣었다`
  - `2026-05-10 my room prototype`
  - `2026-05-24 room style`
  - `2026-05-25 feature/book-catch game`
  - `2026-05-25 book-catch detailed`
  - `2026-05-26 book-catch almost done`
  - `2026-05-26 boo-catch completed`
  - `2026-06-01 api 1차 연결`
  - `2026-06-03 feature/업적, 농구 게임 추가`
  - `2026-06-08 feature/ 서버 API 보완 및 게스트 분리 로직 추가, 졸업 추가, 코스튬 변경`
  - `2026-06-09 feature/ 서버 api 반영`
- Existing docs
  - `docs/technical-learning-guide.md`
  - `docs/work-log-2026-06-03.md`
  - `docs/device-sync-risk.md`
  - `docs/api/backend-api-integration-audit-2026-06-04.md`
  - `docs/api/frontend-api-connection-audit-2026-06-07.md`
  - `docs/api/server-api-summary.md`
  - `docs/current-project-status.md`
- Current source code
  - `app/*`
  - `components/*`
  - `stores/useGameStore.ts`
  - `utils/serverApi.ts`
  - `utils/syncServerUserStats.ts`
  - `utils/syncServerCharacter.ts`
  - `utils/syncServerRoomState.ts`
  - `utils/serverRoomAdapter.ts`
  - `constants/character.ts`
  - `constants/achievements.ts`
  - `components/MiniGame/MiniGameData.ts`
  - `components/Room/RoomData.ts`

기록상 한계:

- 초기 기획 회의, 디자인 시안, 백엔드 repo 내부 구현 기록은 이 저장소 안에 없습니다.
- commit message가 간단한 구간은 변경 파일 목록과 현재 코드 구조를 근거로 흐름을 복원했습니다.
- “왜 그 결정을 했는지”가 문서에 직접 남아 있지 않은 경우에는 현재 코드와 당시 장애 문서로부터 추론한 내용임을 전제로 정리했습니다.

## Overall Timeline

### 2026-05-04: Expo 앱 골격과 첫 화면

- Expo Router 기반 프로젝트가 시작되었습니다.
- `app/_layout.tsx`, `app/index.tsx`, 기본 `app.json`, `tsconfig.json`, `eslint.config.js`가 들어왔습니다.
- `assets/images/main-building.png`, `main-title.png`, `thumbnail_login.png`, `assets/fonts/NeoDunggeunmo.ttf`가 추가되어 한국외대/마스코트 앱의 첫 인상 화면을 만들었습니다.
- `components/Button/MainButton.tsx`가 초기 버튼 컴포넌트로 사용되었습니다.

주요 의미:

- 앱의 첫 방향은 “로그인 진입 화면 + 캠퍼스/부 캐릭터 분위기”였습니다.
- 처음부터 Expo Router를 사용했기 때문에 이후 `/game`, `/room`, `/miniGame` 같은 도메인 화면을 파일 기반으로 자연스럽게 늘릴 수 있었습니다.

### 2026-05-06: 회원가입/로그인 디자인과 캐릭터 에셋

- `components/Register/*`, `components/Login/Login.tsx`, `components/Inputs/*`가 추가되었습니다.
- 학번, 이름, 이메일, 비밀번호, 이메일 확인 같은 입력 UI가 생겼습니다.
- 1-4학년 캐릭터와 졸업 캐릭터 에셋이 추가되었습니다.
- `constants/character.ts`, `constants/colors.ts`, `constants/fonts.ts`가 들어오면서 도메인 타입과 디자인 상수가 분리되기 시작했습니다.
- `metro.config.js`, `declarations.d.ts`가 추가되어 SVG import와 TypeScript 타입 선언을 다루기 시작했습니다.

주요 의미:

- 인증은 아직 서버 권위 기능이라기보다 화면/폼 구조 중심이었습니다.
- 캐릭터는 단일 이미지가 아니라 학년과 상태별 registry로 관리될 기반이 생겼습니다.

### 2026-05-07: 메인 게임 UI

- `/game` 화면과 캐릭터, 코인, 프로그레스, 사각 버튼, 아이콘들이 추가되었습니다.
- `Character`, `CoinBox`, `ProgressBar`, `SquareButton`, `OutlinedText` 같은 공통 UI가 도입되었습니다.
- `utils/backgroundMusic.ts`가 생겨 화면별 BGM 흐름의 초기가 만들어졌습니다.

주요 의미:

- 앱이 단순 로그인 화면에서 “육성형 메인 게임 화면”으로 넘어갔습니다.
- 메인 화면은 이후 학식, 퀴즈, 친구, 설정, 마이룸, 미니게임 진입을 모두 orchestration하는 중심 화면이 되었습니다.

### 2026-05-10: 미니게임 제외 대부분의 기능 완성

- 학식, 퀴즈, 친구, 프로필, 옵션, 사운드, 로딩 오버레이, 진화, TopAlert, BooChat 등 주요 앱 기능이 대량 추가되었습니다.
- `stores/useGameStore.ts`가 본격적으로 앱의 전역 상태를 관리하기 시작했습니다.
- `useHook/useTodayMeal.ts`, `utils/getTodayMeal.ts`, `utils/xpProgress.ts`, `utils/soundEffects.ts`가 들어왔습니다.
- 학식 이미지는 `assets/plates/*`, 사운드는 `assets/musics/*`, smoke/egg/splash 이미지는 `assets/images/*`로 정리되었습니다.

주요 의미:

- “로컬 상태 기반 MVP”가 만들어진 시점입니다.
- 서버 없이도 학식 먹이기, 퀴즈, XP 증가, 진화, 사운드, 친구 더미 UI가 동작하는 방향이었습니다.

### 2026-05-10: 마이룸 prototype

- `/room` 화면, `components/Room/RoomData.ts`, `RoomMiniBoo`, 마이룸 BGM, 튜토리얼 이미지가 추가되었습니다.
- 마이룸은 처음에는 기본 방/침대/옷장/책상 에셋 중심의 prototype이었습니다.
- `RoomData.ts`가 방 배경, 가구, 좌표, 부 이동 영역의 registry 역할을 하게 되었습니다.

주요 의미:

- 마이룸은 처음부터 서버 room model이 아니라 로컬 asset registry와 좌표 렌더링으로 시작했습니다.
- 이후 상점/구매/장착/친구 방/방명록이 붙으면서 가장 복잡한 도메인 중 하나가 되었습니다.

### 2026-05-24 - 2026-05-26: 마이룸 확장과 미니게임 2종

- 방/가구 에셋이 대량 추가되었습니다.
- 슬롯은 `bed`, `closet`, `table`, 벽지는 별도 wallpaper 개념으로 나뉘었습니다.
- `/miniGame` 허브, 장소 이미지, 하트 UI, 랭킹 모달, 미니게임 시작 화면이 생겼습니다.
- 전공책 받기와 부 잡기 실제 플레이 화면이 추가되었습니다.
- `react-native-reanimated` shared value/frame callback 기반의 움직임, 충돌, 타이머 처리가 들어갔습니다.

주요 의미:

- 캠퍼스 장소 기반 미니게임 허브라는 구조가 생겼습니다.
- 장소 registry(`MiniGameData.ts`)가 “장소 설명 + 배경 이미지 + 미니게임 연결 + preload”를 동시에 담당하게 되었습니다.
- 마이룸은 prototype에서 실제 커스터마이징 자산이 많은 도메인으로 확장되었습니다.

### 2026-06-01: 서버 API 1차 연결

- `utils/serverApi.ts`가 추가/확장되고, OpenAPI 문서가 저장소에 들어왔습니다.
- 로그인, 회원가입, 학식, 퀴즈, 친구, 마이룸, 미니게임 일부가 서버 API와 연결되기 시작했습니다.
- `serverFriendAdapter`, `serverGuestbookAdapter`, `syncServerCharacter`, `syncServerUserStats`가 추가되었습니다.
- React Query가 서버 목록/상태 조회의 중심이 되었습니다.
- 로그인 상태에서는 더미 fallback을 줄이고 서버 데이터를 우선하도록 방향이 바뀌었습니다.

주요 의미:

- 앱의 가장 큰 구조 변화입니다.
- 이전까지는 로컬 store가 거의 모든 권위값이었지만, 이 시점부터 로그인 유저의 경제/성장/제한/구매/친구 데이터는 서버 권위값으로 옮기기 시작했습니다.

### 2026-06-03: 업적, 자유투, 서버 전환 보강

- 업적 시스템이 추가되었습니다.
- 자유투 미니게임이 추가되었고 `matter-js` 기반 물리 계산이 들어갔습니다.
- 미니게임 하트 로직과 서버 동기화 보정이 강화되었습니다.
- 학식/퀴즈 낙관적 처리가 들어갔습니다.
- 마이룸 부 드래그 안정화, 튜토리얼/룰 모달, 설정 확인 알림, 배포 전 P0 정리가 진행되었습니다.

주요 의미:

- 단순 기능 추가보다 “실제 배포 전 장애와 UX 지연을 줄이는 작업”이 많았습니다.
- 업적, 하트, 보상, 랭킹, 서버 동기화가 서로 엮이면서 데이터 정합성 문제가 본격적으로 드러났습니다.

### 2026-06-04 - 2026-06-07: 백엔드 연동 audit

- 백엔드 API audit 문서가 작성되었습니다.
- shop catalog 빈 배열, `/characters/me` 403, 퀴즈 answer 누락, achievement event 400, room item key, miniGame session, graduation summary 등 문제가 도메인별로 정리되었습니다.
- 기기 교체 시 동기화 리스크 문서가 만들어졌습니다.
- OpenAPI와 실제 public endpoint 응답을 대조하는 흐름이 생겼습니다.

주요 의미:

- 프론트가 서버 API를 “붙였다”에서 끝난 것이 아니라, 어떤 데이터가 서버 권위여야 하는지, 어떤 fallback을 막아야 하는지, 어떤 문자열 key 계약이 필요한지를 문서화하기 시작했습니다.

### 2026-06-08: 게스트 분리, 졸업, 코스튬, API 보완

- 게스트 모드가 로컬 전용으로 정리되었습니다.
- 졸업 화면, 졸업 BGM, 졸업 summary fallback이 들어갔습니다.
- 코스튬/스킨이 `CharacterCostumeKey`와 업적 보상 스킨 구조로 정리되었습니다.
- 서버 API 보완, Bootstrap 우선 동기화, room/shop adapter 보강, 방명록 adapter 등이 확장되었습니다.
- 프로필 이미지 UI는 현재 workflow에서 빠지고, 서버 필드는 문서상 유지하는 상태가 되었습니다.

주요 의미:

- “로그인 유저”와 “게스트 유저”의 데이터 경계를 명확히 분리했습니다.
- 로컬 전용 체험과 서버 권위 계정 데이터를 섞지 않으려는 구조가 강화되었습니다.

### 2026-06-09: 최신 서버 계약 반영과 낙관 처리 보강

- OpenAPI 최신 반영, `equipped_skin_key`, graduation endpoint, debug endpoint, reward success 필드 등이 프론트 타입에 반영되었습니다.
- 친구 방 코스튬 렌더링, 코스튬 서버 저장, graduation confirm/summary 연결, 미니게임 reward `success: true`, DeveloperPanel `/debug/me` 연결이 들어갔습니다.
- 자유투 준비/재시작 로딩 오버레이와 슛 게이지 freeze 버그가 수정되었습니다.
- 친구 요청 수락/거절, 방명록 작성/수정/삭제, 방 가구/벽지 장착에 낙관 처리와 rollback이 추가되었습니다.
- 현재 상태 문서와 이 도메인 변천 문서가 추가되었습니다.

## Cross-Domain Architecture

### What It Uses

- TypeScript strict mode
- React 19 / React Native 0.85 / Expo SDK 56
- Expo Router file-based routing
- Zustand 5 + persist for local game state
- AsyncStorage for persisted state, with noop fallback when native module is unavailable
- TanStack Query 5 for server state, query cache, invalidation, optimistic update
- axios for Boo backend API and external meal crawler API
- expo-image / expo-asset for image rendering and preload
- expo-audio for BGM/SFX
- react-native-reanimated / react-native-worklets for high-frequency mini-game animation
- matter-js for free throw physics
- react-native-svg and SVG transformer for icons
- react-hook-form in form-oriented UI where applicable

### Current Layering

```text
assets
-> constants / domain registries
-> utils / services / adapters
-> stores
-> hooks
-> shared UI
-> feature panels
-> route orchestration
```

실제 의미:

- `assets/*`는 이미지/음원 원본입니다.
- `constants/character.ts`, `components/Room/RoomData.ts`, `components/MiniGame/MiniGameData.ts`, `components/MealPanel/MealMenuData.ts`, `components/QuizPanel/QuizData.ts`, `constants/achievements.ts`는 기획/도메인 registry입니다.
- `utils/serverApi.ts`는 서버 endpoint adapter입니다.
- `utils/*Adapter.ts`는 서버 응답을 로컬 UI/store 모델로 바꿉니다.
- `stores/useGameStore.ts`는 장기 로컬 상태와 게임 액션을 관리합니다.
- `useHook/*`는 반복되는 화면 진입/서버 query 흐름을 감쌉니다.
- `components/*`는 UI와 기능 패널입니다.
- `app/*` route는 router, timer, BGM, API 세션, overlay, 여러 패널을 조율합니다.

### How It Improved

초기:

- 화면 단위 state와 더미 데이터가 많았습니다.
- 서버 없이도 전체 UX를 보여주는 것이 우선이었습니다.

중간:

- Zustand store로 사용자 진행도, 코인, XP, 친구, 방 상태, 퀴즈 기록, 학식 기록을 모았습니다.
- 정적 registry로 이미지와 기획값을 관리했습니다.

현재:

- 로그인 상태는 서버 권위값을 우선합니다.
- 비로그인/게스트는 로컬 전용으로 분리합니다.
- 서버 응답은 adapter를 거쳐 UI 모델로 변환합니다.
- 사용자가 버튼을 눌렀을 때 느려 보이는 부분은 optimistic update + rollback을 적용합니다.
- 경제성/하트/구매처럼 서버 권위가 중요한 부분은 optimistic을 피하고 pending/loading UI를 씁니다.

### Difficulties

- 로컬 MVP의 더미 데이터가 로그인 서버 데이터처럼 보이면 실제 장애를 가립니다.
- 서버 snake_case와 프론트 camelCase/로컬 id가 섞이면 화면에서 직접 쓰기 어렵습니다.
- room/shop은 서버 `item_id`와 로컬 asset id가 다르기 때문에 stable `item_key`가 없으면 매칭이 깨집니다.
- 앱 시작 시 모든 서버 데이터를 기다리면 진입이 느려지고, 너무 늦게 받으면 화면이 잠깐 잘못된 상태를 보여줍니다.
- Expo/Metro/AsyncStorage native module 같은 개발 환경 문제도 기능 구현과 별개로 영향을 줬습니다.

## Domain: App Bootstrap, Routing, Providers

### What It Uses

- `expo-router/entry`
- `app/_layout.tsx`
- `QueryClientProvider`
- `SafeAreaProvider`
- `SplashScreen.preventAutoHideAsync`
- image/font/audio preload
- Android navigation bar control

### Current Shape

- `_layout.tsx`는 앱 공통 초기화 레이어입니다.
- 폰트, 필수 이미지, 로딩 오버레이 이미지, BGM/SFX를 준비합니다.
- SplashScreen을 너무 빨리 닫지 않도록 preload 완료를 기다립니다.
- Stack route는 `index`, `game/index`, `room/index`, `miniGame/*` 등 파일 라우팅을 따릅니다.

### Evolution

- 2026-05-04에는 기본 Expo Router 앱과 로그인 진입 화면이 중심이었습니다.
- 2026-05-06 이후 회원가입/게임 화면이 추가되며 Stack 라우트가 늘었습니다.
- 2026-05-10 이후 게임 화면이 무거워지면서 네이티브 splash와 커스텀 loading을 분리했습니다.
- 2026-06-01 이후 React Query Provider가 필수 Provider가 되었습니다.
- 2026-06-08 이후 loading overlay 자체 이미지도 앱 시작 시 preload 대상이 되었습니다.

### Difficulties

- `QueryClientProvider` 없이 `useQuery`를 쓰면 `No QueryClient set` 오류가 납니다.
- 이미지 preload를 하지 않으면 첫 화면 또는 화면 전환 직후 이미지가 비어 보입니다.
- Android edge-to-edge와 navigation bar hidden 설정 때문에 하단 UI 잘림을 따로 고려해야 했습니다.
- 개발 build와 Expo Go의 scheme/QR 동작 차이가 있어 dev-client 실행 경로를 문서화해야 했습니다.

## Domain: Auth, Register, Login, Session

### What It Uses

- `components/Login/Login.tsx`
- `components/Register/*`
- `components/Inputs/*`
- `utils/serverApi.ts`
- Zustand auth state: `accessToken`, `refreshToken`, `autoLoginEnabled`, user profile fields
- axios default Authorization header via `setBooApiAccessToken`
- response interceptor with refresh retry

### Current Shape

- 회원가입은 이메일 인증 단계와 상세 정보 입력 단계로 나뉩니다.
- 로그인 ID는 이메일이 아니라 9자리 학번입니다.
- 로그인 성공 후 access/refresh token을 저장하고 Boo API Authorization header를 설정합니다.
- 자동 로그인 시 저장된 token으로 서버 stats sync를 수행한 뒤 메인 화면으로 진입합니다.
- refresh token은 `/user/refresh`, logout은 `/user/logout`에 사용합니다.

### Evolution

- 초기에는 로그인/회원가입 디자인과 입력 컴포넌트가 먼저 만들어졌습니다.
- 2026-06-01 API 1차 연결 때 실제 서버 `/user/signup/email`, `/user/signup/verify`, `/user/`, `/user/login` 흐름이 들어왔습니다.
- 이후 token 저장, axios header, refresh retry, logout/delete account 처리가 붙었습니다.
- 2026-06-08에는 게스트 모드가 들어오면서 auth session과 guest session이 분리되었습니다.

### Difficulties

- 로그인 ID가 이메일이 아니라 학번이라는 정책을 UI와 API 타입 모두에 반영해야 했습니다.
- 자동 로그인에서 서버 동기화를 기다리면 정확도는 올라가지만 첫 진입이 늦어집니다.
- refresh 실패, token 만료, guest 전환 시 Authorization header가 남아 있으면 guest에서 서버 API를 잘못 호출할 수 있습니다.
- SMTP 설정이 없으면 이메일 인증/비밀번호 재설정은 서버에서 실패할 수 있습니다.

## Domain: Guest Mode

### What It Uses

- Zustand `isGuestMode`
- `guestGameSnapshot`
- `GuestModeUnavailableModal`
- `useRequirePlayableSession`
- local-only store fallback

### Current Shape

- 게스트 기본값은 학번 `00000000`, 이름 `외대생`, 닉네임 `부`입니다.
- 게스트 시작 시 access/refresh token과 axios Authorization header를 제거합니다.
- 게스트 진행도는 로그인 세션과 별도 snapshot으로 저장합니다.
- 게스트에서는 친구 관리, 친구 패널, 친구 방, 방명록, 친구 랭킹 fallback을 사용하지 않습니다.
- 게스트에서는 비밀번호 변경이 없고, 프로필 일부만 로컬로 수정합니다.

### Evolution

- 초기 비로그인 상태는 더미/로컬 fallback과 거의 같은 의미였습니다.
- 서버 API 전환 이후 비로그인 fallback이 로그인 서버 장애를 가리는 문제가 생겼습니다.
- 2026-06-08에 게스트를 명시적인 로컬 전용 모드로 분리했습니다.

### Difficulties

- 게스트 데이터를 나중에 서버 계정으로 병합하는 API가 없습니다.
- 게스트에서도 모든 화면을 열어주면 친구/방명록/랭킹 API를 잘못 호출할 수 있습니다.
- 로컬 fallback과 서버 데이터가 섞이면 배포 QA에서 실제 서버 누락을 못 찾습니다.

## Domain: Global Game State And Persist

### What It Uses

- `stores/useGameStore.ts`
- Zustand `create`
- `persist`
- AsyncStorage
- noopStorage fallback
- `partialize` for saved state subset

### Current Shape

store가 관리하는 대표 상태:

- user/session: `userId`, `studentId`, `userName`, `userNickname`, `accessToken`, `refreshToken`
- character: `booName`, `totalXp`, `characterState`, `characterCostumeKey`, `pendingEvolution`, `serverCharacterId`
- economy: `coin`, `heart`, `maxHeart`, `heartUpdatedAt`
- meal/quiz local fallback: `lastFedMeals`, `quizAttemptHistory`, `quizDailyCount`
- room: `ownedRoomItems`, `ownedRoomWallpapers`, `equippedRoomItems`, `equippedRoomWallpaper`
- friend/guestbook fallback: `friendList`, `guestbookEntries`
- achievements: `achievementStats`, `serverAchievementProgress`, `ownedAchievementSkins`, `achievementAlertQueue`
- settings: volume, tutorial flags, developer mode flags

### Evolution

- 5월 초에는 각 화면 local state와 더미 데이터가 많았습니다.
- 기능이 늘면서 XP, 코인, 캐릭터 상태, 친구, 퀴즈 기록이 하나의 store로 모였습니다.
- persist가 붙으면서 앱 재시작 후 진행도가 유지되었습니다.
- 서버 API 연결 이후에는 “persist된 로컬 값”과 “서버 권위 값”이 충돌하기 시작했습니다.
- 이후 로그인 상태에서는 서버 sync가 로컬 값을 덮고, 비로그인/게스트에서는 로컬 값이 유지되는 분기를 넣었습니다.

### Difficulties

- 모든 값을 persist하면 과거 더미 데이터가 로그인 상태에도 남아 있을 수 있습니다.
- `pendingEvolution` 같은 일회성 runtime 상태는 persist하면 안 됩니다.
- AsyncStorage native module이 없으면 persist가 noop으로 동작해 상태가 저장되지 않을 수 있습니다.
- 서버 sync가 방금 로컬에서 차감한 하트보다 오래된 서버 값을 덮어쓰는 문제가 있어 timestamp 보정이 필요했습니다.

## Domain: Server API, Adapters, React Query

### What It Uses

- `utils/serverApi.ts`
- axios `booApiClient`
- OpenAPI JSON in `docs/api/openapi.json`
- TanStack Query `useQuery`, `useQueryClient`, cache invalidation
- adapters:
  - `utils/serverFriendAdapter.ts`
  - `utils/serverGuestbookAdapter.ts`
  - `utils/serverRoomAdapter.ts`
  - `utils/syncServerCharacter.ts`
  - `utils/syncServerRoomState.ts`
  - `utils/syncServerUserStats.ts`

### Current Shape

- 서버 endpoint 함수는 `serverApi.ts`에 모읍니다.
- 인증이 필요한 API는 `Authorization: Bearer <access_token>`을 전달합니다.
- 서버 응답 타입은 snake_case 그대로 표현합니다.
- UI/store에는 adapter를 통해 로컬 모델로 바꿔 전달합니다.
- React Query는 서버 목록과 상세 상태, mutation 후 invalidate, optimistic cache update에 사용합니다.

### Evolution

- 2026-06-01에 API 1차 연결이 들어오며 서버 함수와 adapter가 생겼습니다.
- 2026-06-03에는 서버 실패를 더미 fallback으로 숨기지 않는 정책이 강화되었습니다.
- 2026-06-04 이후 OpenAPI와 실제 응답을 대조하는 audit 문서가 생겼습니다.
- 2026-06-08에는 `/app/bootstrap` 우선 sync와 fallback sync 구조가 생겼습니다.
- 2026-06-09에는 최신 OpenAPI의 `equipped_skin_key`, graduation, debug endpoint, reward success 등이 반영되었습니다.

### Difficulties

- Swagger/OpenAPI와 실제 서버 동작이 다를 수 있었습니다.
- public endpoint와 auth endpoint는 검증 가능 범위가 달라 토큰 없는 상태에서는 코드 계약만 확인해야 했습니다.
- 서버 item type이 `desk`, `room`인데 프론트는 `table`, `wallpaper`를 쓰는 식의 key mismatch가 있었습니다.
- `item_key`, achievement event key, miniGame `game_type/mode`는 문자열 계약이라 하나라도 다르면 기능이 깨집니다.

## Domain: Character, XP, Grade, Evolution

### What It Uses

- `constants/character.ts`
- `utils/xpProgress.ts`
- `components/Character/Character.tsx`
- `components/EvolutionOverlay/EvolutionOverlay.tsx`
- `stores/useGameStore.ts`
- `utils/syncServerCharacter.ts`
- server endpoints:
  - `GET /characters/me`
  - `PUT /characters/me`
  - `POST /characters/me/evolve/confirm`
  - legacy character list/detail fallback

### Current Shape

- 캐릭터 학년은 `1 | 2 | 3 | 4`입니다.
- 상태는 `basic1`, `basic2`, `happy1`, `happy2`, `hungry`, `eating`, `talking`입니다.
- `totalXp` 하나가 원본이고, 학년/프로그레스는 `getXpProgressInfo(totalXp)`로 계산합니다.
- XP 임계치는 1->2학년 1500, 2->3학년 2000, 3->4학년 2500, 4학년 졸업 3000입니다.
- XP 증가가 학년 상승을 만들면 `pendingEvolution`을 만들고 `EvolutionOverlay`가 표시됩니다.

### Evolution

- 2026-05-06에 학년별 캐릭터 이미지가 들어왔습니다.
- 2026-05-10에 XP, 학년, 진화 흐름이 store와 overlay로 연결되었습니다.
- 2026-06-01 이후 서버 캐릭터 동기화가 붙었습니다.
- 2026-06-03 이후 진화 완료 시 서버 confirm을 호출하는 방향으로 보강되었습니다.
- 2026-06-08 이후 졸업이 일반 진화와 분리된 별도 overlay/음악/summary 흐름으로 확장되었습니다.

### Difficulties

- 서버의 `stage`, `xp_point`, user `xp_point` 중 어느 값을 authoritative로 볼지 정해야 했습니다.
- `/characters/me`가 fresh user에서 403을 반환하는 문제가 있었습니다.
- 로컬 `pendingEvolution`은 runtime 연출 상태라 서버와 그대로 1:1 매핑하기 어렵습니다.
- `hungry`는 단순 감정 상태처럼 보이지만 학식 누락/패널티와 연결되어 서버 권위가 필요합니다.

## Domain: Character Costume And Achievement Skins

### What It Uses

- `CharacterCostumeKey`
- `CHARACTER_COSTUMES`
- `getCharacterImage`
- `ownedAchievementSkins`
- `components/Room/RoomScene.tsx`
- `app/room/index.tsx` closet modal
- server `equipped_skin_key`

### Current Shape

- 기본 코스튬은 `default`입니다.
- 업적 스킨은 `skin_truth`, `skin_peace`, `skin_creation`입니다.
- 2-4학년 캐릭터는 코스튬별 이미지 override가 있습니다.
- 장착 상태는 `characterCostumeKey`로 관리합니다.
- 로그인 상태에서는 `PUT /characters/me`에 `equipped_skin_key`를 저장합니다.
- 로그인 sync와 친구 방 room view에서 `equipped_skin_key`를 읽습니다.
- non-default skin은 업적 보상으로 소유한 경우만 선택 가능하게 UI가 막습니다.

### Evolution

- 초기에는 학년/상태별 기본 캐릭터 이미지만 있었습니다.
- 2026-06-03에 색상별 캐릭터 에셋이 정리되었습니다.
- 2026-06-07 audit에서는 코스튬 저장 필드가 없어서 로컬 전용 리스크로 기록되었습니다.
- 2026-06-08/09에 백엔드 계약 `equipped_skin_key`가 반영되며 서버 저장/조회가 연결되었습니다.

### Difficulties

- `state`는 이미 행동 상태이므로 코스튬 저장용으로 재사용하면 안 됩니다.
- 업적 보상 스킨의 소유 여부와 장착 여부는 서로 다른 상태입니다.
- 친구 방에서 상대방 코스튬을 보여주려면 내 캐릭터 API뿐 아니라 `RoomCharacterOut`에도 같은 필드가 필요했습니다.

## Domain: Graduation

### What It Uses

- `GraduationOverlay` inside `EvolutionOverlay`
- `assets/images/graduate-background.png`
- `assets/characters/graduated-boo.png`
- `assets/musics/bgm/graduation.mp3`
- `getXpProgressInfo`
- `confirmGraduation`
- `getGraduationSummary`
- local fallback achievement/game stats

### Current Shape

- 4학년 XP를 모두 채우면 일반 진화 대신 졸업 화면을 표시합니다.
- 로그인 유저는 서버 graduation summary를 우선 사용합니다.
- 서버 실패 또는 게스트는 로컬 persisted 통계로 fallback합니다.
- 졸업 화면은 플레이 일수, 학식/퀴즈/미니게임 요약을 보여줍니다.

### Evolution

- 초기에는 `graduate` 이미지가 있었지만 별도 리포트 흐름은 없었습니다.
- 2026-06-07 audit에서 졸업 summary가 로컬 통계라는 리스크가 문서화되었습니다.
- 2026-06-08에 졸업 배경/캐릭터/BGM과 overlay가 추가되었습니다.
- 2026-06-09에 `/graduation/confirm`, `/graduation/summary` 타입과 프론트 연결이 보강되었습니다.

### Difficulties

- 로컬 통계는 기기 교체 시 달라질 수 있습니다.
- 졸업은 성장 상태이면서 리포트/연출/음악/통계가 함께 엮여 있습니다.
- 일반 진화 효과음과 졸업 BGM이 겹치지 않도록 별도 처리해야 했습니다.

## Domain: Meal / School Food

### What It Uses

- `components/MealPanel/MealPanel.tsx`
- `components/MealPanel/MealMenuData.ts`
- `utils/getTodayMeal.ts`
- `useHook/useTodayMeal.ts`
- `stores/useGameStore.ts`
- TanStack Query
- Boo backend:
  - `GET /school-foods/today`
  - `GET /school-foods/feed-status`
  - `POST /school-foods/feed`
- External crawler:
  - `https://hufs-clock-api.vercel.app/api/data`

### Current Shape

- 학식 패널은 로그인 상태에서 Boo backend school-food APIs를 사용합니다.
- 말풍선용 오늘 학식은 외부 HUFS clock crawler API를 사용합니다.
- 로그인 상태에서 서버 음식 id가 없으면 로컬 `feedBoo()` fallback으로 조용히 성공시키지 않습니다.
- 먹이기는 optimistic local update 후 서버 실패 시 rollback합니다.
- 비로그인/게스트는 로컬 fallback으로 동작할 수 있습니다.

### Evolution

- 초기에는 로컬 `MealMenuData`와 plate image로 학식 UI를 만들었습니다.
- 이후 외부 학식 API를 붙여 오늘 메뉴 말풍선을 만들었습니다.
- 2026-06-01 서버 API 전환 후 Boo backend의 today/feed-status/feed가 붙었습니다.
- 2026-06-03에는 학식 먹이기 optimistic update와 rollback이 들어갔습니다.
- 2026-06-08 이후 로그인 상태에서는 로컬 끼니 패널티가 서버 XP를 임의로 깎지 않도록 차단했습니다.

### Difficulties

- 학식 시간대가 프론트 문서, 백엔드 README, 실제 서버 값에서 다를 수 있었습니다.
- 외부 crawler의 `meals[].menus[]`가 요일별 배열이라 오늘 요일 index를 직접 골라야 했습니다.
- 서버 음식 id 없이 로컬 메뉴만 있으면 로그인 상태의 feed API를 호출할 수 없습니다.
- 누락 끼니, 배고픔, XP 패널티는 기기별 로컬 persist에 의존하면 동기화 문제가 큽니다.

## Domain: Quiz

### What It Uses

- `components/QuizPanel/QuizPanel.tsx`
- `components/QuizPanel/QuizData.ts`
- Zustand quiz local fallback fields
- Boo backend:
  - `GET /quizzes/play-status`
  - `GET /quizzes/next`
  - `POST /quizzes/submit`

### Current Shape

- 로그인 상태에서는 서버 play-status가 남은 횟수, 쿨타임, 가능 여부의 기준입니다.
- 서버 문제가 `answer`를 포함하면 클라이언트가 즉시 정답/오답을 표시합니다.
- 서버 answer가 없으면 submit 결과를 기다립니다.
- submit 결과가 optimistic 판정과 다르면 서버 결과를 최종값으로 보정합니다.
- 비로그인/게스트는 로컬 `QuizData` fallback을 사용할 수 있습니다.

### Evolution

- 초기에는 로컬 `QuizData`와 store 카운터로 일일 제한/쿨타임을 관리했습니다.
- API 전환 후 `/quizzes/play-status`, `/quizzes/next`, `/quizzes/submit` 중심으로 바뀌었습니다.
- 2026-06-03에는 쿨타임이 끝났는데도 `00:00:00` 표시와 버튼 비활성화가 남는 문제를 수정했습니다.
- 2026-06-04/07 audit에서 `QuizQuestion.answer` 누락이 즉시 채점 UX의 핵심 계약 문제로 기록되었습니다.

### Difficulties

- answer 없이 즉시 채점 UX를 만들 수 없습니다.
- 로컬 일일 카운터를 로그인 상태에서 계속 쓰면 새 기기와 기존 기기의 제한 상태가 달라집니다.
- 서버 submit은 중복 제출, cooldown, daily limit을 최종 검증해야 하므로 클라이언트 optimistic 결과는 항상 보정 가능해야 합니다.

## Domain: Achievements

### What It Uses

- `constants/achievements.ts`
- `components/AchievementPanel/AchievementPanel.tsx`
- `stores/useGameStore.ts`
- `TopAlert`
- server:
  - `GET /achievements/`
  - `GET /achievements/me`
  - `POST /achievements/events`

### Current Shape

- 업적 progress는 서버 `/achievements/me`를 우선합니다.
- 로그인 상태에서는 로컬 persisted 업적 키가 서버 진행도를 가리지 않도록 서버 progress를 권위값으로 반영합니다.
- 로컬 `achievementStats`는 게스트/보조 통계와 fallback에 사용합니다.
- 업적 보상은 코인, XP, 스킨 key를 포함할 수 있습니다.
- 업적 달성 알림은 `TopAlert` queue로 순차 표시됩니다.

### Evolution

- 2026-06-03에 클라이언트 업적 정의, 행동별 카운터, 보상 반영, 업적 패널, crown button이 추가되었습니다.
- 초기에는 서버 저장 API가 없어서 새 기기 복구 리스크가 있었습니다.
- 이후 `/achievements/me`, `/achievements/events`가 붙으면서 서버 progress를 기준으로 동기화하도록 바뀌었습니다.
- 스킨 보상은 코스튬 장착 가능 여부와 연결되었습니다.

### Difficulties

- `condition_type`과 `event_type` 문자열이 프론트/백엔드에서 동일해야 합니다.
- `room_first_enter` event 400 로그처럼 서버 event handler 누락 또는 중복 정책 문제가 발생할 수 있습니다.
- 이미 완료한 업적 event를 다시 보낼 때 400보다 idempotent 200이 프론트에 안전합니다.
- 업적 보상 지급은 중복 지급을 막아야 하며, 로컬 optimistic 보상과 서버 보상이 충돌하면 안 됩니다.

## Domain: Friends And Friend Requests

### What It Uses

- `components/FriendPanel/FriendPanel.tsx`
- `components/FriendPanel/FriendAddModal.tsx`
- `components/FriendList/FriendList.tsx`
- `components/FriendList/FriendDeleteModal.tsx`
- `utils/serverFriendAdapter.ts`
- server:
  - `GET /friends/`
  - `GET /friends/search/{student_id}`
  - `POST /friends/requests`
  - `GET /friends/requests`
  - `POST /friends/requests/{request_id}/accept`
  - `DELETE /friends/requests/{request_id}`
  - `DELETE /friends/{friend_id}`

### Current Shape

- 로그인 상태에서는 서버 친구 목록만 표시합니다.
- 서버 응답 전/실패 시 더미 친구 목록을 보여주지 않습니다.
- 친구 추가는 학번 검색 후 friend request를 보냅니다.
- 친구 요청 수락/거절은 React Query cache에서 즉시 제거하고 실패 시 rollback합니다.
- 친구 삭제도 optimistic cache removal + rollback 구조입니다.
- 게스트에서는 친구 기능을 사용하지 않습니다.

### Evolution

- 초기에는 `FriendListDummyData` 기반의 로컬 친구와 더미 점수를 사용했습니다.
- 서버 API 전환 후 친구 목록, 검색, 추가/삭제가 서버로 이동했습니다.
- 친구 직접 추가 API에서 request API 중심 workflow로 바뀌었습니다.
- 2026-06-09에 수락/거절 UX 지연을 줄이기 위해 optimistic cache update가 추가되었습니다.

### Difficulties

- `friend_id`는 친구 user id가 아니라 friendship relation id여야 삭제 API에 맞습니다.
- 자기 자신, 이미 친구, 중복 pending request를 서버가 명확히 막아야 합니다.
- 로그인 상태에서 더미 친구가 보이면 실제 서버 친구가 없는 것인지 구분이 안 됩니다.
- 친구 요청 수락 시 업적 보상이 어느 시점에 발생하는지 정책이 필요합니다.

## Domain: Friend Room

### What It Uses

- `app/room/[friendId].tsx`
- `RoomScene`
- `getUserRoom`
- `mapServerRoomViewToLocalRoomState`
- route params: `friendId`, `friendName`, `friendUserId`

### Current Shape

- 친구 목록에서 `serverUserId`를 route param으로 넘깁니다.
- 친구 방은 `/rooms/{user_id}`를 조회해 서버 room snapshot을 렌더링합니다.
- 서버 room character의 이름, XP, state, `equipped_skin_key`를 사용합니다.
- 서버 데이터가 없고 비로그인일 때만 dummy friend room snapshot fallback을 사용할 수 있습니다.

### Evolution

- 초기에는 더미 친구 방 snapshot으로 구현되었습니다.
- 서버 API 연결 후 `/rooms/{user_id}` 응답을 로컬 room asset id로 매핑하게 바뀌었습니다.
- 코스튬 계약이 생긴 뒤 친구 방에서도 상대방 장착 스킨을 보여주도록 보강되었습니다.

### Difficulties

- 친구 relation id와 user id를 혼동하면 `/rooms/{user_id}`가 잘못된 대상을 조회합니다.
- 서버 room item이 로컬 asset id와 매칭되지 않으면 친구 방이 기본 방처럼 보일 수 있습니다.
- 서버 character field가 비어 있을 때 fallback 표시 기준이 필요합니다.

## Domain: Room, Shop, Furniture, Wallpaper

### What It Uses

- `app/room/index.tsx`
- `components/Room/RoomData.ts`
- `components/Room/RoomScene.tsx`
- `components/Room/RoomMiniBoo.tsx`
- `utils/serverRoomAdapter.ts`
- server:
  - `GET /shop/item-types`
  - `GET /shop/items`
  - `POST /shop/items/{item_id}/purchase`
  - `GET /rooms/me`
  - `PUT /rooms/me/equip`
  - `DELETE /rooms/me/equip/{slot}` adapter exists

### Current Shape

- 방 배경과 가구는 로컬 image registry로 렌더링합니다.
- 슬롯은 `bed`, `closet`, `table`이고, wallpaper는 별도 category입니다.
- 장착 상태는 `equippedRoomItems`, `equippedRoomWallpaper`에 저장됩니다.
- 보유 상태는 `ownedRoomItems`, `ownedRoomWallpapers`입니다.
- 로그인 상태에서는 `/rooms/me`, `/shop/items`를 통해 서버 상태를 로컬 room state로 매핑합니다.
- 구매는 서버 성공 후 coin/owned/equipped를 반영합니다.
- 장착은 로컬 상태를 먼저 바꾸고 서버 실패 시 rollback합니다.

### Evolution

- 2026-05-10에는 기본 방/가구 prototype이었습니다.
- 2026-05-24/26에 방/침대/옷장/책상 에셋이 대량 추가되었습니다.
- `RoomData.ts`가 단순 이미지 모음에서 slot, price, layout, mini boo walk point, preload registry까지 포함하는 도메인 registry가 되었습니다.
- 2026-06-01 이후 서버 shop/room API와 연결되었습니다.
- 2026-06-04 audit에서 `/shop/items` 빈 배열과 item type/key mismatch가 P0로 기록되었습니다.
- 2026-06-07 이후 `item_key` 우선 매칭, `desk -> table`, `room -> wallpaper` alias가 들어갔습니다.
- 2026-06-09에는 장착 optimistic rollback이 들어갔습니다.

### Difficulties

- 서버 catalog가 비어 있으면 구매할 `item_id`를 찾을 수 없습니다.
- 서버 item type이 `desk`, `room`이면 프론트 `table`, `wallpaper`와 맞지 않습니다.
- label/name/image 문자열 normalize 매칭은 취약합니다.
- 가장 안정적인 계약은 서버 `item_key`가 로컬 asset id와 1:1로 일치하는 것입니다.
- 구매는 코인/소유권이 걸린 경제성 작업이라 optimistic 처리하면 위험합니다.

## Domain: Room Guestbook

### What It Uses

- `components/Room/GuestbookModal.tsx`
- `components/Room/GuestbookListModal.tsx`
- `components/Room/RoomGuestbookDummyData.ts`
- `utils/serverGuestbookAdapter.ts`
- server:
  - `GET /rooms/{user_id}/guestbook`
  - `POST /rooms/{user_id}/guestbook`
  - `PUT /rooms/guestbook/{entry_id}`
  - `DELETE /rooms/guestbook/{entry_id}`

### Current Shape

- 내 방 책상에서는 방명록 목록을 봅니다.
- 친구 방 책상에서는 방명록을 작성합니다.
- 서버 `GuestbookPage.items`를 UI `RoomGuestbookListEntry`로 매핑합니다.
- 작성은 임시 entry를 cache에 넣고 서버 응답으로 치환합니다.
- 수정/삭제는 cache를 먼저 바꾸고 실패 시 rollback합니다.
- 비로그인 fallback은 로컬 guestbook store를 사용합니다.

### Evolution

- 초기에는 더미 방명록 목록과 로컬 guestbook entries 중심이었습니다.
- 서버 API 연결 후 목록/작성/수정/삭제가 서버로 이동했습니다.
- 서버 데이터가 없을 때 더미 방명록이 뜨지 않도록 빈 배열 기본값을 사용했습니다.
- 2026-06-09에 cache 기반 optimistic update가 들어갔습니다.

### Difficulties

- 방명록 목록은 pagination 구조(`GuestbookPage`)라 items만 수정해도 next cursor를 유지해야 합니다.
- 작성 직후 모달은 성공 상태로 넘어가지만, 다른 화면 cache도 즉시 일관되게 맞춰야 합니다.
- 수정/삭제는 모달 내부 local state와 React Query cache가 둘 다 바뀌므로 rollback 경로가 필요합니다.

## Domain: MiniGame Hub And Campus Places

### What It Uses

- `app/miniGame/index.tsx`
- `components/MiniGame/MiniGameData.ts`
- `MiniGameStartScreen`
- `MiniGameRankingModal`
- campus place images in `assets/places/*`
- mini-game icons in `assets/miniGame/icons/*`

### Current Shape

- `/miniGame`은 캠퍼스 장소 허브입니다.
- 장소 registry는 이미지, 설명, label, miniGameId, route path를 가집니다.
- 실제 플레이 가능한 장소는 도서관, 잔디광장, 오바마홀입니다.
- 본관, 인문과학관, 교수학습개발원, 운동장 등은 장소 설명과 준비 중 성격입니다.
- 메인에서 `/miniGame`으로 갈 때 첫 장소 이미지는 critical preload, 나머지는 background preload합니다.

### Evolution

- 초기에는 미니게임이 없었고 메인 버튼만 있었습니다.
- 2026-05-24/26에 장소 허브와 전공책/부잡기 게임이 연결되었습니다.
- 2026-06-03에 자유투가 오바마홀 시작 화면과 연결되었습니다.
- 이후 서버 하트/랭킹/세션이 붙으며 hub는 단순 route menu가 아니라 server session entry의 앞단이 되었습니다.

### Difficulties

- 장소/게임/route 매핑은 기획값이라 증상 수정 중 임의로 바꾸면 안 됩니다.
- 이미지가 많아 preload 전략이 없으면 장소 이동 시 빈 화면이 생깁니다.
- 게스트에서는 친구 랭킹 fallback을 보여주지 않아야 합니다.

## Domain: MiniGame Heart, Economy, Reward, Ranking

### What It Uses

- `utils/miniGameHeart.ts`
- `HeartCountBadge`
- server:
  - `GET /economy/status`
  - `POST /economy/minigame/start`
  - `POST /economy/minigame/reward`
  - `POST /minigames/results`
  - `GET /minigames/rankings`
  - `GET /minigames/rankings/friends`
- local fallback heart in store

### Current Shape

- 로그인 상태에서는 미니게임 시작 시 서버 `/economy/minigame/start`가 하트를 차감하고 `play_session_id`를 반환합니다.
- 성공 보상은 `/economy/minigame/reward`를 사용합니다.
- 결과 저장은 `/minigames/results`를 사용합니다.
- 성공 보상 요청에는 `success: true`를 명시합니다.
- 보상 코인은 optimistic update 후 서버 실패 시 rollback합니다.
- ranking list는 `/minigames/rankings`, `/minigames/rankings/friends`를 사용합니다.
- `/minigames/ranking/me`는 개인 요약용으로 보고 게임/모드별 목록에는 쓰지 않습니다.

### Evolution

- 초기에는 더미 친구 점수와 로컬 하트 계산이 중심이었습니다.
- 2026-06-03에는 서버 하트 API가 없다는 전제로 로컬 소비 시각과 서버 갱신 시각을 비교해 하트가 튀는 문제를 완화했습니다.
- 이후 session-oriented API인 start/reward가 생기며 서버 하트 차감으로 전환했습니다.
- 랭킹도 더미 친구 점수에서 서버 ranking endpoint로 이동했습니다.

### Difficulties

- 하트는 여러 기기에서 동시에 플레이하면 클라이언트 보정만으로는 정합성이 깨집니다.
- reward와 result 저장이 분리되어 있으므로 `play_session_id` 기반 idempotency가 중요합니다.
- start API는 optimistic 처리하면 하트 부족/세션 실패를 숨길 수 있으므로 loading overlay가 맞습니다.
- 이전 라운드 callback이 새 라운드를 덮지 않도록 stale session/round guard가 필요합니다.

## Domain: MiniGame - Catch The Major

### What It Uses

- `app/miniGame/catchTheMajor.tsx`
- `app/miniGame/catchTheMajorPlay.tsx`
- `BookCatchRuleModal`
- `assets/miniGame/book-catch/*`
- Reanimated shared values/frame callback
- local collision/spawn logic

### Current Shape

- 일반 모드는 30초 제한, 50P 이상 성공, 성공 시 3 coin 보상입니다.
- 무한 모드는 시간 제한이 없고 방해물 3회 충돌 시 종료됩니다.
- 무한 모드에서 점수 아이템을 먹을 때마다 낙하 속도/스폰 속도가 1%씩 빨라지고 최대 1.8배입니다.
- route param은 `mode=infinite`이고, 기존 `mode=hard`는 호환 alias입니다.
- iOS swipe back gesture는 인게임 화면에서 비활성화합니다.

### Evolution

- 2026-05-25에 book-catch game이 추가되었습니다.
- 이후 detailed/almost done 단계를 거치며 점수/방해물/룰 모달/무한모드가 보강되었습니다.
- 2026-06-01 이후 서버 결과/보상/랭킹과 연결되었습니다.
- 2026-06-03 이후 재시작 시 이전 timer/callback/보상 flag가 새 라운드에 영향 주지 않도록 초기화가 강화되었습니다.

### Difficulties

- Reanimated frame callback과 React state가 섞이면 stale callback이 생기기 쉽습니다.
- 게임 종료와 보상 지급은 한 번만 일어나야 합니다.
- 무한모드 속도 증가가 누적되므로 reset 시 완전히 초기화해야 합니다.

## Domain: MiniGame - Catch Boo

### What It Uses

- `app/miniGame/catchBoo.tsx`
- `app/miniGame/catchBooPlay.tsx`
- `BooCatchRuleModal`
- `assets/miniGame/boo-catch/*`
- random spawn/target hit handling

### Current Shape

- 일반 모드는 30초 제한, 50P 이상 성공, 성공 시 3 coin 보상입니다.
- 부가 지정 구역에 랜덤 출몰하고 사용자가 타격합니다.
- 성공/실패 결과는 서버 결과 저장 및 보상 flow와 연결됩니다.
- 로그인 상태에서는 더미 친구 점수를 랭킹 기준으로 쓰지 않습니다.

### Evolution

- 2026-05-26에 boo-catch가 completed 상태로 들어왔습니다.
- 전공책 받기에서 만든 미니게임 시작/룰/하트/랭킹 구조를 재사용했습니다.
- 2026-06-01 이후 서버 session/result/reward flow가 붙었습니다.
- 2026-06-03 이후 재시작 상태 초기화와 reward/result flag 방어가 들어갔습니다.

### Difficulties

- 랜덤 출몰 target state와 feedback state가 재시작 후 남으면 새 라운드가 이상하게 시작됩니다.
- 보상/결과 저장이 중복 호출되지 않도록 flag 관리가 필요합니다.
- server session start 전에는 입력을 허용하면 하트 차감 없이 플레이하는 상태가 될 수 있습니다.

## Domain: MiniGame - Free Throw

### What It Uses

- `app/miniGame/freeThrow.tsx`
- `app/miniGame/freeThrowPlay.tsx`
- `components/MiniGame/freeThrow/freeThrowPhysics.ts`
- `FreeThrowRuleModal`
- `matter-js`
- Animated/Reanimated-style timing plus React Native Animated values
- basketball assets in `assets/miniGame/basketball/*`

### Current Shape

- 오바마홀 시작 화면에서 진입합니다.
- 5회 연속 성공 시 3 coin 보상입니다.
- 서버 미니게임 세션/하트 차감이 완료되기 전까지 슛 버튼은 비활성화합니다.
- 시작/재시작 준비 중에는 LoadingOverlay를 표시합니다.
- 슛 버튼을 누른 순간의 검은색 게이지 바 위치를 shot animation 동안 고정합니다.
- 새 슛이 가능해질 때 다시 게이지가 움직입니다.

### Evolution

- 2026-06-03에 자유투 미니게임이 추가되었습니다.
- 처음부터 수동 좌표보다 자연스러운 궤적을 위해 `matter-js` 물리 계산을 도입했습니다.
- 백보드/골대/공 레이어, 슛 게이지, 성공/실패, 오버파워/언더파워 연출, 골대 흔들림이 추가되었습니다.
- 이후 서버 start/reward/result flow와 연결되었습니다.
- 2026-06-09에는 준비 단계 로딩 오버레이와 슛 게이지 freeze 버그 수정이 들어갔습니다.

### Difficulties

- 게임 시작을 누른 뒤 서버 세션과 asset/animation 준비가 끝나기 전까지 몇 초 정지처럼 보일 수 있었습니다.
- 재시작도 같은 준비 지연이 있어 로딩 오버레이가 필요했습니다.
- shot animation이 시작되면서 marker progress animation이 reset되어 검은색 바가 왼쪽으로 가는 문제가 있었습니다.
- 해결은 `stopAnimation`으로 누른 순간 값을 얻고, animation phase 동안 frozen numeric value를 렌더링하는 방식이었습니다.
- 이전 shot callback이 재시작 후 새 라운드를 실패 처리하지 않도록 round guard가 필요했습니다.

## Domain: Loading, Image Assets, Preload

### What It Uses

- `components/LoadingOverlay/LoadingOverlay.tsx`
- `components/LoadingOverlay/LoadingOverlayAssets.ts`
- `utils/preloadImageAssets.ts`
- `expo-asset`
- `expo-image`

### Current Shape

- 앱 시작 시 loading overlay 자체 이미지를 preload합니다.
- 메인 화면은 critical asset만 await하고 나머지는 background preload합니다.
- 미니게임 장소는 첫 장소 이미지만 먼저 기다리고 나머지는 background preload합니다.
- 로딩 UI가 필요한 화면은 LoadingOverlay registry의 이미지를 사용해야 합니다.

### Evolution

- 초기에는 네이티브 splash와 화면 이미지 로딩 사이의 빈 구간이 있었습니다.
- 이미지가 많아지면서 critical/deferred preload 구분이 생겼습니다.
- 미니게임/마이룸/튜토리얼/로딩 이미지가 많아져 registry 기반 preload가 중요해졌습니다.

### Difficulties

- 같은 이미지를 여러 파일에서 직접 require하면 preload 관리가 흩어집니다.
- 모든 이미지를 await하면 앱 진입이 늦고, 아무것도 await하지 않으면 빈 화면이 보입니다.
- Expo asset cache와 expo-image cache를 함께 고려해야 합니다.

## Domain: Sound And Music

### What It Uses

- `utils/backgroundMusic.ts`
- `utils/soundEffects.ts`
- `expo-audio`
- BGM tracks:
  - `main`
  - `myRoom`
  - `titleLogin`
  - `miniGameMain`
  - `miniGameIngame`
  - `graduation`
- SFX:
  - `basicClick`
  - `booTouch`
  - `eating`
  - `evolution`
  - `congratulation`
  - `quizO`
  - `quizX`
  - `pointPlus`

### Current Shape

- 화면 focus 시 `startBackgroundMusicSession`으로 BGM을 전환합니다.
- 버튼 클릭은 공통 버튼에서 `basicClick`을 재생합니다.
- 볼륨은 master/bgm/sfx로 나뉩니다.
- BGM 기본 볼륨은 이전보다 낮춰져 있습니다.
- 졸업은 별도 graduation BGM을 사용합니다.

### Evolution

- 초기에는 click/main background mp3 중심이었습니다.
- 기능이 늘며 화면별 BGM과 SFX registry가 분리되었습니다.
- 2026-06-08에는 여러 m4a 사운드 파일과 graduation BGM이 들어왔습니다.
- 사운드 설정 UI와 서버 preferences 저장이 붙었습니다.

### Difficulties

- preload가 없으면 첫 재생이 늦습니다.
- 화면 전환 중 BGM session cleanup이 안 되면 음악이 겹칩니다.
- 진화/졸업 같은 overlay는 기존 BGM/SFX와 겹치지 않게 별도 처리가 필요합니다.

## Domain: BooChat, TopAlert, Tutorial, Feedback UI

### What It Uses

- `components/BooChat/BooChat.tsx`
- `components/BooChat/BooChatList.ts`
- `components/TopAlert/TopAlert.tsx`
- `components/TutorialPanel/*`
- `components/MiniGame/*RuleModal.tsx`

### Current Shape

- BooChat은 메인 캐릭터 말풍선과 학식/상태성 메시지를 보여줍니다.
- TopAlert는 진행/성공/실패/업적 알림을 보여주는 공통 상단 알림입니다.
- TutorialPanel은 캠퍼스 튜토리얼 이미지를 보여줍니다.
- 미니게임별 룰 모달은 시작 화면에서 게임 규칙을 보여줍니다.

### Evolution

- 초기에는 단순 말풍선/알림이었습니다.
- 기능이 늘면서 서버 저장/수정/삭제 같은 비동기 작업 결과를 TopAlert로 보여주는 패턴이 생겼습니다.
- 업적 queue가 생기면서 TopAlert가 순차 알림을 담당하게 되었습니다.
- 튜토리얼 PNG는 파일명 정리와 registry 연결을 거쳤습니다.

### Difficulties

- 버튼 label만 `저장 중`으로 바꾸면 사용자가 실패/성공을 놓칩니다.
- 여러 업적이 동시에 달성되면 알림이 겹치므로 queue가 필요합니다.
- 말풍선 timer cleanup이 안 되면 이전 메시지가 고착될 수 있습니다.

## Domain: Profile, Options, Preferences

### What It Uses

- `components/MyProfile/MyProfile.tsx`
- `components/Options/Options.tsx`
- `components/SoundSettings/SoundSettings.tsx`
- `components/Options/SoundSlider.tsx`
- server:
  - `PUT /user/me`
  - `GET /user/me/preferences`
  - `PUT /user/me/preferences`
  - `POST /user/logout`
  - `DELETE /user/me`

### Current Shape

- 프로필에서는 닉네임, 학번/이름 일부, 비밀번호 변경 흐름을 다룹니다.
- 로그인 상태의 계정 정보 수정은 서버 저장 후 `syncServerUserStats`로 동기화합니다.
- 게스트에서는 계정 정보가 로컬로만 바뀝니다.
- 로그아웃/회원탈퇴는 바로 실행하지 않고 확인 alert를 거칩니다.
- 사운드/튜토리얼 preference는 로컬 우선 반영 후 서버 저장을 시도합니다.

### Evolution

- 초기에는 옵션/프로필 UI와 사운드 슬라이더가 로컬 설정 중심이었습니다.
- 서버 API 연결 후 `/user/me`와 preferences endpoint가 붙었습니다.
- 프로필 이미지 API는 서버에 있으나 현재 설정 UI에서는 변경/삭제 workflow를 노출하지 않는 상태로 정리되었습니다.

### Difficulties

- 닉네임/학번/비밀번호는 서버 검증이 필요하므로 완전한 optimistic update가 항상 적절하지 않습니다.
- 사운드 설정은 실패해도 현재 기기에서는 바뀐 상태가 자연스럽지만, 서버 저장 실패를 사용자에게 알려야 할지는 UX 정책이 필요합니다.
- 회원탈퇴/로그아웃은 destructive action이라 optimistic보다 명확한 confirmation/pending/error가 맞습니다.

## Domain: Developer Panel

### What It Uses

- `components/DeveloperPanel/DeveloperPanel.tsx`
- `useGameStore` debug actions
- server:
  - `PUT /characters/me`
  - `PUT /user/me/preferences`
  - `PATCH /debug/me`

### Current Shape

- 부 이름/상태 변경은 서버 캐릭터 API로 저장합니다.
- 튜토리얼 조회 초기화는 preferences API로 저장합니다.
- 코인, XP, 학년, 부 상태 debug patch는 `/debug/me`를 사용합니다.
- 식사/퀴즈 제한 토글은 서버 debug schema에 없어 로컬 테스트 상태입니다.
- 졸업 화면 미리보기는 서버 상태를 바꾸지 않는 preview입니다.

### Evolution

- 초기에는 로컬 상태 조작용 테스트 패널이었습니다.
- 서버 전환 이후 로컬 조작이 서버 상태와 어긋나는 문제가 생겼습니다.
- 2026-06-09에 debug endpoint가 생기며 코인/XP/학년/상태 조작이 서버에도 반영되도록 바뀌었습니다.

### Difficulties

- 일반 사용자 API와 debug API를 섞으면 운영 데이터가 위험합니다.
- XP 절대값 설정/감소/학년 강제 변경은 일반 `/characters/me/xp` 추가 API와 의미가 다릅니다.
- debug 기능은 개발 환경/권한 통제가 필요합니다.

## Domain: Device Sync And Local Fallback

### What It Uses

- `docs/device-sync-risk.md`
- `syncServerUserStats`
- `syncServerCharacter`
- `syncServerRoomState`
- Zustand persist

### Current Shape

- 로그인 유저의 성장/경제/구매/친구/랭킹/제한 상태는 서버 기준으로 복구합니다.
- 로컬 persist는 게스트, UI 편의, transient state, fallback에 한정하려는 방향입니다.
- 서버 bootstrap 또는 개별 sync가 로그인 직후 상태를 hydrate합니다.

### Evolution

- 로컬 MVP에서는 기기 안의 AsyncStorage가 사실상 source of truth였습니다.
- 서버 API가 붙으면서 기기 교체 시 무엇이 복구되고 무엇이 사라지는지 문제가 생겼습니다.
- device sync risk 문서가 만들어지며 학식 패널티, 퀴즈 제한, 마이룸 item key, 코스튬, 튜토리얼/볼륨 리스크가 분리되었습니다.

### Difficulties

- `lastFedMeals`, `quizDailyCount`, `ownedRoomItems`, `characterCostumeKey` 같은 값은 로컬 persist에 남아도 로그인 상태에서는 서버와 충돌할 수 있습니다.
- 새 기기에는 로컬 알림, 이미지 cache, sound cache, React Query memory cache가 없습니다.
- 과거 더미 데이터가 AsyncStorage에 남아 있으면 로그인 화면에서 노출되지 않도록 분기해야 합니다.

## Domain: Documentation And API Audit

### What It Uses

- `docs/technical-learning-guide.md`
- `docs/work-log-2026-06-03.md`
- `docs/device-sync-risk.md`
- `docs/api/backend-api-integration-audit-2026-06-04.md`
- `docs/api/frontend-api-connection-audit-2026-06-07.md`
- `docs/api/server-api-summary.md`
- `docs/current-project-status.md`
- `docs/domain-evolution-history.md`

### Current Shape

- 학습 가이드는 기술 개념과 프로젝트 구조를 설명합니다.
- work log는 배포 전 작업과 리스크를 날짜별로 기록합니다.
- API audit 문서는 백엔드 전달용 요구사항과 프론트 연결 공백을 기록합니다.
- server API summary는 OpenAPI 요약과 endpoint/schema map을 제공합니다.
- current status는 현재 상태를 빠르게 공유합니다.
- 이 문서는 도메인별 변천사를 정리합니다.

### Evolution

- 초기 README는 Expo 기본 템플릿에 가까웠습니다.
- 기능이 많아지면서 실제 프로젝트 설명은 `technical-learning-guide.md`로 이동했습니다.
- 서버 API 전환 후에는 API audit 문서가 필요해졌습니다.
- 2026-06-09에는 최신 상태/변천 문서를 분리해 운영 문서와 히스토리 문서가 생겼습니다.

### Difficulties

- 문서가 한 파일에 계속 섞이면 학습용 설명, 현재 운영 상태, 백엔드 요청사항이 뒤섞입니다.
- OpenAPI가 바뀌면 타입, adapter, docs가 함께 갱신되어야 합니다.
- 코드 변경 이후 docs를 안 맞추면 백엔드/프론트 간에 이미 해결된 이슈가 계속 남아 보입니다.

## Repeated Upgrade Pattern

이 프로젝트의 기능들은 대체로 아래 순서로 발전했습니다.

1. 로컬 더미/정적 registry로 화면과 UX를 먼저 구현했습니다.
2. Zustand store로 진행도와 사용자 행동을 유지했습니다.
3. 기능이 커지면 domain registry로 이미지, route, slot, reward key를 분리했습니다.
4. 서버 API가 준비되면 `serverApi.ts` 함수와 adapter를 추가했습니다.
5. 로그인 상태에서는 서버 권위값을 우선하고 더미 fallback을 차단했습니다.
6. 서버 응답이 느리면 React Query stale/cache/invalidate 정책을 조정했습니다.
7. 즉시 반응이 필요한 mutation은 optimistic update + rollback을 넣었습니다.
8. 경제성/세션성 작업은 optimistic 대신 loading/pending UI를 넣었습니다.
9. 실제 장애 로그를 문서화하고 백엔드 계약을 다시 조정했습니다.

## Major Difficulties Across The Project

- 서버 권위와 로컬 persist의 경계 설정
- 더미 fallback이 실제 서버 장애를 숨기는 문제
- 문자열 key 계약 불일치
- shop item catalog seed 부재
- fresh user character row 부재 또는 `/characters/me` 403
- quiz answer field 부재와 즉시 채점 UX 충돌
- achievement event idempotency와 event key mismatch
- miniGame heart/reward/result session idempotency
- free throw animation stale callback과 marker freeze 문제
- Reanimated/game loop cleanup 문제
- image/audio preload와 앱 진입 속도 균형
- Android edge-to-edge/navigation bar 하단 UI 문제
- AsyncStorage native module 유무에 따른 persist 문제
- Node 버전/Metro cache/복제 파일로 인한 개발 환경 불안정

## Current Next Improvements

- `/shop/items` catalog seed와 `item_key` 1:1 계약을 백엔드에서 확정해야 합니다.
- `/app/config`를 실제 runtime 정책 source로 사용할지 결정해야 합니다.
- 학식 누락/패널티는 로그인 상태에서 서버 feed history 기반으로 완전히 옮기는 것이 안전합니다.
- 프로필/설정 저장 실패를 사용자에게 어떻게 보여줄지 정책이 필요합니다.
- 게스트 -> 회원 계정 이관이 필요하면 별도 merge/import API가 필요합니다.
- lint의 기존 React hooks 계열 오류를 별도 정리해야 합니다.
- duplicated ` 2`, ` 3` 파일/폴더는 Metro 안정성을 위해 별도 정리 후보입니다.
