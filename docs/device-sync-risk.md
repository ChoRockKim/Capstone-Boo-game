# 기기 교체 시 동기화 리스크 정리

## 목적

사용자가 새 기기에서 로그인했을 때 서버에서 내려받지 않는 로컬 상태는 기존 기기와 불일치할 수 있습니다. 이 문서는 현재 `useGameStore` persist 상태와 서버 동기화 흐름을 기준으로, 기기 교체 시 반영되지 않거나 어긋날 수 있는 항목을 정리합니다.

## 현재 기준

- 로컬 영구 저장소: `stores/useGameStore.ts`의 `persist`, key는 `boo-game-store`
- 서버 기본 동기화: `utils/syncServerUserStats.ts`
- 서버 캐릭터 동기화: `utils/syncServerCharacter.ts`
- 서버 마이룸 동기화: `utils/syncServerRoomState.ts`
- 화면 focus 동기화: `useHook/useSyncServerUserStatsOnFocus.ts`
- 마이룸 서버 동기화: `app/room/index.tsx` 진입 후 `/rooms/me`, `/shop/items` 조회

## 현재 완화된 항목

- 로그인 상태에서는 `syncMealStatus()`가 로컬 끼니 누락 패널티를 적용하지 않습니다. 새 기기/기존 기기 사이의 로컬 `skippedMealCount`, `appliedSkippedMealPenaltyCount` 차이가 XP를 직접 깎지 않도록 막았습니다.
- 로그인 상태의 메인 학식 버튼과 학식 패널은 서버 `/school-foods/feed-status`를 기준으로 먹이기 가능 여부를 판단합니다. 서버 상태가 아직 없으면 로컬 `lastFedMeals`로 대체하지 않습니다.
- 서버 `fed_slots`, `current_slot`은 `normalizeMealSectionId()`로 정규화해 `breakfast/lunch/dinner`와 한국어 slot 값이 섞여도 비교할 수 있게 했습니다.
- 서버 퀴즈 제출 성공 시 `quizAttemptHistory`, `quizDailyCount`, `quizDailyCountDateKey`를 더 이상 갱신하지 않습니다. 로그인 상태의 퀴즈 제한은 서버 `/quizzes/play-status`만 기준으로 둡니다.
- 로그인 후 유저/경제/캐릭터 동기화와 함께 `/rooms/me`, `/shop/items` 기반 마이룸 동기화를 수행합니다. 마이룸 화면에 들어가기 전에도 서버 방/상점 상태가 로컬 store에 반영될 수 있습니다.

## 서버에서 복구되는 핵심 상태

아래 값은 로그인 후 서버 API를 통해 다시 받을 수 있어 기기 교체 리스크가 낮습니다.

| 영역 | 복구되는 값 | 현재 연결 |
| --- | --- | --- |
| 유저 | 학번, 이름, 닉네임, 이메일, 이메일 인증 여부, 프로필 이미지 | `/user/me` |
| 경제 | 코인, 하트, 최대 하트 | `/economy/status`, `/user/me` |
| 성장 | 총 XP | `/user/me` |
| 캐릭터 | 부 이름, 서버 캐릭터 ID, 성장 단계 | `/characters/{id}`, `/characters/` |
| 친구 | 로그인 유저의 친구 목록 | `/friends/` |
| 학식 | 오늘 학식, 먹이기 가능 상태, 먹이기 처리 | `/school-foods/*` |
| 퀴즈 | 플레이 가능 상태, 다음 문제, 제출 결과 | `/quizzes/*` |
| 마이룸 | 서버 방 상태, 상점 아이템, 구매/장착 상태 | `/rooms/me`, `/shop/items` |
| 미니게임 | 결과 저장, 보상 지급, 내 랭킹 요약 | `/minigames/results`, `/economy/minigame/play`, `/minigames/ranking/me` |

## 위험도 높음

### 1. 학식 누락/패널티 로컬 상태

관련 persist 값:

- `lastFedMeals`
- `lastFedMealSlotIndex`
- `skippedMealCount`
- `appliedSkippedMealPenaltyCount`
- `characterState`

문제:

- 새 기기에는 기존 기기에서 누적된 끼니 기록과 패널티 적용 상태가 없습니다.
- 로그인 상태의 먹이기 가능 여부는 서버 `/school-foods/feed-status` 기준으로 맞출 수 있지만, 배고픔 상태나 누락 끼니 수, 이미 적용한 XP 패널티 수는 로컬 계산에 의존할 수 있습니다.
- 기존 기기에서는 `hungry` 상태였는데 새 기기에서는 기본 상태로 보일 수 있습니다.
- 패널티 적용 기준이 로컬에 남아 있으면, 기기별로 패널티 적용 여부가 달라질 수 있습니다.

권장 해결:

- 로그인 상태에서는 `lastFedMeals`, `skippedMealCount`, `appliedSkippedMealPenaltyCount`를 권위 있는 상태로 쓰지 않습니다. 현재 클라이언트에서는 이 원칙을 반영해 로그인 상태의 로컬 패널티 적용을 막았습니다.
- 서버에 끼니별 feed history, missed meal count, penalty applied count가 있다면 해당 값을 내려받아 단일 기준으로 삼습니다.
- 서버에 해당 필드가 없다면 로그인 유저의 배고픔/패널티 기능은 서버 API 추가 전까지 비활성화하거나, 새 기기에서 초기화되는 것을 정책으로 명시합니다.
- `characterState`의 `hungry` 전환도 로그인 상태에서는 서버 기준 상태 또는 계산된 서버 feed status 기반으로만 결정합니다.

우선순위:

- 높음. XP 패널티와 캐릭터 상태가 직접 바뀌므로 사용자 체감과 데이터 신뢰도에 영향이 큽니다.

### 2. 퀴즈 제한 로컬 상태

관련 persist 값:

- `quizAttemptHistory`
- `quizDailyCount`
- `quizDailyCountDateKey`
- `quizDailyLimitEnabled`

문제:

- 새 기기에는 기존 기기의 퀴즈 시도 기록과 일일 카운트가 없습니다.
- 로그인 상태에서는 서버 `/quizzes/play-status`가 있으므로 실제 제한은 서버 기준으로 맞출 수 있습니다.
- 다만 로컬 카운터가 UI 보조값으로 남아 있으면 서버 상태와 다른 메시지, 쿨타임, 가능 횟수를 보여줄 수 있습니다.
- 개발용 토글인 `quizDailyLimitEnabled`도 기기별로 달라집니다.

권장 해결:

- 로그인 상태에서는 퀴즈 가능 여부, 남은 횟수, 쿨타임, 다음 가능 시각을 서버 `/quizzes/play-status` 응답만으로 표시합니다. 현재 클라이언트에서는 서버 제출 성공 시 로컬 퀴즈 카운터를 갱신하지 않도록 정리했습니다.
- `quizAttemptHistory`, `quizDailyCount`, `quizDailyCountDateKey`는 비로그인 fallback 전용으로 제한합니다.
- 로그인 성공 또는 서버 동기화 성공 시 퀴즈 로컬 제한 상태를 UI 판단에서 제외합니다.

우선순위:

- 높음. 퀴즈 보상은 XP/코인과 연결되므로 기기별 제한 불일치가 경제 밸런스 문제로 이어질 수 있습니다.

### 3. 마이룸 서버 매핑 안정성

관련 persist 값:

- `ownedRoomItems`
- `ownedRoomWallpapers`
- `equippedRoomItems`
- `equippedRoomWallpaper`

문제:

- 현재 로그인 상태에서는 `/rooms/me`, `/shop/items`를 통해 서버 상태를 로컬 방 상태로 매핑합니다.
- 다만 서버 shop item 이름/image와 로컬 `RoomData` id/label 매칭이 문자열 normalize 기반이면, 백엔드 데이터가 조금만 바뀌어도 새 기기에서 아이템이 기본값처럼 보일 수 있습니다.
- 마이룸 동기화는 `app/room/index.tsx` 진입 후 수행됩니다. 앱 시작 직후 또는 다른 화면에서 방 상태를 참조하면 아직 서버 상태가 반영되지 않았을 수 있습니다.
- 비로그인 상태에서 구매/장착한 로컬 방 상태는 새 기기로 이동하지 않습니다.

권장 해결:

- 백엔드 `ShopItemOut`에 로컬 asset id와 1:1로 매칭 가능한 stable key를 추가합니다.
- 예: `client_item_key`, `asset_key`, `slot_id`
- 문자열 label/image 기반 매핑은 fallback으로만 사용합니다.
- 로그인 직후 또는 앱 초기 동기화 단계에서 `/rooms/me`, `/shop/items`를 함께 가져와 store에 반영하는 흐름을 추가합니다. 현재 클라이언트에서는 `syncServerUserStats()` 내부에서 `syncServerRoomState()`를 함께 실행합니다.

우선순위:

- 높음. 유저가 구매한 아이템이 새 기기에서 사라진 것처럼 보이면 신뢰도에 큰 영향이 있습니다.

## 위험도 중간

### 4. 튜토리얼 완료 여부

관련 persist 값:

- `hasSeenGameTutorial`

문제:

- 기존 기기에서 튜토리얼을 봤어도 새 기기에서는 다시 표시될 수 있습니다.
- 반대로 새 기기에서 초기화되어도 실제 성장/경제 데이터에는 영향이 없습니다.

권장 해결:

- 서버 유저 설정에 `has_seen_game_tutorial` 같은 필드를 추가합니다.
- 또는 튜토리얼은 기기별 설정으로 간주하고, 반복 노출을 허용하는 정책으로 둡니다.

우선순위:

- 중간. 데이터 손실은 아니지만 새 기기 첫 경험에 영향을 줍니다.

### 5. 사운드/환경 설정

관련 persist 값:

- `masterVolume`
- `bgmVolume`
- `sfxVolume`
- `developerModeEnabled`
- `mealDayMode`
- `mealRestrictionEnabled`

문제:

- 볼륨 설정은 새 기기에서 기본값으로 돌아갑니다.
- 개발/테스트용 토글은 기기별로 달라집니다.
- 일반 사용자에게는 볼륨 초기화가 가장 체감됩니다.

권장 해결:

- 일반 사용자 설정만 서버 프로필 설정으로 분리합니다.
- 후보 필드: `master_volume`, `bgm_volume`, `sfx_volume`
- 개발용 토글은 서버 동기화하지 않고 로컬 전용으로 유지합니다.

우선순위:

- 중간. 핵심 데이터 문제는 아니지만 사용성에 영향이 있습니다.

### 6. 캐릭터 임시 상태

관련 persist 값:

- `characterState`

문제:

- `basic`, `happy`, `hungry`, `eating`, `talking` 같은 상태는 현재 화면/행동 맥락에 가까운 로컬 상태입니다.
- 새 기기에서는 기존 기기의 감정/행동 상태가 이어지지 않습니다.
- 특히 `hungry`가 학식 누락 로직과 연결되면 단순 UI 상태가 아니라 성장/패널티 경험과도 연결될 수 있습니다.

권장 해결:

- `eating`, `talking`, `happy`는 기기별 transient UI 상태로 보고 새 기기에서 초기화해도 됩니다.
- `hungry`만 서버 feed history 또는 missed meal count에서 계산하도록 분리합니다.
- `characterState` 전체를 서버 저장 대상으로 만들기보다는, 서버 권위가 필요한 상태와 UI transient 상태를 분리합니다.

우선순위:

- 중간. `hungry`를 제외하면 대부분은 화면 연출 상태입니다.

### 7. 미니게임 랭킹 목록

관련 상태/데이터:

- `FriendListDummyData` 기반 fallback 점수
- `/minigames/ranking/me`
- `/minigames/results/me`

문제:

- 서버에는 현재 내 랭킹 요약과 내 결과 조회만 연결되어 있습니다.
- 전체 랭킹 또는 친구 랭킹 리스트 API가 없으면 새 기기에서도 실제 랭킹 목록을 완전히 표시할 수 없습니다.
- 로그인 상태에서는 더미 친구 점수를 현재 랭킹 기준으로 쓰지 않도록 정리했지만, 랭킹 모달의 풍부한 목록 경험은 제한됩니다.

권장 해결:

- 백엔드에 게임 타입/모드별 랭킹 목록 API를 추가합니다.
- 예: `GET /minigames/ranking?game_type=catch_the_major&mode=normal`
- 친구 랭킹이 필요하면 `scope=friends` 또는 별도 `/minigames/ranking/friends`를 추가합니다.

우선순위:

- 중간. 핵심 성장 데이터보다 낮지만, 경쟁형 UX에는 중요합니다.

## 위험도 낮음

### 8. 친구/방명록 로컬 fallback

관련 persist 값:

- `friendList`
- `guestbookEntries`

문제:

- 로그인 상태에서는 서버 친구 목록과 서버 방명록을 우선 사용합니다.
- 비로그인 또는 서버 실패 fallback으로 만든 로컬 데이터는 새 기기로 이동하지 않습니다.
- 기존 사용자 AsyncStorage에 더미 친구가 남아 있어도 로그인 화면에서는 서버 데이터만 표시하도록 정리되어 있습니다.

권장 해결:

- 비로그인 플레이를 유지한다면 로컬 전용 데이터임을 정책으로 둡니다.
- 실제 배포에서 비로그인을 막는다면 fallback 데이터와 persist 범위를 축소합니다.
- 필요하면 persist migration으로 과거 `friendList` 더미 값을 제거합니다.

우선순위:

- 낮음. 로그인 기준 주요 화면에서는 서버 데이터가 우선입니다.

### 9. 자동 로그인 세션

관련 persist 값:

- `accessToken`
- `refreshToken`
- `autoLoginEnabled`

문제:

- 새 기기에는 기존 기기의 토큰이 없으므로 자동 로그인이 이어지지 않습니다.
- 사용자는 새 기기에서 다시 로그인해야 합니다.

권장 해결:

- 정상 동작으로 간주합니다.
- 새 기기 로그인 후 서버 동기화를 빠르게 수행해 기존 진행 상태를 복구합니다.

우선순위:

- 낮음. 보안상 기기별 세션이 맞습니다.

### 10. 이미지/사운드/React Query 캐시

관련 상태:

- 이미지 preload cache
- 사운드 preload cache
- TanStack Query memory cache

문제:

- 새 기기에서는 캐시가 비어 있으므로 첫 진입 시 다시 다운로드/로드됩니다.
- 데이터 불일치보다는 초기 로딩 성능 문제입니다.

권장 해결:

- 현재처럼 critical asset만 await하고 나머지는 background preload합니다.
- 서버 데이터도 화면 필수 데이터와 후순위 데이터를 분리합니다.

우선순위:

- 낮음. UX 성능 문제이며 데이터 정합성 문제는 아닙니다.

### 11. 로컬 알림 예약

관련 상태:

- 기기 로컬 알림 스케줄
- 향후 push token 등록 상태

문제:

- 로컬 알림 예약은 기기별입니다.
- 새 기기에서는 기존 기기의 알림 예약이 이어지지 않습니다.
- push notification을 붙일 경우 push token도 기기별로 새로 등록해야 합니다.

권장 해결:

- 로그인 또는 앱 시작 후 알림 권한과 예약 상태를 다시 확인합니다.
- 서버 push를 도입하면 `user_id -> device_token[]` 구조로 기기별 토큰을 관리합니다.

우선순위:

- 낮음. 현재 핵심 성장 데이터와 직접 연결되지는 않습니다.

## 개선 우선순위 제안

1. 로그인 상태의 학식/패널티 계산에서 로컬 상태 의존 제거
2. 로그인 상태의 퀴즈 제한 UI를 서버 `play-status` 단일 기준으로 정리
3. 마이룸 서버 item stable key 추가 및 매핑 안정화
4. 로그인 직후 방/상점 상태 초기 동기화 추가
5. 튜토리얼/볼륨 같은 사용자 설정 서버 저장 여부 결정
6. 미니게임 전체/친구 랭킹 목록 API 추가
7. 알림 예약은 기기별 재설정 플로우로 분리

## 구현 원칙

- 로그인 유저의 성장/경제/제한/구매 데이터는 서버를 단일 기준으로 둡니다.
- 로컬 persist는 UI 편의, 비로그인 fallback, transient 상태에만 사용합니다.
- 서버 동기화가 가능한 값은 앱 시작 또는 로그인 직후에 최소 1회 hydrate합니다.
- 기기별로 달라도 되는 값은 명시적으로 로컬 전용 정책으로 둡니다.
- 로컬 fallback 데이터가 로그인 화면에 섞이지 않도록 `accessToken` 기준 분기를 유지합니다.
