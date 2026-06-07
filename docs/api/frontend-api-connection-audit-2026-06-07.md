# Frontend API Connection Audit - 2026-06-07

이 문서는 현재 프론트 코드, 로컬 `docs/api/openapi.json`, 원격 `/openapi.json`, 일부 public endpoint 호출 결과를 대조해 API 연결이 불완전하거나 계약이 맞지 않는 부분을 정리한 것입니다.

확인 기준:

- 원격 OpenAPI: `https://capstonedesign-production.up.railway.app/openapi.json`
- 로컬 OpenAPI: `docs/api/openapi.json`
- 두 OpenAPI는 현재 동일함: 62 paths, 87 operations, 86 schemas
- 인증이 필요한 endpoint는 토큰이 없어서 실서버 응답까지 검증하지 못함. 코드 연결과 명세, 기존 로그 기준으로 판단함

## P0. Shop / Room item catalog

### 증상

- 기존 로그에서 `/shop/items`가 200 success로 빈 배열을 반환함.
- public `/shop/item-types` 실제 응답은 아래와 같음.

```json
[
  { "item_type": "desk", "label": "책상" },
  { "item_type": "bed", "label": "침대" },
  { "item_type": "closet", "label": "장롱" },
  { "item_type": "room", "label": "마이룸방" }
]
```

### 프론트 기대값

- 프론트 슬롯/상점 type은 `wallpaper`, `bed`, `closet`, `table`.
- `app/room/index.tsx`와 `utils/serverRoomAdapter.ts`는 `wallpaper | bed | closet | table`만 정상 매핑함.
- `item_key`는 로컬 asset id와 1:1이어야 함. 예: `wallpaper-green`, `table-maple-blue`.

### 영향

- `/shop/items`가 비면 구매/장착할 서버 `item_id`를 찾을 수 없음.
- 서버가 `room`/`desk` type으로 `/shop/items`를 내려주면 프론트의 `wallpaper`/`table` 매핑이 실패함.
- 마이룸 구매, 장착, 기본 지급 방 상태 동기화가 가장 큰 실사용 장애로 남음.

### 필요한 조치

- 프론트 조치 완료: `desk -> table`, `room -> wallpaper` alias를 `utils/serverRoomAdapter.ts`, `app/room/index.tsx`에 반영함.
- 프론트 조치 완료: `item_key` 기반 매칭을 추가해 name/image 매칭보다 안정적으로 서버 catalog를 로컬 asset에 연결함.
- 백엔드 catalog seed 보장: `/shop/items`는 전체 구매 가능 catalog를 non-empty로 반환.
- 백엔드 `item_type` 계약은 가능하면 프론트와 일치시킴: `wallpaper | bed | closet | table`.
- `item_key`를 로컬 asset id와 1:1로 고정.
- 기본 지급 item도 catalog에 포함하고, 신규 유저 기본 room state를 생성.

## P0. Quiz answer field missing from playable quiz APIs

### 현재 명세

- `Quiz` schema에는 `answer`가 있음.
- 하지만 플레이용 `QuizQuestion` schema에는 `answer`가 없음.
- `/quizzes/next`, `/quizzes/available`은 `QuizQuestion`을 반환함.

### 프론트 기대값

- 즉시 채점 UX를 위해 `/quizzes/next`, `/quizzes/available`에 `answer`가 필요함.
- 프론트 타입은 `answer?: string | null`로 열어둔 상태.

### 영향

- 백엔드가 `answer`를 내려주지 않으면 클라이언트는 즉시 정답/오답을 안정적으로 표시할 수 없음.
- 현재 프론트는 `answer`가 없을 때 `/quizzes/submit` 결과를 기다리도록 보강되어 있음. 즉, 기능은 동작하지만 즉시 채점 UX는 완성되지 않음.

### 필요한 조치

- 프론트 조치 완료: `answer`가 없으면 optimistic 채점을 하지 않고 `/quizzes/submit` 결과를 기준으로 결과 UI와 보상을 반영함.
- 백엔드 `QuizQuestion` 응답에 `answer` 포함.
- `/quizzes/next`, `/quizzes/available` 모두 같은 계약 적용.

## P0. Achievement event 400

### 증상

- 사용자 로그: `서버 마이룸 진입 업적 동기화 실패 [AxiosError: Request failed with status code 400]`
- 프론트 요청 payload는 명세와 일치함: `{ "event_type": "room_first_enter" }`
- public `/achievements/` master에는 `room_first_enter`, `campus_first_visit`, `friend_count`, `minigame_play_count` 등이 존재함.

