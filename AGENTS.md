# AGENTS.md

## 프로젝트 개요
한국외대 마스코트 캐릭터 `부`를 학식, 퀴즈, 친구, 마이룸 기능과 연결해 성장시키는 Expo 기반 React Native 육성형 캠퍼스 앱입니다.

## 기술 스택
- 언어: TypeScript, JavaScript
- 런타임: Node 20 권장. 현재 nvm default는 `v20.20.2` 기준으로 확인됨
- 프레임워크: React 19.2.3, React Native 0.85.3, Expo SDK 56
- 라우팅: Expo Router 56.2.x, 파일 기반 라우팅, `package.json`의 `"main": "expo-router/entry"`
- 상태 관리: Zustand 5, `zustand/middleware`의 `persist`
- 로컬 저장: `@react-native-async-storage/async-storage`, AsyncStorage 미사용 가능 환경에서는 `noopStorage` fallback
- 서버 상태/요청: TanStack Query 5, axios
- UI/미디어: `expo-image`, `expo-font`, `expo-audio`, `expo-splash-screen`, `expo-status-bar`, `expo-haptics`, `react-native-svg`
- 애니메이션: `react-native-reanimated` 4, `react-native-worklets`
- 폼: `react-hook-form`
- 네이티브/빌드: `expo-dev-client`, EAS 설정, iOS/Android native 폴더 존재
- 웹: `react-native-web`, `app.json`의 `web.output`은 `"static"`
- 린트: ESLint 9 flat config, `eslint-config-expo`, `eslint-import-resolver-typescript`

## 디렉토리 구조
- `app/`
  - `_layout.tsx`: 앱 공통 초기화, Provider, Splash 제어, 폰트/이미지/사운드 preload, Stack 라우트 설정
  - `index.tsx`: 로그인/회원가입 진입 화면
  - `game/index.tsx`: 메인 게임 화면, 패널 오케스트레이션, 말풍선, 알림, 학식/퀴즈/진화 흐름
  - `miniGame/index.tsx`: 캠퍼스 장소 기반 미니게임 허브, 장소 카드, 설정/친구/프로필 패널
  - `miniGame/catchTheMajor.tsx`: 전공책 받기 시작 화면
  - `miniGame/catchTheMajorPlay.tsx`: 전공책 받기 실제 플레이 화면, Reanimated 기반 낙하/충돌 처리
  - `miniGame/catchBoo.tsx`: 부 잡기 시작 화면. 현재 실제 플레이는 준비 중
  - `miniGame/freeThrow.tsx`: 자유투 넣기 시작 화면. 현재 실제 플레이는 준비 중
  - `room/index.tsx`: 마이룸 화면, 방/가구 렌더링, 커스텀 UI
  - `room/[friendId].tsx`: 친구 방 방문 화면, 친구 방 snapshot 렌더링, 방명록 작성
- `components/`
  - `SquareButton`, `MainButton`, `CoinBox`, `ProgressBar`, `TopAlert`, `BooChat` 등 공통 UI
  - `MealPanel`, `QuizPanel`, `FriendPanel`, `FriendList`, `DeveloperPanel`, `SoundSettings`, `TutorialPanel` 등 기능별 패널
  - `LoadingOverlay/`: 로딩 화면 UI와 로딩 화면 전용 이미지 source/preload registry
  - `MiniGame/`: 미니게임 장소/시작 화면 registry, 시작 화면, 랭킹 모달, 룰 모달, 하트 UI
  - `Room/`: 마이룸 에셋 registry, 좌표, 공통 방 렌더러, 미니 부 애니메이션, 방명록 모달
- `stores/`
  - `useGameStore.ts`: 전역 게임 상태, persist, XP/식사/퀴즈/친구/마이룸/설정 액션
- `utils/`
  - `xpProgress.ts`: 누적 XP 기반 학년/프로그레스 계산
  - `backgroundMusic.ts`: BGM player, 트랙 전환, pause/resume, preload
  - `soundEffects.ts`: SFX player, preload, 재생
  - `getTodayMeal.ts`: 학식 API 요청과 응답 정규화, 학식/주말 말풍선 생성
  - `preloadImageAssets.ts`: `expo-asset`과 `expo-image` 캐시에 로컬 이미지를 함께 preload하는 공통 유틸
- `useHook/`
  - `useTodayMeal.ts`: TanStack Query 기반 오늘 학식 커스텀 훅
- `constants/`
  - `character.ts`: 학년별 캐릭터 이미지, 캐릭터 상태 타입, 상태 애니메이션 전환
  - `colors.ts`, `fonts.ts`: 공통 색상/폰트 상수
- `assets/`
  - `images/`: 배경, splash, 로딩, smoke 등 이미지
  - `icons/`: SVG 아이콘
  - `characters/`: 학년/상태별 부 캐릭터 이미지
  - `plates/`: 학식/음식 이미지
  - `Rooms/`: 마이룸 방/가구 이미지
  - `places/`: 미니게임 장소 배경 이미지
  - `miniGame/`: 미니게임 아이콘과 전공책 받기 플레이/룰 이미지
  - `musics/`: BGM/SFX
  - `tutorials/`: 튜토리얼 이미지
  - `fonts/`: `NeoDunggeunmo.ttf`
- `docs/`
  - `technical-learning-guide.md`: 프로젝트 기술 학습 문서
- `ios/`, `android/`
  - Expo prebuild/run으로 생성된 네이티브 프로젝트

## 자주 쓰는 명령어
- Node 버전 확인: `node -v`가 `v20.x`인지 먼저 확인
- 의존성 설치: `npm install`
- Expo 개발 서버: `npm run start`
- 웹 실행: `npm run web`
- 개발 빌드 터널 실행: `npm run dev:device`
- 개발 빌드 터널 실행 + 캐시 삭제: `npm run dev:device:clear`
- 개발 빌드 LAN 실행: `npm run dev:device:lan`
- 개발 빌드 LAN 실행 + 캐시 삭제: `npm run dev:device:lan:clear`
- iOS 로컬 실행: `npm run ios`
- Android 로컬 실행: `npm run android`
- 린트: `npm run lint`
- 타입 체크: `npx tsc --noEmit`
- 웹 정적 export: `npx expo export --platform web`
- EAS 빌드: `eas build --profile development|preview|production --platform ios|android`로 추정되지만, package script에는 없음. 확인 필요.
- 테스트: `package.json`에 test script 없음. 확인 필요.

## 코딩 컨벤션
- TypeScript strict 모드 사용. `tsconfig.json`에서 `"strict": true`.
- 경로 alias는 `@/*`를 사용합니다.
  - 예: `import { useGameStore } from "@/stores/useGameStore";`
  - ESLint alias 해석은 `eslint.config.js`의 `import/resolver.typescript` 설정에 의존합니다.
