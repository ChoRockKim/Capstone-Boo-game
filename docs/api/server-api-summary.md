# Boo Server API Summary

- Source docs: https://capstonedesign-production.up.railway.app/docs
- OpenAPI JSON: ./openapi.json
- Base URL: https://capstonedesign-production.up.railway.app
- OpenAPI version: 3.1.0
- API title: Boo키우기 API
- API version: 0.1.0
- Auth: OAuth2PasswordBearer. Send `Authorization: Bearer <access_token>` for endpoints marked auth.

## Integration Priority

1. Auth/user: login, refresh, me
2. School foods: today, feed-status, feed
3. Quizzes: play-status, next, submit
4. Friends: list, search, add, delete
5. Rooms/shop: items, purchase, equip, guestbook
6. Economy/minigames: heart/coin status, result save, ranking

## 2026-06-04 OpenAPI Update Notes

- Operation count increased from 60 to 90 and schema count increased from 50 to 90.
- `GET /school-foods/today` now returns `SchoolFoodToday` with `sections[]`, not a flat `SchoolFood[]`.
- `GET /rooms/{user_id}/guestbook` now returns `GuestbookPage` with `items[]` and `next_cursor`.
- Mini-game ranking list APIs are now available:
  - `GET /minigames/rankings`
  - `GET /minigames/rankings/friends`
  - Both accept `game_type`, `mode`, and `limit` query parameters.
- Mini-game economy flow now has session-oriented APIs:
  - `POST /economy/minigame/start`
  - `POST /economy/minigame/reward`
  - Legacy `POST /economy/minigame/play` still exists.
- User profile image and preferences APIs were added under `/user/me/image` and `/user/me/preferences`.
- Frontend currently does not expose profile image edit/delete in the settings profile UI. `/user/me/image` remains documented as an available backend endpoint, not an active frontend workflow.
- User-scoped character APIs were added under `/characters/me`, including XP, evolution confirmation, meal health, and meal penalty.
- Character costume/equipped skin persistence now uses `equipped_skin_key` on `CharacterMeOut`, `CharacterMeUpdate`, `AppBootstrap.character`, and `RoomCharacterOut`.
- Achievement APIs were added under `/achievements`, and many gameplay responses can include `unlocked_achievements`.
- Several admin-like CRUD endpoints that were previously public now require auth in the OpenAPI security metadata.

## 2026-06-07 Costume API Notes

- Local and remote OpenAPI were checked for costume/skin/outfit/appearance persistence, and the backend contract has since been added.
- Frontend closet selection stores `default`, `skin_truth`, `skin_peace`, and `skin_creation` through `PUT /characters/me.equipped_skin_key`.
- `equipped_skin_key` is read from `CharacterMeOut` during login sync and from `RoomCharacterOut` for friend room rendering.
- Do not overload `state`; it is already used for character behavior state.

## 2026-06-08 Backend Contract Status

최근 프론트 보강 후 백엔드 계약 반영 여부와 현재 프론트 연결 상태입니다.

- Character costume persistence:
  - `CharacterMeOut`, `CharacterMeUpdate`, `AppBootstrap.character`, `RoomCharacterOut`에 `equipped_skin_key` 반영됨.
  - 허용값은 `default`, `skin_truth`, `skin_peace`, `skin_creation`.
  - non-default skin은 업적 보상 소유 여부를 서버에서 검증해야 함.
- Graduation summary:
  - `/graduation/summary`, `/graduation/confirm` 및 `GraduationSummary`가 OpenAPI에 반영됨.
  - 로그인 유저 졸업 화면은 서버 summary 응답을 우선 표시하고, 실패/게스트는 로컬 통계로 fallback함.
- Guest mode:
  - 게스트 모드는 로컬 전용 정책임. `accessToken`을 비우고 API Authorization header를 제거한 뒤 `guestGameSnapshot`만 사용함.
  - 게스트에서는 친구 목록, 친구 추가, 친구 방, 방명록, 친구 랭킹 API를 호출하지 않고 사용 불가 모달을 표시함.
  - 게스트 진행도를 서버와 병합하는 기능은 현재 없음. 추후 계정 전환/가입 시 이관이 필요하면 별도 import/merge API가 필요함.