### 영향

- 마이룸 첫 진입 업적 progress/reward가 서버에 반영되지 않을 수 있음.
- 같은 패턴이면 다른 event도 특정 조건에서 400이 날 가능성이 있음.

### 필요한 조치

- 백엔드 `/achievements/events`가 `room_first_enter`를 event type으로 정상 처리하는지 확인.
- 이미 완료된 업적/event 재전송은 400보다 idempotent 200으로 처리하는 편이 프론트에 안전함.
- 400 detail을 확인해 event key 불일치, 중복 처리 정책, handler 누락 중 어느 쪽인지 분리.

## P2. Profile image API exists but settings UI no longer exposes it

### 현재 명세

- `POST /user/me/image`
- `DELETE /user/me/image`
- `UserOut.image`

### 현재 프론트 동작

- `syncServerUserStats`는 서버 `UserOut.image` 값을 `userImage`로 동기화할 수 있음.
- 설정 > 나의 계정 화면에서는 프로필 이미지 수정/삭제 UI를 제거함.
- 현재 사용자가 설정에서 바꿀 수 있는 계정 항목은 닉네임, 비밀번호 중심.

### 영향

- 기존 서버/계정 데이터에 프로필 이미지가 있어도 프론트 설정 화면에서 변경할 수 없음.
- `/user/me/image` 엔드포인트는 명세상 존재하지만 현재 활성 프론트 workflow는 아님.

### 필요한 조치

- 현재 정책 유지 시 백엔드 변경 불필요.
- 프로필 이미지 변경 기능을 다시 열 경우에만 `updateCurrentUserImage`, `deleteCurrentUserImage` 연결 UI를 재도입.

## P2. Developer panel server synchronization is intentionally partial

### 현재 프론트 동작

- 부 이름 변경은 로그인 상태에서 `PUT /characters/me`의 `character_name`으로 서버에 저장함.
- 부 상태 변경은 로그인 상태에서 `PUT /characters/me`의 `state`로 서버에 저장함.
- 튜토리얼 조회 초기화는 로그인 상태에서 `PUT /user/me/preferences`의 `has_seen_game_tutorial`, `has_seen_minigame_tutorial`로 서버에 저장함.
- 개발자 패널의 졸업 화면 미리보기는 서버 상태를 변경하지 않는 로컬 preview임.
- 코인 증가/감소, XP 증가/감소, 학년 강제 변경, 식사/퀴즈 제한 토글, 유저 이름/학번 디버그 값 변경은 로컬 테스트 상태만 변경함.

### 이유

- 현재 OpenAPI에는 코인 직접 수정, XP 절대값 설정/감소, 학년 강제 설정을 위한 개발자 전용 endpoint가 없음.
- `/characters/me/xp`는 XP 추가 endpoint라서 절대값 설정/감소/학년 강제 변경과 의미가 다름.
- `/user/me`는 일반 계정 정보 수정 endpoint라서 개발자 패널의 표시용 이름/학번 디버그 조작과 섞지 않음.

### 필요한 조치

- 개발자 패널 조작까지 서버에 완전히 반영하려면 백엔드에 admin/debug 전용 endpoint가 필요함.
- 권장 계약 예: 현재 유저의 `coin`, `xp_point`, `stage`, `character_state`, meal/quiz debug flags를 명시적으로 patch할 수 있는 authenticated admin-only API.

## P0. `/characters/me` 403 / fresh user character

### 증상

- 기존 로그: `서버 캐릭터 동기화 실패 [AxiosError: Request failed with status code 403]`
- 프론트는 로그인 상태에서 `/characters/me`를 우선 호출하고 legacy character list fallback을 사용하지 않음.

### 영향

- 신규 유저나 character row가 없는 유저에서 이름/캐릭터 동기화가 실패할 수 있음.
- 서버 캐릭터 상태가 앱에 반영되지 않음.

### 필요한 조치

- 프론트 조치 완료: `/characters/me` 실패 시 기존 character list/create fallback 경로로 진행하도록 보강함.
- `/characters/me`는 로그인한 모든 유저에게 200을 반환해야 함.
- character row가 없으면 lazy create 하거나, 명확한 404/409 정책을 정하고 프론트가 그 정책으로 생성하도록 해야 함.
- 403은 권한 오류로 해석되므로 "캐릭터 없음" 응답으로 부적절함.