- 화면은 Expo Router 파일 라우팅을 따릅니다.
  - `app/index.tsx` -> `/`
  - `app/game/index.tsx` -> `/game`
  - `app/miniGame/index.tsx` -> `/miniGame`
  - `app/miniGame/catchTheMajor.tsx` -> `/miniGame/catchTheMajor`
  - `app/miniGame/catchTheMajorPlay.tsx` -> `/miniGame/catchTheMajorPlay`
  - `app/room/index.tsx` -> `/room`
- 컴포넌트는 함수형 컴포넌트와 hooks 중심으로 작성합니다.
- 스타일은 각 파일 하단의 `StyleSheet.create`로 관리하는 패턴이 많습니다.
- 공통 색상/폰트는 `constants/colors.ts`, `constants/fonts.ts`를 사용합니다.
- SVG 아이콘은 `react-native-svg-transformer`와 `declarations.d.ts`를 통해 React 컴포넌트처럼 import합니다.
  - 예: `import HomeIcon from "@/assets/icons/home.svg";`
- 정적 이미지/음원은 `require(...)`로 registry 객체에 묶어 관리하는 패턴이 많습니다.
  - 캐릭터: `constants/character.ts`
  - 학식 이미지: `components/MealPanel/MealMenuData.ts`
  - 마이룸 가구: `components/Room/RoomData.ts`
  - 미니게임 장소/아이콘/룰 이미지: `components/MiniGame/MiniGameData.ts`
  - 로딩 오버레이 이미지: `components/LoadingOverlay/LoadingOverlayAssets.ts`
  - 사운드: `utils/backgroundMusic.ts`, `utils/soundEffects.ts`
- 전역 게임 데이터는 `useGameStore` selector로 필요한 값만 구독하는 패턴을 사용합니다.
  - 예: `const coin = useGameStore((state) => state.coin);`
- UI 상태는 화면 내부 `useState`로 관리하는 패턴이 많습니다.
  - 예: `isMealOpen`, `isQuizOpen`, `isCustomizeMode`
- 버튼 효과음은 `SquareButton`, `MainButton`에서 `playSoundEffect("basicClick")`로 처리합니다.
- 화면별 BGM은 `useFocusEffect`에서 `startBackgroundMusicSession(...)`을 호출하는 패턴입니다.
- 서버 요청은 `useHook/useTodayMeal.ts`처럼 TanStack Query custom hook으로 감싸는 패턴입니다.

## 핵심 도메인 개념
- `부`: 사용자가 키우는 캐릭터입니다. 학년과 상태에 따라 이미지가 바뀝니다.
- 코인: `useGameStore.coin`에 저장되며 학식 구매, 마이룸 가구/벽지 구매, 미니게임 보상에 사용됩니다. 기본값은 100입니다.
- 캐릭터 학년: `CharacterGrade = 1 | 2 | 3 | 4`.
- 캐릭터 상태: `basic1`, `basic2`, `happy1`, `happy2`, `hungry`, `eating`, `talking`.
- 누적 XP: `useGameStore.totalXp` 하나를 원본 상태로 저장하고, 현재 학년/프로그레스는 `utils/xpProgress.ts`의 `getXpProgressInfo(totalXp)`로 계산합니다.
- XP 임계치:
  - 1학년 -> 2학년: 1500 XP
  - 2학년 -> 3학년: 2000 XP
  - 3학년 -> 4학년: 2500 XP
  - 4학년 -> 졸업: 3000 XP
- 진화: XP 증가로 학년이 상승하면 `pendingEvolution`이 생성되고, `app/game/index.tsx`에서 진화 컷신을 시작합니다.
- 학식:
  - 조식: 08:00 ~ 10:00
  - 중식: 11:00 ~ 14:30
  - 석식: 16:40 ~ 18:40
  - 한 끼당 한 번 먹이기 제한이 있습니다.
  - 6끼니부터 `hungry` 상태가 되며, 이후 누락 끼니에 XP 패널티가 적용됩니다.
- 퀴즈:
  - 하루 제한값 `QUIZ_DAILY_LIMIT = 3`
  - 문제당 쿨타임 `QUIZ_COOLDOWN_MS = 3시간`
  - 정답 보상 `+30 XP`, `+10 coin`, 오답 패널티 `-10 XP`
- 마이룸:
  - 방 배경과 가구는 `RoomSlotId -> equippedItemId -> image` 구조로 분리되어 있습니다.
  - 현재 슬롯은 `bed`, `closet`, `table`.
  - 장착 가구 상태는 `useGameStore.equippedRoomItems`에 저장됩니다.
- 미니게임:
  - 장소 허브는 `/miniGame`이며, 장소/시작 화면/이미지 registry는 `components/MiniGame/MiniGameData.ts`에 있습니다.
  - 미니게임 ID는 `catchTheMajor`, `catchBoo`, `freeThrow`입니다.
  - 현재 실제 플레이 구현은 `app/miniGame/catchTheMajorPlay.tsx`의 전공책 받기입니다.
  - 전공책 받기 일반모드는 30초 제한, 50P 이상 성공, 성공 시 `+3 coin`을 지급합니다.
  - 전공책 받기 무한모드는 시간 제한이 없고 방해물 3회 충돌 시 종료됩니다. 점수 아이템을 먹을 때마다 낙하 속도/스폰 속도가 1%씩 빨라지며 최대 1.8배까지 증가합니다.
  - 전공책 받기 무한모드 라우트 param은 `mode=infinite`입니다. 기존 `mode=hard`는 호환 alias로 처리하며, 친구 랭킹 데이터는 기존 `miniGameHardScores`를 재사용합니다.
  - 전공책 받기 인게임 화면은 iOS 좌->우 swipe back gesture를 비활성화합니다.
  - 하트는 서버 유저 데이터(`heart`, `max_heart`, `heart_updated_at`)와 동기화합니다. 비로그인/서버 데이터 부재 시에는 로컬 fallback으로 계산합니다.
  - 로그인 상태에서는 더미 친구 점수 기반 미니게임 랭킹을 표시하지 않습니다. 현재 백엔드에는 전체 랭킹 목록 API가 없어 랭킹 목록은 서버 API 추가가 필요합니다.
- 학식 API:
  - `utils/getTodayMeal.ts`에서 `https://hufs-clock-api.vercel.app/api/data`를 axios로 요청합니다.
  - 응답 메뉴는 `TodayMealSection[]`으로 정규화됩니다.
