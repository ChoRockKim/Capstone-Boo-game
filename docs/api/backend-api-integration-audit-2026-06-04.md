# Backend API Integration Audit - 2026-06-04

이 문서는 프론트에서 서버 API 전환 중 확인된 장애 지점과 백엔드 확인 요청 사항을 도메인별로 정리한 백엔드 전달용 체크리스트입니다.

## 1. 프론트 클라이언트 구조

### 1.1 기본 아키텍처

- 앱: Expo SDK 56 / React Native / TypeScript
- 로컬 상태: `stores/useGameStore.ts`의 Zustand persist
- 서버 상태: TanStack Query
- API adapter: `utils/serverApi.ts`
- 서버 -> 로컬 매핑:
  - snake_case 응답은 `utils/serverApi.ts` 타입과 adapter에서 처리
  - UI/store에는 가능하면 로컬 camelCase와 로컬 asset id만 전달
- 서버 동기화:
  - 로그인 직후와 화면 focus 시 `utils/syncServerUserStats.ts`가 `/user/me`, `/economy/status`, `/characters/me`, `/rooms/me`, `/shop/items`, `/achievements/me` 등을 동기화
  - 일부 화면은 자체 TanStack Query로 최신 서버 상태를 다시 조회

### 1.2 인증/토큰 처리

- 로그인 응답의 `access_token`, `refresh_token`을 Zustand에 저장
- `setBooApiAccessToken()`이 axios default Authorization header를 설정
- `booApiClient` response interceptor가 401을 받으면 `/user/refresh`로 access token 재발급 후 1회 재시도
- 인증이 필요한 API는 함수 인자로 받은 `accessToken`도 직접 `Authorization: Bearer ...` 헤더에 전달

### 1.3 프론트 fallback 정책

- 비로그인 상태에서는 로컬 더미/로컬 store fallback 사용 가능
- 로그인 상태에서는 서버 데이터가 없을 때 더미를 보여주면 서버/로컬이 엇갈리므로 대부분 fallback을 차단
- 따라서 로그인 상태에서 서버 catalog, quiz answer, room view 같은 핵심 데이터가 비면 UI가 의도적으로 실패를 표시함

## 2. 현재 확인된 실제 장애 로그

### 2.1 마이룸 상점 구매 불가

프론트 로그:

```txt
WARN [RoomShop] shop items loaded {"count": 0, "items": []}
WARN [RoomShop] shop items refetch result {"count": 0, "error": null, "items": [], "status": "success"}
WARN [RoomShop] purchase item mapping failed {
  "option": {"id": "wallpaper-green", "label": "초록 벽지"},
  "selectedCategory": "wallpaper",
  "serverShopItems": {"count": 0, "matchingTypeItems": []}
}
```

판단:

- `/shop/items`가 200 success로 빈 배열을 반환함
- 프론트 구매 API는 `/shop/items/{item_id}/purchase`를 호출해야 하므로 `item_id`가 필요함
- 서버 catalog가 비어 있으면 프론트는 `wallpaper-green` 같은 로컬 선택지를 서버 `item_id`로 매핑할 수 없음
- 현재 가구 구매 불가는 프론트 버튼 문제가 아니라 서버 shop catalog 부재가 1차 원인

### 2.2 캐릭터 동기화 403

프론트 로그:

```txt
WARN 서버 캐릭터 동기화 실패 [AxiosError: Request failed with status code 403]
```

판단:

- 로그인 상태에서 `/characters/me` 또는 관련 캐릭터 API가 403을 반환한 것으로 보임
- 신규 유저의 캐릭터 row 미생성, user ownership 검증 오류, 토큰 subject/user_id 매칭 오류 가능성이 큼
- 프론트는 로그인 상태에서 legacy character list fallback을 사용하지 않는 방향으로 정리되어 있으므로 `/characters/me`는 fresh user도 항상 200이어야 함

### 2.3 퀴즈 즉시 채점 UX와 API 계약 불일치 가능성

프론트 요구:

- 서버에서 문제를 내려받을 때 정답도 같이 내려받고, 클라이언트가 즉시 채점
- 이후 `/quizzes/submit`은 서버 동기화/검증/보상 확정 역할

필요 계약:

- `/quizzes/next`
- `/quizzes/available`

위 응답에 `answer`가 반드시 포함되어야 함.

현재 TS 타입상 `answer?: string`이지만, UX 요구상 로그인 상태에서는 사실상 필수 필드임. 정답이 누락되면 프론트는 즉시 채점할 수 없어 다시 "채점 중" 상태로 돌아갈 수밖에 없음.

## 3. 최우선 백엔드 수정 체크리스트

### P0. Shop catalog 비어 있음

- [ ] `/shop/items`가 로그인 유저에게 전체 구매 가능 catalog를 반환해야 함
- [ ] 응답은 owned item만이 아니라 미구매 item도 포함해야 함
- [ ] 각 item에 `item_id`, `item_key`, `item_type`, `name`, `price`, `owned`, `equipped`, `is_default` 포함
- [ ] `item_key`는 프론트 로컬 asset id와 1:1로 맞아야 함
- [ ] 기본 지급 wallpaper/furniture도 catalog에 포함되어야 함
- [ ] 신규 유저 DB에도 default owned item 또는 default room state가 있어야 함

필수 `item_type`:

- `wallpaper`
- `bed`
- `closet`
- `table`

예시 `item_key`:

- `wallpaper-green`
- `wallpaper-pink`
- `bed-maple`
- `closet-oak`
- `table-maple-blue`

해결 방향:

- 백엔드 DB seed script로 shop master catalog를 보장
- `/shop/items`는 master catalog + user owned/equipped 상태를 left join해서 반환
- item label/name 매칭보다 `item_key` 매칭을 공식 계약으로 고정

### P0. `/characters/me` 403

- [ ] 로그인한 모든 유저가 `/characters/me`를 200으로 조회할 수 있어야 함
- [ ] 신규 회원가입/첫 로그인 시 character row 자동 생성 필요
- [ ] user ownership 검증이 access token의 user_id와 정확히 매칭되는지 확인
- [ ] 캐릭터가 없으면 403이 아니라 생성 후 200 또는 명확한 404/409 정책 필요
- [ ] 응답에는 `xp_point`, `grade`, `state`, `nickname/name` 등 프론트 동기화에 필요한 필드 포함

해결 방향:

- `/characters/me`는 "현재 사용자 대표 캐릭터" 조회 API로 보고, 존재하지 않으면 lazy create 하는 편이 가장 명확함

### P0. 퀴즈 정답 필드 계약

- [ ] `/quizzes/next` 응답에 `answer` 포함
- [ ] `/quizzes/available` 응답에도 `answer` 포함
- [ ] `/quizzes/submit`은 `correct`, `correct_answer`, `awarded_points`, `awarded_coin`, `xp_point`, `coin`, `unlocked_achievements` 반환
- [ ] 서버는 daily limit/cooldown/중복 제출을 최종 검증
- [ ] 클라이언트 채점 결과와 서버 결과가 다를 경우 서버 결과를 최종 authoritative로 사용

해결 방향:

- 문제 다운로드는 "플레이 가능한 문제 + 정답" 계약
- 제출 API는 "결과 기록 + 보상 확정 + 남은 횟수 갱신" 계약

## 4. 도메인별 상세 점검표

## 4.1 Auth / User / Preferences

현재 프론트 호출:

- `POST /user/signup/email`
- `POST /user/signup/verify`
- `POST /user/`
- `POST /user/login`
- `POST /user/refresh`
- `POST /user/logout`
- `GET /user/me`
- `PUT /user/me`
- `DELETE /user/me`
- `GET /user/me/preferences`
- `PUT /user/me/preferences`
- `GET /economy/status`
- `GET /app/config`
- `GET /app/bootstrap`

체크리스트:

- [ ] `/user/login`은 `access_token`, `refresh_token`, `token_type`, `unlocked_achievements` 반환
- [ ] `/user/refresh`는 refresh token으로 새 access token 발급
- [ ] `/user/me`는 `user_id`, `student_id`, `nickname`, `name`, `email`, `coin`, `heart`, `xp_point`, `heart_updated_at` 반환
- [ ] `/user/me/preferences`는 신규 유저도 200 + 기본값 반환
- [ ] preferences 미존재가 500/403이 되면 안 됨
- [ ] `/app/bootstrap`이 있다면 user/economy/preferences/character/room/shop/achievements를 한 번에 내려주는 방향 권장

위험 요소:

- 앱 시작 자동 로그인에서 여러 sync API가 직렬로 걸리면 진입이 느려짐
- bootstrap이 없거나 불완전하면 프론트가 여러 API를 병렬 호출해야 하므로 장애 지점이 늘어남

## 4.2 Character / XP / Meal Health

현재 프론트 호출:

- `GET /characters/me`
- `PUT /characters/me`
- `POST /characters/me/xp`
- `POST /characters/me/evolve/confirm`
- `GET /characters/me/meal-health`
- `POST /characters/me/meal-penalty/apply`

체크리스트:

- [ ] `/characters/me`는 fresh user도 항상 정상 응답
- [ ] `/characters/me/meal-health`는 데이터가 없으면 safe default 반환
- [ ] `/characters/me/meal-penalty/apply`는 같은 끼니/날짜에 중복 적용되지 않도록 idempotent 처리
- [ ] XP 변경 API는 최종 `xp_point`, 진화 여부, `unlocked_achievements` 반환
- [ ] character state/grade와 user `xp_point`가 서로 다른 source로 어긋나지 않게 한쪽을 authoritative로 고정

해결 방향:

- XP의 source of truth는 서버 `xp_point`
- grade/progress는 서버가 내려주거나 프론트가 `xp_point`로 계산하되, 둘 중 하나로 일관화

### 4.2.1 Character Costume / Equipped Skin

현재 프론트 상태:

- 마이룸 옷장 UI에서 부 코스튬을 2x2 선택 UI로 표시함.
- 선택 가능 key는 `default`, `skin_truth`, `skin_peace`, `skin_creation`.
- `skin_truth`, `skin_peace`, `skin_creation` 보유 여부는 업적 보상 `reward_item_key`로 받은 `ownedAchievementSkins` 기준.
- 장착 상태 `characterCostumeKey`는 현재 프론트 로컬 persist에만 저장됨.

현재 API 공백:

- 2026-06-07 기준 로컬 `docs/api/openapi.json`과 원격 Swagger OpenAPI 모두에서 코스튬/스킨 장착 상태 필드를 찾지 못함.
- `CharacterMeUpdate`는 `character_name`, `state`만 받음.
- `CharacterMeOut`, `/app/bootstrap.character`, `RoomCharacterOut`에 장착 코스튬/스킨 필드가 없음.
- `state`는 `basic1`, `hungry`, `eating` 같은 캐릭터 행동/상태 값이라 코스튬 저장에 쓰면 안 됨.

백엔드 요청:

- [ ] `CharacterMeOut` 및 `/app/bootstrap.character`에 장착 코스튬 필드 추가
- [ ] 권장 필드명: `equipped_skin_key`
- [ ] 허용값: `default`, `skin_truth`, `skin_peace`, `skin_creation`
- [ ] `PUT /characters/me`의 `CharacterMeUpdate` 또는 별도 `PUT /characters/me/costume`로 `equipped_skin_key` 저장 지원
- [ ] `default`는 항상 허용하고, non-default는 유저가 해당 업적 스킨을 소유한 경우만 허용
- [ ] `null` 또는 미지정 값은 `default`로 처리
- [ ] 친구 방에서 상대방 코스튬까지 보여줄 필요가 있으면 `RoomCharacterOut`에도 동일 필드 포함

## 4.3 Achievements

현재 프론트 호출:

- `GET /achievements/`
- `GET /achievements/me`
- `POST /achievements/events`

주요 프론트 event/condition key:

- `first_login`
- `room_first_enter`
- `campus_first_visit`
- `feed_count`
- `quiz_correct_count`
- `friend_count`
- `minigame_play_count`
- `room_item_equip_count`
- `achievement_completed_count`

체크리스트:

- [ ] `/achievements/me`는 모든 achievement progress를 반환
- [ ] `achievement_key`, `condition_type`, `progress_value`, `target_value`, `completed`, `claimed`, `reward_type`, `reward_value`, `reward_item_key`, `sort_order` 포함
- [ ] `/achievements/events`는 동일 event 반복 호출에 대해 중복 보상을 지급하지 않아야 함
- [ ] event 처리 결과로 `coin`, `xp_point`, `unlocked_achievements` 반환
- [ ] `room_first_enter` event가 마이룸 첫 진입 업적과 정확히 연결되어야 함

현재 의심 지점:

- "마이룸 진입" 업적 미달성은 event key 불일치, `/achievements/events` 처리 누락, 또는 `/achievements/me` progress 반영 누락 가능성이 큼

해결 방향:

- 백엔드 achievement master의 `condition_type`과 프론트 event key를 동일 문자열로 고정
- 반복 event는 progress만 보정하고 reward는 최초 completion 때만 지급

## 4.4 School Foods

현재 프론트 호출:

- `GET /school-foods/today`
- `GET /school-foods/`
- `GET /school-foods/{school_food_id}`
- `GET /school-foods/feed-status`
- `POST /school-foods/feed`

체크리스트:

- [ ] `/school-foods/today`는 public 또는 auth optional로 안정 응답
- [ ] 응답 구조: `date`, `server_time`, `sections[{ meal_slot, items[] }]`
- [ ] 각 food item은 `id`, `name`, `type`, `price`, `image` 등 포함
- [ ] `/school-foods/feed-status`는 `current_slot`, `can_feed_now`, `fed_slots`, `next_slot_at` 반환
- [ ] `/school-foods/feed`는 현재 slot/food id를 검증하고 최종 `coin`, `xp_point`, `meal_slot`, `unlocked_achievements` 반환
- [ ] 서버 오늘 학식이 비어 있을 때 `/school-foods/?type=...` fallback 목록이 있어야 함

해결 방향:

- `feed-status`를 로그인 상태의 단일 기준으로 사용
- 프론트 로컬 식사 제한값은 비로그인 fallback에만 사용

## 4.5 Quiz

현재 프론트 호출:

- `GET /quizzes/play-status`
- `GET /quizzes/next`
- `GET /quizzes/available`
- `POST /quizzes/submit`

체크리스트:

- [ ] `/quizzes/play-status`는 daily limit, remaining count, cooldown, next available time의 source of truth
- [ ] `/quizzes/next`는 단일 문제와 `answer` 반환
- [ ] `/quizzes/available`도 fallback 후보로 `answer` 포함
- [ ] `/quizzes/submit`은 서버 최종 결과와 보상 반영 후 최신 `coin`, `xp_point` 반환
- [ ] 이미 푼 문제 재제출, cooldown 중 제출, 하루 제한 초과 제출은 명확한 status/detail 반환

해결 방향:

- 클라이언트는 answer로 즉시 UX 처리
- 서버는 submit에서 결과를 다시 검증하고 authoritative 상태만 확정

## 4.6 Friends

현재 프론트 호출:

- `GET /friends/`
- `GET /friends/search/{student_id}`
- `POST /friends/`
- `DELETE /friends/{friend_id}`
- `GET /friends/requests`
- `POST /friends/requests`
- `POST /friends/requests/{request_id}/accept`
- `DELETE /friends/requests/{request_id}`

체크리스트:

- [ ] `/friends/`의 `friend_id`는 친구 user id가 아니라 friendship relation id여야 함
- [ ] 응답의 `friend`에는 `user_id`, `student_id`, `nickname`, `image` 포함
- [ ] `/friends/search/{student_id}`는 자기 자신 검색, 없는 학번, 이미 친구인 유저를 구분 가능한 에러로 반환
- [ ] 친구 요청 생성은 self/duplicate/already-friend/pending request를 서버에서 차단
- [ ] accept/reject는 idempotent하거나 명확한 409/404를 반환
- [ ] 친구 추가 업적이 있으면 accept 또는 request 성공 중 어느 시점에 적용할지 정책 고정

위험 요소:

- 프론트는 로그인 상태에서 dummy friend를 표시하지 않음
- 서버 친구 목록이 비면 실제로 친구가 없는 것으로 표시됨

## 4.7 Room / Shop / Guestbook

현재 프론트 호출:

- `GET /shop/item-types`
- `GET /shop/items`
- `POST /shop/items/{item_id}/purchase`
- `GET /rooms/me`
- `PUT /rooms/me/equip`
- `GET /rooms/{user_id}`
- `GET /rooms/{user_id}/guestbook`
- `POST /rooms/{user_id}/guestbook`
- `PUT /rooms/guestbook/{entry_id}`
- `DELETE /rooms/guestbook/{entry_id}`

체크리스트:

- [ ] `/shop/items`는 non-empty catalog 반환
- [ ] `item_key`는 프론트 로컬 asset id와 정확히 일치
- [ ] `item_type`은 `wallpaper | bed | closet | table` 중 하나
- [ ] `/shop/items/{item_id}/purchase`는 보유 여부/코인 부족을 검증하고 `coin`, `item` 반환
- [ ] 구매 성공 후 item은 owned true
- [ ] `/rooms/me/equip`은 item ownership과 slot compatibility를 검증
- [ ] `/rooms/me/equip` 응답은 최신 `RoomView`
- [ ] `/rooms/me`와 `/rooms/{user_id}`는 wallpaper/equipped_items/owner/character를 포함
- [ ] 방명록 page는 `items`, `next_cursor` 구조로 반환
- [ ] 방명록 작성/수정/삭제 권한 정책이 명확해야 함

해결 방향:

- Room rendering은 프론트 로컬 asset registry가 담당
- 서버는 `item_key`와 slot 상태를 안정적으로 제공
- name/image 문자열 매칭은 fallback으로만 사용하고 공식 계약은 `item_key`

## 4.8 MiniGame / Economy / Rankings

현재 프론트 호출:

- `GET /economy/status`
- `POST /economy/minigame/start`
- `POST /economy/minigame/reward`
- `POST /economy/minigame/play` legacy
- `POST /minigames/results`
- `GET /minigames/results/me`
- `GET /minigames/rankings`
- `GET /minigames/rankings/friends`
- `GET /minigames/ranking/me`

현재 프론트 flow:

1. 플레이 화면 진입 시 `/economy/minigame/start`
2. 서버가 heart 차감 + `play_session_id` 반환
3. 게임 종료 시 `/minigames/results`로 score/result 기록
4. 성공 보상은 `/economy/minigame/reward`
5. ranking query invalidation 후 랭킹 재조회

체크리스트:

- [ ] `/economy/status`는 `coin`, `heart`, `max_heart`, `heart_updated_at`, `next_heart_at` 반환
- [ ] `/economy/minigame/start`는 heart 부족 시 명확한 에러 반환
- [ ] start 성공 시 최신 heart와 `play_session_id` 반환
- [ ] `/economy/minigame/reward`는 `play_session_id`, `game_type`, `mode`, `score`, `success`를 검증
- [ ] reward는 중복 호출 시 중복 지급되지 않아야 함
- [ ] reward 성공 시 `coin`, `awarded_coin`, `unlocked_achievements` 반환
- [ ] `/minigames/results`는 `game_type`, `mode`, `score`, `location`, `success`, `ended_reason`, `play_time_seconds`, `play_session_id` 저장
- [ ] `/minigames/rankings`는 `game_type`, `mode`, `limit` query를 반영
- [ ] `/minigames/rankings/friends`도 같은 filter를 반영
- [ ] `/minigames/ranking/me`가 game/mode filter를 지원하지 않는다면 프론트는 모드별 랭킹에는 사용하지 않음