## P1. Character detail fields are only partially connected

### 현재 프론트 동작

- `utils/syncServerCharacter.ts`는 `/characters/me`에서 `character_name`, `character_id`만 실질 반영함.
- `stage`, `state`, `xp_point`, `pending_evolution`은 거의 사용하지 않음.
- 진화 완료 후에도 `/characters/me/evolve/confirm`을 호출하지 않음.

### 영향

- 서버가 캐릭터 상태/진화 pending 상태를 authoritative로 관리한다면 프론트와 서버가 어긋날 수 있음.
- 현재 진화 컷신은 로컬 `pendingEvolution` 중심으로 처리됨.

### 필요한 조치

- 프론트 조치 완료: `/characters/me`의 `state`, `xp_point`를 로컬 상태에 반영함.
- 프론트 조치 완료: 로컬 진화 컷신 완료 시 `/characters/me/evolve/confirm`을 호출함.
- XP source of truth를 `UserOut.xp_point`로 둘지 `CharacterMeOut.xp_point`로 둘지 고정.
- 서버 `pending_evolution`을 프론트 `pendingEvolution`으로 매핑할지 결정.

## P1. Character costume equip is local-only

### 현재 프론트 동작

- 마이룸 옷장 UI에서 부 코스튬을 선택할 수 있음.
- 선택 가능 key는 `default`, `skin_truth`, `skin_peace`, `skin_creation`.
- non-default 코스튬은 업적 보상 `reward_item_key`로 소유 상태가 확인된 경우만 선택 가능.
- 선택한 값은 `useGameStore.characterCostumeKey`에 로컬 persist로만 저장됨.

### 현재 명세와 API 공백

- 2026-06-07 기준 로컬 `docs/api/openapi.json`과 원격 Swagger OpenAPI 모두에서 코스튬/스킨 장착 상태 필드를 찾지 못함.
- 로컬/원격 OpenAPI 기준 `CharacterMeUpdate`는 `character_name`, `state`만 받음.
- `CharacterMeOut`, `/app/bootstrap.character`, `RoomCharacterOut`에 장착 코스튬/스킨 필드가 없음.
- `state`는 캐릭터 행동 상태(`basic1`, `hungry`, `eating` 등)라 코스튬 저장용으로 쓰면 안 됨.

### 영향

- 같은 계정으로 다른 기기에서 로그인하면 선택한 코스튬이 복구되지 않음.
- 친구 방에서 상대방이 장착한 코스튬을 보여주는 것도 현재 서버 응답만으로는 불가능함.

### 필요한 조치

- 백엔드 계약 필요: `equipped_skin_key` 필드를 `CharacterMeOut` 및 `/app/bootstrap.character`에 추가.
- 백엔드 계약 필요: `PUT /characters/me` 또는 별도 `PUT /characters/me/costume`로 `equipped_skin_key` 저장 지원.
- 허용값은 `default`, `skin_truth`, `skin_peace`, `skin_creation`으로 제한.
- non-default는 해당 업적 스킨 소유 여부를 서버에서 검증.
- 친구 방 렌더링에 필요하면 `RoomCharacterOut`에도 동일 필드 추가.
- 프론트 후속 조치: 서버 필드가 생기면 `syncServerCharacter`와 옷장 확인 버튼에서 저장/동기화 연결.

## P1. Graduation summary statistics are local-only

### 현재 프론트 동작

- 4학년 XP를 모두 채워 졸업 상태로 전환되면 `GraduationOverlay`를 표시함.
- 졸업 화면은 `assets/images/graduate-background.png`, `assets/characters/graduated-boo.png`, `assets/musics/bgm/graduation.mp3`를 사용함.
- 졸업 BGM은 다른 BGM 밸런스 대비 `graduation` track volume scale 2로 재생함.
- 플레이 일수는 서버/로컬 유저 생성일(`created_at`) 기준으로 프론트에서 계산함.
- 학식 횟수, 퀴즈 정답 수, 미니게임 최고 점수는 현재 로컬 persisted 통계로 표시함.
- 졸업 전환 시 일반 진화 완료 효과음은 재생하지 않아 졸업 BGM/연출과 겹치지 않게 처리함.

### 현재 명세와 API 공백

- 현재 OpenAPI에는 졸업 리포트 전용 endpoint나 누적 통계 요약 field가 없음.
- 서버가 `feed_count`, `quiz_correct_count`, 게임별 best score를 한 번에 내려주는 계약이 없음.
- 졸업 완료 시점(`graduated_at`)을 서버에 명시적으로 저장하는 계약도 없음.

