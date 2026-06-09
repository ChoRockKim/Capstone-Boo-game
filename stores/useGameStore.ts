/**
 * @description  게임 전역 상태와 XP/식사/퀴즈/친구/마이룸/설정 액션을 관리하는 Zustand store입니다.
 * @depends      components/FriendList/FriendListDummyData.ts, components/MealPanel/MealMenuData.ts, components/QuizPanel/QuizData.ts, components/Room/RoomData.ts, constants/character.ts, utils/xpProgress.ts
 * @used-by      app/_layout.tsx, app/game/index.tsx, app/room/index.tsx, components/* 패널
 * @side-effects AsyncStorage persist, Zustand 상태 변경, eating timeout 관리
 */
import { FriendListItem } from "@/components/FriendList/FriendListDummyData";
import {
  getLatestCompletedMealSlotIndex,
  getLocalDateKey,
  getMealSlotIndex,
  MealDayMode,
  MealHistory,
  MealSectionId,
} from "@/components/MealPanel/MealMenuData";
import {
  getQuizCooldownEndAt,
  getQuizDailyCountForDate,
  getQuizLocalDateKey,
  isQuizAvailableByCooldown,
  QUIZ_CORRECT_COIN_REWARD,
  QUIZ_CORRECT_XP_REWARD,
  QUIZ_DAILY_LIMIT,
  QUIZ_WRONG_XP_PENALTY,
  QuizAttemptHistory,
} from "@/components/QuizPanel/QuizData";
import {
  DEFAULT_EQUIPPED_ROOM_ITEMS,
  DEFAULT_EQUIPPED_ROOM_WALLPAPER,
  DEFAULT_OWNED_ROOM_ITEMS,
  DEFAULT_OWNED_ROOM_WALLPAPERS,
  EquippedRoomItems,
  ROOM_ITEM_ASSETS,
  ROOM_WALLPAPER_ASSETS,
  RoomItemId,
  RoomSlotId,
  RoomWallpaperId,
} from "@/components/Room/RoomData";
import {
  ACHIEVEMENT_DEFINITIONS,
  type AchievementConditionType,
  type AchievementReward,
  type AchievementSkinKey,
  type UnlockedAchievement,
} from "@/constants/achievements";
import {
  CharacterCostumeKey,
  CharacterGrade,
  CharacterLifeStage,
  CharacterState,
} from "@/constants/character";
import {
  type AchievementProgress,
  listMyAchievementProgress,
  setBooApiAccessToken,
  setBooApiTokenRefreshHandlers,
  type ServerUnlockedAchievement,
  sendAchievementEvent,
  updateCurrentUserPreferences,
  updateCharacter,
  updateMyCharacter,
} from "@/utils/serverApi";
import { consumeMiniGameHeart } from "@/utils/miniGameHeart";
import { getTotalXpForGrade, getXpProgressInfo } from "@/utils/xpProgress";
import { create } from "zustand";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";

const EATING_DURATION_MS = 2000;
const FEED_XP_REWARD = 50;
const HUNGRY_MEAL_SKIP_THRESHOLD = 6;
const MEAL_SKIP_XP_PENALTY = 20;
const DEFAULT_CHARACTER_STATE: CharacterState = "basic1";
const DEFAULT_MASTER_VOLUME = 1;
const DEFAULT_BGM_VOLUME = 1;
const DEFAULT_SFX_VOLUME = 1;
const GUEST_DEFAULT_STUDENT_ID = "00000000";
const GUEST_DEFAULT_USER_NAME = "외대생";
const GUEST_DEFAULT_USER_NICKNAME = "부";
const LEGACY_DEFAULT_STUDENT_ID = "202101108";
const LEGACY_DEFAULT_USER_NAME = "김외대";
const noopStorage: StateStorage = {
  getItem: async () => null,
  removeItem: async () => {},
  setItem: async () => {},
};

const normalizeEvolutionResumeState = (
  characterState: CharacterState,
): CharacterState => {
  if (characterState === "happy1" || characterState === "happy2") {
    return DEFAULT_CHARACTER_STATE;
  }

  return characterState;
};

export type EvolutionTrigger = "meal" | "quiz" | "xp";

export type PendingEvolution = {
  fromGrade: CharacterGrade;
  id: number;
  readyAt: number | null;
  resumeState: CharacterState;
  toGrade: CharacterGrade;
  toLifeStage: CharacterLifeStage;
  trigger: EvolutionTrigger;
};

export type MealStatusSyncResult = {
  skippedMealCount: number;
  xpPenalty: number;
};

export type RoomWallpaperPurchaseResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: "already_owned" | "insufficient_coin" | "not_found";
    };

export type RoomItemPurchaseResult = RoomWallpaperPurchaseResult;

export type GuestbookEntry = {
  authorName: string;
  authorStudentId: string;
  createdAt: string;
  friendId: string;
  id: string;
  message: string;
};

export type GuestbookEntriesByFriendId = Record<string, GuestbookEntry[]>;

export type AchievementStats = {
  feedCount: number;
  friendAddCount: number;
  hasFirstLogin: boolean;
  hasVisitedCampus: boolean;
  hasEnteredRoom: boolean;
  miniGameBestScores: {
    catchBoo: number;
    catchTheMajor: number;
    freeThrow: number;
  };
  miniGamePlayCount: number;
  quizCorrectCount: number;
  roomItemEquipCount: number;
};

type GuestGameSnapshot = {
  achievementStats: AchievementStats;
  appliedSkippedMealPenaltyCount: number;
  booName: string;
  characterCostumeKey: CharacterCostumeKey;
  characterState: CharacterState;
  coin: number;
  completedAchievementKeys: string[];
  equippedRoomItems: EquippedRoomItems;
  equippedRoomWallpaper: RoomWallpaperId;
  friendList: FriendListItem[];
  guestbookEntries: GuestbookEntriesByFriendId;
  hasSeenGameTutorial: boolean;
  hasSeenMiniGameTutorial: boolean;
  heart: number;
  heartUpdatedAt: string | null;
  lastFedMeals: MealHistory;
  lastFedMealSlotIndex: number;
  maxHeart: number;
  mealDayMode: MealDayMode;
  mealRestrictionEnabled: boolean;
  ownedAchievementSkins: AchievementSkinKey[];
  ownedRoomItems: RoomItemId[];
  ownedRoomWallpapers: RoomWallpaperId[];
  quizAttemptHistory: QuizAttemptHistory;
  quizDailyCount: number;
  quizDailyCountDateKey: string;
  quizDailyLimitEnabled: boolean;
  skippedMealCount: number;
  studentId: string;
  totalXp: number;
  userCreatedAt: string | null;
  userName: string;
  userNickname: string;
};

type GameStoreState = {
  accessToken: string | null;
  appliedSkippedMealPenaltyCount: number;
  autoLoginEnabled: boolean;
  achievementAlertQueue: UnlockedAchievement[];
  achievementStats: AchievementStats;
  booName: string;
  characterCostumeKey: CharacterCostumeKey;
  characterState: CharacterState;
  coin: number;
  developerModeEnabled: boolean;
  equippedRoomItems: EquippedRoomItems;
  equippedRoomWallpaper: RoomWallpaperId;
  friendList: FriendListItem[];
  guestbookEntries: GuestbookEntriesByFriendId;
  guestGameSnapshot: GuestGameSnapshot | null;
  hasSeenGameTutorial: boolean;
  hasSeenMiniGameTutorial: boolean;
  hasSyncedServerAchievements: boolean;
  heart: number;
  heartUpdatedAt: string | null;
  isGuestMode: boolean;
  lastFedMeals: MealHistory;
  lastFedMealSlotIndex: number;
  masterVolume: number;
  maxHeart: number;
  mealDayMode: MealDayMode;
  mealRestrictionEnabled: boolean;
  ownedRoomItems: RoomItemId[];
  ownedRoomWallpapers: RoomWallpaperId[];
  ownedAchievementSkins: AchievementSkinKey[];
  pendingEvolution: PendingEvolution | null;
  completedAchievementKeys: string[];
  quizAttemptHistory: QuizAttemptHistory;
  quizDailyCount: number;
  quizDailyCountDateKey: string;
  quizDailyLimitEnabled: boolean;
  refreshToken: string | null;
  serverCharacterId: number | null;
  bgmVolume: number;
  skippedMealCount: number;
  sfxVolume: number;
  studentId: string;
  totalXp: number;
  userCreatedAt: string | null;
  userEmail: string;
  userEmailVerified: boolean;
  userId: number | null;
  userImage: string | null;
  userName: string;
  userNickname: string;
};