- 서버 API:
  - 서버 Swagger UI는 `https://capstonedesign-production.up.railway.app/docs`입니다.
  - 원본 OpenAPI 스키마는 `docs/api/openapi.json`에 저장되어 있습니다.
  - 사람이 읽기 쉬운 요약, 연결 우선순위, 백엔드 README 기반 정책 메모는 `docs/api/server-api-summary.md`를 참고하세요.
  - Base URL은 `https://capstonedesign-production.up.railway.app`입니다.
  - 인증이 필요한 API는 로그인 응답의 `access_token`을 `Authorization: Bearer <access_token>` 헤더로 전달하는 구조입니다.
  - `refresh_token`은 `/user/refresh` 토큰 재발급과 `/user/logout` 토큰 폐기에 사용합니다.
  - 로그인 ID는 이메일이 아니라 9자리 학번이며, 회원가입 이메일은 `@hufs.ac.kr` 도메인으로 제한됩니다.
  - 로컬 백엔드는 별도 DB 설정이 없으면 `boo_app.db` SQLite를 사용하고, Railway 배포는 `DATABASE_URL` PostgreSQL 연결 문자열이 필요합니다.
  - 이메일 인증/비밀번호 재설정은 SMTP 환경변수(`SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME`, `SMTP_USE_TLS`)에 의존합니다.
  - 현재 연결 우선순위는 인증/유저 -> 학식 -> 퀴즈 -> 친구 -> 마이룸/상점 -> 미니게임/경제 상태입니다.
  - 서버 응답 필드는 snake_case가 많으므로 UI/store에는 직접 흘리지 말고 API adapter/mapper에서 camelCase로 변환하는 방식을 우선합니다.
- 사운드:
  - BGM은 `main`, `myRoom`, `titleLogin`, `miniGameMain`, `miniGameIngame` 트랙으로 관리됩니다.
  - BGM 기본 볼륨은 이전 대비 약 70% 수준으로 낮춰져 있습니다.
  - SFX는 `basicClick`, `booTouch`, `eating`, `evolution`, `congratulation`, `quizO`, `quizX`, `pointPlus` 등을 사용합니다.

## 주의사항
- `.env.example` 또는 `.env*` 파일은 현재 확인되지 않았습니다. 환경변수 정책은 확인 필요.
- 서버 연동 작업 전에는 `docs/api/openapi.json`과 `docs/api/server-api-summary.md`를 먼저 확인하세요. Swagger와 실제 서버 동작이 다를 수 있는 엔드포인트는 작은 호출로 검증한 뒤 UI에 연결하세요.
- `/economy/minigame/play`는 Swagger상 request body가 없습니다. 미니게임 하트 차감/보상 흐름 연결 전 백엔드 동작 확인이 필요합니다.
- `/minigames/ranking/me`는 Swagger상 game type/mode query parameter가 없습니다. 게임별/모드별 랭킹이 필요하면 백엔드 확인이 필요합니다.
- Node 26/Homebrew Node로 실행하면 Expo/Metro나 optional native dependency가 불안정할 수 있습니다. 개발 서버와 설치는 Node 20 환경에서 실행하세요.
- `README.md`는 Expo 기본 템플릿 내용입니다. 프로젝트 실제 설명은 `docs/technical-learning-guide.md`가 더 상세합니다.
- `ios/`, `android/` native 폴더가 존재합니다. Expo config/app.json으로 관리되는 설정과 직접 수정한 native 설정이 섞일 수 있으므로 prebuild 전후 변경사항을 확인해야 합니다.
- `app.json`에서 Android navigation bar hidden plugin, splash-screen plugin, expo-audio plugin을 사용합니다.
- Android `edgeToEdgeEnabled`가 true이고 navigation bar 숨김 로직이 `_layout.tsx`에 있습니다.
- `babel.config.js`는 `unstable_transformImportMeta: true`를 켜고 있습니다. 웹 번들에서 `import.meta` 관련 오류를 방지하기 위한 설정입니다.
- `babel.config.js`는 `react-native-worklets/plugin`을 사용합니다. Reanimated/Worklets 관련 변경 시 플러그인 순서를 건드리지 마세요.
- `metro.config.js`에서 SVG를 asset이 아닌 source로 처리하고 `react-native-svg-transformer`를 사용합니다. SVG import 동작에 영향이 큽니다.
- `eslint.config.js`에서 TypeScript resolver를 명시합니다. `@/*` alias 관련 `import/no-unresolved` 경고가 다시 생기면 이 설정과 `eslint-import-resolver-typescript` 설치 상태를 확인하세요.
- `useGameStore`의 persist는 `partialize`로 저장할 상태를 명시합니다. `pendingEvolution`은 persist 대상이 아닙니다.
- AsyncStorage native module이 없으면 `noopStorage`로 fallback되어 상태가 영구 저장되지 않을 수 있습니다.
- `app/game/index.tsx`는 여러 패널/타이머/진화/말풍선/로딩을 한 화면에서 조율합니다. 수정 시 타이머 cleanup과 overlay open state를 함께 확인해야 합니다.
- `app/miniGame/catchTheMajorPlay.tsx`는 Reanimated shared value, frame callback, collision 판정, 하트/랭킹 UI를 한 화면에서 조율합니다. 수정 시 animation cleanup, `useFocusEffect` BGM 세션, router 이동을 함께 확인해야 합니다.
- 로딩 오버레이 이미지 source와 preload는 `components/LoadingOverlay/LoadingOverlayAssets.ts`만 진실로 둡니다. 로딩 화면 배경/알 이미지를 다른 파일에서 새로 `require(...)`하지 말고 해당 registry를 import하세요.
- `app/_layout.tsx`는 SplashScreen을 닫기 전에 `preloadLoadingOverlayAssets()`를 await합니다. 로딩창이 필요한 새 화면을 추가해도 로딩 오버레이 자체 이미지는 앱 시작 시 준비되어 있어야 합니다.
- `app/game/index.tsx`의 로그인 후 초기 진입은 critical asset만 await합니다. 현재 부 이미지 등 첫 화면에 필요한 최소 에셋은 `preloadGameCriticalImageAssets`, 캐릭터 전체/학식/마이룸/튜토리얼 이미지는 `preloadGameDeferredImageAssets`에서 background preload합니다.
- 메인에서 `/miniGame`으로 이동할 때는 `preloadMiniGamePlaceCriticalImageAssets`로 첫 장소 배경만 await합니다. 나머지 장소/시작화면/플레이 이미지는 `app/miniGame/index.tsx` mount 이후 `preloadMiniGamePlaceImageAssets`로 background preload합니다.
- 새 이미지 preload가 필요하면 가능하면 `utils/preloadImageAssets.ts`를 사용해 `expo-asset`과 `expo-image` 캐시를 함께 올리세요.
- `components/Room/RoomData.ts`의 가구 위치는 room 이미지 기준 좌표(`ROOM_CANVAS_WIDTH`, `ROOM_CANVAS_HEIGHT`)로 계산됩니다.
- `node_modules`에 ` 2`, ` 3`이 붙은 복제 패키지가 생기면 Metro가 `Bundler cache is empty` 단계에서 멈출 수 있습니다. 이 경우 `node_modules`와 `.expo/cache`를 삭제하고 Node 20에서 `npm install`을 다시 실행하세요.
- 현재 repo에는 `assets/characters/first 2`, `assets/characters/fourth 2`, `components/* 2`, `ios/* 2`, `android/* 4/5`, `.expo/devices 2.json` 등 복제 파일/폴더가 일부 남아 있습니다. 실제 사용 여부와 정리 여부는 별도 확인이 필요합니다.
- `npm run lint`는 실행 가능하지만 현재 React hooks 계열 lint error가 다수 남아 있을 수 있습니다. 최신 상태는 실행해서 확인하세요.
- 테스트 자동화 script는 확인되지 않았습니다. 확인 필요.

