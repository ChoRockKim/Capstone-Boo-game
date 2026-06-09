/**
 * @description  Boo 서버 API axios client와 인증/회원가입 요청 함수를 관리합니다.
 * @depends      axios
 * @used-by      components/Login/Login.tsx, components/Register/RegisterEmail.tsx
 * @side-effects HTTP 요청
 */
import type { CharacterCostumeKey } from "@/constants/character";
import { AxiosError, AxiosRequestConfig, create, isAxiosError } from "axios";

export const BOO_API_BASE_URL =
  "https://capstonedesign-production.up.railway.app";

const createBooApiClient = () =>
  create({
    baseURL: BOO_API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
  });

const booApiRawClient = createBooApiClient();

export const booApiClient = createBooApiClient();

type RetryableAxiosRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
};

type BooApiTokenRefreshHandlers = {
  getRefreshToken: () => string | null;
  onRefreshFailure?: () => void | Promise<void>;
  onTokenRefresh: (token: TokenWithRefresh) => void | Promise<void>;
};

let tokenRefreshHandlers: BooApiTokenRefreshHandlers | null = null;
let refreshTokenPromise: Promise<TokenWithRefresh> | null = null;

export const setBooApiTokenRefreshHandlers = (
  handlers: BooApiTokenRefreshHandlers,
) => {
  tokenRefreshHandlers = handlers;
};

const shouldAttemptTokenRefresh = (
  error: AxiosError,
  originalRequest?: RetryableAxiosRequestConfig,
) => {
  if (!originalRequest || originalRequest._retry) {
    return false;
  }

  const requestUrl = String(originalRequest.url ?? "");

  return (
    error.response?.status === 401 &&
    !requestUrl.includes("/user/login") &&
    !requestUrl.includes("/user/refresh") &&
    !requestUrl.includes("/user/logout")
  );
};

booApiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | RetryableAxiosRequestConfig
      | undefined;

    if (!shouldAttemptTokenRefresh(error, originalRequest)) {
      throw error;
    }

    if (!originalRequest) {
      throw error;
    }

    const refreshToken = tokenRefreshHandlers?.getRefreshToken();

    if (!refreshToken) {
      await tokenRefreshHandlers?.onRefreshFailure?.();
      throw error;
    }

    originalRequest._retry = true;

    try {
      refreshTokenPromise ??= refreshAccessToken(refreshToken);
      const token = await refreshTokenPromise;

      await tokenRefreshHandlers?.onTokenRefresh(token);
      setBooApiAccessToken(token.access_token);

      originalRequest.headers = {
        ...originalRequest.headers,
        Authorization: `Bearer ${token.access_token}`,
      };

      return booApiClient(originalRequest);
    } catch (refreshError) {
      await tokenRefreshHandlers?.onRefreshFailure?.();
      throw refreshError;
    } finally {
      refreshTokenPromise = null;
    }
  },
);

export const setBooApiAccessToken = (accessToken: string | null) => {
  if (accessToken) {
    booApiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
    return;
  }

  delete booApiClient.defaults.headers.common.Authorization;
};

export type SignupEmailVerificationOut = {
  detail: string;
  verification_code?: string | null;
};

export type TokenWithRefresh = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  unlocked_achievements?: ServerUnlockedAchievement[];
};

export type ServerUnlockedAchievement = {
  achievement_key: string;
  reward_item_key?: string | null;
  reward_type: string;
  reward_value?: number | null;
  title: string;
};

export type EconomyStatus = {
  coin: number;
  heart: number;
  heart_updated_at?: string | null;
  max_heart: number;
  next_heart_at?: string | null;
  server_time?: string;
};

export type UserOut = {
  coin: number;
  created_at?: string | null;
  email: string;
  email_verified: boolean;
  email_verified_at?: string | null;
  heart: number;
  heart_updated_at?: string | null;
  image?: string | null;
  name: string;
  nickname: string;
  student_id: string;
  user_id: number;
  xp_point: number;
  is_admin?: boolean;
  graduated_at?: string | null;
};

export type UserAccountUpdate = {
  image?: string | null;
  nickname?: string | null;
  password?: string | null;
  student_id?: string | null;
};

