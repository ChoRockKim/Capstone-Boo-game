# Boo App

한국외대 마스코트 캐릭터 `부`를 학식, 퀴즈, 친구, 마이룸, 미니게임 기능과 연결해 성장시키는 Expo 기반 React Native 앱입니다.

## Tech Stack

- React 19, React Native, Expo, Expo Router
- TypeScript strict mode
- Zustand persist, AsyncStorage fallback
- TanStack Query, axios
- expo-image, expo-audio, expo-font, expo-splash-screen
- react-native-reanimated, react-native-svg

## Requirements

Node 20 사용을 권장합니다.

```bash
node -v
npm install
```

## Run

```bash
npm run start
npm run dev:device
npm run dev:device:clear
npm run dev:device:lan
npm run dev:device:lan:clear
npm run ios
npm run android
npm run web
```

검증:

```bash
npx tsc --noEmit
npm run lint
```

현재 별도 test script는 없습니다.

## Main Routes

- `/`: 로그인/회원가입
- `/game`: 메인 육성 화면
- `/miniGame`: 미니게임 장소 선택
- `/miniGame/catchTheMajor`: 전공책 받기 시작 화면
- `/miniGame/catchTheMajorPlay`: 전공책 받기 플레이 화면
- `/miniGame/catchBoo`: 부 잡기 시작 화면
- `/miniGame/catchBooPlay`: 부 잡기 플레이 화면
- `/miniGame/freeThrow`: 자유투 넣기 시작 화면
- `/miniGame/freeThrowPlay`: 자유투 넣기 플레이 화면
- `/room`: 마이룸
- `/room/[friendId]`: 친구 방 방문

## Feature Notes

- 퀴즈 정답 보상은 `+30 XP`, `+10 coin`입니다.
- 전공책 받기 일반모드는 30초 제한, 50P 이상 성공, 성공 시 `+3 coin`을 지급합니다.
- 전공책 받기 무한모드는 시간 제한이 없고 방해물 3회 충돌 시 종료됩니다.
- 무한모드는 점수 아이템을 먹을 때마다 낙하/스폰 속도가 1%씩 빨라지며 최대 1.8배까지 증가합니다.
- 무한모드 랭킹은 기존 `miniGameHardScores` 데이터를 호환 사용합니다.
- 전공책 받기 인게임 화면은 iOS swipe back gesture를 비활성화합니다.
- 부 잡기 일반모드는 30초 제한, 50P 이상 성공, 성공 시 `+3 coin`을 지급합니다.
- 자유투 넣기는 오바마홀에서 시작하며, 5회 연속 성공 시 `+3 coin`을 지급합니다.
- 로그인 상태 미니게임 시작/보상은 서버 `/economy/minigame/start`, `/economy/minigame/reward`를 우선 사용합니다.
- 미니게임 랭킹 목록은 서버 `/minigames/rankings`, `/minigames/rankings/friends`를 사용합니다.
- 게스트 모드는 `guestGameSnapshot`에 로컬 진행도를 보관하며, 친구/방명록/친구 랭킹 기능은 사용하지 않습니다.
- 4학년 XP를 모두 채우면 졸업 화면을 표시하고, 졸업 리포트 통계는 현재 로컬 누적값을 사용합니다.
- 전공책 받기 점수 아이템 획득 시 `assets/musics/sfx/point-plus.m4a`를 재생합니다.
- BGM 기본 볼륨은 이전 대비 약 70% 수준으로 낮춰져 있고, 졸업 화면은 `assets/musics/bgm/graduation.mp3`를 별도 BGM으로 사용합니다.

## Asset Preload

로딩 오버레이 이미지 source와 preload는 `components/LoadingOverlay/LoadingOverlayAssets.ts`에서 관리합니다.

- 앱 시작 시 `app/_layout.tsx`가 splash를 닫기 전에 `preloadLoadingOverlayAssets()`를 await합니다.
- `LoadingOverlay` 자체도 방어적으로 같은 preload 함수를 호출합니다.
- 새 로딩 오버레이 이미지는 `LoadingOverlayAssets.ts`에 추가하세요.
- 일반 이미지 preload는 `utils/preloadImageAssets.ts`를 사용해 `expo-asset`과 `expo-image` 캐시에 함께 올립니다.
- 로그인 후 메인 화면 진입 시에는 현재 부 이미지 같은 critical asset만 await하고, 캐릭터 전체/학식/마이룸/튜토리얼 이미지는 화면 표시 이후 background preload합니다.
- 메인에서 미니게임 장소 선택 화면으로 이동할 때는 첫 장소 배경만 critical asset으로 await하고, 나머지 장소/시작화면/플레이 이미지는 장소 선택 화면 표시 이후 background preload합니다.

## Project Structure

- `app/`: Expo Router routes, app-level orchestration
- `components/`: shared UI and feature panels
- `components/LoadingOverlay/`: loading UI and loading asset registry
- `components/MiniGame/`: mini-game registry, start screen, ranking/rule UI
- `components/Room/`: room renderer, furniture registry, guestbook UI
- `stores/`: Zustand game store
- `utils/`: audio, meal API, XP, preload utilities
- `constants/`: colors, fonts, character image registry
- `assets/`: images, icons, characters, rooms, mini-game assets, music, fonts
- `docs/`: technical learning guide

## Troubleshooting

- Metro가 `Bundler cache is empty` 이후 멈추면 Node 20인지 확인하고, 필요 시 `node_modules`와 `.expo/cache`를 삭제한 뒤 `npm install`을 다시 실행하세요.
- `@/*` alias 관련 ESLint 오류는 `eslint.config.js`의 TypeScript resolver 설정과 `eslint-import-resolver-typescript` 설치 상태를 확인하세요.
- React hooks 계열 lint error가 기존 코드에 남아 있을 수 있으므로, lint 결과는 최신 상태를 직접 확인하세요.