type GameStoreActions = {
  adjustCoin: (delta: number) => void;
  adjustXp: (delta: number) => void;
  addSkippedMealForTest: () => void;
  addFriend: (friend: FriendListItem) => void;
  addGuestbookEntry: (
    friendId: string,
    message: string,
    createdAt?: Date,
  ) => GuestbookEntry | null;
  applyServerMealFeed: (result: {
    coin: number;
    countAchievement?: boolean;
    mealSectionId: MealSectionId | null;
    totalXp: number;
    unlockedAchievements?: ServerUnlockedAchievement[];
  }) => void;
  applyServerQuizSubmit: (result: {
    coin: number;
    countAchievement?: boolean;
    isCorrect: boolean;
    totalXp: number;
    unlockedAchievements?: ServerUnlockedAchievement[];
  }) => void;
  applyServerUnlockedAchievements: (
    unlockedAchievements?: ServerUnlockedAchievement[] | null,
    syncState?: {
      coin?: number;
      totalXp?: number;
    },
  ) => void;
  clearPendingEvolution: () => void;
  clearAuthSession: () => void;
  clearMealHistory: () => void;
  clearQuizHistory: () => void;
  consumeMiniGameHeart: (nowMs?: number) => boolean;
  dismissAchievementAlert: () => void;
  feedBoo: (mealCost: number, mealSectionId: MealSectionId | null) => boolean;
  purchaseRoomItem: (itemId: RoomItemId) => RoomItemPurchaseResult;
  purchaseRoomWallpaper: (
    wallpaperId: RoomWallpaperId,
  ) => RoomWallpaperPurchaseResult;
  removeFriend: (friendId: string) => void;
  recordCampusVisit: () => void;
  recordMiniGameResult: (
    gameId: keyof AchievementStats["miniGameBestScores"],
    score: number,
  ) => void;
  recordServerMiniGamePlay: () => void;
  recordRoomEnter: () => void;
  recordRoomItemEquip: () => void;
  resetGuestGameData: () => void;
  resetGameState: () => void;
  setAuthSession: (session: {
    accessToken: string;
    autoLoginEnabled: boolean;
    refreshToken: string;
    unlockedAchievements?: ServerUnlockedAchievement[] | null;
  }) => void;
  setBooName: (booName: string) => void;
  setCharacterState: (characterState: CharacterState) => void;
  setCharacterCostumeKey: (characterCostumeKey: CharacterCostumeKey) => void;
  setCoin: (coin: number) => void;
  setDeveloperModeEnabled: (enabled: boolean) => void;
  setEquippedRoomItem: (slotId: RoomSlotId, itemId: RoomItemId) => void;
  setEquippedRoomWallpaper: (wallpaperId: RoomWallpaperId) => void;
  setFriendList: (friendList: FriendListItem[]) => void;
  setGameState: (
    patch: Partial<GameStoreState>,
    options?: { resolveAchievements?: boolean },
  ) => void;
  syncServerAchievementProgress: (
    achievements?: AchievementProgress[] | null,
  ) => void;
  setHasSeenGameTutorial: (hasSeenGameTutorial: boolean) => void;
  setHasSeenMiniGameTutorial: (hasSeenMiniGameTutorial: boolean) => void;
  setMasterVolume: (volume: number) => void;
  setGrade: (grade: CharacterGrade) => void;
  setBgmVolume: (volume: number) => void;
  setMealDayMode: (mode: MealDayMode) => void;
  setMealRestrictionEnabled: (enabled: boolean) => void;
  setServerCharacterId: (serverCharacterId: number | null) => void;
  setSfxVolume: (volume: number) => void;
  setStudentId: (studentId: string) => void;
  setTotalXp: (totalXp: number) => void;
  setUserEmail: (userEmail: string) => void;
  setUserName: (userName: string) => void;
  setUserNickname: (userNickname: string) => void;
  startGuestMode: () => void;
  submitQuizAttempt: (
    quizId: string,
    isCorrect: boolean,
    attemptedAt?: Date,
  ) =>
    | {
        nextAvailableAt: string | null;
        ok: false;
        reason: "cooldown" | "daily_limit";
      }
    | {
        coinDelta: number;
        ok: true;
        xpDelta: number;
      };
  syncMealStatus: (preserveEatingState?: boolean) => MealStatusSyncResult;
  toggleQuizDailyLimitEnabled: () => void;
  toggleMealRestrictionEnabled: () => void;
  toggleDeveloperModeEnabled: () => void;
};

export type GameStore = GameStoreState & GameStoreActions;

const clampVolume = (volume: number) => Math.max(0, Math.min(volume, 1));

const createInitialGameState = (): GameStoreState => ({
  accessToken: null,
  appliedSkippedMealPenaltyCount: 0,
  autoLoginEnabled: false,
  achievementAlertQueue: [],
  achievementStats: {
    feedCount: 0,
    friendAddCount: 0,
    hasFirstLogin: false,
    hasVisitedCampus: false,
    hasEnteredRoom: false,
    miniGameBestScores: {
      catchBoo: 0,
      catchTheMajor: 0,
      freeThrow: 0,
    },
    miniGamePlayCount: 0,
    quizCorrectCount: 0,
    roomItemEquipCount: 0,
  },
  userName: "김외대",
  booName: "부",
  coin: 100,
  developerModeEnabled: false,
  equippedRoomItems: { ...DEFAULT_EQUIPPED_ROOM_ITEMS },
  equippedRoomWallpaper: DEFAULT_EQUIPPED_ROOM_WALLPAPER,
  friendList: [],
  guestbookEntries: {},
  guestGameSnapshot: null,
  hasSeenGameTutorial: false,
  hasSeenMiniGameTutorial: false,
  hasSyncedServerAchievements: false,
  heart: 5,
  heartUpdatedAt: null,
  isGuestMode: false,
  characterCostumeKey: "default",
  characterState: DEFAULT_CHARACTER_STATE,
  lastFedMeals: {},
  lastFedMealSlotIndex: getLatestCompletedMealSlotIndex(),
  masterVolume: DEFAULT_MASTER_VOLUME,
  maxHeart: 5,
  mealDayMode: "auto",
  mealRestrictionEnabled: true,
  ownedRoomItems: [...DEFAULT_OWNED_ROOM_ITEMS],
  ownedRoomWallpapers: [...DEFAULT_OWNED_ROOM_WALLPAPERS],
  ownedAchievementSkins: [],
  pendingEvolution: null,
  completedAchievementKeys: [],
  quizAttemptHistory: {},
  quizDailyCount: 0,
  quizDailyCountDateKey: "",
  quizDailyLimitEnabled: true,
  refreshToken: null,
  serverCharacterId: null,
  bgmVolume: DEFAULT_BGM_VOLUME,
  skippedMealCount: 0,
  sfxVolume: DEFAULT_SFX_VOLUME,
  studentId: "202101108",
  totalXp: 0,
  userCreatedAt: new Date().toISOString(),
  userEmail: "",
  userEmailVerified: false,
  userId: null,
  userImage: null,
  userNickname: "김외대",
});

export const initialGameState: GameStoreState = createInitialGameState();

let eatingTimeoutRef: ReturnType<typeof setTimeout> | null = null;
let pendingEvolutionIdRef = 0;

const normalizeAchievementStats = (
  achievementStats?: Partial<AchievementStats> | null,
): AchievementStats => {
  const initialAchievementStats = createInitialGameState().achievementStats;

  return {
    ...initialAchievementStats,
    ...achievementStats,
    miniGameBestScores: {
      ...initialAchievementStats.miniGameBestScores,
      ...achievementStats?.miniGameBestScores,
    },
  };
};

const createGuestGameSnapshot = (
  state: GameStoreState,
): GuestGameSnapshot => ({
  achievementStats: normalizeAchievementStats(state.achievementStats),
  appliedSkippedMealPenaltyCount: state.appliedSkippedMealPenaltyCount,
  booName: state.booName,
  characterCostumeKey: state.characterCostumeKey,
  characterState: state.characterState,
  coin: state.coin,
  completedAchievementKeys: [...state.completedAchievementKeys],
  equippedRoomItems: { ...state.equippedRoomItems },
  equippedRoomWallpaper: state.equippedRoomWallpaper,
  friendList: [...state.friendList],
  guestbookEntries: state.guestbookEntries,
  hasSeenGameTutorial: state.hasSeenGameTutorial,
  hasSeenMiniGameTutorial: state.hasSeenMiniGameTutorial,
  heart: state.heart,
  heartUpdatedAt: state.heartUpdatedAt,
  lastFedMeals: { ...state.lastFedMeals },
  lastFedMealSlotIndex: state.lastFedMealSlotIndex,
  maxHeart: state.maxHeart,
  mealDayMode: state.mealDayMode,
  mealRestrictionEnabled: state.mealRestrictionEnabled,
  ownedAchievementSkins: [...state.ownedAchievementSkins],
  ownedRoomItems: [...state.ownedRoomItems],
  ownedRoomWallpapers: [...state.ownedRoomWallpapers],
  quizAttemptHistory: { ...state.quizAttemptHistory },
  quizDailyCount: state.quizDailyCount,
  quizDailyCountDateKey: state.quizDailyCountDateKey,
  quizDailyLimitEnabled: state.quizDailyLimitEnabled,
  skippedMealCount: state.skippedMealCount,
  studentId:
    !state.studentId || state.studentId === LEGACY_DEFAULT_STUDENT_ID
      ? GUEST_DEFAULT_STUDENT_ID
      : state.studentId,
  totalXp: state.totalXp,
  userCreatedAt: state.userCreatedAt,
  userName:
    !state.userName || state.userName === LEGACY_DEFAULT_USER_NAME
      ? GUEST_DEFAULT_USER_NAME
      : state.userName,
  userNickname:
    !state.userNickname || state.userNickname === LEGACY_DEFAULT_USER_NAME
      ? GUEST_DEFAULT_USER_NICKNAME
      : state.userNickname,
});