## 현재 작업 중인 기능

### 서버 API 전환 진행상황
- 인증/회원가입/이메일 인증/로그인/로그아웃/토큰 갱신은 `utils/serverApi.ts`와 `useGameStore` 인증 세션으로 연결되어 있습니다.
- 로그인 후 `syncServerUserStats` / `useSyncServerUserStatsOnFocus`로 코인, 하트, XP, 유저 기본 정보를 서버 값과 동기화합니다.
- 퀴즈는 로그인 상태에서 서버 `/quizzes/play-status`, `/quizzes/next`, `/quizzes/submit`을 우선 사용합니다. 비로그인 상태에서만 로컬 `QuizData` fallback을 사용합니다.
- 학식 먹이기 패널은 서버 `/school-foods/today`, `/school-foods/feed-status`, `/school-foods/feed`를 사용합니다. 로그인 상태에서 서버 음식 id가 없으면 로컬 `feedBoo()`로 fallback하지 않도록 막았습니다.
- 부 말풍선용 오늘 학식은 Boo 백엔드가 아니라 `https://hufs-clock-api.vercel.app/api/data` 크롤링 API를 사용합니다. 해당 API의 `meals[].menus[]`는 요일별 배열이므로 `월=0, 화=1, 수=2, 목=3, 금=4` 인덱스의 메뉴만 오늘 메뉴로 사용합니다.
- 친구 목록/친구 관리 화면은 로그인 상태에서 서버 `/friends/` 결과만 표시합니다. 서버 응답 전/실패 시 더미 친구 목록을 보여주지 않도록 정리했습니다.
- 친구 추가/삭제는 서버 API를 우선 사용합니다. 비로그인 상태에서만 `FriendListDummyData` 기반 로컬 fallback을 사용합니다.
- 마이룸 상점 구매는 서버 구매 성공 후 로컬 구매 함수를 다시 호출하지 않도록 수정했습니다. 서버가 내려준 `coin`으로 동기화하고, 로컬 owned/equipped 상태만 맞춥니다.
- 방명록 목록은 서버 `/rooms/{user_id}/guestbook` 결과를 표시합니다. 서버 데이터가 없을 때 더미 방명록이 뜨지 않도록 기본값을 빈 배열로 바꿨습니다.
- 친구 방 방문은 서버 친구의 `serverUserId`를 라우트 param으로 넘기고 `/rooms/{user_id}` 조회 결과를 로컬 룸 에셋 id로 매핑해 렌더링합니다.
- 미니게임 플레이 결과 저장과 성공 보상은 서버 `/minigames/results`, `/economy/minigame/play`을 사용합니다. 로그인 상태에서 더미 친구 점수로 현재 랭킹을 계산하지 않습니다.

### 남은 서버/더미 정리 작업
- 전체 미니게임 랭킹 목록 API가 필요합니다. 현재 서버에는 `/minigames/ranking/me`만 확인되어 있어 친구/전체 랭킹 리스트를 실제 서버 데이터로 표시할 수 없습니다.
- `/minigames/ranking/me`는 Swagger상 game type/mode query parameter가 없습니다. 전공책 받기/부 잡기/무한모드별 랭킹 분리가 필요한지 백엔드 확인이 필요합니다.
- 퀴즈 플레이 가능 타이밍이 로컬 상태와 서버 `/quizzes/play-status` 기준 사이에서 어긋날 수 있습니다. 로그인 상태에서는 남은 횟수/쿨타임/다음 가능 시각을 서버 응답만 단일 기준으로 삼고, 로컬 `lastQuizAttemptAt`/`quizAttemptsToday`는 비로그인 fallback 또는 서버 동기화 보조값으로만 제한해야 합니다.
- 자동 로그인 상태에서 앱 시작 후 메인화면으로 넘어가는 초기 진입이 느립니다. 저장된 세션 복원, refresh token 갱신, `/user/me`/경제 상태/이미지 preload가 직렬로 묶여 있는지 확인하고, 화면 진입에 필수인 작업과 백그라운드 동기화로 미룰 작업을 분리해야 합니다.
- 친구 방 서버 조회는 현재 서버 `RoomView`에 캐릭터 이름/XP/상태가 없어 방 가구/벽지만 서버 값으로 매핑하고, 부 이름/XP/상태는 fallback을 사용합니다. 백엔드가 캐릭터 정보를 같이 내려주면 매핑을 확장해야 합니다.
- 마이룸 내 방(`/rooms/me`) 조회 결과를 앱 시작/마이룸 진입 시 로컬 `equippedRoomItems`, `equippedRoomWallpaper`, owned 목록에 반영하는 동기화가 아직 제한적입니다. 현재는 상점 목록과 구매/장착 흐름 중심으로 맞춰져 있습니다.
- 서버 shop item 이름/image와 로컬 `RoomData` id/label 매칭은 문자열 normalize 기반입니다. 백엔드 item key를 로컬 asset id와 1:1로 내려주면 매칭 안정성이 좋아집니다.
- 더미 파일 자체(`FriendListDummyData`, `RoomGuestbookDummyData`, 로컬 `MealMenuData`, 로컬 `QuizData`)는 비로그인/개발 fallback 용도로 남아 있습니다. 실제 배포에서 비로그인 플레이를 허용하지 않을 경우 제거 범위를 다시 결정해야 합니다.
- 기존 사용자 AsyncStorage에 저장된 `friendList` 더미 값은 persist 때문에 남아 있을 수 있습니다. 로그인 상태 화면에서는 더미를 표시하지 않도록 막았지만, 필요하면 마이그레이션으로 persisted `friendList` 정리가 필요합니다.
- 친구 방명록 작성은 서버 요청을 보내고 로컬 fallback 추가는 비로그인일 때만 수행하도록 정리했습니다. 작성 성공 후 방명록 목록 refetch는 아직 연결되지 않았습니다.