export type SchoolFood = {
  name: string;
  school_food_id: number;
  school_food_img?: string | null;
  school_food_time?: string | null;
  type?: string | null;
};

export type SchoolFoodSection = {
  items: SchoolFood[];
  meal_slot: string;
};

export type SchoolFoodToday = {
  date: string;
  sections: SchoolFoodSection[];
  server_time: string;
};

export type SchoolFoodFeedStatus = {
  can_feed_now: boolean;
  current_slot?: string | null;
  date: string;
  fed_slots: string[];
  next_slot_at?: string | null;
  server_time?: string;
};

export type SchoolFoodFeedResult = {
  awarded_xp: number;
  coin: number;
  detail: string;
  fed_at: string;
  feed_id: number;
  meal_slot: string;
  school_food_id: number;
  spent_coin: number;
  unlocked_achievements?: ServerUnlockedAchievement[];
  xp_point: number;
};

export type QuizQuestionOut = {
  answer: string;
  options?: Record<string, string> | string[] | null;
  question: string;
  quiz_id: number;
  quiz_point: number;
};

export type QuizPlayStatus = {
  blocked_reason?: string | null;
  can_play_now: boolean;
  cooldown_hours: number;
  daily_limit: number;
  date: string;
  last_played_at?: string | null;
  next_available_at?: string | null;
  remaining_today: number;
  solved_today: number;
};

export type QuizSubmitResult = {
  awarded_coin: number;
  awarded_points: number;
  coin: number;
  correct: boolean;
  correct_answer: string;
  detail: string;
  unlocked_achievements?: ServerUnlockedAchievement[];
  xp_point: number;
};

export type BooCharacter = {
  character_id: number;
  character_name: string;
  state?: string | null;
  stage?: number | null;
  user_id: number;
};

export type CharacterMeOut = {
  character_id: number;
  character_name: string;
  equipped_skin_key?: CharacterCostumeKey | null;
  grade?: number;
  name?: string;
  nickname?: string;
  pending_evolution?: boolean;
  stage: number;
  state: string;
  xp_point: number;
};

export type CharacterMeUpdate = {
  character_name?: string | null;
  equipped_skin_key?: CharacterCostumeKey | null;
  state?: string | null;
};

export type CharacterMealHealth = {
  applied_penalty_count: number;
  hungry_state: boolean;
  last_checked_meal_slot?: string | null;
  server_time: string;
  skipped_meal_count: number;
};

export type CharacterXpResult = {
  added_xp: number;
  pending_evolution: boolean;
  stage: number;
  unlocked_achievements?: ServerUnlockedAchievement[];
  xp_point: number;
};

export type CharacterMealPenaltyResult = CharacterMealHealth & {
  applied_penalty: number;
  unlocked_achievements?: ServerUnlockedAchievement[];
  xp_point: number;
};

export type FriendUser = {
  image?: string | null;
  nickname: string;
  student_id: string;
  user_id: number;
};

export type FriendOut = {
  created_at: string;
  friend: FriendUser;
  friend_id: number;
  unlocked_achievements?: ServerUnlockedAchievement[];
};

export type FriendDetail = FriendOut & {
  best_score?: number | null;
  xp_point?: number;
};

export type FriendRequestOut = {
  created_at: string;
  receiver: FriendUser;
  request_id: number;
  requester: FriendUser;
  responded_at?: string | null;
  status: string;
  unlocked_achievements?: ServerUnlockedAchievement[];
};

export type MiniGamePlayResult = {
  awarded_coin: number;
  coin: number;
  detail: string;
  heart: number;
  heart_updated_at?: string | null;
  max_heart: number;
  next_heart_at?: string | null;
  spent_heart: number;
  unlocked_achievements?: ServerUnlockedAchievement[];
};

export type MiniGameResultCreate = {
  ended_reason?: string | null;
  game_type?: string | null;
  location?: string | null;
  mode?: string | null;
  play_session_id?: string | null;
  play_time_seconds?: number | null;
  score: number;
  success?: boolean | null;
};

export type MiniGameResultOut = {
  created_at: string;
  ended_reason?: string | null;
  game_type?: string | null;
  location?: string | null;
  mode?: string | null;
  play_session_id?: string | null;
  play_time_seconds?: number | null;
  result_id: number;
  score: number;
  success: boolean;
  unlocked_achievements?: ServerUnlockedAchievement[];
  user_id: number;
};