const getGuestStudentId = (studentId?: string | null) =>
  !studentId || studentId === LEGACY_DEFAULT_STUDENT_ID
    ? GUEST_DEFAULT_STUDENT_ID
    : studentId;

const getGuestUserName = (userName?: string | null) =>
  !userName || userName === LEGACY_DEFAULT_USER_NAME
    ? GUEST_DEFAULT_USER_NAME
    : userName;

const getGuestUserNickname = (userNickname?: string | null) =>
  !userNickname || userNickname === LEGACY_DEFAULT_USER_NAME
    ? GUEST_DEFAULT_USER_NICKNAME
    : userNickname;

const normalizeGuestGameSnapshot = (
  snapshot?: GuestGameSnapshot | null,
): GuestGameSnapshot | null =>
  snapshot
    ? {
        ...snapshot,
        achievementStats: normalizeAchievementStats(snapshot.achievementStats),
        studentId: getGuestStudentId(snapshot.studentId),
        userName: getGuestUserName(snapshot.userName),
        userNickname: getGuestUserNickname(snapshot.userNickname),
      }
    : null;

const clearEatingTimeout = () => {
  if (eatingTimeoutRef) {
    clearTimeout(eatingTimeoutRef);
    eatingTimeoutRef = null;
  }
};

const getNextPendingEvolutionId = () => {
  pendingEvolutionIdRef += 1;

  return pendingEvolutionIdRef;
};

const createPendingEvolution = ({
  currentPendingEvolution,
  currentTotalXp,
  nextTotalXp,
  readyAt = null,
  resumeState,
  trigger,
}: {
  currentPendingEvolution: PendingEvolution | null;
  currentTotalXp: number;
  nextTotalXp: number;
  readyAt?: number | null;
  resumeState: CharacterState;
  trigger: EvolutionTrigger;
}): PendingEvolution | null => {
  const currentXpInfo = getXpProgressInfo(currentTotalXp);
  const nextXpInfo = getXpProgressInfo(nextTotalXp);

  if (nextXpInfo.lifeStage === currentXpInfo.lifeStage) {
    return currentPendingEvolution;
  }

  if (currentPendingEvolution) {
    const toLifeStage =
      nextXpInfo.lifeStage === "graduate"
        ? "graduate"
        : currentPendingEvolution.toLifeStage === "graduate"
          ? "graduate"
          : (Math.max(
              currentPendingEvolution.toLifeStage,
              nextXpInfo.grade,
            ) as CharacterGrade);

    return {
      ...currentPendingEvolution,
      toGrade: Math.max(
        currentPendingEvolution.toGrade,
        nextXpInfo.grade,
      ) as CharacterGrade,
      toLifeStage,
    };
  }

  return {
    id: getNextPendingEvolutionId(),
    fromGrade: currentXpInfo.grade,
    readyAt,
    resumeState: normalizeEvolutionResumeState(resumeState),
    toGrade: nextXpInfo.grade,
    toLifeStage: nextXpInfo.lifeStage,
    trigger,
  };
};

const getAchievementProgressValue = (
  state: GameStoreState,
  conditionType: (typeof ACHIEVEMENT_DEFINITIONS)[number]["conditionType"],
) => {
  switch (conditionType) {
    case "achievement_completed_count":
      return state.completedAchievementKeys.length;
    case "campus_first_visit":
      return state.achievementStats.hasVisitedCampus ? 1 : 0;
    case "feed_count":
      return state.achievementStats.feedCount;
    case "first_login":
      return state.achievementStats.hasFirstLogin ? 1 : 0;
    case "friend_count":
      return Math.max(
        state.achievementStats.friendAddCount,
        state.friendList.length,
      );
    case "minigame_play_count":
      return state.achievementStats.miniGamePlayCount;
    case "quiz_correct_count":
      return state.achievementStats.quizCorrectCount;
    case "room_first_enter":
      return state.achievementStats.hasEnteredRoom ? 1 : 0;
    case "room_item_equip_count":
      return state.achievementStats.roomItemEquipCount;
    case "total_xp":
      return state.totalXp;
  }
};

const isAchievementSkinKey = (
  value: string | null | undefined,
): value is AchievementSkinKey =>
  value === "skin_creation" ||
  value === "skin_peace" ||
  value === "skin_truth";

const getServerAchievementReward = (
  achievement: Pick<
    ServerUnlockedAchievement | AchievementProgress,
    "reward_item_key" | "reward_type" | "reward_value"
  >,
): AchievementReward => {
  const rewardType = achievement.reward_type.toLowerCase();
  const rewardValue = achievement.reward_value ?? undefined;
  const reward: AchievementReward = {};

  if (rewardType === "coin" && typeof rewardValue === "number") {
    reward.coin = rewardValue;
  }

  if (
    (rewardType === "xp" || rewardType === "xp_point") &&
    typeof rewardValue === "number"
  ) {
    reward.xp = rewardValue;
  }

  if (
    (rewardType === "skin" || rewardType === "item") &&
    isAchievementSkinKey(achievement.reward_item_key)
  ) {
    reward.skinKey = achievement.reward_item_key;
  }

  return reward;
};

const getServerAchievementSkinKeys = (
  achievements: Array<
    Pick<
      ServerUnlockedAchievement | AchievementProgress,
      "reward_item_key" | "reward_type"
    >
  >,
) =>
  achievements.reduce<AchievementSkinKey[]>((skinKeys, achievement) => {
    if (
      (achievement.reward_type === "skin" ||
        achievement.reward_type === "item") &&
      isAchievementSkinKey(achievement.reward_item_key)
    ) {
      skinKeys.push(achievement.reward_item_key);
    }

    return skinKeys;
  }, []);

const getMaxServerAchievementProgressValue = (
  achievements: AchievementProgress[],
  conditionType: AchievementConditionType,
) =>
  achievements.reduce((maxProgress, achievement) => {
    if (achievement.condition_type !== conditionType) {
      return maxProgress;
    }

    return Math.max(maxProgress, achievement.progress_value);
  }, 0);

const hasCompletedServerAchievement = (
  achievements: AchievementProgress[],
  conditionType: AchievementConditionType,
) =>
  achievements.some(
    (achievement) =>
      achievement.condition_type === conditionType &&
      (achievement.completed || achievement.claimed),
  );

const syncAchievementStatsFromServerProgress = (
  currentStats: AchievementStats,
  achievements: AchievementProgress[],
): AchievementStats => ({
  ...currentStats,
  feedCount: Math.max(
    currentStats.feedCount,
    getMaxServerAchievementProgressValue(achievements, "feed_count"),
  ),
  friendAddCount: Math.max(
    currentStats.friendAddCount,
    getMaxServerAchievementProgressValue(achievements, "friend_count"),
  ),
  hasEnteredRoom:
    currentStats.hasEnteredRoom ||
    hasCompletedServerAchievement(achievements, "room_first_enter") ||
    getMaxServerAchievementProgressValue(achievements, "room_first_enter") >= 1,
  hasFirstLogin:
    currentStats.hasFirstLogin ||
    hasCompletedServerAchievement(achievements, "first_login") ||
    getMaxServerAchievementProgressValue(achievements, "first_login") >= 1,
  hasVisitedCampus:
    currentStats.hasVisitedCampus ||
    hasCompletedServerAchievement(achievements, "campus_first_visit") ||
    getMaxServerAchievementProgressValue(achievements, "campus_first_visit") >=
      1,
  miniGameBestScores: {
    catchBoo: currentStats.miniGameBestScores?.catchBoo ?? 0,
    catchTheMajor: currentStats.miniGameBestScores?.catchTheMajor ?? 0,
    freeThrow: currentStats.miniGameBestScores?.freeThrow ?? 0,
  },
  miniGamePlayCount: Math.max(
    currentStats.miniGamePlayCount,
    getMaxServerAchievementProgressValue(achievements, "minigame_play_count"),
  ),
  quizCorrectCount: Math.max(
    currentStats.quizCorrectCount,
    getMaxServerAchievementProgressValue(achievements, "quiz_correct_count"),
  ),
  roomItemEquipCount: Math.max(
    currentStats.roomItemEquipCount,
    getMaxServerAchievementProgressValue(achievements, "room_item_equip_count"),
  ),
});