## Dependency Layers
실제 import를 기준으로 보면 현재 핵심 흐름은 아래 방향입니다.

`[assets] -> [constants / domain data] -> [utils / services] -> [store] -> [hooks] -> [shared UI] -> [feature panels] -> [routes]`

- `[assets]`: `assets/icons`, `assets/images`, `assets/characters`, `assets/plates`, `assets/Rooms`, `assets/places`, `assets/miniGame`, `assets/musics`, `assets/tutorials`, `assets/fonts`
- `[constants / domain data]`: `constants/character.ts`, `constants/colors.ts`, `constants/fonts.ts`, `components/MealPanel/MealMenuData.ts`, `components/QuizPanel/QuizData.ts`, `components/Room/RoomData.ts`, `components/MiniGame/MiniGameData.ts`, `components/BooChat/BooChatList.ts`
- `[utils / services]`: `utils/xpProgress.ts`, `utils/getTodayMeal.ts`, `utils/backgroundMusic.ts`, `utils/soundEffects.ts`, `utils/preloadImageAssets.ts`
- `[store]`: `stores/useGameStore.ts`
- `[hooks]`: `useHook/useTodayMeal.ts`
- `[shared UI]`: `components/MainButton`, `components/SquareButton`, `components/CoinBox`, `components/ProgressBar`, `components/TopAlert`, `components/Character`, `components/BooChat`, `components/LoadingOverlay`
- `[feature panels]`: `components/MealPanel`, `components/QuizPanel`, `components/DeveloperPanel`, `components/FriendPanel`, `components/FriendList`, `components/MyProfile`, `components/Options`, `components/SoundSettings`, `components/TutorialPanel`, `components/MiniGame`, `components/Room/RoomScene`, `components/Room/RoomMiniBoo`, `components/Room/GuestbookModal`, `components/Room/GuestbookListModal`
- `[routes]`: `app/_layout.tsx`, `app/index.tsx`, `app/game/index.tsx`, `app/miniGame/index.tsx`, `app/miniGame/catchTheMajor.tsx`, `app/miniGame/catchTheMajorPlay.tsx`, `app/miniGame/catchBoo.tsx`, `app/miniGame/freeThrow.tsx`, `app/room/index.tsx`, `app/room/[friendId].tsx`

확인된 예외/특징:
- `stores/useGameStore.ts`는 `components/MealPanel/MealMenuData.ts`, `components/QuizPanel/QuizData.ts`, `components/Room/RoomData.ts`를 import합니다. 이 파일들은 UI 컴포넌트라기보다 도메인 데이터/정책 registry 역할을 합니다.
- `utils/getTodayMeal.ts`는 학식 section 타입을 쓰기 위해 `components/MealPanel/MealMenuData.ts`를 import합니다.
- `components/MiniGame/MiniGameData.ts`는 UI 컴포넌트가 아니라 미니게임 장소/시작 화면/하트/이미지 preload registry 역할도 합니다.
- `routes`는 대부분의 feature panel과 shared UI를 import하지만, 반대로 하위 레이어에서 `app/*`를 import하는 흐름은 확인되지 않았습니다.
- 상위 화면(`app/game/index.tsx`, `app/miniGame/index.tsx`, `app/miniGame/catchTheMajorPlay.tsx`, `app/room/index.tsx`)은 여러 feature를 조율하는 orchestration 레이어입니다. 이 레이어의 로직을 하위 컴포넌트로 옮길 때는 store/timer/audio/router/animation 의존이 같이 이동하는지 확인해야 합니다.

## File Dependency Map
핵심 파일 기준으로 정리했습니다. 아래 목록은 실제 import와 확인된 호출 흐름만 반영합니다.

`app/_layout.tsx`:
  @depends: [`components/LoadingOverlay/LoadingOverlayAssets.ts`, `stores/useGameStore.ts`, `utils/backgroundMusic.ts`, `utils/preloadImageAssets.ts`, `utils/soundEffects.ts`]
  @used-by: [`expo-router/entry`]
  @side-effects: SplashScreen 제어, 이미지/폰트/오디오 preload, Android navigation bar 설정, Stack route 등록

`app/index.tsx`:
  @depends: [`components/Login/Login.tsx`, `components/MainButton/MainButton.tsx`, `components/Register/RegisterContainer.tsx`, `utils/backgroundMusic.ts`]
  @used-by: [`expo-router/entry`]
  @side-effects: titleLogin BGM 세션 시작, 로그인/회원가입 패널 UI 상태 변경

`app/game/index.tsx`:
  @depends: [`stores/useGameStore.ts`, `useHook/useTodayMeal.ts`, `utils/backgroundMusic.ts`, `utils/getTodayMeal.ts`, `utils/preloadImageAssets.ts`, `utils/soundEffects.ts`, `utils/xpProgress.ts`, `components/BooChat/BooChat.tsx`, `components/BooChat/BooChatList.ts`, `components/Character/Character.tsx`, `components/MiniGame/MiniGameData.ts`, `components/MealPanel/MealPanel.tsx`, `components/QuizPanel/QuizPanel.tsx`, `components/EvolutionOverlay/EvolutionOverlay.tsx`, `components/LoadingOverlay/LoadingOverlay.tsx`, `components/LoadingOverlay/LoadingOverlayAssets.ts`, `components/DeveloperPanel/DeveloperPanel.tsx`, `components/FriendList/FriendList.tsx`, `components/FriendPanel/FriendPanel.tsx`, `components/MyProfile/MyProfile.tsx`, `components/Options/Options.tsx`, `components/SoundSettings/SoundSettings.tsx`, `components/TutorialPanel/TutorialPanel.tsx`, `components/TopAlert/TopAlert.tsx`]
  @used-by: [`expo-router/entry`]
  @side-effects: Zustand 상태 변경, BGM/SFX 재생, 이미지 preload, router 이동(`/miniGame` 포함), 타이머/interval 관리

