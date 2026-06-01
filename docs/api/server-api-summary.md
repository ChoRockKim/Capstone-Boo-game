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
- 관련 API:
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
| GET | `/user/` | no | - | UserOut[] | - | List Users |
| POST | `/user/` | no | UserCreate | UserOut | - | Create User |
| POST | `/user/login` | no | UserLogin | TokenWithRefresh | - | Login |
| POST | `/user/password-reset-request` | no | PasswordResetRequest | - | - | Request Password Reset |
| POST | `/user/password-reset-confirm` | no | ResetPasswordRequest | - | - | Reset Password |
| POST | `/user/refresh` | no | RefreshRequest | TokenWithRefresh | - | Refresh Token |
| GET | `/user/me` | yes | - | UserOut | - | Read Current User |
| PUT | `/user/me` | yes | UserAccountUpdate | UserOut | - | Update Current User |
| DELETE | `/user/me` | yes | - | - | - | Delete Current User |
| POST | `/user/logout` | no | RefreshRequest | - | - | Logout |
| GET | `/user/{user_id}` | no | - | UserOut | user_id(path) | Get User |
| PUT | `/user/{user_id}` | no | UserUpdate | UserOut | user_id(path) | Update User |
| DELETE | `/user/{user_id}` | no | - | - | user_id(path) | Delete User |

### school-foods

| Method | Path | Auth | Request | Response | Params | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/school-foods/` | no | SchoolFoodCreate | SchoolFood | - | Create School Food |
| GET | `/school-foods/` | no | - | SchoolFood[] | type(query) | List School Foods |
| GET | `/school-foods/today` | no | - | SchoolFood[] | - | List Today School Foods |
| GET | `/school-foods/feed-status` | yes | - | SchoolFoodFeedStatus | - | Get School Food Feed Status |
| POST | `/school-foods/feed` | yes | SchoolFoodFeedRequest | SchoolFoodFeedResult | - | Feed School Food |
| GET | `/school-foods/{school_food_id}` | no | - | SchoolFood | school_food_id(path) | Get School Food |
| PUT | `/school-foods/{school_food_id}` | no | SchoolFoodUpdate | SchoolFood | school_food_id(path) | Update School Food |
| DELETE | `/school-foods/{school_food_id}` | no | - | - | school_food_id(path) | Delete School Food |

### quizzes

| Method | Path | Auth | Request | Response | Params | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/quizzes/` | no | - | Quiz[] | - | List Quizzes |
| POST | `/quizzes/` | no | QuizCreate | Quiz | - | Create Quiz |
| GET | `/quizzes/available` | yes | - | QuizQuestion[] | - | List Available Quizzes |
| GET | `/quizzes/next` | yes | - | QuizQuestion | - | Get Next Quiz |
| GET | `/quizzes/play-status` | yes | - | QuizPlayStatus | - | Read Quiz Play Status |
| POST | `/quizzes/submit` | yes | QuizSubmit | QuizSubmitResult | - | Submit Quiz |
| GET | `/quizzes/{quiz_id}` | no | - | Quiz | quiz_id(path) | Get Quiz |
| PUT | `/quizzes/{quiz_id}` | no | QuizUpdate | Quiz | quiz_id(path) | Update Quiz |
| DELETE | `/quizzes/{quiz_id}` | no | - | - | quiz_id(path) | Delete Quiz |

### friends

| Method | Path | Auth | Request | Response | Params | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/friends/` | yes | - | FriendOut[] | - | List Friends |
| POST | `/friends/` | yes | FriendCreate | FriendOut | - | Add Friend |
| GET | `/friends/search/{student_id}` | yes | - | FriendUser | student_id(path) | Search Friend By Student Id |
| DELETE | `/friends/{friend_id}` | yes | - | - | friend_id(path) | Delete Friend |

### economy

| Method | Path | Auth | Request | Response | Params | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/economy/status` | yes | - | EconomyStatus | - | Get Economy Status |
| POST | `/economy/minigame/play` | yes | - | MiniGamePlayResult | - | Play Minigame |

### minigames