const resolveAchievementRewards = (
  nextState: GameStoreState,
  unlockedAt = new Date().toISOString(),
): Partial<GameStoreState> => {
  if (nextState.accessToken) {
    return nextState;
  }

  let completedAchievementKeys = [...nextState.completedAchievementKeys];
  let coin = nextState.coin;
  let totalXp = nextState.totalXp;
  let pendingEvolution = nextState.pendingEvolution;
  let ownedAchievementSkins = [...nextState.ownedAchievementSkins];
  const unlockedAchievements: UnlockedAchievement[] = [];
  let didUnlockAchievement = true;

  while (didUnlockAchievement) {
    didUnlockAchievement = false;

    const completedKeySet = new Set(completedAchievementKeys);
    const stateForProgress = {
      ...nextState,
      completedAchievementKeys,
      coin,
      ownedAchievementSkins,
      pendingEvolution,
      totalXp,
    };

    ACHIEVEMENT_DEFINITIONS.forEach((achievement) => {
      if (
        completedKeySet.has(achievement.key) ||
        getAchievementProgressValue(stateForProgress, achievement.conditionType) <
          achievement.targetValue
      ) {
        return;
      }

      didUnlockAchievement = true;
      completedKeySet.add(achievement.key);
      completedAchievementKeys = [...completedAchievementKeys, achievement.key];

      const reward = achievement.reward as AchievementReward;

      if (reward.coin) {
        coin += reward.coin;
      }

      if (reward.xp) {
        const nextTotalXp = Math.max(totalXp + reward.xp, 0);

        pendingEvolution = createPendingEvolution({
          currentPendingEvolution: pendingEvolution,
          currentTotalXp: totalXp,
          nextTotalXp,
          resumeState: nextState.characterState,
          trigger: "xp",
        });
        totalXp = nextTotalXp;
      }

      if (
        reward.skinKey &&
        !ownedAchievementSkins.includes(reward.skinKey)
      ) {
        ownedAchievementSkins = [
          ...ownedAchievementSkins,
          reward.skinKey,
        ];
      }

      unlockedAchievements.push({
        key: achievement.key,
        reward,
        title: achievement.title,
        unlockedAt,
      });
    });
  }

  if (unlockedAchievements.length === 0) {
    return nextState;
  }

  return {
    achievementAlertQueue: [
      ...nextState.achievementAlertQueue,
      ...unlockedAchievements,
    ],
    completedAchievementKeys,
    coin,
    ownedAchievementSkins,
    pendingEvolution,
    totalXp,
  };
};