`app/miniGame/index.tsx`:
  @depends: [`components/MiniGame/MiniGameData.ts`, `components/CoinBox/CoinBox.tsx`, `components/FriendList/FriendList.tsx`, `components/FriendPanel/FriendPanel.tsx`, `components/MainButton/MainButton.tsx`, `components/MyProfile/MyProfile.tsx`, `components/Options/Options.tsx`, `components/ProgressBar/ProgressBar.tsx`, `components/SoundSettings/SoundSettings.tsx`, `components/SquareButton/SquareButton.tsx`, `components/TopAlert/TopAlert.tsx`, `stores/useGameStore.ts`, `utils/backgroundMusic.ts`, `utils/soundEffects.ts`, `utils/xpProgress.ts`]
  @used-by: [`expo-router/entry`, `app/game/index.tsx`]
  @side-effects: miniGameMain BGM 세션 시작, router 이동, 패널 상태 변경, TopAlert 표시

`app/miniGame/catchTheMajor.tsx`:
  @depends: [`components/MiniGame/MiniGameStartScreen.tsx`]
  @used-by: [`expo-router/entry`, `app/miniGame/index.tsx`]
  @side-effects: MiniGameStartScreen에 `catchTheMajor` 설정 전달

`app/miniGame/catchBoo.tsx`:
  @depends: [`components/MiniGame/MiniGameStartScreen.tsx`]
  @used-by: [`expo-router/entry`, `app/miniGame/index.tsx`]
  @side-effects: MiniGameStartScreen에 `catchBoo` 설정 전달. 실제 플레이는 준비 중 알림 처리

`app/miniGame/freeThrow.tsx`:
  @depends: [`components/MiniGame/MiniGameStartScreen.tsx`]
  @used-by: [`expo-router/entry`, `app/miniGame/index.tsx`]
  @side-effects: MiniGameStartScreen에 `freeThrow` 설정 전달. 실제 플레이는 준비 중 알림 처리

`app/miniGame/catchTheMajorPlay.tsx`:
  @depends: [`assets/icons/arrow-back-return.svg`, `assets/icons/cross.svg`, `assets/icons/heart-filled.svg`, `assets/icons/heart-white.svg`, `assets/icons/hourglass-time.svg`, `assets/miniGame/book-catch/*`, `components/FriendList/FriendListDummyData.ts`, `components/MainButton/MainButton.tsx`, `components/MiniGame/MiniGameData.ts`, `components/OutlinedText/OutlinedText.tsx`, `components/SquareButton/SquareButton.tsx`, `components/TopAlert/TopAlert.tsx`, `constants/character.ts`, `constants/colors.ts`, `constants/fonts.ts`, `stores/useGameStore.ts`, `utils/backgroundMusic.ts`, `utils/soundEffects.ts`, `utils/xpProgress.ts`]
  @used-by: [`expo-router/entry`, `components/MiniGame/MiniGameStartScreen.tsx`]
  @side-effects: miniGameIngame BGM 세션 시작, book-catch 이미지 preload, Reanimated animation/frame callback 관리, 일반모드 성공 시 coin 변경, SFX/haptic 재생, router 이동

`app/room/index.tsx`:
  @depends: [`stores/useGameStore.ts`, `components/Room/RoomData.ts`, `components/Room/RoomScene.tsx`, `components/Room/GuestbookListModal.tsx`, `components/CoinBox/CoinBox.tsx`, `components/ProgressBar/ProgressBar.tsx`, `components/SquareButton/SquareButton.tsx`, `utils/backgroundMusic.ts`, `utils/soundEffects.ts`, `utils/xpProgress.ts`]
  @used-by: [`expo-router/entry`]
  @side-effects: myRoom BGM 세션 시작, 가구/벽지 구매 및 장착 Zustand 상태 변경, router 이동, 클릭 SFX 재생, 방명록 목록 모달 상태 변경

`app/room/[friendId].tsx`:
  @depends: [`components/FriendList/FriendListDummyData.ts`, `components/ProgressBar/ProgressBar.tsx`, `components/Room/GuestbookModal.tsx`, `components/Room/RoomData.ts`, `components/Room/RoomScene.tsx`, `components/SquareButton/SquareButton.tsx`, `stores/useGameStore.ts`, `utils/backgroundMusic.ts`, `utils/soundEffects.ts`, `utils/xpProgress.ts`]
  @used-by: [`expo-router/entry`]
  @side-effects: myRoom BGM 세션 시작, router 이동, basicClick SFX 재생, 방명록 Zustand 상태 변경

`stores/useGameStore.ts`:
  @depends: [`components/FriendList/FriendListDummyData.ts`, `components/MealPanel/MealMenuData.ts`, `components/QuizPanel/QuizData.ts`, `components/Room/RoomData.ts`, `constants/character.ts`, `utils/xpProgress.ts`]
  @used-by: [`app/_layout.tsx`, `app/game/index.tsx`, `app/miniGame/index.tsx`, `app/miniGame/catchTheMajorPlay.tsx`, `app/room/index.tsx`, `app/room/[friendId].tsx`, `components/MealPanel/MealPanel.tsx`, `components/QuizPanel/QuizPanel.tsx`, `components/DeveloperPanel/DeveloperPanel.tsx`, `components/FriendList/FriendList.tsx`, `components/FriendPanel/FriendPanel.tsx`, `components/FriendPanel/FriendAddModal.tsx`, `components/MyProfile/MyProfile.tsx`, `components/Options/Options.tsx`, `components/SoundSettings/SoundSettings.tsx`, `components/MiniGame/MiniGameStartScreen.tsx`]
  @side-effects: AsyncStorage persist, Zustand 상태 변경, eating timeout 관리, 방명록 임시 데이터 저장

`constants/character.ts`:
  @depends: [`assets/characters/*`]
  @used-by: [`stores/useGameStore.ts`, `utils/xpProgress.ts`, `app/game/index.tsx`, `app/miniGame/catchTheMajorPlay.tsx`, `components/Character/Character.tsx`, `components/EvolutionOverlay/EvolutionOverlay.tsx`, `components/Room/RoomMiniBoo.tsx`, `components/BooChat/BooChatList.ts`, `components/DeveloperPanel/DeveloperPanel.tsx`, `components/ProgressBar/ProgressBar.tsx`]
  @side-effects: 정적 이미지 require

`utils/xpProgress.ts`:
  @depends: [`constants/character.ts`]
  @used-by: [`stores/useGameStore.ts`, `app/game/index.tsx`, `app/miniGame/index.tsx`, `app/miniGame/catchTheMajorPlay.tsx`, `app/room/index.tsx`, `components/DeveloperPanel/DeveloperPanel.tsx`]
  @side-effects: 없음

`utils/getTodayMeal.ts`:
  @depends: [`components/MealPanel/MealMenuData.ts`]
  @used-by: [`useHook/useTodayMeal.ts`, `app/game/index.tsx`]
  @side-effects: axios 네트워크 요청