- Developer panel:
  - 부 이름은 `PUT /characters/me.character_name`, 튜토리얼 조회 초기화는 `PUT /user/me/preferences`로 서버에 반영함.
  - 코인, XP, 학년, 부 상태 디버그 조작은 `/debug/me`로 서버에 반영함.
  - 식사/퀴즈 제한 토글은 서버 debug schema에 없어 로컬 테스트 상태로만 처리함.
- Mini-game results:
  - 로그인 상태는 `/economy/minigame/start`, `/economy/minigame/reward`, `/minigames/results`를 사용함.
  - 게스트는 로컬 하트/보상/통계만 사용함.
  - `/economy/minigame/reward`는 `success` 필드를 받을 수 있고, 프론트는 성공 보상 요청에 `success: true`를 명시함.
  - 결과 저장과 보상 지급의 중복 방지는 서버가 `play_session_id` 기준 idempotency로 보장해야 함.
- Profile image:
  - `/user/me/image`는 OpenAPI에 있으나 현재 설정 UI에서는 프로필 이미지 변경/삭제 workflow를 제거함.
  - 정책상 유지 가능하지만, 현재 활성 프론트 기능은 아님.

## Backend Reference Notes

이 섹션은 백엔드 README/운영 메모 기반 보조 설명입니다. 아래 정책은 OpenAPI 스키마와 함께 확인하고, 실제 서버 동작이 다르면 Swagger/실서버 응답을 우선합니다.

### Backend Setup

- Backend framework: FastAPI
- Auth: JWT, `python-jose`
- Email: `smtplib`
- Local run:
  - `python3 -m venv .venv`
  - `source .venv/bin/activate`
  - `pip install -r requirements.txt`
  - `uvicorn app.main:app --reload`
- Local Swagger UI: `http://127.0.0.1:8000/docs`
- Local DB: 별도 설정이 없으면 `boo_app.db` SQLite 사용
- Railway deploy DB: `DATABASE_URL`에 PostgreSQL 연결 문자열 등록 필요
- ERD: backend repo의 `docs/ERD.md`

### Backend Environment Variables

