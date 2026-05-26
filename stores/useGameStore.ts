/**
 * @description  게임 전역 상태와 XP/식사/퀴즈/친구/마이룸/설정 액션을 관리하는 Zustand store입니다.
 * @depends      components/FriendList/FriendListDummyData.ts, components/MealPanel/MealMenuData.ts, components/QuizPanel/QuizData.ts, components/Room/RoomData.ts, constants/character.ts, utils/xpProgress.ts
 * @used-by      app/_layout.tsx, app/game/index.tsx, app/room/index.tsx, components/* 패널
 * @side-effects AsyncStorage persist, Zustand 상태 변경, eating timeout 관리
 */
import {
  FRIEND_LIST_DUMMY_DATA,
  FriendListItem,
} from "@/components/FriendList/FriendListDummyData";
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
import { CharacterGrade, CharacterState } from "@/constants/character";
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

type GameStoreState = {
  appliedSkippedMealPenaltyCount: number;
  booName: string;
  characterState: CharacterState;
  coin: number;
  developerModeEnabled: boolean;
  equippedRoomItems: EquippedRoomItems;
  equippedRoomWallpaper: RoomWallpaperId;
  friendList: FriendListItem[];
  guestbookEntries: GuestbookEntriesByFriendId;
  hasSeenGameTutorial: boolean;
  lastFedMeals: MealHistory;
  lastFedMealSlotIndex: number;
  masterVolume: number;
  mealDayMode: MealDayMode;
  mealRestrictionEnabled: boolean;
  ownedRoomItems: RoomItemId[];
  ownedRoomWallpapers: RoomWallpaperId[];
  pendingEvolution: PendingEvolution | null;
  quizAttemptHistory: QuizAttemptHistory;
  quizDailyCount: number;
  quizDailyCountDateKey: string;
  quizDailyLimitEnabled: boolean;
  bgmVolume: number;
  skippedMealCount: number;
  sfxVolume: number;
  studentId: string;
  totalXp: number;
  userName: string;
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
  clearPendingEvolution: () => void;
  clearMealHistory: () => void;
  clearQuizHistory: () => void;
  feedBoo: (mealCost: number, mealSectionId: MealSectionId | null) => boolean;
  purchaseRoomItem: (itemId: RoomItemId) => RoomItemPurchaseResult;
  purchaseRoomWallpaper: (
    wallpaperId: RoomWallpaperId,
  ) => RoomWallpaperPurchaseResult;
  removeFriend: (friendId: string) => void;
  resetGameState: () => void;
  setBooName: (booName: string) => void;
  setCharacterState: (characterState: CharacterState) => void;
  setCoin: (coin: number) => void;
  setDeveloperModeEnabled: (enabled: boolean) => void;
  setEquippedRoomItem: (slotId: RoomSlotId, itemId: RoomItemId) => void;
  setEquippedRoomWallpaper: (wallpaperId: RoomWallpaperId) => void;
  setFriendList: (friendList: FriendListItem[]) => void;
  setGameState: (patch: Partial<GameStoreState>) => void;
  setHasSeenGameTutorial: (hasSeenGameTutorial: boolean) => void;
  setMasterVolume: (volume: number) => void;
  setGrade: (grade: CharacterGrade) => void;
  setBgmVolume: (volume: number) => void;
  setMealDayMode: (mode: MealDayMode) => void;
  setMealRestrictionEnabled: (enabled: boolean) => void;
  setSfxVolume: (volume: number) => void;
  setStudentId: (studentId: string) => void;
  setTotalXp: (totalXp: number) => void;
  setUserName: (userName: string) => void;
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
  appliedSkippedMealPenaltyCount: 0,
  userName: "김외대",
  booName: "부",
  coin: 100,
  developerModeEnabled: false,
  equippedRoomItems: { ...DEFAULT_EQUIPPED_ROOM_ITEMS },
  equippedRoomWallpaper: DEFAULT_EQUIPPED_ROOM_WALLPAPER,
  friendList: [...FRIEND_LIST_DUMMY_DATA],
  guestbookEntries: {},
  hasSeenGameTutorial: false,
  characterState: DEFAULT_CHARACTER_STATE,
  lastFedMeals: {},
  lastFedMealSlotIndex: getLatestCompletedMealSlotIndex(),
  masterVolume: DEFAULT_MASTER_VOLUME,
  mealDayMode: "auto",
  mealRestrictionEnabled: true,
  ownedRoomItems: [...DEFAULT_OWNED_ROOM_ITEMS],
  ownedRoomWallpapers: [...DEFAULT_OWNED_ROOM_WALLPAPERS],
  pendingEvolution: null,
  quizAttemptHistory: {},
  quizDailyCount: 0,
  quizDailyCountDateKey: "",
  quizDailyLimitEnabled: true,
  bgmVolume: DEFAULT_BGM_VOLUME,
  skippedMealCount: 0,
  sfxVolume: DEFAULT_SFX_VOLUME,
  studentId: "202101108",
  totalXp: 0,
});