해결 방향:

- start/reward/session을 하나의 서버 transaction policy로 고정
- ranking은 반드시 `game_type + mode` 기준으로 분리

## 4.9 Graduation Summary

현재 프론트 동작:

- 4학년 XP를 모두 채워 졸업 상태로 전환되면 졸업 화면을 표시
- 플레이 일수는 유저 생성일(`created_at`) 기준으로 프론트에서 계산
- 학식 횟수, 퀴즈 정답 수, 미니게임 최고 점수는 로컬 persisted 통계로 표시
- 졸업 전환 시 일반 진화 완료 효과음은 재생하지 않고 졸업 BGM만 사용

현재 API 공백:

- 졸업 리포트 전용 endpoint 없음
- 누적 학식/퀴즈/미니게임 통계 summary field 없음
- 졸업 완료 시점(`graduated_at`) 저장 계약 없음

체크리스트:

- [ ] 로그인 유저의 `created_at`이 `/user/me` 또는 `/app/bootstrap`에서 안정적으로 반환됨
- [ ] 서버 기준 졸업 리포트를 원하면 `feed_count`, `quiz_attempt_count`, `quiz_correct_count`, `minigame_best_scores` 제공
- [ ] `minigame_best_scores`는 `game_type`, `mode` 기준으로 구분
- [ ] 졸업 확정 시점이 서버 권위 상태라면 `graduated_at` 저장
- [ ] 졸업 상태를 서버가 관리한다면 `/characters/me/evolve/confirm` 또는 별도 graduation endpoint의 역할 명확화

해결 방향:

- 단기: 졸업 화면 통계는 로컬 표시값으로 유지
- 중기: `/app/bootstrap` 또는 별도 `/graduation/summary` 응답으로 졸업 리포트 통계 제공

## 4.10 Guest Mode

현재 프론트 동작:

- 게스트 시작 시 access/refresh token과 axios Authorization header 제거
- 게스트 진행도는 `guestGameSnapshot`에 저장하고 다음 게스트 시작 시 복원
- 게스트 기본값은 학번 `00000000`, 이름 `외대생`, 닉네임 `부`
- 게스트에서는 비밀번호 변경, 친구 관리, 친구 패널, 친구 방, 방명록 작성, 친구 랭킹 fallback을 사용하지 않음
- 게스트 시작/복원/초기화 시 로컬 `first_login` 업적을 즉시 달성 처리

현재 API 공백:

- 게스트 진행도와 서버 계정 진행도를 병합하는 API 없음
- 게스트 모드는 현재 로컬 전용 정책이므로 공백 자체가 장애는 아님

체크리스트:

- [ ] 게스트 상태에서는 인증 API가 필요한 친구/방명록/친구 랭킹 endpoint를 호출하지 않음
- [ ] 게스트 진행도는 서버 계정 상태와 자동 병합하지 않음
- [ ] 추후 게스트 -> 회원 전환 이관이 필요하면 import/merge API 계약 별도 정의

해결 방향:

- 현재는 로컬 전용 정책 유지
- 계정 이관 요구가 생길 때만 서버 merge API 설계

## 4.11 Developer Panel Server Sync

현재 서버 반영 항목:

- 부 이름: `PUT /characters/me.character_name`
- 부 상태: `PUT /characters/me.state`
- 튜토리얼 조회 초기화: `PUT /user/me/preferences`

현재 로컬 전용 항목:

- 코인 직접 증가/감소
- XP 직접 증가/감소
- 학년 강제 변경
- 식사/퀴즈 제한 토글
- 표시용 유저 이름/학번 디버그 값 변경
- 졸업 화면 미리보기

필요한 백엔드 계약:

- [ ] 개발자/관리자 전용 authenticated debug API
- [ ] 현재 유저의 `coin`, `xp_point`, `stage`, `character_state`를 명시적으로 patch 가능
- [ ] meal/quiz debug flags를 운영 데이터와 분리해 테스트 가능
- [ ] 일반 사용자 API와 debug API 권한을 분리

## 5. 백엔드 acceptance test 목록

### 5.1 신규 유저 초기 동기화

- [ ] 회원가입/로그인 직후 `/user/me` 200
- [ ] `/economy/status` 200
- [ ] `/characters/me` 200
- [ ] `/characters/me/meal-health` 200
- [ ] `/achievements/me` 200
- [ ] `/rooms/me` 200
- [ ] `/shop/items` 200 and non-empty

### 5.2 마이룸 구매/장착

- [ ] `/shop/items`에 `wallpaper-green` 존재
- [ ] 해당 item의 `item_id`로 `/shop/items/{item_id}/purchase` 성공
- [ ] purchase 응답의 `coin`이 차감된 최신 값
- [ ] purchase 응답 item이 `owned: true`
- [ ] `/rooms/me/equip`으로 `wallpaper-green` 장착 성공
- [ ] 이후 `/rooms/me`에 `wallpaper.item_key = "wallpaper-green"` 반영
- [ ] 이후 `/shop/items`에 해당 item `owned: true`, `equipped: true`

### 5.3 퀴즈

- [ ] `/quizzes/play-status`에서 `remaining_today > 0`
- [ ] `/quizzes/next`가 `answer` 포함
- [ ] 클라이언트가 answer로 즉시 정답/오답 표시 가능
- [ ] `/quizzes/submit`이 최종 보상과 최신 `coin`, `xp_point` 반환
- [ ] submit 후 `/quizzes/play-status`의 remaining/cooldown 갱신

### 5.4 미니게임

- [ ] `/economy/minigame/start`가 heart 1 차감
- [ ] 응답 `play_session_id` 존재
- [ ] 성공 결과 `/minigames/results` 저장
- [ ] `/economy/minigame/reward`가 coin 보상 1회 지급
- [ ] 같은 session reward 재호출 시 중복 지급 없음
- [ ] `/minigames/rankings?game_type=freeThrow&mode=normal`에 점수 반영

### 5.5 업적

- [ ] `/achievements/events`에 `first_login` 반복 호출 시 보상 1회만 지급
- [ ] `/achievements/events`에 `room_first_enter` 호출 시 마이룸 첫 진입 업적 progress 반영
- [ ] `/achievements/me`에서 해당 업적 completed/claimed 상태 확인 가능

### 5.6 캐릭터 코스튬

- [ ] 업적 보상으로 `skin_truth`, `skin_peace`, `skin_creation` 소유 상태 확인 가능
- [ ] `equipped_skin_key = "default"` 저장/조회 성공
- [ ] 소유한 `equipped_skin_key = "skin_truth"` 저장/조회 성공
- [ ] 미소유 `equipped_skin_key` 장착 요청은 400 또는 403
- [ ] `GET /characters/me`와 `/app/bootstrap`에서 저장된 `equipped_skin_key` 반환
- [ ] `state` 값은 기존 캐릭터 상태와 독립적으로 유지

### 5.7 친구

- [ ] 학번 검색 성공/실패 케이스 구분
- [ ] 자기 자신 친구 요청 차단
- [ ] 중복 친구 요청 차단
- [ ] accept 후 `/friends/`에 relation id와 friend user 정보 표시
- [ ] delete 후 `/friends/`에서 제거

### 5.8 졸업 리포트

- [ ] `/user/me` 또는 `/app/bootstrap`에서 `created_at` 반환
- [ ] 서버 기준 리포트를 제공한다면 학식/퀴즈/미니게임 통계가 기기와 무관하게 동일
- [ ] 졸업 확정 시 `graduated_at` 저장 또는 졸업 상태 정책 명확화

### 5.9 개발자 패널 API