| Name | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string. 로컬 미설정 시 SQLite fallback |
| `SECRET_KEY` | JWT 서명용 secret |
| `SMTP_HOST` | SMTP host. 예: `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port. 예: `587` |
| `SMTP_USERNAME` | SMTP sender account |
| `SMTP_PASSWORD` | SMTP app password |
| `SMTP_FROM_EMAIL` | 발신 이메일 |
| `SMTP_FROM_NAME` | 발신자 이름. 예: `Boo키우기` |
| `SMTP_USE_TLS` | SMTP TLS 사용 여부 |

### Auth/User Policy Notes

- 회원가입은 학교 이메일 인증 후 최종 사용자 정보를 입력하는 흐름입니다.
- 이메일 도메인은 `@hufs.ac.kr`로 제한됩니다.
- 로그인 ID는 이메일이 아니라 9자리 숫자 학번입니다.
- 로그인 성공 시 `access_token`과 `refresh_token`을 발급합니다.
- `access_token`은 인증 API의 `Authorization: Bearer <access_token>` 헤더에 사용합니다.
- `refresh_token`은 `/user/refresh`로 토큰 재발급, `/user/logout`으로 폐기합니다.
- SMTP 설정이 없거나 잘못되면 이메일 인증/비밀번호 재설정 메일 발송이 실패할 수 있습니다.

### Password Reset Notes

- 사용자는 학번으로 비밀번호 재설정을 요청합니다.
- 서버는 해당 유저의 이메일로 재설정 토큰을 발송합니다.
- 관련 API:
  - `POST /user/password-reset-request`
  - `POST /user/password-reset-confirm`

### Quiz Policy Notes

- 퀴즈는 O/X 형식입니다.
- 사용자는 아직 풀지 않은 퀴즈만 받을 수 있고, 한 번 푼 퀴즈는 다시 풀 수 없습니다.
- 정답 보상: `+30 XP`
- 오답 패널티: `-10 XP`
- 하루 최대 3개까지 풀이 가능합니다.
- 퀴즈 1개 풀이 후 3시간 쿨타임이 적용됩니다.
- 풀이 기록은 `user_quiz_connect` 테이블에 저장됩니다.
- 앱 연동 우선 API:
  - `GET /quizzes/play-status`
  - `GET /quizzes/next`
  - `POST /quizzes/submit`

### School Food Policy Notes

- 평일에는 학식, 주말에는 외대 근처 맛집을 먹일 수 있습니다.
- 음식 `type`:
  - `weekday`: 평일 학식
  - `weekend`: 주말 맛집
- 백엔드 README 기준 먹이기 시간대:
  - `breakfast`: 08:00 ~ 10:00
  - `lunch`: 11:00 ~ 13:00
  - `dinner`: 17:00 ~ 19:00
- 각 시간대마다 하루 1회만 먹일 수 있습니다.
- 먹이기 성공 시 `+50 XP`가 지급됩니다.
- `user_id + feed_date + meal_slot` 조합으로 중복 먹이기를 방지합니다.
- 앱 연동 우선 API:
  - `GET /school-foods/today`
  - `GET /school-foods/feed-status`
  - `POST /school-foods/feed`

### Character Policy Notes

- 사용자별 캐릭터 정보를 저장합니다.
- 캐릭터는 이름과 성장 단계 값을 가집니다.
- 현재 OpenAPI의 user-scoped character 응답/수정 스키마에는 장착 코스튬/스킨 필드가 없습니다.
- 마이룸 옷장 선택을 서버에 저장하려면 `equipped_skin_key` 같은 stable key가 필요합니다.
- 권장 허용값은 `default`, `skin_truth`, `skin_peace`, `skin_creation`입니다.
- `state`는 `basic1`, `hungry`, `eating` 같은 캐릭터 행동 상태이므로 코스튬 저장용으로 재사용하지 않습니다.
- non-default skin은 업적 보상 소유 여부를 서버에서 검증해야 합니다.
- 관련 API:
  - `GET /characters/me`
  - `PUT /characters/me`
  - `POST /characters/me/xp`
  - `POST /characters/me/evolve/confirm`
  - `GET /characters/me/meal-health`
  - `POST /characters/me/meal-penalty/apply`
  - `POST /characters/`
  - `GET /characters/`
  - `GET /characters/{character_id}`
  - `PUT /characters/{character_id}`
  - `DELETE /characters/{character_id}`

## Endpoint Map

### user

| Method | Path | Auth | Request | Response | Params | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/user/signup/email` | no | SignupEmailRequest | SignupEmailVerificationOut | - | Request Signup Email Verification |
| POST | `/user/signup/verify` | no | SignupEmailVerificationRequest | - | - | Verify Signup Email |
| GET | `/user/` | yes | - | UserOut[] | - | List Users |
| POST | `/user/` | no | UserCreate | UserOut | - | Create User |
| POST | `/user/login` | no | UserLogin | TokenWithRefresh | - | Login |
| POST | `/user/password-reset-request` | no | PasswordResetRequest | - | - | Request Password Reset |
| POST | `/user/password-reset-confirm` | no | ResetPasswordRequest | - | - | Reset Password |
| POST | `/user/refresh` | no | RefreshRequest | TokenWithRefresh | - | Refresh Token |
| GET | `/user/me` | yes | - | UserOut | - | Read Current User |
| PUT | `/user/me` | yes | UserAccountUpdate | UserOut | - | Update Current User |
| DELETE | `/user/me` | yes | - | - | - | Delete Current User |
| POST | `/user/me/image` | yes | ProfileImageRequest | ProfileImageOut | - | Update Current User Image |
| DELETE | `/user/me/image` | yes | - | ProfileImageOut | - | Delete Current User Image |
| GET | `/user/me/preferences` | yes | - | UserPreferenceOut | - | Get Current User Preferences |
| PUT | `/user/me/preferences` | yes | UserPreferenceUpdate | UserPreferenceOut | - | Update Current User Preferences |
| POST | `/user/logout` | no | RefreshRequest | - | - | Logout |
| GET | `/user/{user_id}` | yes | - | UserOut | user_id(path) | Get User |
| PUT | `/user/{user_id}` | yes | UserUpdate | UserOut | user_id(path) | Update User |
| DELETE | `/user/{user_id}` | yes | - | - | user_id(path) | Delete User |