export const initialGameState: GameStoreState = createInitialGameState();

let eatingTimeoutRef: ReturnType<typeof setTimeout> | null = null;
let pendingEvolutionIdRef = 0;

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

  if (nextXpInfo.grade <= currentXpInfo.grade) {
    return currentPendingEvolution;
  }

  if (currentPendingEvolution) {
    return {
      ...currentPendingEvolution,
      toGrade: Math.max(
        currentPendingEvolution.toGrade,
        nextXpInfo.grade,
      ) as CharacterGrade,
    };
  }

  return {
    id: getNextPendingEvolutionId(),
    fromGrade: currentXpInfo.grade,
    readyAt,
    resumeState: normalizeEvolutionResumeState(resumeState),
    toGrade: nextXpInfo.grade,
    trigger,
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

          return {
            pendingEvolution: createPendingEvolution({
              currentPendingEvolution: state.pendingEvolution,
              currentTotalXp: state.totalXp,
              nextTotalXp,
              resumeState: state.characterState,
              trigger: "xp",
            }),
            totalXp: nextTotalXp,
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
          if (state.friendList.some((item) => item.id === friend.id)) {
            return state;
          }

          return {
            friendList: [...state.friendList, friend],
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
      clearPendingEvolution: () => set({ pendingEvolution: null }),
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

        set((state) => ({
          coin: coin - item.price,
          equippedRoomItems: {
            ...state.equippedRoomItems,
            [item.slotId]: itemId,
          },
          ownedRoomItems: [...ownedRoomItems, itemId],
        }));

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

        set({
          coin: coin - wallpaper.price,
          equippedRoomWallpaper: wallpaperId,
          ownedRoomWallpapers: [...ownedRoomWallpapers, wallpaperId],
        });

        return {
          ok: true as const,
        };
      },
      syncMealStatus: (preserveEatingState = true) => {
        const {
          appliedSkippedMealPenaltyCount,
          characterState,
          lastFedMealSlotIndex,
          totalXp,
        } = get();
        const latestCompletedMealSlotIndex = getLatestCompletedMealSlotIndex();
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

        set((state) => ({
          appliedSkippedMealPenaltyCount: 0,
          coin: coin - mealCost,
          characterState: "eating",
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
        }));

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

        set((state) => ({
          coin: isCorrect
            ? state.coin + QUIZ_CORRECT_COIN_REWARD
            : state.coin,
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
        }));

        return {
          coinDelta: isCorrect ? QUIZ_CORRECT_COIN_REWARD : 0,
          ok: true as const,
          xpDelta,
        };
      },
      setUserName: (userName) => set({ userName }),
      setBooName: (booName) => set({ booName }),
      setCoin: (coin) => set({ coin: Math.max(coin, 0) }),
      setDeveloperModeEnabled: (developerModeEnabled) =>
        set({ developerModeEnabled }),
      setEquippedRoomItem: (slotId, itemId) =>
        set((state) => {
          if (
            ROOM_ITEM_ASSETS[itemId]?.slotId !== slotId ||
            !state.ownedRoomItems.includes(itemId)
          ) {
            return state;
          }

          return {
            equippedRoomItems: {
              ...state.equippedRoomItems,
              [slotId]: itemId,
            },
          };
        }),
      setEquippedRoomWallpaper: (wallpaperId) =>
        set((state) => {
          if (
            !ROOM_WALLPAPER_ASSETS[wallpaperId] ||
            !state.ownedRoomWallpapers.includes(wallpaperId)
          ) {
            return state;
          }

          return {
            equippedRoomWallpaper: wallpaperId,
          };
        }),
      setFriendList: (friendList) => set({ friendList }),
      setHasSeenGameTutorial: (hasSeenGameTutorial) =>
        set({ hasSeenGameTutorial }),
      setMasterVolume: (masterVolume) =>
        set({ masterVolume: clampVolume(masterVolume) }),
      setGrade: (grade) => set({ totalXp: getTotalXpForGrade(grade) }),
      setBgmVolume: (bgmVolume) => set({ bgmVolume: clampVolume(bgmVolume) }),
      setMealDayMode: (mealDayMode) => set({ mealDayMode }),
      setMealRestrictionEnabled: (mealRestrictionEnabled) =>
        set({ mealRestrictionEnabled }),
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
      setSfxVolume: (sfxVolume) => set({ sfxVolume: clampVolume(sfxVolume) }),
      setStudentId: (studentId) => set({ studentId }),
      setTotalXp: (totalXp) =>
        set((state) => {
          const nextTotalXp = Math.max(totalXp, 0);

          return {
            pendingEvolution: createPendingEvolution({
              currentPendingEvolution: state.pendingEvolution,
              currentTotalXp: state.totalXp,
              nextTotalXp,
              resumeState: state.characterState,
              trigger: "xp",
            }),
            totalXp: nextTotalXp,
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
      setGameState: (patch) => set((state) => ({ ...state, ...patch })),
      resetGameState: () => {
        clearEatingTimeout();
        set({
          ...createInitialGameState(),
          bgmVolume: get().bgmVolume,
          developerModeEnabled: get().developerModeEnabled,
          masterVolume: get().masterVolume,
          sfxVolume: get().sfxVolume,
        });
      },
    }),
    {
      name: "boo-game-store",
      storage: createJSONStorage(resolvePersistStorage),
      partialize: (state) => ({
        appliedSkippedMealPenaltyCount: state.appliedSkippedMealPenaltyCount,
        booName: state.booName,
        characterState: state.characterState,
        coin: state.coin,
        developerModeEnabled: state.developerModeEnabled,
        equippedRoomItems: state.equippedRoomItems,
        equippedRoomWallpaper: state.equippedRoomWallpaper,
        friendList: state.friendList,
        guestbookEntries: state.guestbookEntries,
        hasSeenGameTutorial: state.hasSeenGameTutorial,
        lastFedMeals: state.lastFedMeals,
        lastFedMealSlotIndex: state.lastFedMealSlotIndex,
        masterVolume: state.masterVolume,
        mealDayMode: state.mealDayMode,
        mealRestrictionEnabled: state.mealRestrictionEnabled,
        ownedRoomItems: state.ownedRoomItems,
        ownedRoomWallpapers: state.ownedRoomWallpapers,
        quizAttemptHistory: state.quizAttemptHistory,
        quizDailyCount: state.quizDailyCount,
        quizDailyCountDateKey: state.quizDailyCountDateKey,
        quizDailyLimitEnabled: state.quizDailyLimitEnabled,
        bgmVolume: state.bgmVolume,
        skippedMealCount: state.skippedMealCount,
        sfxVolume: state.sfxVolume,
        studentId: state.studentId,
        totalXp: state.totalXp,
        userName: state.userName,
      }),
      onRehydrateStorage: () => (state) => {
        clearEatingTimeout();

        if (!state) {
          return;
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
          equippedRoomItems,
          ownedRoomItems: [...ownedRoomItems].filter(
            (itemId) => !!ROOM_ITEM_ASSETS[itemId],
          ),
        });
        state.syncMealStatus(false);
      },
    },
  ),
);