- [ ] admin/debug 권한 없는 유저는 debug endpoint 접근 불가
- [ ] debug XP/coin/stage patch가 일반 사용자 API와 분리됨
- [ ] 운영 데이터에 영향을 주는 debug 조작은 감사 가능하거나 개발 환경에서만 활성화

## 6. 프론트에서 이미 보강한 부분

- Shop mapping 실패 시 `[RoomShop]` 로그로 category, local option, server item count, matching type items 출력
- `/shop/items`가 비어 있으면 구매 직전 refetch 후 다시 매핑 시도
- Room item mapping에 `item_key` 우선 매칭 추가
- 로그인 상태에서는 서버 실패를 더미 데이터로 조용히 덮지 않도록 정리
- 퀴즈는 answer 기반 즉시 채점 후 submit 결과로 서버 상태 보정
- 미니게임 보상은 성공 시 optimistic 처리 후 서버 결과로 coin/achievement 동기화
- 방명록 수정/삭제, 상점 구매/장착 실패는 TopAlert와 console warning으로 노출
- 랭킹 관련 mutation 후 ranking query invalidate

## 7. 가장 명확한 해결 순서

1. `/shop/items` catalog seed 및 응답 계약 수정
2. `/characters/me` 403 원인 제거 및 fresh user lazy create
3. 캐릭터 코스튬 장착 상태 `equipped_skin_key` 저장/조회 계약 추가
4. `/quizzes/next`, `/quizzes/available`에 `answer` 포함
5. `/rooms/me`, `/rooms/me/equip`, `/shop/items/{item_id}/purchase`의 `item_key` 기반 end-to-end 검증
6. `/economy/minigame/start` -> `/minigames/results` -> `/economy/minigame/reward` session flow 검증
7. `/achievements/events` key/idempotency 검증, 특히 `room_first_enter`
8. `/minigames/rankings`, `/minigames/rankings/friends`가 `game_type`, `mode` filter를 실제 반영하도록 검증
9. `/app/bootstrap`로 초기 동기화 API를 통합해 앱 진입 지연과 부분 실패 위험 축소
10. 졸업 리포트 통계를 서버 권위값으로 제공할지 정책 결정
11. 개발자 패널 조작을 서버에 반영해야 한다면 admin/debug endpoint 추가

## 8. 백엔드에 전달할 핵심 결론

- 현재 가장 큰 실사용 장애는 `/shop/items`가 빈 배열을 반환해서 프론트가 구매할 서버 `item_id`를 찾지 못하는 문제다.
- 프론트는 로그인 상태에서 로컬 더미로 서버 누락을 덮지 않도록 바뀌어 있으므로, 서버 master/catalog/default data가 반드시 준비되어야 한다.
- `item_key`, achievement `condition_type/event key`, miniGame `game_type/mode`는 문자열 계약이다. 백엔드와 프론트가 같은 key를 써야만 안정적으로 연결된다.
- 마이룸 옷장 코스튬 선택은 프론트 로컬 구현만 되어 있으며, 서버 동기화를 위해 `equipped_skin_key` 저장/조회 계약이 추가되어야 한다.
- 퀴즈는 UX 요구상 클라이언트 즉시 채점 구조이므로 문제 응답에 `answer`가 포함되어야 한다. 서버 submit은 최종 검증과 보상 확정 역할이다.
- 신규 유저 기준으로 user/economy/character/room/shop/achievement가 모두 200으로 초기화되는지가 전체 API 전환의 핵심 acceptance 기준이다.
- 졸업 화면의 통계는 현재 로컬값이다. 백엔드 기준 졸업 리포트가 필요하면 누적 통계 summary와 `graduated_at` 계약이 필요하다.
- 게스트 모드는 로컬 전용이며 서버 API를 호출하지 않는 쪽이 현재 정책이다. 계정 이관이 필요해지면 별도 merge API로 다룬다.
- 개발자 패널의 XP/학년/코인 조작은 현재 서버 계약이 없어서 로컬 테스트 상태다. 서버 반영이 필요하면 admin/debug API가 필요하다.