### 영향

- 같은 계정으로 다른 기기에서 졸업 화면을 보면 로컬 통계가 다를 수 있음.
- 게스트는 로컬 저장이 유일한 기준이므로 정상 정책이지만, 로그인 유저는 서버 통계와 화면 통계가 어긋날 수 있음.
- 졸업 리포트를 업적/감사용 기준으로 쓰려면 현재 로컬 통계만으로는 부족함.

### 필요한 조치

- 백엔드 계약 필요: 졸업 리포트 summary API 또는 `/app/bootstrap` 확장.
- 권장 필드: `created_at`, `graduated_at`, `feed_count`, `quiz_attempt_count`, `quiz_correct_count`, `minigame_best_scores`.
- `minigame_best_scores`는 `game_type`과 `mode` 기준으로 구분되어야 함.
- 졸업 상태를 서버가 authoritative하게 관리한다면 `/characters/me/evolve/confirm` 또는 별도 graduation endpoint에서 졸업 확정과 `graduated_at` 저장을 처리.

## P1. Guest mode is intentionally local-only

### 현재 프론트 동작

- 게스트 시작 시 `accessToken`, `refreshToken`, axios Authorization header를 제거함.
- 게스트 진행도는 `guestGameSnapshot`에 별도로 저장하고, 게스트 모드 종료 후 다시 시작해도 snapshot을 복원함.
- 게스트 기본값은 학번 `00000000`, 이름 `외대생`, 닉네임 `부`.
- 게스트에서는 비밀번호 변경 UI가 없고, 설정에서 학번/이름/닉네임만 로컬로 수정함.
- 게스트에서는 친구 관리, 친구 패널, 친구 방, 방명록 작성, 친구 랭킹 fallback을 사용하지 않음.
- 게스트 시작/복원/초기화 시 로컬 `first_login` 업적을 즉시 달성 처리함.

### 영향

- 게스트 데이터는 서버 계정과 병합되지 않음.
- 게스트 상태와 로그인 유저 상태가 섞이지 않도록 모든 서버 API 호출은 `accessToken`과 `isGuestMode` 기준으로 분기해야 함.

### 필요한 조치

- 현재 정책 유지 시 백엔드 변경 불필요.
- 게스트 진행도를 회원가입/로그인 후 계정으로 이관해야 한다면 별도 import/merge API가 필요함.
- merge API가 생기기 전까지 게스트 통계, 업적, 코인, XP, 마이룸, 코스튬은 로컬 전용으로 문서화함.

## P2. Mini-game restart state hardening

### 현재 프론트 동작

- 자유투 재시작 시 이전 shot animation callback이 새 라운드를 실패 처리하지 않도록 `roundRunIdRef`로 stale callback을 차단함.
- 자유투 재시작은 round, target, countdown, result submit flag, alert, marker, ball, hoop animation을 초기화함.
- 부 잡기와 전공책 받기도 재시작 시 target, feedback, reward flag, result submit flag, alert, score, time, item state를 초기화함.

### API 관점

- 로그인 상태의 새 플레이는 `/economy/minigame/start`로 새 세션을 시작하고, 성공 보상은 `/economy/minigame/reward`, 결과 저장은 `/minigames/results`로 분리함.
- 게스트는 로컬 하트/보상/결과 통계만 사용함.

### 필요한 조치

- 서버는 같은 `play_session_id`에 대해 보상 중복 지급이 일어나지 않도록 idempotency를 보장해야 함.
- `/minigames/results` 중복 저장 정책도 `play_session_id` 기준으로 명확히 해야 함.
- 재시작은 새 세션이므로 이전 세션의 reward/result callback이 늦게 도착해도 새 세션 결과를 덮지 않도록 서버 응답에 session id가 유지되어야 함.

## P1. App bootstrap/config endpoints exist but are not wired

### 현재 상태

- `utils/serverApi.ts`에 `getAppConfig`, `getAppBootstrap`이 구현되어 있음.
- `getAppBootstrap`은 현재 `syncServerUserStats` 초기 동기화에서 우선 사용함.
- `getAppConfig`는 아직 런타임 정책 source로 연결하지 않음.
- public `/app/config`는 정상 응답함.