const resolvePersistStorage = (): StateStorage => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const asyncStorageModule = require("@react-native-async-storage/async-storage");
    const asyncStorage = asyncStorageModule?.default;

    if (
      asyncStorage &&
      typeof asyncStorage.getItem === "function" &&
      typeof asyncStorage.setItem === "function" &&
      typeof asyncStorage.removeItem === "function"
    ) {
      return asyncStorage;
    }
  } catch {
    // fall through to noop storage
  }

  console.warn(
    "AsyncStorage native module is unavailable. Falling back to in-memory storage until the app is rebuilt.",
  );

  return noopStorage;
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...createInitialGameState(),
      adjustCoin: (delta) =>
        set((state) => ({
          coin: Math.max(state.coin + delta, 0),
        })),
      adjustXp: (delta) =>
        set((state) => {
          const nextTotalXp = Math.max(state.totalXp + delta, 0);
          const nextState = {
            ...state,
            pendingEvolution: createPendingEvolution({
              currentPendingEvolution: state.pendingEvolution,
              currentTotalXp: state.totalXp,
              nextTotalXp,
              resumeState: state.characterState,
              trigger: "xp" as const,
            }),
            totalXp: nextTotalXp,
          };

          return {
            ...nextState,
            ...resolveAchievementRewards(nextState),
          };
        }),
      addSkippedMealForTest: () => {
        clearEatingTimeout();

        set((state) => {
          const latestCompletedMealSlotIndex =
            getLatestCompletedMealSlotIndex();
          const nextLastFedMealSlotIndex =
            Math.min(state.lastFedMealSlotIndex, latestCompletedMealSlotIndex) -
            1;
          const skippedMealCount = Math.max(
            latestCompletedMealSlotIndex - nextLastFedMealSlotIndex,
            0,
          );
          const totalSkippedMealPenaltyCount = Math.max(
            skippedMealCount - HUNGRY_MEAL_SKIP_THRESHOLD,
            0,
          );
          const nextPenaltyCount = Math.max(
            totalSkippedMealPenaltyCount - state.appliedSkippedMealPenaltyCount,
            0,
          );
          const nextTotalXp =
            nextPenaltyCount > 0
              ? Math.max(
                  state.totalXp - nextPenaltyCount * MEAL_SKIP_XP_PENALTY,
                  0,
                )
              : state.totalXp;
          const normalizedCharacterState = normalizeEvolutionResumeState(
            state.characterState,
          );
          const nextCharacterState =
            skippedMealCount >= HUNGRY_MEAL_SKIP_THRESHOLD
              ? "hungry"
              : normalizedCharacterState === "hungry" ||
                  normalizedCharacterState === "eating"
                ? DEFAULT_CHARACTER_STATE
                : normalizedCharacterState;

          return {
            appliedSkippedMealPenaltyCount: totalSkippedMealPenaltyCount,
            characterState: nextCharacterState,
            lastFedMealSlotIndex: nextLastFedMealSlotIndex,
            skippedMealCount,
            totalXp: nextTotalXp,
          };
        });
      },
      addFriend: (friend) =>
        set((state) => {
          if (
            state.friendList.some(
              (item) =>
                item.id === friend.id ||
                item.studentId === friend.studentId ||
                (friend.serverFriendId !== undefined &&
                  item.serverFriendId === friend.serverFriendId),
            )
          ) {
            return state;
          }

          const nextState = {
            ...state,
            achievementStats: {
              ...state.achievementStats,
              friendAddCount: state.achievementStats.friendAddCount + 1,
            },
            friendList: [...state.friendList, friend],
          };

          return {
            ...nextState,
            ...resolveAchievementRewards(nextState),
          };
        }),
      addGuestbookEntry: (friendId, message, createdAt = new Date()) => {
        const trimmedMessage = message.trim();

        if (!friendId || !trimmedMessage) {
          return null;
        }

        const entry: GuestbookEntry = {
          id: `${friendId}-${createdAt.getTime()}`,
          authorName: get().userName,
          authorStudentId: get().studentId,
          createdAt: createdAt.toISOString(),
          friendId,
          message: trimmedMessage.slice(0, 15),
        };

        set((state) => ({
          guestbookEntries: {
            ...state.guestbookEntries,
            [friendId]: [...(state.guestbookEntries[friendId] ?? []), entry],
          },
        }));

        return entry;
      },
      applyServerMealFeed: ({
        coin,
        countAchievement = true,
        mealSectionId,
        totalXp,
        unlockedAchievements,
      }) => {
        const todayKey = getLocalDateKey();
        const lastFedMealSlotIndex = mealSectionId
          ? getMealSlotIndex(new Date(), mealSectionId)
          : getLatestCompletedMealSlotIndex();

        clearEatingTimeout();

        set((state) => {
          const nextState = {
            ...state,
            achievementStats: {
              ...state.achievementStats,
              feedCount: countAchievement
                ? state.achievementStats.feedCount + 1
                : state.achievementStats.feedCount,
            },
          appliedSkippedMealPenaltyCount: 0,
          characterState: "eating" as CharacterState,
          coin: Math.max(coin, 0),
          lastFedMealSlotIndex,
          lastFedMeals: mealSectionId
            ? {
                ...state.lastFedMeals,
                [mealSectionId]: todayKey,
              }
            : state.lastFedMeals,
          pendingEvolution: createPendingEvolution({
            currentPendingEvolution: state.pendingEvolution,
            currentTotalXp: state.totalXp,
            nextTotalXp: Math.max(totalXp, 0),
            readyAt: Date.now() + EATING_DURATION_MS,
            resumeState: state.characterState,
            trigger: "meal",
          }),
          skippedMealCount: 0,
          totalXp: Math.max(totalXp, 0),
          };

          return {
            ...nextState,
            ...resolveAchievementRewards(nextState),
          };
        });

        get().applyServerUnlockedAchievements(unlockedAchievements, {
          coin,
          totalXp,
        });

        eatingTimeoutRef = setTimeout(() => {
          eatingTimeoutRef = null;
          get().syncMealStatus(false);
        }, EATING_DURATION_MS);
      },
      applyServerQuizSubmit: ({
        coin,
        countAchievement = true,
        isCorrect,
        totalXp,
        unlockedAchievements,
      }) => {
        const nextTotalXp = Math.max(totalXp, 0);

        set((state) => {
          const nextState = {
            ...state,
            achievementStats: {
              ...state.achievementStats,
              quizCorrectCount: countAchievement && isCorrect
                ? state.achievementStats.quizCorrectCount + 1
                : state.achievementStats.quizCorrectCount,
            },
          coin: Math.max(coin, 0),
          pendingEvolution: createPendingEvolution({
            currentPendingEvolution: state.pendingEvolution,
            currentTotalXp: state.totalXp,
            nextTotalXp,
            resumeState: state.characterState,
            trigger: "quiz",
          }),
          totalXp: nextTotalXp,
          };

          return {
            ...nextState,
            ...resolveAchievementRewards(nextState),
          };
        });

        get().applyServerUnlockedAchievements(unlockedAchievements, {
          coin,
          totalXp,
        });
      },
      clearPendingEvolution: () => set({ pendingEvolution: null }),
      clearAuthSession: () => {
        setBooApiAccessToken(null);

        set((state) => ({
          accessToken: null,
          autoLoginEnabled: false,
          guestGameSnapshot: state.isGuestMode
            ? createGuestGameSnapshot(state)
            : state.guestGameSnapshot,
          isGuestMode: false,
          refreshToken: null,
        }));
      },
      clearMealHistory: () => {
        clearEatingTimeout();

        set((state) => ({
          appliedSkippedMealPenaltyCount: 0,
          characterState:
            state.characterState === "hungry" ||
            state.characterState === "eating"
              ? DEFAULT_CHARACTER_STATE
              : state.characterState,
          lastFedMealSlotIndex: getLatestCompletedMealSlotIndex(),
          lastFedMeals: {},
          pendingEvolution:
            state.pendingEvolution?.trigger === "meal"
              ? null
              : state.pendingEvolution,
          skippedMealCount: 0,
        }));
      },
      clearQuizHistory: () => {
        set({
          quizAttemptHistory: {},
          quizDailyCount: 0,
          quizDailyCountDateKey: "",
        });
      },
      consumeMiniGameHeart: (nowMs = Date.now()) => {
        let didConsumeHeart = false;

        set((state) => {
          const nextHeartState = consumeMiniGameHeart(
            {
              heart: state.heart,
              heartUpdatedAt: state.heartUpdatedAt,
              maxHeart: state.maxHeart,
            },
            nowMs,
          );

          if (!nextHeartState) {
            return state;
          }

          didConsumeHeart = true;
          const nextState = {
            ...state,
            ...nextHeartState,
            achievementStats: {
              ...state.achievementStats,
              miniGamePlayCount: state.achievementStats.miniGamePlayCount + 1,
            },
          };

          return {
            ...nextState,
            ...resolveAchievementRewards(nextState),
          };
        });

        return didConsumeHeart;
      },
      dismissAchievementAlert: () =>
        set((state) => ({
          achievementAlertQueue: state.achievementAlertQueue.slice(1),
        })),
      applyServerUnlockedAchievements: (
        unlockedAchievements,
        syncState = {},
      ) => {
        const achievements = unlockedAchievements ?? [];

        set((state) => {
          const completedKeySet = new Set(state.completedAchievementKeys);
          const newlyUnlocked = achievements.filter(
            (achievement) =>
              !completedKeySet.has(achievement.achievement_key),
          );
          const nextCompletedAchievementKeys = [
            ...state.completedAchievementKeys,
            ...newlyUnlocked.map(
              (achievement) => achievement.achievement_key,
            ),
          ];
          const unlockedAt = new Date().toISOString();
          const nextOwnedAchievementSkins = [
            ...state.ownedAchievementSkins,
          ];

          getServerAchievementSkinKeys(newlyUnlocked).forEach((skinKey) => {
            if (
              skinKey &&
              !nextOwnedAchievementSkins.includes(skinKey)
            ) {
              nextOwnedAchievementSkins.push(skinKey);
            }
          });

          const nextTotalXp =
            syncState.totalXp !== undefined
              ? Math.max(syncState.totalXp, 0)
              : state.totalXp;
          const shouldSyncTotalXp =
            syncState.totalXp !== undefined && nextTotalXp !== state.totalXp;

          return {
            achievementAlertQueue: [
              ...state.achievementAlertQueue,
              ...newlyUnlocked.map((achievement) => ({
                key: achievement.achievement_key,
                reward: getServerAchievementReward(achievement),
                title: achievement.title,
                unlockedAt,
              })),
            ],
            coin:
              syncState.coin !== undefined
                ? Math.max(syncState.coin, 0)
                : state.coin,
            completedAchievementKeys: nextCompletedAchievementKeys,
            ownedAchievementSkins: nextOwnedAchievementSkins,
            pendingEvolution: shouldSyncTotalXp
              ? createPendingEvolution({
                  currentPendingEvolution: state.pendingEvolution,
                  currentTotalXp: state.totalXp,
                  nextTotalXp,
                  resumeState: state.characterState,
                  trigger: "xp",
                })
              : state.pendingEvolution,
            totalXp: nextTotalXp,
          };
        });
      },
      purchaseRoomItem: (itemId) => {
        const item = ROOM_ITEM_ASSETS[itemId];

        if (!item) {
          return {
            ok: false as const,
            reason: "not_found" as const,
          };
        }

        const { coin, ownedRoomItems } = get();

        if (ownedRoomItems.includes(itemId)) {
          return {
            ok: false as const,
            reason: "already_owned" as const,
          };
        }

        if (coin < item.price) {
          return {
            ok: false as const,
            reason: "insufficient_coin" as const,
          };
        }

        set((state) => {
          const nextState = {
            ...state,
            achievementStats: {
              ...state.achievementStats,
              roomItemEquipCount: state.achievementStats.roomItemEquipCount + 1,
            },
          coin: coin - item.price,
          equippedRoomItems: {
            ...state.equippedRoomItems,
            [item.slotId]: itemId,
          },
          ownedRoomItems: [...ownedRoomItems, itemId],
          };

          return {
            ...nextState,
            ...resolveAchievementRewards(nextState),
          };
        });

        return {
          ok: true as const,
        };
      },
      purchaseRoomWallpaper: (wallpaperId) => {
        const wallpaper = ROOM_WALLPAPER_ASSETS[wallpaperId];

        if (!wallpaper) {
          return {
            ok: false as const,
            reason: "not_found" as const,
          };
        }

        const { coin, ownedRoomWallpapers } = get();

        if (ownedRoomWallpapers.includes(wallpaperId)) {
          return {
            ok: false as const,
            reason: "already_owned" as const,
          };
        }

        if (coin < wallpaper.price) {
          return {
            ok: false as const,
            reason: "insufficient_coin" as const,
          };
        }

        set((state) => {
          const nextState = {
            ...state,
            achievementStats: {
              ...state.achievementStats,
              roomItemEquipCount: state.achievementStats.roomItemEquipCount + 1,
            },
          coin: coin - wallpaper.price,
          equippedRoomWallpaper: wallpaperId,
          ownedRoomWallpapers: [...ownedRoomWallpapers, wallpaperId],
          };

          return {
            ...nextState,
            ...resolveAchievementRewards(nextState),
          };
        });

        return {
          ok: true as const,
        };
      },
      syncMealStatus: (preserveEatingState = true) => {
        const {
          accessToken,
          appliedSkippedMealPenaltyCount,
          characterState,
          lastFedMealSlotIndex,
          totalXp,
        } = get();
        const latestCompletedMealSlotIndex = getLatestCompletedMealSlotIndex();

        if (accessToken) {
          const shouldStayEating =
            preserveEatingState && characterState === "eating";
          const normalizedCharacterState =
            normalizeEvolutionResumeState(characterState);
          const nextCharacterState = shouldStayEating
            ? "eating"
            : normalizedCharacterState === "hungry" ||
                normalizedCharacterState === "eating"
              ? DEFAULT_CHARACTER_STATE
              : normalizedCharacterState;

          set({
            appliedSkippedMealPenaltyCount: 0,
            characterState: nextCharacterState,
            lastFedMealSlotIndex: latestCompletedMealSlotIndex,
            skippedMealCount: 0,
          });

          return {
            skippedMealCount: 0,
            xpPenalty: 0,
          };
        }

        const skippedMealCount = Math.max(
          latestCompletedMealSlotIndex - lastFedMealSlotIndex,
          0,
        );
        const totalSkippedMealPenaltyCount = Math.max(
          skippedMealCount - HUNGRY_MEAL_SKIP_THRESHOLD,
          0,
        );
        const nextPenaltyCount = Math.max(
          totalSkippedMealPenaltyCount - appliedSkippedMealPenaltyCount,
          0,
        );
        const xpPenalty = nextPenaltyCount * MEAL_SKIP_XP_PENALTY;
        const nextTotalXp =
          nextPenaltyCount > 0 ? Math.max(totalXp - xpPenalty, 0) : totalXp;
        const shouldStayEating =
          preserveEatingState && characterState === "eating";
        const shouldBeHungry = skippedMealCount >= HUNGRY_MEAL_SKIP_THRESHOLD;
        const normalizedCharacterState =
          normalizeEvolutionResumeState(characterState);
        const nextCharacterState = shouldStayEating
          ? "eating"
          : shouldBeHungry
            ? "hungry"
            : normalizedCharacterState === "hungry" ||
                normalizedCharacterState === "eating"
              ? DEFAULT_CHARACTER_STATE
              : normalizedCharacterState;

        set({
          appliedSkippedMealPenaltyCount: totalSkippedMealPenaltyCount,
          characterState: nextCharacterState,
          skippedMealCount,
          totalXp: nextTotalXp,
        });

        return {
          skippedMealCount,
          xpPenalty,
        };
      },
      feedBoo: (mealCost, mealSectionId) => {
        const { coin, lastFedMeals, mealRestrictionEnabled, totalXp } = get();
        const todayKey = getLocalDateKey();
        const lastFedMealSlotIndex = mealSectionId
          ? getMealSlotIndex(new Date(), mealSectionId)
          : getLatestCompletedMealSlotIndex();

        if (coin < mealCost) {
          return false;
        }

        if (mealRestrictionEnabled) {
          if (!mealSectionId) {
            return false;
          }

          if (lastFedMeals[mealSectionId] === todayKey) {
            return false;
          }
        }

        clearEatingTimeout();

        set((state) => {
          const nextState = {
            ...state,
            achievementStats: {
              ...state.achievementStats,
              feedCount: state.achievementStats.feedCount + 1,
            },
          appliedSkippedMealPenaltyCount: 0,
          coin: coin - mealCost,
          characterState: "eating" as CharacterState,
          lastFedMealSlotIndex,
          skippedMealCount: 0,
          pendingEvolution: createPendingEvolution({
            currentPendingEvolution: state.pendingEvolution,
            currentTotalXp: state.totalXp,
            nextTotalXp: totalXp + FEED_XP_REWARD,
            readyAt: Date.now() + EATING_DURATION_MS,
            resumeState: state.characterState,
            trigger: "meal",
          }),
          totalXp: totalXp + FEED_XP_REWARD,
          lastFedMeals: mealSectionId
            ? {
                ...state.lastFedMeals,
                [mealSectionId]: todayKey,
              }
            : state.lastFedMeals,
          };

          return {
            ...nextState,
            ...resolveAchievementRewards(nextState),
          };
        });

        eatingTimeoutRef = setTimeout(() => {
          eatingTimeoutRef = null;
          get().syncMealStatus(false);
        }, EATING_DURATION_MS);

        return true;
      },
      submitQuizAttempt: (quizId, isCorrect, attemptedAt = new Date()) => {
        const {
          quizAttemptHistory,
          quizDailyCount,
          quizDailyCountDateKey,
          quizDailyLimitEnabled,
          totalXp,
        } = get();
        const quizCountToday = getQuizDailyCountForDate(
          quizDailyCount,
          quizDailyCountDateKey,
          attemptedAt,
        );

        if (quizDailyLimitEnabled && quizCountToday >= QUIZ_DAILY_LIMIT) {
          return {
            ok: false as const,
            reason: "daily_limit" as const,
            nextAvailableAt: null,
          };
        }

        if (
          quizDailyLimitEnabled &&
          !isQuizAvailableByCooldown(quizAttemptHistory, attemptedAt)
        ) {
          return {
            ok: false as const,
            reason: "cooldown" as const,
            nextAvailableAt:
              getQuizCooldownEndAt(
                quizAttemptHistory,
                attemptedAt,
              )?.toISOString() ?? null,
          };
        }

        const xpDelta = isCorrect
          ? QUIZ_CORRECT_XP_REWARD
          : -QUIZ_WRONG_XP_PENALTY;

        set((state) => {
          const nextState = {
            ...state,
          coin: isCorrect
            ? state.coin + QUIZ_CORRECT_COIN_REWARD
            : state.coin,
          achievementStats: {
            ...state.achievementStats,
            quizCorrectCount: isCorrect
              ? state.achievementStats.quizCorrectCount + 1
              : state.achievementStats.quizCorrectCount,
          },
          pendingEvolution: createPendingEvolution({
            currentPendingEvolution: state.pendingEvolution,
            currentTotalXp: totalXp,
            nextTotalXp: Math.max(totalXp + xpDelta, 0),
            resumeState: state.characterState,
            trigger: "quiz",
          }),
          quizAttemptHistory: {
            ...quizAttemptHistory,
            [quizId]: attemptedAt.toISOString(),
          },
          quizDailyCount: quizCountToday + 1,
          quizDailyCountDateKey: getQuizLocalDateKey(attemptedAt),
          totalXp: Math.max(totalXp + xpDelta, 0),
          };

          return {
            ...nextState,
            ...resolveAchievementRewards(nextState),
          };
        });

        return {
          coinDelta: isCorrect ? QUIZ_CORRECT_COIN_REWARD : 0,
          ok: true as const,
          xpDelta,
        };
      },
      setUserName: (userName) => set({ userName }),
      setAuthSession: ({
        accessToken,
        autoLoginEnabled,
        refreshToken,
        unlockedAchievements,
      }) => {
        setBooApiAccessToken(accessToken);

        set((state) => {
          const guestGameSnapshot = state.isGuestMode
            ? createGuestGameSnapshot(state)
            : state.guestGameSnapshot;
          const sessionBaseState = state.isGuestMode
            ? {
                ...createInitialGameState(),
                bgmVolume: state.bgmVolume,
                developerModeEnabled: state.developerModeEnabled,
                guestGameSnapshot,
                masterVolume: state.masterVolume,
                sfxVolume: state.sfxVolume,
              }
            : {
                ...state,
                guestGameSnapshot,
              };
          const nextState = {
            ...sessionBaseState,
            accessToken,
            achievementStats: {
              ...sessionBaseState.achievementStats,
              hasFirstLogin: true,
            },
            autoLoginEnabled,
            hasSyncedServerAchievements: false,
            isGuestMode: false,
            refreshToken,
          };

          return {
            ...nextState,
            ...resolveAchievementRewards(nextState),
          };
        });

        get().applyServerUnlockedAchievements(unlockedAchievements);
      },
      setBooName: (booName) => {
        set({ booName });

        const { accessToken, serverCharacterId } = get();

        if (accessToken) {
          void updateMyCharacter({ character_name: booName }, accessToken).catch(
            (error) => {
              console.warn("서버 캐릭터 이름 동기화 실패", error);
            },
          );

          return;
        }

        if (serverCharacterId !== null) {
          void updateCharacter(serverCharacterId, {
            character_name: booName,
          }).catch((error) => {
            console.warn("서버 캐릭터 이름 동기화 실패", error);
          });
        }
      },
      setCoin: (coin) => set({ coin: Math.max(coin, 0) }),
      setDeveloperModeEnabled: (developerModeEnabled) =>
        set({ developerModeEnabled }),
      setEquippedRoomItem: (slotId, itemId) => {
        const { accessToken } = get();
        let didEquip = false;

        set((state) => {
          if (
            ROOM_ITEM_ASSETS[itemId]?.slotId !== slotId ||
            !state.ownedRoomItems.includes(itemId) ||
            state.equippedRoomItems[slotId] === itemId
          ) {
            return state;
          }

          const nextState = {
            ...state,
            achievementStats: {
              ...state.achievementStats,
              roomItemEquipCount: state.achievementStats.roomItemEquipCount + 1,
            },
            equippedRoomItems: {
              ...state.equippedRoomItems,
              [slotId]: itemId,
            },
          };
          didEquip = true;

          return {
            ...nextState,
            ...resolveAchievementRewards(nextState),
          };
        });

        if (accessToken && didEquip) {
          void sendAchievementEvent("room_item_equip_count", accessToken)
            .then((result) => {
              get().applyServerUnlockedAchievements(
                result.unlocked_achievements,
                {
                  coin: result.coin,
                  totalXp: result.xp_point,
                },
              );
            })
            .catch((error) => {
              console.warn("서버 마이룸 아이템 장착 업적 동기화 실패", error);
            });
        }
      },
      setEquippedRoomWallpaper: (wallpaperId) => {
        const { accessToken } = get();
        let didEquip = false;

        set((state) => {
          if (
            !ROOM_WALLPAPER_ASSETS[wallpaperId] ||
            !state.ownedRoomWallpapers.includes(wallpaperId) ||
            state.equippedRoomWallpaper === wallpaperId
          ) {
            return state;
          }

          const nextState = {
            ...state,
            achievementStats: {
              ...state.achievementStats,
              roomItemEquipCount: state.achievementStats.roomItemEquipCount + 1,
            },
            equippedRoomWallpaper: wallpaperId,
          };
          didEquip = true;

          return {
            ...nextState,
            ...resolveAchievementRewards(nextState),
          };
        });

        if (accessToken && didEquip) {
          void sendAchievementEvent("room_item_equip_count", accessToken)
            .then((result) => {
              get().applyServerUnlockedAchievements(
                result.unlocked_achievements,
                {
                  coin: result.coin,
                  totalXp: result.xp_point,
                },
              );
            })
            .catch((error) => {
              console.warn("서버 마이룸 아이템 장착 업적 동기화 실패", error);
            });
        }
      },
      setFriendList: (friendList) => set({ friendList }),
      setHasSeenGameTutorial: (hasSeenGameTutorial) => {
        set({ hasSeenGameTutorial });

        const { accessToken } = get();

        if (accessToken) {
          void updateCurrentUserPreferences(
            { has_seen_game_tutorial: hasSeenGameTutorial },
            accessToken,
          ).catch((error) => {
            console.warn("서버 게임 튜토리얼 설정 저장 실패", error);
          });
        }
      },
      setHasSeenMiniGameTutorial: (hasSeenMiniGameTutorial) => {
        set({ hasSeenMiniGameTutorial });

        const { accessToken } = get();

        if (accessToken) {
          void updateCurrentUserPreferences(
            { has_seen_minigame_tutorial: hasSeenMiniGameTutorial },
            accessToken,
          ).catch((error) => {
            console.warn("서버 미니게임 튜토리얼 설정 저장 실패", error);
          });
        }
      },
      setMasterVolume: (masterVolume) =>
        set({ masterVolume: clampVolume(masterVolume) }),
      setGrade: (grade) => set({ totalXp: getTotalXpForGrade(grade) }),
      setBgmVolume: (bgmVolume) => set({ bgmVolume: clampVolume(bgmVolume) }),
      setMealDayMode: (mealDayMode) => set({ mealDayMode }),
      setMealRestrictionEnabled: (mealRestrictionEnabled) =>
        set({ mealRestrictionEnabled }),
      setServerCharacterId: (serverCharacterId) => set({ serverCharacterId }),
      setCharacterCostumeKey: (characterCostumeKey) =>
        set((state) => {
          if (
            characterCostumeKey !== "default" &&
            !state.ownedAchievementSkins.includes(characterCostumeKey)
          ) {
            return state;
          }

          return { characterCostumeKey };
        }),
      setCharacterState: (characterState) => {
        if (characterState !== "eating") {
          clearEatingTimeout();
        }

        set({ characterState });
      },
      removeFriend: (friendId) =>
        set((state) => ({
          friendList: state.friendList.filter(
            (friend) => friend.id !== friendId,
          ),
        })),
      recordCampusVisit: () => {
        const {
          accessToken,
          completedAchievementKeys,
          hasSyncedServerAchievements,
        } = get();
        const shouldSendServerEvent =
          !!accessToken &&
          (!hasSyncedServerAchievements ||
            !completedAchievementKeys.includes("campus_first_visit"));

        set((state) => {
          if (state.achievementStats.hasVisitedCampus) {
            return state;
          }

          const nextState = {
            ...state,
            achievementStats: {
              ...state.achievementStats,
              hasVisitedCampus: true,
            },
          };

          return {
            ...nextState,
            ...resolveAchievementRewards(nextState),
          };
        });

        if (shouldSendServerEvent) {
          void sendAchievementEvent("campus_first_visit", accessToken)
            .then((result) => {
              get().applyServerUnlockedAchievements(
                result.unlocked_achievements,
                {
                  coin: result.coin,
                  totalXp: result.xp_point,
                },
              );

              return listMyAchievementProgress(accessToken);
            })
            .then((achievements) => {
              get().syncServerAchievementProgress(achievements);
            })
            .catch((error) => {
              console.warn("서버 캠퍼스 방문 업적 동기화 실패", error);
            });
        }
      },
      recordMiniGameResult: (gameId, score) => {
        const normalizedScore = Math.max(Math.floor(score), 0);

        set((state) => {
          const currentBestScores = state.achievementStats.miniGameBestScores ?? {
            catchBoo: 0,
            catchTheMajor: 0,
            freeThrow: 0,
          };

          if (currentBestScores[gameId] >= normalizedScore) {
            return state;
          }

          return {
            achievementStats: {
              ...state.achievementStats,
              miniGameBestScores: {
                ...currentBestScores,
                [gameId]: normalizedScore,
              },
            },
          };
        });
      },
      recordServerMiniGamePlay: () => {
        set((state) => ({
          achievementStats: {
            ...state.achievementStats,
            miniGameBestScores: state.achievementStats.miniGameBestScores ?? {
              catchBoo: 0,
              catchTheMajor: 0,
              freeThrow: 0,
            },
            miniGamePlayCount: state.achievementStats.miniGamePlayCount + 1,
          },
        }));
      },
      recordRoomEnter: () => {
        const {
          accessToken,
          completedAchievementKeys,
          hasSyncedServerAchievements,
        } = get();
        const shouldSendServerEvent =
          !!accessToken &&
          (!hasSyncedServerAchievements ||
            !completedAchievementKeys.includes("room_first_enter"));

        set((state) => {
          if (state.achievementStats.hasEnteredRoom) {
            return state;
          }

          const nextState = {
            ...state,
            achievementStats: {
              ...state.achievementStats,
              hasEnteredRoom: true,
            },
          };

          return {
            ...nextState,
            ...resolveAchievementRewards(nextState),
          };
        });

        if (shouldSendServerEvent) {
          void sendAchievementEvent("room_first_enter", accessToken)
            .then((result) => {
              get().applyServerUnlockedAchievements(
                result.unlocked_achievements,
                {
                  coin: result.coin,
                  totalXp: result.xp_point,
                },
              );

              return listMyAchievementProgress(accessToken);
            })
            .then((achievements) => {
              get().syncServerAchievementProgress(achievements);
            })
            .catch((error) => {
              console.warn("서버 마이룸 진입 업적 동기화 실패", error);
            });
        }
      },
      recordRoomItemEquip: () => {
        const { accessToken } = get();

        set((state) => {
          const nextState = {
            ...state,
            achievementStats: {
              ...state.achievementStats,
              roomItemEquipCount: state.achievementStats.roomItemEquipCount + 1,
            },
          };

          return {
            ...nextState,
            ...resolveAchievementRewards(nextState),
          };
        });

        if (accessToken) {
          void sendAchievementEvent("room_item_equip_count", accessToken)
            .then((result) => {
              get().applyServerUnlockedAchievements(
                result.unlocked_achievements,
                {
                  coin: result.coin,
                  totalXp: result.xp_point,
                },
              );
            })
            .catch((error) => {
              console.warn("서버 마이룸 아이템 장착 업적 동기화 실패", error);
            });
        }
      },
      setSfxVolume: (sfxVolume) => set({ sfxVolume: clampVolume(sfxVolume) }),
      setStudentId: (studentId) => set({ studentId }),
      setUserEmail: (userEmail) => set({ userEmail }),
      setUserNickname: (userNickname) => set({ userNickname }),
      startGuestMode: () => {
        setBooApiAccessToken(null);

        const {
          bgmVolume,
          developerModeEnabled,
          guestGameSnapshot,
          masterVolume,
          sfxVolume,
        } = get();

        set(() => {
          const initialState = createInitialGameState();
          const normalizedGuestGameSnapshot =
            normalizeGuestGameSnapshot(guestGameSnapshot);
          const restoredAchievementStats = normalizeAchievementStats(
            normalizedGuestGameSnapshot?.achievementStats,
          );
          const nextOwnedAchievementSkins =
            normalizedGuestGameSnapshot?.ownedAchievementSkins ?? [];
          const nextCharacterCostumeKey =
            normalizedGuestGameSnapshot?.characterCostumeKey === "default" ||
            (normalizedGuestGameSnapshot?.characterCostumeKey &&
              nextOwnedAchievementSkins.includes(
                normalizedGuestGameSnapshot.characterCostumeKey,
              ))
              ? normalizedGuestGameSnapshot.characterCostumeKey
              : "default";
          const nextState = {
            ...initialState,
            ...normalizedGuestGameSnapshot,
            accessToken: null,
            achievementStats: {
              ...restoredAchievementStats,
              hasFirstLogin: true,
            },
            autoLoginEnabled: false,
            bgmVolume,
            characterCostumeKey: nextCharacterCostumeKey,
            developerModeEnabled,
            guestGameSnapshot: normalizedGuestGameSnapshot,
            isGuestMode: true,
            masterVolume,
            refreshToken: null,
            sfxVolume,
            studentId: getGuestStudentId(
              normalizedGuestGameSnapshot?.studentId,
            ),
            userCreatedAt:
              normalizedGuestGameSnapshot?.userCreatedAt ??
              initialState.userCreatedAt,
            userName: getGuestUserName(normalizedGuestGameSnapshot?.userName),
            userNickname: getGuestUserNickname(
              normalizedGuestGameSnapshot?.userNickname,
            ),
          };

          return {
            ...nextState,
            ...resolveAchievementRewards(nextState),
          };
        });
      },
      setTotalXp: (totalXp) =>
        set((state) => {
          const nextTotalXp = Math.max(totalXp, 0);
          const nextState = {
            ...state,
            pendingEvolution: createPendingEvolution({
              currentPendingEvolution: state.pendingEvolution,
              currentTotalXp: state.totalXp,
              nextTotalXp,
              resumeState: state.characterState,
              trigger: "xp" as const,
            }),
            totalXp: nextTotalXp,
          };

          return {
            ...nextState,
            ...resolveAchievementRewards(nextState),
          };
        }),
      toggleQuizDailyLimitEnabled: () =>
        set((state) => ({
          quizDailyLimitEnabled: !state.quizDailyLimitEnabled,
        })),
      toggleMealRestrictionEnabled: () =>
        set((state) => ({
          mealRestrictionEnabled: !state.mealRestrictionEnabled,
        })),
      toggleDeveloperModeEnabled: () =>
        set((state) => ({
          developerModeEnabled: !state.developerModeEnabled,
        })),
      setGameState: (patch, options = {}) =>
        set((state) => {
          const nextState = { ...state, ...patch };
          const shouldResolveAchievements =
            options.resolveAchievements === true || patch.totalXp !== undefined;

          if (!shouldResolveAchievements || options.resolveAchievements === false) {
            return nextState;
          }

          return {
            ...nextState,
            ...resolveAchievementRewards(nextState),
          };
        }),
      syncServerAchievementProgress: (achievements) => {
        if (!achievements) {
          return;
        }

        const progressList = achievements ?? [];
        const completedAchievements = progressList.filter(
          (achievement) => achievement.completed || achievement.claimed,
        );

        set((state) => {
          const completedAchievementKeys = completedAchievements.map(
            (achievement) => achievement.achievement_key,
          );
          const ownedAchievementSkins = [
            ...new Set(getServerAchievementSkinKeys(completedAchievements)),
          ];
          const characterCostumeKey =
            state.characterCostumeKey === "default" ||
            ownedAchievementSkins.includes(state.characterCostumeKey)
              ? state.characterCostumeKey
              : "default";

          return {
            achievementStats: syncAchievementStatsFromServerProgress(
              state.achievementStats,
              progressList,
            ),
            characterCostumeKey,
            completedAchievementKeys,
            hasSyncedServerAchievements: true,
            ownedAchievementSkins,
          };
        });
      },
      resetGuestGameData: () => {
        clearEatingTimeout();
        setBooApiAccessToken(null);

        const {
          bgmVolume,
          developerModeEnabled,
          masterVolume,
          sfxVolume,
        } = get();

        set(() => {
          const initialState = createInitialGameState();
          const nextState = {
            ...initialState,
            accessToken: null,
            achievementStats: {
              ...initialState.achievementStats,
              hasFirstLogin: true,
            },
            autoLoginEnabled: false,
            bgmVolume,
            developerModeEnabled,
            guestGameSnapshot: null,
            isGuestMode: true,
            masterVolume,
            refreshToken: null,
            sfxVolume,
            studentId: GUEST_DEFAULT_STUDENT_ID,
            userName: GUEST_DEFAULT_USER_NAME,
            userNickname: GUEST_DEFAULT_USER_NICKNAME,
          };

          return {
            ...nextState,
            ...resolveAchievementRewards(nextState),
          };
        });
      },
      resetGameState: () => {
        clearEatingTimeout();
        const isGuestMode = get().isGuestMode;
        const initialState = createInitialGameState();

        set({
          ...initialState,
          accessToken: get().accessToken,
          autoLoginEnabled: get().autoLoginEnabled,
          bgmVolume: get().bgmVolume,
          developerModeEnabled: get().developerModeEnabled,
          guestGameSnapshot: get().guestGameSnapshot,
          isGuestMode: get().isGuestMode,
          masterVolume: get().masterVolume,
          refreshToken: get().refreshToken,
          sfxVolume: get().sfxVolume,
          studentId: isGuestMode
            ? GUEST_DEFAULT_STUDENT_ID
            : initialState.studentId,
          userName: isGuestMode
            ? GUEST_DEFAULT_USER_NAME
            : initialState.userName,
          userNickname: isGuestMode
            ? GUEST_DEFAULT_USER_NICKNAME
            : initialState.userNickname,
        });
      },
    }),
    {
      name: "boo-game-store",
      storage: createJSONStorage(resolvePersistStorage),
      partialize: (state) => ({
        accessToken: state.autoLoginEnabled ? state.accessToken : null,
        appliedSkippedMealPenaltyCount: state.appliedSkippedMealPenaltyCount,
        autoLoginEnabled: state.autoLoginEnabled,
        achievementStats: state.achievementStats,
        booName: state.booName,
        characterCostumeKey: state.characterCostumeKey,
        characterState: state.characterState,
        coin: state.coin,
        completedAchievementKeys: state.completedAchievementKeys,
        developerModeEnabled: state.developerModeEnabled,
        equippedRoomItems: state.equippedRoomItems,
        equippedRoomWallpaper: state.equippedRoomWallpaper,
        friendList: state.friendList,
        guestbookEntries: state.guestbookEntries,
        guestGameSnapshot: state.guestGameSnapshot,
        hasSeenGameTutorial: state.hasSeenGameTutorial,
        hasSeenMiniGameTutorial: state.hasSeenMiniGameTutorial,
        heart: state.heart,
        heartUpdatedAt: state.heartUpdatedAt,
        isGuestMode: state.isGuestMode,
        lastFedMeals: state.lastFedMeals,
        lastFedMealSlotIndex: state.lastFedMealSlotIndex,
        masterVolume: state.masterVolume,
        maxHeart: state.maxHeart,
        mealDayMode: state.mealDayMode,
        mealRestrictionEnabled: state.mealRestrictionEnabled,
        ownedAchievementSkins: state.ownedAchievementSkins,
        ownedRoomItems: state.ownedRoomItems,
        ownedRoomWallpapers: state.ownedRoomWallpapers,
        quizAttemptHistory: state.quizAttemptHistory,
        quizDailyCount: state.quizDailyCount,
        quizDailyCountDateKey: state.quizDailyCountDateKey,
        quizDailyLimitEnabled: state.quizDailyLimitEnabled,
        refreshToken: state.autoLoginEnabled ? state.refreshToken : null,
        serverCharacterId: state.serverCharacterId,
        bgmVolume: state.bgmVolume,
        skippedMealCount: state.skippedMealCount,
        sfxVolume: state.sfxVolume,
        studentId: state.studentId,
        totalXp: state.totalXp,
        userCreatedAt: state.userCreatedAt,
        userEmail: state.userEmail,
        userEmailVerified: state.userEmailVerified,
        userId: state.userId,
        userImage: state.userImage,
        userName: state.userName,
        userNickname: state.userNickname,
      }),
      onRehydrateStorage: () => (state) => {
        clearEatingTimeout();

        if (!state) {
          return;
        }

        const rehydratedAchievementStats = normalizeAchievementStats(
          state.achievementStats,
        );
        const shouldResolveGuestFirstLogin =
          state.isGuestMode && !state.accessToken;
        const normalizedAchievementStats = {
          ...rehydratedAchievementStats,
          hasFirstLogin:
            rehydratedAchievementStats.hasFirstLogin ||
            shouldResolveGuestFirstLogin,
        };
        const rehydratedGuestGameSnapshot = normalizeGuestGameSnapshot(
          state.guestGameSnapshot,
        );

        if (state.autoLoginEnabled && state.accessToken) {
          setBooApiAccessToken(state.accessToken);
          state.setGameState({ isGuestMode: false });
        } else {
          setBooApiAccessToken(null);
          state.setGameState({
            accessToken: null,
            autoLoginEnabled: false,
            refreshToken: null,
          });
        }

        const ownedRoomItems = new Set<RoomItemId>([
          ...DEFAULT_OWNED_ROOM_ITEMS,
          ...(state.ownedRoomItems ?? []),
        ]);
        const equippedRoomItems: EquippedRoomItems = {
          ...DEFAULT_EQUIPPED_ROOM_ITEMS,
          ...state.equippedRoomItems,
        };

        (Object.keys(DEFAULT_EQUIPPED_ROOM_ITEMS) as RoomSlotId[]).forEach(
          (slotId) => {
            const equippedItemId = equippedRoomItems[slotId];

            if (ROOM_ITEM_ASSETS[equippedItemId]?.slotId !== slotId) {
              equippedRoomItems[slotId] = DEFAULT_EQUIPPED_ROOM_ITEMS[slotId];
            }

            ownedRoomItems.add(equippedRoomItems[slotId]);
          },
        );

        state.setGameState({
          achievementAlertQueue: [],
          achievementStats: normalizedAchievementStats,
          characterCostumeKey:
            state.characterCostumeKey === "default" ||
            (state.ownedAchievementSkins ?? []).includes(
              state.characterCostumeKey,
            )
              ? state.characterCostumeKey
              : "default",
          equippedRoomItems,
          guestGameSnapshot: rehydratedGuestGameSnapshot,
          ownedRoomItems: [...ownedRoomItems].filter(
            (itemId) => !!ROOM_ITEM_ASSETS[itemId],
          ),
          studentId: shouldResolveGuestFirstLogin
            ? getGuestStudentId(state.studentId)
            : state.studentId,
          userCreatedAt: state.userCreatedAt ?? new Date().toISOString(),
          userName: shouldResolveGuestFirstLogin
            ? getGuestUserName(state.userName)
            : state.userName,
          userNickname: shouldResolveGuestFirstLogin
            ? getGuestUserNickname(state.userNickname)
            : state.userNickname,
        }, {
          resolveAchievements: shouldResolveGuestFirstLogin,
        });
        state.syncMealStatus(false);
      },
    },
  ),
);

setBooApiTokenRefreshHandlers({
  getRefreshToken: () => useGameStore.getState().refreshToken,
  onRefreshFailure: () => {
    useGameStore.getState().clearAuthSession();
  },
  onTokenRefresh: (token) => {
    const { autoLoginEnabled, setAuthSession } = useGameStore.getState();

    setAuthSession({
      accessToken: token.access_token,
      autoLoginEnabled,
      refreshToken: token.refresh_token,
      unlockedAchievements: token.unlocked_achievements,
    });
  },
});