### school-foods

| Method | Path | Auth | Request | Response | Params | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/school-foods/` | yes | SchoolFoodCreate | SchoolFood | - | Create School Food |
| GET | `/school-foods/` | yes | - | SchoolFood[] | type(query) | List School Foods |
| GET | `/school-foods/today` | no | - | SchoolFoodToday | - | List Today School Foods |
| GET | `/school-foods/feed-status` | yes | - | SchoolFoodFeedStatus | - | Get School Food Feed Status |
| POST | `/school-foods/feed` | yes | SchoolFoodFeedRequest | SchoolFoodFeedResult | - | Feed School Food |
| GET | `/school-foods/{school_food_id}` | yes | - | SchoolFood | school_food_id(path) | Get School Food |
| PUT | `/school-foods/{school_food_id}` | yes | SchoolFoodUpdate | SchoolFood | school_food_id(path) | Update School Food |
| DELETE | `/school-foods/{school_food_id}` | yes | - | - | school_food_id(path) | Delete School Food |

### quizzes

| Method | Path | Auth | Request | Response | Params | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/quizzes/` | yes | - | Quiz[] | - | List Quizzes |
| POST | `/quizzes/` | yes | QuizCreate | Quiz | - | Create Quiz |
| GET | `/quizzes/available` | yes | - | QuizQuestion[] | - | List Available Quizzes |
| GET | `/quizzes/next` | yes | - | QuizQuestion | - | Get Next Quiz |
| GET | `/quizzes/play-status` | yes | - | QuizPlayStatus | - | Read Quiz Play Status |
| POST | `/quizzes/submit` | yes | QuizSubmit | QuizSubmitResult | - | Submit Quiz |
| GET | `/quizzes/{quiz_id}` | yes | - | Quiz | quiz_id(path) | Get Quiz |
| PUT | `/quizzes/{quiz_id}` | yes | QuizUpdate | Quiz | quiz_id(path) | Update Quiz |
| DELETE | `/quizzes/{quiz_id}` | yes | - | - | quiz_id(path) | Delete Quiz |

### characters

| Method | Path | Auth | Request | Response | Params | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/characters/me` | yes | - | CharacterMeOut | - | Get My Character |
| PUT | `/characters/me` | yes | CharacterMeUpdate | CharacterMeOut | - | Update My Character |
| POST | `/characters/me/xp` | yes | CharacterXpRequest | CharacterXpResult | - | Add My Character Xp |
| POST | `/characters/me/evolve/confirm` | yes | - | CharacterMeOut | - | Confirm My Character Evolution |
| GET | `/characters/me/meal-health` | yes | - | CharacterMealHealth | - | Get My Character Meal Health |
| POST | `/characters/me/meal-penalty/apply` | yes | - | CharacterMealPenaltyResult | - | Apply My Character Meal Penalty |
| GET | `/characters/` | yes | - | Character[] | - | List Characters |
| POST | `/characters/` | yes | CharacterCreate | Character | - | Create Character |
| GET | `/characters/{character_id}` | yes | - | Character | character_id(path) | Get Character |
| PUT | `/characters/{character_id}` | yes | CharacterUpdate | Character | character_id(path) | Update Character |
| DELETE | `/characters/{character_id}` | yes | - | - | character_id(path) | Delete Character |

### friends

| Method | Path | Auth | Request | Response | Params | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/friends/` | yes | - | FriendOut[] | - | List Friends |
| POST | `/friends/` | yes | FriendCreate | FriendOut | - | Add Friend |
| GET | `/friends/search/{student_id}` | yes | - | FriendUser | student_id(path) | Search Friend By Student Id |
| GET | `/friends/requests` | yes | - | FriendRequestOut[] | - | List Friend Requests |
| POST | `/friends/requests` | yes | FriendRequestCreate | FriendRequestOut | - | Create Friend Request |
| POST | `/friends/requests/{request_id}/accept` | yes | - | FriendRequestOut | request_id(path) | Accept Friend Request |
| DELETE | `/friends/requests/{request_id}` | yes | - | - | request_id(path) | Delete Friend Request |
| GET | `/friends/{friend_id}` | yes | - | FriendDetail | friend_id(path) | Get Friend Detail |
| DELETE | `/friends/{friend_id}` | yes | - | - | friend_id(path) | Delete Friend |