export type MiniGameRankingMe = {
  best_score?: number | null;
  rank?: number | null;
  total_ranked_users: number;
  total_users: number;
};

export type MiniGameMode = "normal" | "infinite" | string;

export type MiniGameStartResult = {
  heart: number;
  heart_updated_at?: string | null;
  max_heart: number;
  next_heart_at?: string | null;
  play_session_id: string;
  spent_heart: number;
  unlocked_achievements?: ServerUnlockedAchievement[];
};

export type MiniGameRewardResult = {
  awarded_coin: number;
  coin: number;
  unlocked_achievements?: ServerUnlockedAchievement[];
};

export type MiniGameRankingUser = {
  best_score: number;
  image?: string | null;
  nickname: string;
  rank: number;
  student_id: string;
  user_id: number;
};

export type MiniGameRankingList = {
  game_type?: string | null;
  mode?: string | null;
  rankings: MiniGameRankingUser[];
  total_ranked_users: number;
};

export type ShopItemTypeOut = {
  item_type: string;
  label: string;
};

export type ShopItemOut = {
  created_at: string;
  equipped?: boolean;
  image?: string | null;
  is_default?: boolean | null;
  item_key?: string | null;
  item_id: number;
  item_type: string;
  name: string;
  owned?: boolean;
  price?: number;
};

export type RoomEquippedItemOut = {
  equipped_at: string;
  equipped_id: number;
  item: ShopItemOut;
  item_type: string;
};

export type RoomOwnerOut = FriendUser & {
  grade: number;
  xp_point: number;
};

export type RoomCharacterOut = {
  character_id?: number | null;
  character_name?: string | null;
  equipped_skin_key?: CharacterCostumeKey | null;
  stage: number;
  state?: string | null;
  xp_point: number;
};

export type RoomView = {
  character?: RoomCharacterOut | null;
  equipped_items: RoomEquippedItemOut[];
  owner: RoomOwnerOut;
  unlocked_achievements?: ServerUnlockedAchievement[];
  wallpaper?: ShopItemOut | null;
};

export type GuestbookOut = {
  content: string;
  created_at: string;
  entry_id: number;
  room_owner_id: number;
  writer_id: number;
  writer_nickname: string;
};

export type GuestbookPage = {
  items: GuestbookOut[];
  next_cursor?: string | null;
};

export type AppConfig = {
  minigame: {
    heart_recovery_minutes: number;
    heart_cost: number;
    max_heart: number;
    reward_coin: number;
  };
  quiz: {
    cooldown_hours: number;
    correct_xp: number;
    daily_limit: number;
    incorrect_xp: number;
    reward_coin: number;
  };
  school_food: {
    feed_coin_cost: number;
    feed_xp: number;
  };
};

export type TutorialFlags = {
  has_seen_game_tutorial?: boolean;
  has_seen_minigame_tutorial?: boolean;
};

export type AppBootstrap = {
  character?: CharacterMeOut | null;
  economy: EconomyStatus;
  room: RoomView;
  shop_items: ShopItemOut[];
  tutorial_flags: TutorialFlags;
  user: UserOut;
};

export type UserPreferenceOut = {
  bgm_volume?: number | null;
  has_seen_game_tutorial?: boolean;
  has_seen_minigame_tutorial?: boolean;
  master_volume?: number | null;
  sfx_volume?: number | null;
  updated_at?: string | null;
};

export type UserPreferenceUpdate = Omit<UserPreferenceOut, "updated_at">;

export type ProfileImageOut = {
  image?: string | null;
};

export type AchievementMaster = {
  achievement_key: string;
  condition_type: string;
  reward_item_key?: string | null;
  reward_type: string;
  reward_value?: number | null;
  sort_order: number;
  target_value: number;
  title: string;
};

export type AchievementProgress = AchievementMaster & {
  claimed: boolean;
  completed: boolean;
  completed_at?: string | null;
  progress_value: number;
};

export type AchievementEventResult = {
  coin: number;
  event_type: string;
  unlocked_achievements: ServerUnlockedAchievement[];
  xp_point: number;
};