```json
{
  "quiz": { "daily_limit": 3, "cooldown_hours": 3, "correct_xp": 30, "incorrect_xp": -10, "reward_coin": 10 },
  "minigame": { "max_heart": 5, "heart_recovery_minutes": 30, "reward_coin": 3, "heart_cost": 1 },
  "school_food": { "feed_xp": 50, "feed_coin_cost": 4 }
}
```

### 영향

- 현재는 프론트 상수와 서버 설정이 우연히 맞아야 함.
- bootstrap 실패 시에는 `/user/me`, `/economy/status`, `/preferences`, `/characters/me/meal-health`, `/achievements/me`, `/characters/me`, `/rooms/me`, `/shop/items` 개별 호출로 fallback함.
- 서버 응답이 느리거나 일부 실패하면 fallback 경로에서 초기 동기화가 부분 실패할 수 있음.

### 필요한 조치

- 프론트 조치 완료: `syncServerUserStats`에서 `/app/bootstrap`을 우선 사용하고 실패 시 기존 개별 API 호출로 fallback함.
- 단기: config 값이 바뀔 가능성이 낮으면 현 상태 유지 가능.
- 중기: `/app/config`를 quiz/minigame/meal 보상/제한 정책의 source로 연결.
- 장기: `/app/config`를 적용할 런타임 설정 store/schema를 별도 설계.

## P1. Mini-game reward contract is narrower than backend checklist

### 현재 명세와 프론트 동작

- `MiniGameRewardRequest` required field는 `play_session_id`, `game_type`, `score`.
- optional은 `mode`.
- 프론트는 `/economy/minigame/reward`에 `success`를 보내지 않음.
- 성공/실패 저장은 별도로 `/minigames/results`에 `success`, `ended_reason`, `play_session_id`를 보냄.

### 영향

- 백엔드가 reward API에서 success를 직접 검증하고 싶다면 현재 명세가 부족함.
- 현재 계약에서는 백엔드가 `game_type + mode + score + session`으로 보상 가능 여부를 판정해야 함.

### 필요한 조치

- 백엔드가 현재 OpenAPI 계약대로 score 기반 검증을 할지, `success`를 reward request에 추가할지 결정.
- 추가한다면 OpenAPI와 `utils/serverApi.ts` 타입을 같이 변경.

## P1. Room unequip endpoint is not connected

### 현재 상태

- OpenAPI에는 `DELETE /rooms/me/equip/{slot}`이 있음.
- 프론트에는 해당 API adapter/function과 UI flow가 없음.

### 영향

- 현재 UI가 "다른 아이템 장착"만 지원한다면 문제 없음.
- "슬롯 비우기" 기능이 필요하면 미연결 상태.

### 필요한 조치

- 프론트 조치 완료: `unequipRoomItem(slot)` adapter를 추가함.
- 기획상 슬롯 비우기가 필요하면 `unequipRoomItem(slot)` adapter와 UI command 추가.
- 필요 없다면 endpoint는 미사용으로 둬도 됨.

## P2. Implemented but currently unused serverApi functions

아래 함수는 `utils/serverApi.ts`에 있으나 현재 기능 화면에서 직접 사용되지 않거나 legacy/보조 용도임.

- `getAppConfig`
- `getAppBootstrap`은 `syncServerUserStats`에서 사용
- `listAchievements`
- `getSchoolFood`
- `deleteCharacter`
- `addMyCharacterXp`
- `confirmMyCharacterEvolution`은 메인 진화 컷신 완료 시 사용
- `addServerFriend` 기존 direct add API. 현재 UI는 friend request API 사용
- `playMiniGameEconomy` legacy API. 현재 start/reward flow 사용
- `listMyMiniGameResults`
- `getMyMiniGameRanking` 개인 요약용. 게임/모드별 랭킹에는 부적합

대부분은 legacy/admin/향후 개선용이라 즉시 문제는 아님. 다만 `getAppConfig`는 서버 정책을 런타임 source로 쓰려면 별도 store/schema 설계가 필요함.

## Public endpoint checks

- `/openapi.json`: 로컬 문서와 동일
- `/app/config`: 정상 응답
- `/shop/item-types`: 응답 type이 프론트 기대값과 다름 (`desk`, `room`)
- `/school-foods/today`: 정상 응답. 주말에는 `meal_slot: "all"`로 내려옴
- `/achievements/`: 정상 응답. condition/event key는 프론트와 대체로 일치
- `/school-foods/?type=lunch`: 인증 필요
- `/shop/items`: 인증 필요