`utils/preloadImageAssets.ts`:
  @depends: [`expo-asset`, `expo-image`]
  @used-by: [`app/_layout.tsx`, `app/game/index.tsx`, `components/LoadingOverlay/LoadingOverlayAssets.ts`]
  @side-effects: 로컬 이미지 에셋과 expo-image 캐시 preload

`useHook/useTodayMeal.ts`:
  @depends: [`utils/getTodayMeal.ts`]
  @used-by: [`app/game/index.tsx`]
  @side-effects: React Query cache 갱신, getTodayMeal 네트워크 요청 실행

`utils/backgroundMusic.ts`:
  @depends: [`assets/musics/bgm/*`]
  @used-by: [`app/_layout.tsx`, `app/index.tsx`, `app/game/index.tsx`, `app/miniGame/index.tsx`, `app/miniGame/catchTheMajorPlay.tsx`, `app/room/index.tsx`, `components/MiniGame/MiniGameStartScreen.tsx`]
  @side-effects: expo-audio player 생성/재생/정지, retry timer 관리

`utils/soundEffects.ts`:
  @depends: [`assets/musics/sfx/*`]
  @used-by: [`app/_layout.tsx`, `app/game/index.tsx`, `app/miniGame/index.tsx`, `app/miniGame/catchTheMajorPlay.tsx`, `app/room/index.tsx`, `components/MainButton/MainButton.tsx`, `components/SquareButton/SquareButton.tsx`, `components/TopAlert/TopAlert.tsx`, `components/MealPanel/MealPanel.tsx`, `components/QuizPanel/QuizPanel.tsx`, `components/TutorialPanel/TutorialPanel.tsx`, `components/MiniGame/BookCatchRuleModal.tsx`, `components/MiniGame/MiniGameRankingModal.tsx`, `components/Room/GuestbookListModal.tsx`]
  @side-effects: expo-audio player 생성/seek/play, SFX 볼륨 상태 변경

`components/MealPanel/MealMenuData.ts`:
  @depends: [`assets/plates/*`]
  @used-by: [`stores/useGameStore.ts`, `utils/getTodayMeal.ts`, `app/game/index.tsx`, `components/MealPanel/MealPanel.tsx`, `components/MealPanel/MealMenuButton.tsx`, `components/DeveloperPanel/DeveloperPanel.tsx`]
  @side-effects: 정적 이미지 require

`components/MealPanel/MealPanel.tsx`:
  @depends: [`stores/useGameStore.ts`, `utils/soundEffects.ts`, `components/MainButton/MainButton.tsx`, `components/MealPanel/MealMenuData.ts`, `components/MealPanel/MealMenuButton.tsx`]
  @used-by: [`app/game/index.tsx`]
  @side-effects: feedBoo Zustand 액션 호출, eating SFX 재생, clock interval 관리

`components/QuizPanel/QuizData.ts`:
  @depends: []
  @used-by: [`stores/useGameStore.ts`, `app/game/index.tsx`, `components/QuizPanel/QuizPanel.tsx`]
  @side-effects: Math.random 기반 문제 선택

`components/QuizPanel/QuizPanel.tsx`:
  @depends: [`stores/useGameStore.ts`, `utils/soundEffects.ts`, `components/MainButton/MainButton.tsx`, `components/QuizPanel/QuizData.ts`, `components/QuizPanel/QuizAnswerButton.tsx`]
  @used-by: [`app/game/index.tsx`]
  @side-effects: submitQuizAttempt Zustand 액션 호출, quiz SFX 재생, clock interval 관리

`components/MiniGame/MiniGameData.ts`:
  @depends: [`assets/places/*`, `assets/miniGame/icons/*`, `assets/miniGame/book-catch/*`, `expo-image`]
  @used-by: [`app/game/index.tsx`, `app/miniGame/index.tsx`, `app/miniGame/catchTheMajorPlay.tsx`, `components/MiniGame/MiniGameStartScreen.tsx`]
  @side-effects: preload 함수 호출 시 expo-image 캐시 preload, 하트 더미 상태 계산에서 Date.now 사용

`components/MiniGame/MiniGameStartScreen.tsx`:
  @depends: [`components/MiniGame/MiniGameData.ts`, `components/MiniGame/BookCatchRuleModal.tsx`, `components/MiniGame/HeartCountBadge.tsx`, `components/MiniGame/MiniGameRankingModal.tsx`, `components/CoinBox/CoinBox.tsx`, `components/MainButton/MainButton.tsx`, `components/SquareButton/SquareButton.tsx`, `components/TopAlert/TopAlert.tsx`, `components/FriendList/FriendListDummyData.ts`, `stores/useGameStore.ts`, `utils/backgroundMusic.ts`]
  @used-by: [`app/miniGame/catchTheMajor.tsx`, `app/miniGame/catchBoo.tsx`, `app/miniGame/freeThrow.tsx`]
  @side-effects: miniGameMain BGM 세션 시작, router 이동, TopAlert/랭킹/룰 모달 상태 변경

`components/MiniGame/BookCatchRuleModal.tsx`:
  @depends: [`assets/icons/cross.svg`, `assets/miniGame/book-catch/*`, `constants/colors.ts`, `constants/fonts.ts`, `utils/soundEffects.ts`]
  @used-by: [`components/MiniGame/MiniGameStartScreen.tsx`]
  @side-effects: basicClick SFX 재생, onClose 콜백 호출

`components/MiniGame/MiniGameRankingModal.tsx`:
  @depends: [`assets/icons/cross.svg`, `constants/colors.ts`, `constants/fonts.ts`, `utils/soundEffects.ts`, `@expo/vector-icons`]
  @used-by: [`components/MiniGame/MiniGameStartScreen.tsx`]
  @side-effects: basicClick SFX 재생, 랭킹 탭 상태 변경, onClose 콜백 호출

`components/MiniGame/HeartCountBadge.tsx`:
  @depends: [`assets/icons/heart.svg`, `constants/colors.ts`, `constants/fonts.ts`]
  @used-by: [`components/MiniGame/MiniGameStartScreen.tsx`]
  @side-effects: 없음

`components/Room/RoomData.ts`:
  @depends: [`assets/Rooms/*`]
  @used-by: [`stores/useGameStore.ts`, `app/game/index.tsx`, `app/room/index.tsx`, `app/room/[friendId].tsx`, `components/Room/RoomScene.tsx`, `components/Room/RoomMiniBoo.tsx`]
  @side-effects: 정적 이미지 require