export type MiniGameBestScore = {
  best_score: number;
  game_type?: string | null;
  mode?: string | null;
};

export type GraduationSummary = {
  created_at?: string | null;
  feed_count: number;
  graduated_at?: string | null;
  minigame_best_scores: MiniGameBestScore[];
  play_days: number;
  quiz_attempt_count: number;
  quiz_correct_count: number;
  user_id: number;
};

export type DebugMePatch = {
  character_state?: string | null;
  coin?: number | null;
  stage?: number | null;
  xp_point?: number | null;
};

export type DebugMeResult = {
  character?: CharacterMeOut | null;
  user: UserOut;
};

export type ShopItemPurchaseResult = {
  coin: number;
  detail: string;
  item: ShopItemOut;
};

export const refreshAccessToken = async (refreshToken: string) => {
  const response = await booApiRawClient.post<TokenWithRefresh>(
    "/user/refresh",
    {
      refresh_token: refreshToken,
    },
  );

  return response.data;
};

export const requestSignupEmailVerification = async (email: string) => {
  const response = await booApiClient.post<SignupEmailVerificationOut>(
    "/user/signup/email",
    { email },
  );

  return response.data;
};

export const verifySignupEmail = async (params: {
  code: string;
  email: string;
}) => {
  const response = await booApiClient.post<Record<string, never>>(
    "/user/signup/verify",
    params,
  );

  return response.data;
};

export const createUser = async (params: {
  email: string;
  image?: string | null;
  name: string;
  nickname: string;
  password: string;
  student_id: string;
}) => {
  const response = await booApiClient.post<UserOut>("/user/", params);

  return response.data;
};

export const loginUser = async (params: {
  password: string;
  remember_me?: boolean;
  student_id: string;
}) => {
  const response = await booApiClient.post<TokenWithRefresh>(
    "/user/login",
    params,
  );

  return response.data;
};

export const requestPasswordReset = async (studentId: string) => {
  const response = await booApiClient.post<Record<string, never>>(
    "/user/password-reset-request",
    {
      student_id: studentId,
    },
  );

  return response.data;
};

export const confirmPasswordReset = async (params: {
  new_password: string;
  token: string;
}) => {
  const response = await booApiClient.post<Record<string, never>>(
    "/user/password-reset-confirm",
    params,
  );

  return response.data;
};

export const logoutUser = async (refreshToken: string) => {
  const response = await booApiClient.post<Record<string, never>>(
    "/user/logout",
    {
      refresh_token: refreshToken,
    },
  );

  return response.data;
};

export const getCurrentUser = async (accessToken?: string) => {
  const response = await booApiClient.get<UserOut>("/user/me", {
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  });

  return response.data;
};

export const updateCurrentUser = async (
  params: UserAccountUpdate,
  accessToken?: string,
) => {
  const response = await booApiClient.put<UserOut>("/user/me", params, {
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  });

  return response.data;
};