### economy

| Method | Path | Auth | Request | Response | Params | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/economy/status` | yes | - | EconomyStatus | - | Get Economy Status |
| POST | `/economy/minigame/start` | yes | MiniGameStartRequest | MiniGameStartResult | - | Start Minigame |
| POST | `/economy/minigame/reward` | yes | MiniGameRewardRequest | MiniGameRewardResult | - | Reward Minigame |
| POST | `/economy/minigame/play` | yes | - | MiniGamePlayResult | - | Play Minigame |

### minigames

| Method | Path | Auth | Request | Response | Params | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/minigames/results` | yes | MiniGameResultCreate | MiniGameResultOut | - | Create Minigame Result |
| GET | `/minigames/results/me` | yes | - | MiniGameResultOut[] | - | List My Minigame Results |
| GET | `/minigames/ranking/me` | yes | - | MiniGameRankingMe | - | Get My Minigame Ranking |
| GET | `/minigames/rankings` | yes | - | MiniGameRankingList | game_type, mode, limit(query) | List Minigame Rankings |
| GET | `/minigames/rankings/friends` | yes | - | MiniGameRankingList | game_type, mode, limit(query) | List Friend Minigame Rankings |

### shop

| Method | Path | Auth | Request | Response | Params | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/shop/item-types` | no | - | ShopItemTypeOut[] | - | List Shop Item Types |
| POST | `/shop/items` | yes | RoomItemCreate | RoomItemOut | - | Create Room Item |
| GET | `/shop/items` | yes | - | ShopItemOut[] | item_type(query) | List Shop Items |
| POST | `/shop/items/{item_id}/purchase` | yes | - | RoomItemPurchaseResult | item_id(path) | Purchase Room Item |

### rooms

| Method | Path | Auth | Request | Response | Params | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/rooms/me` | yes | - | RoomView | - | Get My Room |
| PUT | `/rooms/me/equip` | yes | RoomEquipRequest | RoomView | - | Equip Room Item |
| DELETE | `/rooms/me/equip/{slot}` | yes | - | RoomView | slot(path) | Unequip Room Item |
| GET | `/rooms/{user_id}` | yes | - | RoomView | user_id(path) | Get Room |
| GET | `/rooms/{user_id}/guestbook` | yes | - | GuestbookPage | user_id(path), cursor, limit(query) | List Guestbook Entries |
| POST | `/rooms/{user_id}/guestbook` | yes | GuestbookCreate | GuestbookOut | user_id(path) | Create Guestbook Entry |
| PUT | `/rooms/guestbook/{entry_id}` | yes | GuestbookUpdate | GuestbookOut | entry_id(path) | Update Guestbook Entry |
| DELETE | `/rooms/guestbook/{entry_id}` | yes | - | - | entry_id(path) | Delete Guestbook Entry |

### user-quiz-connect

| Method | Path | Auth | Request | Response | Params | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/user-quiz-connect/` | no | - | UserQuizConnect[] | - | List User Quiz Connect |
| POST | `/user-quiz-connect/` | no | UserQuizConnectCreate | UserQuizConnect | - | Create User Quiz Connect |
| GET | `/user-quiz-connect/{user_quiz_id}` | no | - | UserQuizConnect | user_quiz_id(path) | Get User Quiz Connect |
| DELETE | `/user-quiz-connect/{user_quiz_id}` | no | - | - | user_quiz_id(path) | Delete User Quiz Connect |

### app

| Method | Path | Auth | Request | Response | Params | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/app/config` | no | - | AppConfig | - | Get App Config |
| GET | `/app/bootstrap` | yes | - | AppBootstrap | - | Get App Bootstrap |

### achievements

| Method | Path | Auth | Request | Response | Params | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/achievements/` | no | - | AchievementMaster[] | - | List Achievements |
| GET | `/achievements/me` | yes | - | AchievementProgress[] | - | List My Achievements |
| POST | `/achievements/events` | yes | AchievementEventRequest | AchievementEventResult | - | Create Achievement Event |

### misc

| Method | Path | Auth | Request | Response | Params | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/` | no | - | - | - | Root |