`components/Room/RoomScene.tsx`:
  @depends: [`components/Room/RoomData.ts`, `components/Room/RoomMiniBoo.tsx`, `constants/character.ts`]
  @used-by: [`app/room/index.tsx`, `app/room/[friendId].tsx`]
  @side-effects: 없음. 단, 전달받은 `onFurniturePress` callback을 호출할 수 있음

`components/Room/RoomMiniBoo.tsx`:
  @depends: [`components/BooChat/BooChat.tsx`, `components/BooChat/BooChatList.ts`, `components/Character/Character.tsx`, `components/Room/RoomData.ts`, `constants/character.ts`]
  @used-by: [`components/Room/RoomScene.tsx`]
  @side-effects: Animated loop/timing, room chat timeout 관리

`components/Room/GuestbookModal.tsx`:
  @depends: [`assets/icons/cross.svg`, `components/Inputs/InputField.tsx`, `components/MainButton/MainButton.tsx`, `constants/colors.ts`, `constants/fonts.ts`, `utils/soundEffects.ts`]
  @used-by: [`app/room/[friendId].tsx`]
  @side-effects: Keyboard dismiss, basicClick SFX 재생, onSubmit/onClose 콜백 호출

`components/Room/GuestbookListModal.tsx`:
  @depends: [`assets/icons/cross.svg`, `assets/icons/edit-square.svg`, `components/Room/RoomGuestbookDummyData.ts`, `constants/colors.ts`, `constants/fonts.ts`, `utils/soundEffects.ts`, `@expo/vector-icons`]
  @used-by: [`app/room/index.tsx`]
  @side-effects: basicClick SFX 재생, router 이동, 방명록 목록/필터 UI 상태 변경

`components/BooChat/BooChatList.ts`:
  @depends: [`constants/character.ts`]
  @used-by: [`app/game/index.tsx`, `components/Room/RoomMiniBoo.tsx`]
  @side-effects: Math.random 기반 문구 선택

`components/Character/Character.tsx`:
  @depends: [`constants/character.ts`]
  @used-by: [`app/game/index.tsx`, `components/Room/RoomMiniBoo.tsx`]
  @side-effects: interval timer 관리, 이미지 표시 완료 콜백 호출

`components/EvolutionOverlay/EvolutionOverlay.tsx`:
  @depends: [`constants/character.ts`, `assets/images/big-smoke.png`]
  @used-by: [`app/game/index.tsx`]
  @side-effects: Animated timing, blink/smoke timeout 관리

`components/LoadingOverlay/LoadingOverlay.tsx`:
  @depends: [`components/LoadingOverlay/LoadingOverlayAssets.ts`, `constants/colors.ts`, `constants/fonts.ts`]
  @used-by: [`app/game/index.tsx`]
  @side-effects: loading frame interval 관리, 방어적 로딩 오버레이 preload 호출

`components/LoadingOverlay/LoadingOverlayAssets.ts`:
  @depends: [`assets/images/egg-closed.png`, `assets/images/egg-opened.png`, `assets/images/inGameMain.png`, `utils/preloadImageAssets.ts`]
  @used-by: [`app/_layout.tsx`, `app/game/index.tsx`, `components/LoadingOverlay/LoadingOverlay.tsx`]
  @side-effects: preloadLoadingOverlayAssets 호출 시 로딩 오버레이 이미지 캐시 preload

`components/DeveloperPanel/DeveloperPanel.tsx`:
  @depends: [`stores/useGameStore.ts`, `components/MainButton/MainButton.tsx`, `components/MealPanel/MealMenuData.ts`, `constants/character.ts`, `utils/xpProgress.ts`]
  @used-by: [`app/game/index.tsx`]
  @side-effects: 다수의 Zustand 디버그 액션 호출, 입력 validation 상태 관리

`components/TutorialPanel/TutorialPanel.tsx`:
  @depends: [`components/TutorialPanel/TutorialData.ts`, `utils/soundEffects.ts`]
  @used-by: [`app/game/index.tsx`]
  @side-effects: basicClick SFX 재생, 튜토리얼 완료 콜백 호출

`components/SquareButton/SquareButton.tsx`:
  @depends: [`constants/colors.ts`, `utils/soundEffects.ts`]
  @used-by: [`app/game/index.tsx`, `app/miniGame/index.tsx`, `app/miniGame/catchTheMajorPlay.tsx`, `app/room/index.tsx`, `app/room/[friendId].tsx`, `components/MiniGame/MiniGameStartScreen.tsx`]
  @side-effects: basicClick SFX 재생, onPress 콜백 호출

`components/MainButton/MainButton.tsx`:
  @depends: [`constants/colors.ts`, `constants/fonts.ts`, `utils/soundEffects.ts`]
  @used-by: [`app/index.tsx`, `app/miniGame/index.tsx`, `app/miniGame/catchTheMajorPlay.tsx`, `components/Register/RegisterComplete.tsx`, `components/Register/RegisterDetail.tsx`, `components/Login/Login.tsx`, `components/MealPanel/MealPanel.tsx`, `components/QuizPanel/QuizPanel.tsx`, `components/FriendList/FriendDeleteModal.tsx`, `components/FriendPanel/FriendAddModal.tsx`, `components/DeveloperPanel/DeveloperPanel.tsx`, `components/Room/GuestbookModal.tsx`, `components/MiniGame/MiniGameStartScreen.tsx`]
  @side-effects: basicClick SFX 재생, onPress 콜백 호출

`components/CoinBox/CoinBox.tsx`:
  @depends: [`assets/icons/coin.svg`, `constants/colors.ts`, `constants/fonts.ts`]
  @used-by: [`app/game/index.tsx`, `app/miniGame/index.tsx`, `app/room/index.tsx`, `components/MiniGame/MiniGameStartScreen.tsx`]
  @side-effects: 없음

`components/ProgressBar/ProgressBar.tsx`:
  @depends: [`constants/character.ts`, `constants/colors.ts`, `constants/fonts.ts`, `components/OutlinedText/OutlinedText.tsx`]
  @used-by: [`app/game/index.tsx`, `app/miniGame/index.tsx`, `app/room/index.tsx`, `app/room/[friendId].tsx`]
  @side-effects: 없음

`components/TopAlert/TopAlert.tsx`:
  @depends: [`assets/icons/cross.svg`, `constants/colors.ts`, `constants/fonts.ts`, `utils/soundEffects.ts`]
  @used-by: [`app/game/index.tsx`, `app/miniGame/index.tsx`, `app/miniGame/catchTheMajorPlay.tsx`, `components/MiniGame/MiniGameStartScreen.tsx`]
  @side-effects: Animated timing/spring, auto-hide timeout, close SFX 재생