export const deleteCurrentUser = async (accessToken?: string) => {
  const response = await booApiClient.delete<Record<string, never>>(
    "/user/me",
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const updateCurrentUserImage = async (
  imageUrl: string,
  accessToken?: string,
) => {
  const response = await booApiClient.post<ProfileImageOut>(
    "/user/me/image",
    {
      image_url: imageUrl,
    },
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const deleteCurrentUserImage = async (accessToken?: string) => {
  const response = await booApiClient.delete<ProfileImageOut>(
    "/user/me/image",
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const getCurrentUserPreferences = async (accessToken?: string) => {
  const response = await booApiClient.get<UserPreferenceOut>(
    "/user/me/preferences",
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const updateCurrentUserPreferences = async (
  params: UserPreferenceUpdate,
  accessToken?: string,
) => {
  const response = await booApiClient.put<UserPreferenceOut>(
    "/user/me/preferences",
    params,
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const getEconomyStatus = async (accessToken?: string) => {
  const response = await booApiClient.get<EconomyStatus>("/economy/status", {
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  });

  return response.data;
};

export const getAppConfig = async () => {
  const response = await booApiClient.get<AppConfig>("/app/config");

  return response.data;
};

export const getAppBootstrap = async (accessToken?: string) => {
  const response = await booApiClient.get<AppBootstrap>("/app/bootstrap", {
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  });

  return response.data;
};

export const getGraduationSummary = async (accessToken?: string) => {
  const response = await booApiClient.get<GraduationSummary>(
    "/graduation/summary",
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const confirmGraduation = async (accessToken?: string) => {
  const response = await booApiClient.post<GraduationSummary>(
    "/graduation/confirm",
    undefined,
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const patchMyDebugState = async (
  params: DebugMePatch,
  accessToken?: string,
) => {
  const response = await booApiClient.patch<DebugMeResult>(
    "/debug/me",
    params,
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const listAchievements = async () => {
  const response = await booApiClient.get<AchievementMaster[]>(
    "/achievements/",
  );

  return response.data;
};

export const listMyAchievementProgress = async (accessToken?: string) => {
  const response = await booApiClient.get<AchievementProgress[]>(
    "/achievements/me",
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const sendAchievementEvent = async (
  eventType: string,
  accessToken?: string,
) => {
  const response = await booApiClient.post<AchievementEventResult>(
    "/achievements/events",
    {
      event_type: eventType,
    },
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const listTodaySchoolFoods = async () => {
  const response =
    await booApiClient.get<SchoolFoodToday>("/school-foods/today");

  return response.data;
};

export const listSchoolFoods = async (
  type?: string | null,
  accessToken?: string,
) => {
  const response = await booApiClient.get<SchoolFood[]>("/school-foods/", {
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
    params: type ? { type } : undefined,
  });

  return response.data;
};

export const getSchoolFood = async (
  schoolFoodId: number,
  accessToken?: string,
) => {
  const response = await booApiClient.get<SchoolFood>(
    `/school-foods/${schoolFoodId}`,
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const getSchoolFoodFeedStatus = async (accessToken?: string) => {
  const response = await booApiClient.get<SchoolFoodFeedStatus>(
    "/school-foods/feed-status",
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const feedSchoolFood = async (
  schoolFoodId: number,
  accessToken?: string,
) => {
  const response = await booApiClient.post<SchoolFoodFeedResult>(
    "/school-foods/feed",
    {
      school_food_id: schoolFoodId,
    },
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const getQuizPlayStatus = async (accessToken?: string) => {
  const response = await booApiClient.get<QuizPlayStatus>(
    "/quizzes/play-status",
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const getNextQuiz = async (accessToken?: string) => {
  const response = await booApiClient.get<QuizQuestionOut>("/quizzes/next", {
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  });

  return response.data;
};

export const listAvailableQuizzes = async (accessToken?: string) => {
  const response = await booApiClient.get<QuizQuestionOut[]>(
    "/quizzes/available",
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const submitQuizAnswer = async (
  params: {
    answer: string;
    quiz_id: number;
  },
  accessToken?: string,
) => {
  const response = await booApiClient.post<QuizSubmitResult>(
    "/quizzes/submit",
    params,
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const listCharacters = async () => {
  const response = await booApiClient.get<BooCharacter[]>("/characters/");

  return response.data;
};

export const createCharacter = async (params: {
  character_name: string;
  stage?: number | null;
  user_id: number;
}) => {
  const response = await booApiClient.post<BooCharacter>(
    "/characters/",
    params,
  );

  return response.data;
};

export const updateCharacter = async (
  characterId: number,
  params: {
    character_name?: string | null;
    stage?: number | null;
  },
) => {
  const response = await booApiClient.put<BooCharacter>(
    `/characters/${characterId}`,
    params,
  );

  return response.data;
};

export const getCharacter = async (characterId: number) => {
  const response = await booApiClient.get<BooCharacter>(
    `/characters/${characterId}`,
  );

  return response.data;
};

export const deleteCharacter = async (characterId: number) => {
  const response = await booApiClient.delete<Record<string, never>>(
    `/characters/${characterId}`,
  );

  return response.data;
};

export const getMyCharacter = async (accessToken?: string) => {
  const response = await booApiClient.get<CharacterMeOut>("/characters/me", {
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  });

  return response.data;
};

export const updateMyCharacter = async (
  params: CharacterMeUpdate,
  accessToken?: string,
) => {
  const response = await booApiClient.put<CharacterMeOut>(
    "/characters/me",
    params,
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const getMyCharacterMealHealth = async (accessToken?: string) => {
  const response = await booApiClient.get<CharacterMealHealth>(
    "/characters/me/meal-health",
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const addMyCharacterXp = async (
  amount: number,
  reason?: string | null,
  accessToken?: string,
) => {
  const response = await booApiClient.post<CharacterXpResult>(
    "/characters/me/xp",
    {
      amount,
      reason,
    },
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const confirmMyCharacterEvolution = async (accessToken?: string) => {
  const response = await booApiClient.post<CharacterMeOut>(
    "/characters/me/evolve/confirm",
    undefined,
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const applyMyCharacterMealPenalty = async (accessToken?: string) => {
  const response = await booApiClient.post<CharacterMealPenaltyResult>(
    "/characters/me/meal-penalty/apply",
    undefined,
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const listFriends = async (accessToken?: string) => {
  const response = await booApiClient.get<FriendOut[]>("/friends/", {
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  });

  return response.data;
};

export const searchFriendByStudentId = async (
  studentId: string,
  accessToken?: string,
) => {
  const response = await booApiClient.get<FriendUser>(
    `/friends/search/${studentId}`,
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const addServerFriend = async (
  studentId: string,
  accessToken?: string,
) => {
  const response = await booApiClient.post<FriendOut>(
    "/friends/",
    {
      student_id: studentId,
    },
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const deleteServerFriend = async (
  friendId: number,
  accessToken?: string,
) => {
  const response = await booApiClient.delete<Record<string, never>>(
    `/friends/${friendId}`,
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const listFriendRequests = async (accessToken?: string) => {
  const response = await booApiClient.get<FriendRequestOut[]>(
    "/friends/requests",
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const createFriendRequest = async (
  studentId: string,
  accessToken?: string,
) => {
  const response = await booApiClient.post<FriendRequestOut>(
    "/friends/requests",
    {
      student_id: studentId,
    },
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const acceptFriendRequest = async (
  requestId: number,
  accessToken?: string,
) => {
  const response = await booApiClient.post<FriendRequestOut>(
    `/friends/requests/${requestId}/accept`,
    undefined,
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const deleteFriendRequest = async (
  requestId: number,
  accessToken?: string,
) => {
  const response = await booApiClient.delete<Record<string, never>>(
    `/friends/requests/${requestId}`,
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const playMiniGameEconomy = async (accessToken?: string) => {
  const response = await booApiClient.post<MiniGamePlayResult>(
    "/economy/minigame/play",
    undefined,
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const startMiniGameEconomy = async (
  params: {
    game_type: string;
    mode?: MiniGameMode;
  },
  accessToken?: string,
) => {
  const response = await booApiClient.post<MiniGameStartResult>(
    "/economy/minigame/start",
    params,
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const rewardMiniGameEconomy = async (
  params: {
    game_type: string;
    mode?: MiniGameMode;
    play_session_id: string;
    score: number;
    success?: boolean | null;
  },
  accessToken?: string,
) => {
  const response = await booApiClient.post<MiniGameRewardResult>(
    "/economy/minigame/reward",
    params,
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const createMiniGameResult = async (
  params: MiniGameResultCreate,
  accessToken?: string,
) => {
  const response = await booApiClient.post<MiniGameResultOut>(
    "/minigames/results",
    params,
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const listMyMiniGameResults = async (accessToken?: string) => {
  const response = await booApiClient.get<MiniGameResultOut[]>(
    "/minigames/results/me",
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const listMiniGameRankings = async (
  params: {
    game_type?: string;
    limit?: number;
    mode?: MiniGameMode;
  },
  accessToken?: string,
) => {
  const response = await booApiClient.get<MiniGameRankingList>(
    "/minigames/rankings",
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
      params,
    },
  );

  return response.data;
};

export const listFriendMiniGameRankings = async (
  params: {
    game_type?: string;
    limit?: number;
    mode?: MiniGameMode;
  },
  accessToken?: string,
) => {
  const response = await booApiClient.get<MiniGameRankingList>(
    "/minigames/rankings/friends",
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
      params,
    },
  );

  return response.data;
};

export const getMyMiniGameRanking = async (
  params?: {
    game_type?: string;
    mode?: MiniGameMode;
  },
  accessToken?: string,
) => {
  const response = await booApiClient.get<MiniGameRankingMe>(
    "/minigames/ranking/me",
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
      params,
    },
  );

  return response.data;
};

export const listShopItemTypes = async () => {
  const response =
    await booApiClient.get<ShopItemTypeOut[]>("/shop/item-types");

  return response.data;
};

export const listShopItems = async (accessToken?: string) => {
  const response = await booApiClient.get<ShopItemOut[]>("/shop/items", {
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  });

  return response.data;
};

export const purchaseShopItem = async (
  itemId: number,
  accessToken?: string,
) => {
  const response = await booApiClient.post<ShopItemPurchaseResult>(
    `/shop/items/${itemId}/purchase`,
    undefined,
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const getMyRoom = async (accessToken?: string) => {
  const response = await booApiClient.get<RoomView>("/rooms/me", {
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  });

  return response.data;
};

export const equipRoomItem = async (itemId: number, accessToken?: string) => {
  const response = await booApiClient.put<RoomView>(
    "/rooms/me/equip",
    {
      item_id: itemId,
    },
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const unequipRoomItem = async (slot: string, accessToken?: string) => {
  const response = await booApiClient.delete<RoomView>(
    `/rooms/me/equip/${slot}`,
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const getUserRoom = async (userId: number, accessToken?: string) => {
  const response = await booApiClient.get<RoomView>(`/rooms/${userId}`, {
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  });

  return response.data;
};

export const listRoomGuestbook = async (
  userId: number,
  accessToken?: string,
  options?: {
    cursor?: string | null;
    limit?: number;
  },
) => {
  const response = await booApiClient.get<GuestbookPage>(
    `/rooms/${userId}/guestbook`,
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
      params: {
        cursor: options?.cursor ?? undefined,
        limit: options?.limit,
      },
    },
  );

  return response.data;
};

export const createRoomGuestbook = async (
  userId: number,
  content: string,
  accessToken?: string,
) => {
  const response = await booApiClient.post<GuestbookOut>(
    `/rooms/${userId}/guestbook`,
    {
      content,
    },
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const updateRoomGuestbook = async (
  entryId: number,
  content: string,
  accessToken?: string,
) => {
  const response = await booApiClient.put<GuestbookOut>(
    `/rooms/guestbook/${entryId}`,
    {
      content,
    },
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

export const deleteRoomGuestbook = async (
  entryId: number,
  accessToken?: string,
) => {
  const response = await booApiClient.delete<Record<string, never>>(
    `/rooms/guestbook/${entryId}`,
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
  );

  return response.data;
};

const SERVER_ERROR_MESSAGE_TRANSLATIONS: {
  includes: string;
  message: string;
}[] = [
  {
    includes: "Incorrect student_id or password",
    message: "학번 또는 비밀번호를 확인해주세요.",
  },
  {
    includes: "Invalid credentials",
    message: "학번 또는 비밀번호를 확인해주세요.",
  },
  {
    includes: "User not found",
    message: "해당 학번으로 가입된 계정을 찾지 못했어요.",
  },
  {
    includes: "User does not exist",
    message: "해당 학번으로 가입된 계정을 찾지 못했어요.",
  },
  {
    includes: "Password reset email sent",
    message: "비밀번호 재설정 메일을 전송했어요.",
  },
  {
    includes: "Password reset token expired",
    message: "재설정 토큰이 만료되었어요. 다시 요청해주세요.",
  },
  {
    includes: "Invalid password reset token",
    message: "재설정 토큰이 올바르지 않아요.",
  },
  {
    includes: "Invalid or expired password reset token",
    message: "재설정 토큰이 올바르지 않거나 만료되었어요.",
  },
  {
    includes: "Invalid or expired reset token",
    message: "재설정 토큰이 올바르지 않거나 만료되었어요.",
  },
  {
    includes: "Password reset token is invalid",
    message: "재설정 토큰이 올바르지 않아요.",
  },
  {
    includes: "Password reset token is expired",
    message: "재설정 토큰이 만료되었어요. 다시 요청해주세요.",
  },
  {
    includes: "Password has been reset",
    message: "비밀번호가 변경됐어요.",
  },
  {
    includes: "Password must",
    message: "비밀번호는 8자 이상, 영문과 숫자를 포함해야 해요.",
  },
  {
    includes: "new_password",
    message: "새 비밀번호를 확인해주세요.",
  },
  {
    includes: "Could not validate credentials",
    message: "로그인 정보가 만료되었어요. 다시 로그인해주세요.",
  },
  {
    includes: "Not authenticated",
    message: "로그인이 필요해요.",
  },
  {
    includes: "Email not verified",
    message: "이메일 인증을 먼저 완료해주세요.",
  },
  {
    includes: "Email must end with @hufs.ac.kr",
    message: "한국외대 이메일(@hufs.ac.kr)만 사용할 수 있어요.",
  },
  {
    includes: "Email already registered",
    message: "이미 가입된 이메일이에요.",
  },
  {
    includes: "Email already exists",
    message: "이미 가입된 이메일이에요.",
  },
  {
    includes: "Email is already registered",
    message: "이미 가입된 이메일이에요.",
  },
  {
    includes: "Email has already been verified",
    message: "이미 인증된 이메일이에요.",
  },
  {
    includes: "Verification code sent",
    message: "인증번호를 이메일로 전송했어요.",
  },
  {
    includes: "Failed to send email",
    message: "인증 메일 전송에 실패했어요. 잠시 후 다시 시도해주세요.",
  },
  {
    includes: "Could not send email",
    message: "인증 메일 전송에 실패했어요. 잠시 후 다시 시도해주세요.",
  },
  {
    includes: "SMTP",
    message: "인증 메일 전송에 실패했어요. 잠시 후 다시 시도해주세요.",
  },
  {
    includes: "Verification code expired",
    message: "인증번호가 만료되었어요. 다시 요청해주세요.",
  },
  {
    includes: "Invalid verification code",
    message: "인증번호가 올바르지 않아요.",
  },
  {
    includes: "Invalid or expired verification code",
    message: "인증번호가 올바르지 않거나 만료되었어요.",
  },
  {
    includes: "value is not a valid email address",
    message: "올바른 이메일 형식으로 입력해주세요.",
  },
  {
    includes: "An email address must have an @-sign",
    message: "이메일에 @를 포함해주세요.",
  },
  {
    includes: "The email address is not valid",
    message: "올바른 이메일 형식으로 입력해주세요.",
  },
  {
    includes: "email address is not valid",
    message: "올바른 이메일 형식으로 입력해주세요.",
  },
  {
    includes: "field required",
    message: "필수 정보를 입력해주세요.",
  },
  {
    includes: "Input should be a valid string",
    message: "문자 형식으로 입력해주세요.",
  },
  {
    includes: "Input should be a valid integer",
    message: "숫자 형식으로 입력해주세요.",
  },
];

const containsEnglishText = (message: string) => /[A-Za-z]/.test(message);

const translateServerErrorMessage = (message: string, fallback?: string) => {
  const matchedTranslation = SERVER_ERROR_MESSAGE_TRANSLATIONS.find(
    (translation) => message.includes(translation.includes),
  );

  if (matchedTranslation) {
    return matchedTranslation.message;
  }

  return fallback && containsEnglishText(message) ? fallback : message;
};

const extractServerDetailMessage = (detail: unknown) => {
  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const firstMessage = detail[0]?.msg;

    if (typeof firstMessage === "string") {
      return firstMessage;
    }
  }

  return null;
};

export const getServerApiErrorMessage = (
  error: unknown,
  fallbackMessage = "요청을 처리하지 못했어요.",
) => {
  if (!isAxiosError(error)) {
    return fallbackMessage;
  }

  const detailMessage = extractServerDetailMessage(
    error.response?.data?.detail,
  );

  if (detailMessage) {
    return translateServerErrorMessage(detailMessage, fallbackMessage);
  }

  if (typeof error.response?.data?.message === "string") {
    return translateServerErrorMessage(
      error.response.data.message,
      fallbackMessage,
    );
  }

  return fallbackMessage;
};