## Key Schemas

### UserCreate

Required: `email`, `student_id`, `nickname`, `name`, `password`

| Field | Type |
| --- | --- |
| `email` | string |
| `student_id` | string |
| `nickname` | string |
| `name` | string |
| `image` | string | null |
| `password` | string |

### UserLogin

Required: `student_id`, `password`

| Field | Type |
| --- | --- |
| `student_id` | string |
| `password` | string |
| `remember_me` | boolean | null |

### TokenWithRefresh

Required: `access_token`, `token_type`, `refresh_token`

| Field | Type |
| --- | --- |
| `access_token` | string |
| `token_type` | string |
| `refresh_token` | string |
| `unlocked_achievements` | UnlockedAchievement[] | null |

### UserOut

Required: `email`, `student_id`, `nickname`, `name`, `user_id`, `xp_point`, `coin`, `heart`, `email_verified`

| Field | Type |
| --- | --- |
| `email` | string |
| `student_id` | string |
| `nickname` | string |
| `name` | string |
| `image` | string | null |
| `user_id` | integer |
| `xp_point` | integer |
| `coin` | integer |
| `heart` | integer |
| `heart_updated_at` | string | null |
| `email_verified` | boolean |
| `email_verified_at` | string | null |
| `created_at` | string | null |
| `is_admin` | boolean | null |

### SchoolFood

Required: `name`, `school_food_id`

| Field | Type |
| --- | --- |
| `name` | string |
| `school_food_img` | string | null |
| `school_food_time` | string | null |
| `type` | string | null |
| `school_food_id` | integer |

### SchoolFoodToday

Required: `date`, `server_time`, `sections`

| Field | Type |
| --- | --- |
| `date` | string |
| `server_time` | string |
| `sections` | SchoolFoodSection[] |

### SchoolFoodFeedStatus

Required: `date`, `fed_slots`, `can_feed_now`

| Field | Type |
| --- | --- |
| `date` | string |
| `current_slot` | string | null |
| `fed_slots` | string[] |
| `can_feed_now` | boolean |
| `next_slot_at` | string | null |
| `server_time` | string | null |

### SchoolFoodFeedRequest

Required: `school_food_id`

| Field | Type |
| --- | --- |
| `school_food_id` | integer |

### SchoolFoodFeedResult

Required: `detail`, `feed_id`, `school_food_id`, `meal_slot`, `awarded_xp`, `spent_coin`, `xp_point`, `coin`, `fed_at`

| Field | Type |
| --- | --- |
| `detail` | string |
| `feed_id` | integer |
| `school_food_id` | integer |
| `meal_slot` | string |
| `awarded_xp` | integer |
| `spent_coin` | integer |
| `xp_point` | integer |
| `coin` | integer |
| `fed_at` | string |
| `unlocked_achievements` | UnlockedAchievement[] | null |

### QuizQuestion

Required: `quiz_id`, `question`, `quiz_point`

| Field | Type |
| --- | --- |
| `quiz_id` | integer |
| `question` | string |
| `options` | array | object | null |
| `quiz_point` | integer |

### QuizSubmit

Required: `quiz_id`, `answer`

| Field | Type |
| --- | --- |
| `quiz_id` | integer |
| `answer` | string |

### QuizSubmitResult

Required: `detail`, `correct`, `awarded_points`, `awarded_coin`, `xp_point`, `coin`, `correct_answer`

| Field | Type |
| --- | --- |
| `detail` | string |
| `correct` | boolean |
| `awarded_points` | integer |
| `awarded_coin` | integer |
| `xp_point` | integer |
| `coin` | integer |
| `correct_answer` | string |
| `unlocked_achievements` | UnlockedAchievement[] | null |

### QuizPlayStatus

Required: `date`, `solved_today`, `daily_limit`, `remaining_today`, `cooldown_hours`, `can_play_now`

| Field | Type |
| --- | --- |
| `date` | string |
| `solved_today` | integer |
| `daily_limit` | integer |
| `remaining_today` | integer |
| `cooldown_hours` | integer |
| `last_played_at` | string | null |
| `next_available_at` | string | null |
| `can_play_now` | boolean |
| `blocked_reason` | string | null |