| Method | Path | Auth | Request | Response | Params | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/minigames/results` | yes | MiniGameResultCreate | MiniGameResultOut | - | Create Minigame Result |
| GET | `/minigames/results/me` | yes | - | MiniGameResultOut[] | - | List My Minigame Results |
| GET | `/minigames/ranking/me` | yes | - | MiniGameRankingMe | - | Get My Minigame Ranking |

### shop

| Method | Path | Auth | Request | Response | Params | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/shop/item-types` | no | - | ShopItemTypeOut[] | - | List Shop Item Types |
| POST | `/shop/items` | no | RoomItemCreate | RoomItemOut | - | Create Room Item |
| GET | `/shop/items` | yes | - | ShopItemOut[] | item_type(query) | List Shop Items |
| POST | `/shop/items/{item_id}/purchase` | yes | - | RoomItemPurchaseResult | item_id(path) | Purchase Room Item |

### rooms

| Method | Path | Auth | Request | Response | Params | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/rooms/me` | yes | - | RoomView | - | Get My Room |
| PUT | `/rooms/me/equip` | yes | RoomEquipRequest | RoomView | - | Equip Room Item |
| GET | `/rooms/{user_id}` | yes | - | RoomView | user_id(path) | Get Room |
| GET | `/rooms/{user_id}/guestbook` | yes | - | GuestbookOut[] | user_id(path) | List Guestbook Entries |
| POST | `/rooms/{user_id}/guestbook` | yes | GuestbookCreate | GuestbookOut | user_id(path) | Create Guestbook Entry |

### characters

| Method | Path | Auth | Request | Response | Params | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/characters/` | no | - | Character[] | - | List Characters |
| POST | `/characters/` | no | CharacterCreate | Character | - | Create Character |
| GET | `/characters/{character_id}` | no | - | Character | character_id(path) | Get Character |
| PUT | `/characters/{character_id}` | no | CharacterUpdate | Character | character_id(path) | Update Character |
| DELETE | `/characters/{character_id}` | no | - | - | character_id(path) | Delete Character |

### user-quiz-connect

| Method | Path | Auth | Request | Response | Params | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/user-quiz-connect/` | no | - | UserQuizConnect[] | - | List User Quiz Connect |
| POST | `/user-quiz-connect/` | no | UserQuizConnectCreate | UserQuizConnect | - | Create User Quiz Connect |
| GET | `/user-quiz-connect/{user_quiz_id}` | no | - | UserQuizConnect | user_quiz_id(path) | Get User Quiz Connect |
| DELETE | `/user-quiz-connect/{user_quiz_id}` | no | - | - | user_quiz_id(path) | Delete User Quiz Connect |

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

### SchoolFood

Required: `name`, `school_food_id`

| Field | Type |
| --- | --- |
| `name` | string |
| `school_food_img` | string | null |
| `school_food_time` | string | null |
| `type` | string | null |
| `school_food_id` | integer |

### SchoolFoodFeedStatus

Required: `date`, `fed_slots`, `can_feed_now`

| Field | Type |
| --- | --- |
| `date` | string |
| `current_slot` | string | null |
| `fed_slots` | string[] |
| `can_feed_now` | boolean |

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

### MiniGameResultCreate

Required: `score`

| Field | Type |
| --- | --- |
| `score` | integer |
| `success` | boolean | null |
| `game_type` | string | null |
| `location` | string | null |
| `play_time_seconds` | integer | null |

### MiniGameResultOut

Required: `result_id`, `user_id`, `score`, `success`, `created_at`

| Field | Type |
| --- | --- |
| `result_id` | integer |
| `user_id` | integer |
| `game_type` | string | null |
| `location` | string | null |
| `score` | integer |
| `success` | boolean |
| `play_time_seconds` | integer | null |
| `created_at` | string |

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
| `owner` | FriendUser |
| `equipped_items` | RoomEquippedItemOut[] |

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

- Several admin-like CRUD endpoints are public in the current spec. App integration should prefer authenticated user-scoped endpoints where available.
- `POST /economy/minigame/play` has no request body in the spec. Verify behavior with the backend before wiring gameplay flow.
- `/minigames/ranking/me` has no game type query parameter in the spec. If rankings must be per game/mode, backend clarification is needed.
- Server field names use snake_case; frontend state currently uses camelCase. Add mapper functions instead of leaking snake_case into UI/store code.
- README의 학식 시간대와 기존 프론트 상수의 시간대가 다를 수 있습니다. 서버 연동 시 `GET /school-foods/feed-status` 응답을 기준으로 UI 상태를 맞추는 편이 안전합니다.