### FriendCreate

Required: `student_id`

| Field | Type |
| --- | --- |
| `student_id` | string |

### FriendOut

Required: `friend_id`, `created_at`, `friend`

| Field | Type |
| --- | --- |
| `friend_id` | integer |
| `created_at` | string |
| `friend` | FriendUser |

### FriendUser

Required: `user_id`, `student_id`, `nickname`

| Field | Type |
| --- | --- |
| `user_id` | integer |
| `student_id` | string |
| `nickname` | string |
| `image` | string | null |

### EconomyStatus

Required: `coin`, `heart`, `max_heart`

| Field | Type |
| --- | --- |
| `coin` | integer |
| `heart` | integer |
| `max_heart` | integer |
| `heart_updated_at` | string | null |
| `next_heart_at` | string | null |
| `server_time` | string | null |

### MiniGamePlayResult

Required: `detail`, `awarded_coin`, `spent_heart`, `coin`, `heart`, `max_heart`

| Field | Type |
| --- | --- |
| `detail` | string |
| `awarded_coin` | integer |
| `spent_heart` | integer |
| `coin` | integer |
| `heart` | integer |
| `max_heart` | integer |
| `heart_updated_at` | string | null |
| `next_heart_at` | string | null |
| `unlocked_achievements` | UnlockedAchievement[] | null |

### MiniGameResultCreate

Required: `score`

| Field | Type |
| --- | --- |
| `score` | integer |
| `success` | boolean | null |
| `game_type` | string | null |
| `mode` | string | null |
| `location` | string | null |
| `play_session_id` | string | null |
| `play_time_seconds` | integer | null |
| `ended_reason` | string | null |

### MiniGameResultOut

Required: `result_id`, `user_id`, `score`, `success`, `created_at`

| Field | Type |
| --- | --- |
| `result_id` | integer |
| `user_id` | integer |
| `game_type` | string | null |
| `mode` | string | null |
| `location` | string | null |
| `play_session_id` | string | null |
| `score` | integer |
| `success` | boolean |
| `play_time_seconds` | integer | null |
| `ended_reason` | string | null |
| `created_at` | string |
| `unlocked_achievements` | UnlockedAchievement[] | null |

### MiniGameStartResult

Required: `play_session_id`, `spent_heart`, `heart`, `max_heart`

| Field | Type |
| --- | --- |
| `play_session_id` | string |
| `spent_heart` | integer |
| `heart` | integer |
| `max_heart` | integer |
| `heart_updated_at` | string | null |
| `next_heart_at` | string | null |
| `unlocked_achievements` | UnlockedAchievement[] | null |

### MiniGameRewardResult

Required: `awarded_coin`, `coin`

| Field | Type |
| --- | --- |
| `awarded_coin` | integer |
| `coin` | integer |
| `unlocked_achievements` | UnlockedAchievement[] | null |

### MiniGameRankingList

Required: `rankings`, `total_ranked_users`

| Field | Type |
| --- | --- |
| `game_type` | string | null |
| `mode` | string | null |
| `rankings` | MiniGameRankingUser[] |
| `total_ranked_users` | integer |

### MiniGameRankingMe

Required: `total_ranked_users`, `total_users`

| Field | Type |
| --- | --- |
| `rank` | integer | null |
| `best_score` | integer | null |
| `total_ranked_users` | integer |
| `total_users` | integer |

### ShopItemOut

Required: `name`, `item_type`, `item_id`, `created_at`, `owned`, `equipped`

| Field | Type |
| --- | --- |
| `name` | string |
| `item_type` | string |
| `image` | string | null |
| `price` | integer |
| `is_default` | boolean | null |
| `item_key` | string | null |
| `item_id` | integer |
| `created_at` | string |
| `owned` | boolean |
| `equipped` | boolean |

### RoomItemPurchaseResult

Required: `detail`, `item`, `coin`

| Field | Type |
| --- | --- |
| `detail` | string |
| `item` | RoomItemOut |
| `coin` | integer |

### RoomView

Required: `owner`, `equipped_items`

| Field | Type |
| --- | --- |
| `owner` | RoomOwnerOut |
| `character` | RoomCharacterOut | null |
| `wallpaper` | ShopItemOut | null |
| `equipped_items` | RoomEquippedItemOut[] |
| `unlocked_achievements` | UnlockedAchievement[] | null |

### RoomEquipRequest

Required: `item_id`

| Field | Type |
| --- | --- |
| `item_id` | integer |

### GuestbookCreate

Required: `content`

| Field | Type |
| --- | --- |
| `content` | string |

### GuestbookOut

Required: `entry_id`, `room_owner_id`, `writer_id`, `writer_nickname`, `content`, `created_at`

| Field | Type |
| --- | --- |
| `entry_id` | integer |
| `room_owner_id` | integer |
| `writer_id` | integer |
| `writer_nickname` | string |
| `content` | string |
| `created_at` | string |

### GuestbookPage

Required: `items`

| Field | Type |
| --- | --- |
| `items` | GuestbookOut[] |
| `next_cursor` | string | null |

### AchievementProgress

Required: `achievement_key`, `title`, `condition_type`, `target_value`, `progress_value`, `completed`, `claimed`

| Field | Type |
| --- | --- |
| `achievement_key` | string |
| `title` | string |
| `condition_type` | string |
| `target_value` | integer |
| `progress_value` | integer |
| `completed` | boolean |
| `claimed` | boolean |
| `completed_at` | string | null |
| `reward_type` | string |
| `reward_value` | integer | null |
| `reward_item_key` | string | null |

### AchievementEventResult

Required: `event_type`, `coin`, `xp_point`, `unlocked_achievements`

| Field | Type |
| --- | --- |
| `event_type` | string |
| `coin` | integer |
| `xp_point` | integer |
| `unlocked_achievements` | UnlockedAchievement[] |

### Character

Required: `character_name`, `user_id`, `character_id`

| Field | Type |
| --- | --- |
| `character_name` | string |
| `stage` | integer | null |
| `user_id` | integer |
| `character_id` | integer |

### CharacterCreate

Required: `character_name`, `user_id`

| Field | Type |
| --- | --- |
| `character_name` | string |
| `stage` | integer | null |
| `user_id` | integer |

### CharacterUpdate

Required: -

| Field | Type |
| --- | --- |
| `character_name` | string | null |
| `stage` | integer | null |

## Notes

- Several admin-like CRUD endpoints now require auth in the current spec. App integration should prefer authenticated user-scoped endpoints where available.
- `/user/me/image` exists in the OpenAPI, but profile image editing was removed from the current settings UI. Keep the endpoint for backend compatibility unless product policy says to remove it from the API too.
- `POST /economy/minigame/play` still has no request body in the spec. Prefer the newer `/economy/minigame/start` and `/economy/minigame/reward` flow for new gameplay wiring.
- `/minigames/ranking/me` now accepts `game_type` and `mode` query parameters. Ranking list screens still primarily use `/minigames/rankings` and `/minigames/rankings/friends`.
- `CharacterMeOut`, `CharacterMeUpdate`, `AppBootstrap.character`, `RoomCharacterOut` now include `equipped_skin_key`; frontend sync and friend room rendering are connected.
- 졸업 화면은 로그인 상태에서 `/graduation/confirm`의 `GraduationSummary`를 우선 사용하고, 게스트/서버 실패 시 로컬 통계로 fallback합니다.
- 게스트 모드는 서버와 동기화하지 않는 로컬 전용 상태입니다. 게스트에서 친구/방명록/친구 랭킹 API를 호출하지 않도록 프론트에서 차단합니다.
- 개발자 패널의 XP/학년/코인/부 상태 강제 조작은 `/debug/me`로 서버에 반영합니다. 식사/퀴즈 제한 토글은 로컬 전용입니다.
- Server field names use snake_case; frontend state currently uses camelCase. Add mapper functions instead of leaking snake_case into UI/store code.
- README의 학식 시간대와 기존 프론트 상수의 시간대가 다를 수 있습니다. 서버 연동 시 `GET /school-foods/feed-status` 응답을 기준으로 UI 상태를 맞추는 편이 안전합니다.
