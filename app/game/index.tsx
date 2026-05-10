import ball from "@/assets/icons/ball.svg";
import cap from "@/assets/icons/cap.svg";
import home from "@/assets/icons/home.svg";
import meal from "@/assets/icons/meal.svg";
import setting from "@/assets/icons/setting.svg";
import user from "@/assets/icons/users-multiple.svg";
import BooChat from "@/components/BooChat/BooChat";
import {
  getEvolutionBooChat,
  getQuizCorrectBooChat,
  getRandomAutoBooChat,
  getRandomTapBooChat,
} from "@/components/BooChat/BooChatList";
import Character from "@/components/Character/Character";
import CoinBox from "@/components/CoinBox/CoinBox";
import DeveloperPanel from "@/components/DeveloperPanel/DeveloperPanel";
import EvolutionOverlay, {
  EVOLUTION_BLINK_DURATION_MS,
} from "@/components/EvolutionOverlay/EvolutionOverlay";
import FriendList from "@/components/FriendList/FriendList";
import FriendPanel from "@/components/FriendPanel/FriendPanel";
import LoadingOverlay from "@/components/LoadingOverlay/LoadingOverlay";
import {
  formatMealCountdown,
  getMealAvailabilityStatus,
  PLATE_IMAGE_ASSETS,
} from "@/components/MealPanel/MealMenuData";
import MealPanel from "@/components/MealPanel/MealPanel";
import MyProfile from "@/components/MyProfile/MyProfile";
import Options from "@/components/Options/Options";
import ProgressBar from "@/components/ProgressBar/ProgressBar";
import {
  formatQuizCooldownRemaining,
  getAvailableQuizQuestions,
  getNextQuizAvailabilityTime,
  getQuizDailyCountForDate,
  QUIZ_DAILY_LIMIT,
} from "@/components/QuizPanel/QuizData";
import QuizPanel from "@/components/QuizPanel/QuizPanel";
import { ROOM_IMAGE_ASSETS } from "@/components/Room/RoomData";
import SoundSettings from "@/components/SoundSettings/SoundSettings";
import SquareButton from "@/components/SquareButton/SquareButton";
import TopAlert from "@/components/TopAlert/TopAlert";
import { TUTORIAL_IMAGE_ASSETS } from "@/components/TutorialPanel/TutorialData";
import TutorialPanel from "@/components/TutorialPanel/TutorialPanel";
import { CHARACTER_IMAGES, type CharacterState } from "@/constants/character";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import type { PendingEvolution } from "@/stores/useGameStore";
import { useGameStore } from "@/stores/useGameStore";
import { useTodayMeal } from "@/useHook/useTodayMeal";
import {
  pauseBackgroundMusicForOverlay,
  resumeBackgroundMusicAfterOverlay,
  startBackgroundMusicSession,
} from "@/utils/backgroundMusic";
import {
  getTodayMealTalkMessage,
  getWeekendBooChatMessage,
  type TodayMealSection,
} from "@/utils/getTodayMeal";
import { playSoundEffect } from "@/utils/soundEffects";
import { getRequiredXpForGrade, getXpProgressInfo } from "@/utils/xpProgress";
import { Image as ExpoImage, Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const CHARACTER_SIZE = 319;
const BIG_BUTTON_HEIGHT = 76;
const BOO_CHAT_DURATION_MS = 2000;
const CUSTOM_LOADING_MIN_DURATION_MS = 2000;
const PROGRESS_BAR_GAP = 22;
const AUTO_BOO_CHAT_INTERVAL_MS = 6000;
const MEAL_STATUS_SYNC_INTERVAL_MS = 30000;
const EVOLUTION_SOUND_DELAY_MS = 500;
const EVOLUTION_SMOKE_DURATION_MS = 1200;
const EVOLUTION_CONGRAT_SOUND_EARLY_MS = 500;
const EVOLUTION_CONGRAT_SOUND_DURATION_MS = 5042;
const EVOLUTION_ALERT_SUCCESS_MS = 4000;
const EVOLUTION_HAPPY_STATE_DURATION_MS = 10000;
const QUIZ_CORRECT_HAPPY_DURATION_MS = 5000;
const QUIZ_CORRECT_BOO_CHAT_DURATION_MS = 2600;
const EVOLUTION_POST_SUCCESS_SETTLE_MS = Math.max(
  EVOLUTION_ALERT_SUCCESS_MS,
  EVOLUTION_CONGRAT_SOUND_DURATION_MS - EVOLUTION_CONGRAT_SOUND_EARLY_MS,
);
const GAME_IMAGE_ASSETS = [
  require("../../assets/images/big-smoke.png"),
  ...Object.values(CHARACTER_IMAGES.grades).flatMap((gradeImages) =>
    Object.values(gradeImages),
  ),
  CHARACTER_IMAGES.graduate,
  ...PLATE_IMAGE_ASSETS,
  ...ROOM_IMAGE_ASSETS,
  ...TUTORIAL_IMAGE_ASSETS,
];

let hasPreloadedGameImageAssets = false;
let gameImageAssetsPreloadPromise: Promise<void> | null = null;

const preloadGameImageAssets = () => {
  if (hasPreloadedGameImageAssets) {
    return Promise.resolve();
  }

  if (!gameImageAssetsPreloadPromise) {
    gameImageAssetsPreloadPromise = Promise.all(
      GAME_IMAGE_ASSETS.map((source) => ExpoImage.loadAsync(source)),
    )
      .catch(() => undefined)
      .then(() => {
        hasPreloadedGameImageAssets = true;
      });
  }

  return gameImageAssetsPreloadPromise;
};

const resolvePostEvolutionCharacterState = (
  characterState: CharacterState,
): CharacterState => {
  if (characterState === "happy1" || characterState === "happy2") {
    return "basic1";
  }

  return characterState;
};

const getNextQuizDailyResetAt = (date: Date) => {
  const nextDate = new Date(date);

  nextDate.setDate(nextDate.getDate() + 1);
  nextDate.setHours(0, 0, 0, 0);

  return nextDate;
};

type TopAlertState = {
  autoHideDuration: number;
  closable: boolean;
  id: number;
  message: string;
  textSize: "compact" | "default";
  title: string;
  visible: boolean;
};

export default function Index() {
  const insets = useSafeAreaInsets();
  const booChatTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quizCorrectHappyTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const evolutionStartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const evolutionSequenceTimersRef = useRef<ReturnType<typeof setTimeout>[]>(
    [],
  );
  const hasShownWeekendBooChatRef = useRef(false);
  const isBooChatVisibleRef = useRef(false);
  const isAnyOverlayOpenRef = useRef(false);
  const isEvolutionBusyRef = useRef(false);
  const hasCheckedTutorialPromptRef = useRef(false);
  const shouldUseMinimumGameLoadingRef = useRef(!hasPreloadedGameImageAssets);
  const todayMealSectionsRef = useRef<TodayMealSection[]>([]);
  const [isOptionOpen, setIsOptionOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isFriendOpen, setIsFriendOpen] = useState(false);
  const [isFriendListOpen, setIsFriendListOpen] = useState(false);
  const [isSoundSettingsOpen, setIsSoundSettingsOpen] = useState(false);
  const [isMealOpen, setIsMealOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isDeveloperPanelOpen, setIsDeveloperPanelOpen] = useState(false);
  const [isBackgroundReady, setIsBackgroundReady] = useState(
    hasPreloadedGameImageAssets,
  );
  const [areGameAssetsLoaded, setAreGameAssetsLoaded] = useState(
    hasPreloadedGameImageAssets,
  );
  const [isMinimumLoadingElapsed, setIsMinimumLoadingElapsed] = useState(
    !shouldUseMinimumGameLoadingRef.current,
  );
  const [booChatMessage, setBooChatMessage] = useState("");
  const [isBooChatVisible, setIsBooChatVisible] = useState(false);
  const [isCharacterReady, setIsCharacterReady] = useState(
    hasPreloadedGameImageAssets,
  );
  const [activeEvolution, setActiveEvolution] =
    useState<PendingEvolution | null>(null);
  const [evolutionPhase, setEvolutionPhase] = useState<
    "blink" | "smoke" | null
  >(null);
  const [mealNow, setMealNow] = useState(() => new Date());
  const [topAlert, setTopAlert] = useState<TopAlertState>({
    autoHideDuration: 2600,
    closable: true,
    id: 0,
    message: "",
    textSize: "default",
    title: "",
    visible: false,
  });
  const { todayMealSections } = useTodayMeal();
  const booName = useGameStore((state) => state.booName);
  const characterState = useGameStore((state) => state.characterState);
  const clearPendingEvolution = useGameStore(
    (state) => state.clearPendingEvolution,
  );
  const coin = useGameStore((state) => state.coin);
  const developerModeEnabled = useGameStore(
    (state) => state.developerModeEnabled,
  );
  const hasSeenGameTutorial = useGameStore(
    (state) => state.hasSeenGameTutorial,
  );
  const lastFedMeals = useGameStore((state) => state.lastFedMeals);
  const mealRestrictionEnabled = useGameStore(
    (state) => state.mealRestrictionEnabled,
  );
  const pendingEvolution = useGameStore((state) => state.pendingEvolution);
  const quizAttemptHistory = useGameStore((state) => state.quizAttemptHistory);
  const quizDailyCount = useGameStore((state) => state.quizDailyCount);
  const quizDailyCountDateKey = useGameStore(
    (state) => state.quizDailyCountDateKey,
  );
  const quizDailyLimitEnabled = useGameStore(
    (state) => state.quizDailyLimitEnabled,
  );
  const setCharacterState = useGameStore((state) => state.setCharacterState);
  const setHasSeenGameTutorial = useGameStore(
    (state) => state.setHasSeenGameTutorial,
  );
  const syncMealStatus = useGameStore((state) => state.syncMealStatus);
  const totalXp = useGameStore((state) => state.totalXp);
  const bottomButtonOffset = Math.max(insets.bottom + 24, 46);
  const progressBarBottomOffset =
    bottomButtonOffset + BIG_BUTTON_HEIGHT + PROGRESS_BAR_GAP;
  const isGameVisualReady = isBackgroundReady && isCharacterReady;
  const isGameLoadingVisible =
    !isMinimumLoadingElapsed || !areGameAssetsLoaded || !isGameVisualReady;
  const xpProgress = useMemo(() => getXpProgressInfo(totalXp), [totalXp]);
  const evolutionDisplaySource =
    activeEvolution &&
    (evolutionPhase === "blink" || evolutionPhase === "smoke")
      ? activeEvolution
      : pendingEvolution;
  const displayedGrade = evolutionDisplaySource?.fromGrade ?? xpProgress.grade;
  const displayedProgressXp = evolutionDisplaySource
    ? getRequiredXpForGrade(evolutionDisplaySource.fromGrade)
    : xpProgress.currentXpInGrade;
  const displayedProgressMaxXp = evolutionDisplaySource
    ? getRequiredXpForGrade(evolutionDisplaySource.fromGrade)
    : xpProgress.progressMaxXp;
  const isEvolutionSequenceActive =
    !!activeEvolution && evolutionPhase !== null;
  const isEvolutionBusy =
    !!activeEvolution ||
    (!!pendingEvolution && pendingEvolution.trigger !== "quiz");
  const mealAvailability = getMealAvailabilityStatus(
    mealNow,
    lastFedMeals,
    mealRestrictionEnabled,
  );
  const isMealButtonDisabled =
    mealRestrictionEnabled && !mealAvailability.canFeedNow;
  const mealCountdownText = mealAvailability.shouldShowCountdown
    ? formatMealCountdown(mealAvailability.nextMeal.startsAt, mealNow)
    : "";
  const quizCountToday = getQuizDailyCountForDate(
    quizDailyCount,
    quizDailyCountDateKey,
    mealNow,
  );
  const availableQuizQuestions = useMemo(
    () =>
      getAvailableQuizQuestions(quizAttemptHistory, mealNow, {
        ignoreCooldown: !quizDailyLimitEnabled,
      }),
    [mealNow, quizAttemptHistory, quizDailyLimitEnabled],
  );
  const nextQuizAvailableAt = useMemo(
    () =>
      quizDailyLimitEnabled
        ? getNextQuizAvailabilityTime(quizAttemptHistory, mealNow)
        : null,
    [mealNow, quizAttemptHistory, quizDailyLimitEnabled],
  );
  const isQuizDailyLimitReached =
    quizDailyLimitEnabled && quizCountToday >= QUIZ_DAILY_LIMIT;
  const isQuizCooldownLocked =
    quizDailyLimitEnabled &&
    !isQuizDailyLimitReached &&
    availableQuizQuestions.length === 0;
  const isQuizButtonDisabled = isQuizDailyLimitReached || isQuizCooldownLocked;
  const nextQuizUnlockAt = isQuizDailyLimitReached
    ? getNextQuizDailyResetAt(mealNow)
    : nextQuizAvailableAt;
  const quizCountdownText =
    isQuizButtonDisabled && nextQuizUnlockAt
      ? formatMealCountdown(nextQuizUnlockAt, mealNow)
      : "";

  useFocusEffect(
    useCallback(() => {
      return startBackgroundMusicSession("main");
    }, []),
  );

  useEffect(() => {
    let isMounted = true;

    const preloadGameAssets = async () => {
      await preloadGameImageAssets();

      if (isMounted) {
        setAreGameAssetsLoaded(true);
      }
    };

    void preloadGameAssets();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!shouldUseMinimumGameLoadingRef.current) {
      setIsMinimumLoadingElapsed(true);
      return;
    }

    const loadingTimer = setTimeout(() => {
      setIsMinimumLoadingElapsed(true);
    }, CUSTOM_LOADING_MIN_DURATION_MS);

    return () => clearTimeout(loadingTimer);
  }, []);

  useEffect(() => {
    const mealClockTimer = setInterval(() => {
      if (isEvolutionBusyRef.current) {
        return;
      }

      setMealNow(new Date());
    }, 1000);

    return () => clearInterval(mealClockTimer);
  }, []);

  useEffect(() => {
    return () => {
      if (booChatTimeoutRef.current) {
        clearTimeout(booChatTimeoutRef.current);
      }

      if (quizCorrectHappyTimeoutRef.current) {
        clearTimeout(quizCorrectHappyTimeoutRef.current);
      }

      if (evolutionStartTimerRef.current) {
        clearTimeout(evolutionStartTimerRef.current);
      }

      evolutionSequenceTimersRef.current.forEach((timer) =>
        clearTimeout(timer),
      );
      evolutionSequenceTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!developerModeEnabled) {
      setIsDeveloperPanelOpen(false);
    }
  }, [developerModeEnabled]);

  useEffect(() => {
    isBooChatVisibleRef.current = isBooChatVisible;
  }, [isBooChatVisible]);

  useEffect(() => {
    isEvolutionBusyRef.current = isEvolutionBusy;
  }, [isEvolutionBusy]);

  useEffect(() => {
    isAnyOverlayOpenRef.current =
      isGameLoadingVisible ||
      isEvolutionBusy ||
      isTutorialOpen ||
      isDeveloperPanelOpen ||
      isOptionOpen ||
      isProfileOpen ||
      isFriendOpen ||
      isFriendListOpen ||
      isSoundSettingsOpen ||
      isMealOpen ||
      isQuizOpen;
  }, [
    isDeveloperPanelOpen,
    isEvolutionBusy,
    isGameLoadingVisible,
    isTutorialOpen,
    isFriendListOpen,
    isFriendOpen,
    isMealOpen,
    isOptionOpen,
    isProfileOpen,
    isQuizOpen,
    isSoundSettingsOpen,
  ]);

  useEffect(() => {
    todayMealSectionsRef.current = todayMealSections;
  }, [todayMealSections]);

  useEffect(() => {
    if (hasSeenGameTutorial) {
      hasCheckedTutorialPromptRef.current = false;
      setIsTutorialOpen(false);
      return;
    }

    if (
      hasCheckedTutorialPromptRef.current ||
      isGameLoadingVisible ||
      isEvolutionBusy ||
      isDeveloperPanelOpen ||
      isOptionOpen ||
      isProfileOpen ||
      isFriendOpen ||
      isFriendListOpen ||
      isSoundSettingsOpen ||
      isMealOpen ||
      isQuizOpen
    ) {
      return;
    }

    hasCheckedTutorialPromptRef.current = true;
    setIsTutorialOpen(true);
  }, [
    hasSeenGameTutorial,
    isDeveloperPanelOpen,
    isEvolutionBusy,
    isFriendListOpen,
    isFriendOpen,
    isGameLoadingVisible,
    isMealOpen,
    isOptionOpen,
    isProfileOpen,
    isQuizOpen,
    isSoundSettingsOpen,
  ]);

  const clearEvolutionStartTimer = useCallback(() => {
    if (evolutionStartTimerRef.current) {
      clearTimeout(evolutionStartTimerRef.current);
      evolutionStartTimerRef.current = null;
    }
  }, []);

  const clearEvolutionSequenceTimers = useCallback(() => {
    evolutionSequenceTimersRef.current.forEach((timer) => clearTimeout(timer));
    evolutionSequenceTimersRef.current = [];
  }, []);

  const clearQuizCorrectHappyTimer = useCallback(() => {
    if (quizCorrectHappyTimeoutRef.current) {
      clearTimeout(quizCorrectHappyTimeoutRef.current);
      quizCorrectHappyTimeoutRef.current = null;
    }
  }, []);

  const queueEvolutionTimer = useCallback(
    (callback: () => void, delay: number) => {
      const timer = setTimeout(() => {
        evolutionSequenceTimersRef.current =
          evolutionSequenceTimersRef.current.filter((item) => item !== timer);
        callback();
      }, delay);

      evolutionSequenceTimersRef.current.push(timer);
    },
    [],
  );

  const stopEvolutionAudioAndTimers = useCallback(() => {
    clearQuizCorrectHappyTimer();
    clearEvolutionStartTimer();
    clearEvolutionSequenceTimers();
  }, [
    clearEvolutionSequenceTimers,
    clearEvolutionStartTimer,
    clearQuizCorrectHappyTimer,
  ]);

  const hideBooChatNow = useCallback(() => {
    if (booChatTimeoutRef.current) {
      clearTimeout(booChatTimeoutRef.current);
      booChatTimeoutRef.current = null;
    }

    isBooChatVisibleRef.current = false;
    setIsBooChatVisible(false);
  }, []);

  const showBooChat = useCallback(
    (message: string, options?: { durationMs?: number; force?: boolean }) => {
      if (isEvolutionBusyRef.current && !options?.force) {
        return;
      }

      if (booChatTimeoutRef.current) {
        clearTimeout(booChatTimeoutRef.current);
      }

      setBooChatMessage(message);
      isBooChatVisibleRef.current = true;
      setIsBooChatVisible(true);

      booChatTimeoutRef.current = setTimeout(() => {
        isBooChatVisibleRef.current = false;
        setIsBooChatVisible(false);
      }, options?.durationMs ?? BOO_CHAT_DURATION_MS);
    },
    [],
  );

  const getContextualBooChatMessage = useCallback(() => {
    const mealTalkMessage = getTodayMealTalkMessage(
      todayMealSectionsRef.current,
    );

    if (mealTalkMessage) {
      return mealTalkMessage;
    }

    if (hasShownWeekendBooChatRef.current) {
      return null;
    }

    const weekendTalkMessage = getWeekendBooChatMessage();

    if (weekendTalkMessage) {
      hasShownWeekendBooChatRef.current = true;
    }

    return weekendTalkMessage;
  }, []);

  const closeAllPanelsToMain = useCallback(() => {
    setIsDeveloperPanelOpen(false);
    setIsOptionOpen(false);
    setIsProfileOpen(false);
    setIsFriendOpen(false);
    setIsFriendListOpen(false);
    setIsSoundSettingsOpen(false);
    setIsMealOpen(false);
    setIsQuizOpen(false);
  }, []);

  const showTopAlert = useCallback(
    (
      title: string,
      message: string,
      options?: {
        autoHideDuration?: number;
        closable?: boolean;
        textSize?: "compact" | "default";
      },
    ) => {
      setTopAlert((prev) => ({
        autoHideDuration: options?.autoHideDuration ?? 2600,
        closable: options?.closable ?? true,
        id: prev.id + 1,
        message,
        textSize: options?.textSize ?? "default",
        title,
        visible: true,
      }));
    },
    [],
  );

  const hideTopAlert = useCallback(() => {
    setTopAlert((prev) => ({
      ...prev,
      visible: false,
    }));
  }, []);

  const showSkippedMealPenaltyAlert = useCallback(
    (xpPenalty: number) => {
      if (xpPenalty <= 0) {
        return;
      }

      showTopAlert(
        "끼니를 걸렀어요",
        `부가 배고파해서 XP가 ${xpPenalty} 감소했어요.`,
        {
          autoHideDuration: 2400,
          textSize: "compact",
        },
      );
    },
    [showTopAlert],
  );

  useFocusEffect(
    useCallback(() => {
      const syncResult = syncMealStatus();
      showSkippedMealPenaltyAlert(syncResult.xpPenalty);
    }, [showSkippedMealPenaltyAlert, syncMealStatus]),
  );

  useEffect(() => {
    const mealStatusSyncTimer = setInterval(() => {
      if (isEvolutionBusyRef.current) {
        return;
      }

      const syncResult = syncMealStatus();
      showSkippedMealPenaltyAlert(syncResult.xpPenalty);
    }, MEAL_STATUS_SYNC_INTERVAL_MS);

    return () => clearInterval(mealStatusSyncTimer);
  }, [showSkippedMealPenaltyAlert, syncMealStatus]);

  const startEvolutionSequence = useCallback(
    (evolution: PendingEvolution) => {
      stopEvolutionAudioAndTimers();
      closeAllPanelsToMain();
      hideBooChatNow();
      pauseBackgroundMusicForOverlay();
      setActiveEvolution(evolution);
      setEvolutionPhase("blink");

      showTopAlert("앗 부의 상태가...!", "", {
        autoHideDuration: 0,
        closable: false,
      });

      queueEvolutionTimer(() => {
        playSoundEffect("evolution");
      }, EVOLUTION_SOUND_DELAY_MS);

      queueEvolutionTimer(() => {
        setCharacterState("happy1");
        setEvolutionPhase("smoke");
      }, EVOLUTION_BLINK_DURATION_MS);

      queueEvolutionTimer(
        () => {
          playSoundEffect("congratulation");
        },
        EVOLUTION_BLINK_DURATION_MS +
          EVOLUTION_SMOKE_DURATION_MS -
          EVOLUTION_CONGRAT_SOUND_EARLY_MS,
      );

      queueEvolutionTimer(() => {
        setEvolutionPhase(null);
        clearPendingEvolution();
        showBooChat(getEvolutionBooChat(evolution.toGrade), {
          durationMs: EVOLUTION_ALERT_SUCCESS_MS,
          force: true,
        });
        showTopAlert(
          `${booName}이(가) ${evolution.toGrade}학년으로 진화했다!`,
          "",
          {
            autoHideDuration: EVOLUTION_ALERT_SUCCESS_MS,
            closable: false,
          },
        );
      }, EVOLUTION_BLINK_DURATION_MS + EVOLUTION_SMOKE_DURATION_MS);

      queueEvolutionTimer(
        () => {
          resumeBackgroundMusicAfterOverlay();
          setActiveEvolution(null);
        },
        EVOLUTION_BLINK_DURATION_MS +
          EVOLUTION_SMOKE_DURATION_MS +
          EVOLUTION_POST_SUCCESS_SETTLE_MS,
      );

      queueEvolutionTimer(
        () => {
          const nextCharacterState = resolvePostEvolutionCharacterState(
            evolution.resumeState,
          );

          if (evolution.trigger === "meal") {
            setCharacterState(nextCharacterState);
            syncMealStatus(false);
          } else {
            setCharacterState(nextCharacterState);
          }
        },
        EVOLUTION_BLINK_DURATION_MS +
          EVOLUTION_SMOKE_DURATION_MS +
          EVOLUTION_HAPPY_STATE_DURATION_MS,
      );
    },
    [
      clearPendingEvolution,
      closeAllPanelsToMain,
      hideBooChatNow,
      queueEvolutionTimer,
      stopEvolutionAudioAndTimers,
      setCharacterState,
      showTopAlert,
      syncMealStatus,
      booName,
    ],
  );

  useFocusEffect(
    useCallback(() => {
      const entryBooChatTimer = setTimeout(() => {
        if (
          isEvolutionBusyRef.current ||
          isBooChatVisibleRef.current ||
          isAnyOverlayOpenRef.current
        ) {
          return;
        }

        const contextualMessage = getContextualBooChatMessage();

        if (!contextualMessage) {
          return;
        }

        showBooChat(contextualMessage);
      }, 1000);

      return () => clearTimeout(entryBooChatTimer);
    }, [getContextualBooChatMessage, showBooChat]),
  );

  useEffect(() => {
    if (isEvolutionBusy) {
      hideBooChatNow();
    }
  }, [hideBooChatNow, isEvolutionBusy]);

  useEffect(() => {
    clearEvolutionStartTimer();

    if (!pendingEvolution || activeEvolution) {
      return;
    }

    if (pendingEvolution.trigger === "quiz" && isQuizOpen) {
      return;
    }

    if (pendingEvolution.trigger !== "quiz") {
      closeAllPanelsToMain();
    }

    const delay = pendingEvolution.readyAt
      ? Math.max(pendingEvolution.readyAt - Date.now(), 0)
      : 0;

    evolutionStartTimerRef.current = setTimeout(() => {
      evolutionStartTimerRef.current = null;
      startEvolutionSequence(pendingEvolution);
    }, delay);

    return clearEvolutionStartTimer;
  }, [
    activeEvolution,
    clearEvolutionStartTimer,
    closeAllPanelsToMain,
    isQuizOpen,
    pendingEvolution,
    startEvolutionSequence,
  ]);

  useEffect(() => {
    const autoChatTimer = setInterval(() => {
      if (
        isEvolutionBusy ||
        isGameLoadingVisible ||
        isTutorialOpen ||
        isBooChatVisible ||
        isDeveloperPanelOpen ||
        isOptionOpen ||
        isProfileOpen ||
        isFriendOpen ||
        isFriendListOpen ||
        isSoundSettingsOpen ||
        isMealOpen ||
        isQuizOpen
      ) {
        return;
      }

      const nextMessage =
        getContextualBooChatMessage() ?? getRandomAutoBooChat(characterState);

      showBooChat(nextMessage);
    }, AUTO_BOO_CHAT_INTERVAL_MS);

    return () => clearInterval(autoChatTimer);
  }, [
    characterState,
    getContextualBooChatMessage,
    isEvolutionBusy,
    isGameLoadingVisible,
    isTutorialOpen,
    isDeveloperPanelOpen,
    isBooChatVisible,
    isFriendListOpen,
    isFriendOpen,
    isMealOpen,
    isOptionOpen,
    isProfileOpen,
    isQuizOpen,
    isSoundSettingsOpen,
    showBooChat,
  ]);

  const handleCharacterPress = () => {
    if (isEvolutionBusy) {
      return;
    }

    playSoundEffect("booTouch");
    showBooChat(getRandomTapBooChat(characterState));
  };

  const handleQuizOpenPress = () => {
    if (isEvolutionBusy) {
      return;
    }

    setIsDeveloperPanelOpen(false);
    setIsFriendOpen(false);
    setIsOptionOpen(false);
    setIsProfileOpen(false);
    setIsFriendListOpen(false);
    setIsSoundSettingsOpen(false);
    setIsMealOpen(false);
    setIsQuizOpen((prev) => !prev);
  };

  const showMealUnavailableAlert = useCallback(() => {
    const countdownText = formatMealCountdown(
      mealAvailability.nextMeal.startsAt,
      mealNow,
    );

    showTopAlert(
      "다음 학식까지 기다려주세요",
      `${mealAvailability.nextMeal.title}까지 ${countdownText}`,
      {
        autoHideDuration: 1800,
        textSize: "compact",
      },
    );
  }, [mealAvailability, mealNow, showTopAlert]);

  const showQuizUnavailableAlert = useCallback(() => {
    if (isQuizDailyLimitReached) {
      const resetCountdownText = formatMealCountdown(
        getNextQuizDailyResetAt(mealNow),
        mealNow,
      );

      showTopAlert(
        "오늘 퀴즈는 완료했어요",
        `${resetCountdownText} 뒤에 열려요.`,
        {
          autoHideDuration: 1800,
          textSize: "compact",
        },
      );
      return;
    }

    const remainingText = nextQuizAvailableAt
      ? formatQuizCooldownRemaining(nextQuizAvailableAt, mealNow)
      : "조금";

    showTopAlert(
      "다음 퀴즈까지 기다려주세요",
      `${remainingText} 뒤에 열려요.`,
      {
        autoHideDuration: 1800,
        textSize: "compact",
      },
    );
  }, [isQuizDailyLimitReached, mealNow, nextQuizAvailableAt, showTopAlert]);

  const handleQuizResultAlert = useCallback(
    (isCorrect: boolean) => {
      playSoundEffect(isCorrect ? "quizO" : "quizX");

      showTopAlert(
        isCorrect ? "퀴즈 정답!" : "퀴즈 오답!",
        isCorrect ? "XP가 30 증가합니다" : "XP가 10 감소합니다",
      );

      if (!isCorrect) {
        return;
      }

      const resumeState = resolvePostEvolutionCharacterState(
        useGameStore.getState().characterState,
      );

      clearQuizCorrectHappyTimer();
      setCharacterState("happy1");
      showBooChat(getQuizCorrectBooChat(), {
        durationMs: QUIZ_CORRECT_BOO_CHAT_DURATION_MS,
      });

      quizCorrectHappyTimeoutRef.current = setTimeout(() => {
        quizCorrectHappyTimeoutRef.current = null;

        if (isEvolutionBusyRef.current) {
          return;
        }

        setCharacterState(resumeState);
      }, QUIZ_CORRECT_HAPPY_DURATION_MS);
    },
    [clearQuizCorrectHappyTimer, setCharacterState, showBooChat, showTopAlert],
  );

  return (
    <View style={styles.backgroundImage}>
      <StatusBar hidden={true} />
      <TopAlert
        autoHideDuration={topAlert.autoHideDuration}
        closable={topAlert.closable}
        message={topAlert.message}
        onClose={hideTopAlert}
        textSize={topAlert.textSize}
        title={topAlert.title}
        visibilityKey={topAlert.id}
        visible={topAlert.visible}
      />
      <View
        pointerEvents={isEvolutionBusy ? "auto" : "none"}
        style={styles.interactionBlocker}
      />
      <Image
        style={StyleSheet.absoluteFill}
        source={require("../../assets/images/inGameMain.png")}
        contentFit="cover"
        cachePolicy="memory-disk"
        onDisplay={() => setIsBackgroundReady(true)}
        onError={() => setIsBackgroundReady(true)}
      />
      {isEvolutionSequenceActive ? (
        <View pointerEvents="none" style={styles.evolutionBackdrop} />
      ) : null}
      <View pointerEvents="box-none" style={styles.characterLayer}>
        <Pressable
          disabled={isEvolutionBusy}
          onPress={handleCharacterPress}
          style={styles.characterContainer}
        >
          <View pointerEvents="none" style={styles.booChatAnchor}>
            <BooChat
              message={booChatMessage}
              style={styles.booChat}
              visible={isBooChatVisible}
            />
          </View>
          {!activeEvolution || evolutionPhase === null ? (
            <View style={styles.characterVisual}>
              <Character
                grade={displayedGrade}
                onImageReady={() => setIsCharacterReady(true)}
                state={characterState}
              />
            </View>
          ) : null}
          <EvolutionOverlay
            fromGrade={activeEvolution?.fromGrade ?? displayedGrade}
            phase={evolutionPhase}
            toGrade={activeEvolution?.toGrade ?? displayedGrade}
            visible={!!activeEvolution && evolutionPhase !== null}
          />
        </Pressable>
      </View>
      <SafeAreaView style={styles.container}>
        <View style={styles.buttonContainer}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <SquareButton
              disabled={isEvolutionSequenceActive}
              Icon={home}
              onPress={() => router.replace("/room")}
            />
            <CoinBox coin={coin} dimmed={isEvolutionSequenceActive} />
          </View>
          <View style={styles.topRightControlGroup}>
            <View style={styles.topRightButtonRow}>
              <SquareButton
                disabled={isEvolutionSequenceActive}
                Icon={user}
                onPress={() => {
                  setIsDeveloperPanelOpen(false);
                  setIsOptionOpen(false);
                  setIsProfileOpen(false);
                  setIsFriendListOpen(false);
                  setIsSoundSettingsOpen(false);
                  setIsMealOpen(false);
                  setIsQuizOpen(false);
                  setIsFriendOpen((prev) => !prev);
                }}
              />
              <SquareButton
                disabled={isEvolutionSequenceActive}
                Icon={setting}
                onPress={() => {
                  setIsDeveloperPanelOpen(false);
                  setIsFriendOpen(false);
                  setIsProfileOpen(false);
                  setIsFriendListOpen(false);
                  setIsSoundSettingsOpen(false);
                  setIsMealOpen(false);
                  setIsQuizOpen(false);
                  setIsOptionOpen((prev) => !prev);
                }}
              />
            </View>
            {developerModeEnabled && !isDeveloperPanelOpen && (
              <View style={styles.developerShortcutRow}>
                <Pressable
                  disabled={isEvolutionSequenceActive}
                  onPress={() => {
                    if (isEvolutionBusy) {
                      return;
                    }

                    setIsFriendOpen(false);
                    setIsProfileOpen(false);
                    setIsFriendListOpen(false);
                    setIsSoundSettingsOpen(false);
                    setIsMealOpen(false);
                    setIsQuizOpen(false);
                    setIsOptionOpen(false);
                    setIsDeveloperPanelOpen(true);
                  }}
                  style={({ pressed }) => [
                    styles.developerShortcutButton,
                    isEvolutionSequenceActive &&
                      styles.developerShortcutButtonDisabled,
                    pressed && styles.developerShortcutButtonPressed,
                  ]}
                >
                  <Text style={styles.developerShortcutText}>개발자</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
        <ProgressBar
          booName={booName}
          bottomOffset={progressBarBottomOffset}
          dimmed={isEvolutionSequenceActive}
          grade={displayedGrade}
          maxXp={displayedProgressMaxXp}
          xp={displayedProgressXp}
        />
        <View
          style={[styles.bigButtonContainer, { bottom: bottomButtonOffset }]}
        >
          <View style={styles.bigButtonSlot}>
            <SquareButton
              allowDisabledPress={
                isQuizButtonDisabled && !isEvolutionSequenceActive
              }
              disabled={isQuizButtonDisabled || isEvolutionSequenceActive}
              Icon={cap}
              onPress={() => {
                if (isQuizButtonDisabled) {
                  showQuizUnavailableAlert();
                  return;
                }

                handleQuizOpenPress();
              }}
              size="M"
            />
            {quizCountdownText ? (
              <Text style={styles.quizCountdownText}>{quizCountdownText}</Text>
            ) : null}
          </View>
          <View style={styles.mealButtonColumn}>
            <SquareButton
              allowDisabledPress={
                isMealButtonDisabled && !isEvolutionSequenceActive
              }
              disabled={isMealButtonDisabled || isEvolutionSequenceActive}
              Icon={meal}
              onPress={() => {
                if (isMealButtonDisabled) {
                  showMealUnavailableAlert();
                  return;
                }

                if (isEvolutionBusy) {
                  return;
                }

                setIsDeveloperPanelOpen(false);
                setIsFriendOpen(false);
                setIsOptionOpen(false);
                setIsProfileOpen(false);
                setIsFriendListOpen(false);
                setIsSoundSettingsOpen(false);
                setIsQuizOpen(false);
                setIsMealOpen((prev) => !prev);
              }}
              size="M"
            />
            {mealAvailability.shouldShowCountdown && (
              <Text style={styles.mealCountdownText}>{mealCountdownText}</Text>
            )}
          </View>
          <View style={styles.bigButtonSlot}>
            <SquareButton
              disabled={isEvolutionSequenceActive}
              Icon={ball}
              onPress={() => {
                showTopAlert("준비 중", "아직 개발되지 않은 기능이에요.", {
                  autoHideDuration: 1800,
                  textSize: "compact",
                });
              }}
              size="M"
            />
          </View>
        </View>
      </SafeAreaView>
      {isOptionOpen && (
        <Options
          setIsFriendListOpen={setIsFriendListOpen}
          setIsOptionOpen={setIsOptionOpen}
          setIsProfileOpen={setIsProfileOpen}
          setIsSoundSettingsOpen={setIsSoundSettingsOpen}
        />
      )}
      {isProfileOpen && (
        <MyProfile
          setIsOptionOpen={setIsOptionOpen}
          setIsProfileOpen={setIsProfileOpen}
        />
      )}
      {isFriendOpen && <FriendPanel setIsFriendOpen={setIsFriendOpen} />}
      {isFriendListOpen && (
        <FriendList
          setIsFriendListOpen={setIsFriendListOpen}
          setIsOptionOpen={setIsOptionOpen}
        />
      )}
      {isSoundSettingsOpen && (
        <SoundSettings
          setIsOptionOpen={setIsOptionOpen}
          setIsSoundSettingsOpen={setIsSoundSettingsOpen}
        />
      )}
      {isMealOpen && (
        <MealPanel
          onFeedInsufficientCoin={() =>
            showTopAlert(
              "코인이 부족해요!",
              "학식을 먹이려면\n코인을 더 모아야 해요.",
            )
          }
          onFeedSuccess={() => {
            if (useGameStore.getState().pendingEvolution?.trigger === "meal") {
              return;
            }

            showBooChat(getRandomTapBooChat("eating"));
          }}
          setIsMealOpen={setIsMealOpen}
        />
      )}
      {isQuizOpen && (
        <QuizPanel
          onQuizResultAlert={handleQuizResultAlert}
          setIsQuizOpen={setIsQuizOpen}
        />
      )}
      {isDeveloperPanelOpen && (
        <DeveloperPanel
          onActionFeedback={(title, message) =>
            showTopAlert(title, message ?? "", {
              autoHideDuration: 1000,
              textSize: "compact",
            })
          }
          onMealStateChanged={() => setMealNow(new Date())}
          setIsDeveloperPanelOpen={setIsDeveloperPanelOpen}
        />
      )}
      {isTutorialOpen && (
        <TutorialPanel
          onComplete={() => {
            setHasSeenGameTutorial(true);
            setIsTutorialOpen(false);
          }}
        />
      )}
      {isGameLoadingVisible && <LoadingOverlay />}
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    backgroundColor: colors.GRAY_NORMAL,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  topRightControlGroup: {
    alignItems: "flex-end",
  },
  topRightButtonRow: {
    flexDirection: "row",
    gap: 8,
  },
  developerShortcutRow: {
    marginTop: 6,
    alignSelf: "stretch",
    alignItems: "flex-end",
  },
  developerShortcutButton: {
    width: 96,
    minHeight: 36,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.BLACK_NORMAL,
    backgroundColor: colors.WHITE_NORMAL,
    alignItems: "center",
    justifyContent: "center",
  },
  developerShortcutButtonPressed: {
    backgroundColor: colors.GREEN_LIGHT_ACTIVE,
  },
  developerShortcutButtonDisabled: {
    opacity: 0.55,
  },
  developerShortcutText: {
    fontFamily: fonts.BASIC,
    fontSize: 18,
    lineHeight: 20,
    color: colors.GREEN_NORMAL,
    includeFontPadding: false,
  },
  bigButtonContainer: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    position: "absolute",
    left: 28,
    right: 28,
  },
  bigButtonSlot: {
    width: BIG_BUTTON_HEIGHT,
    alignItems: "center",
    height: BIG_BUTTON_HEIGHT,
    position: "relative",
  },
  mealButtonColumn: {
    height: BIG_BUTTON_HEIGHT,
    position: "relative",
    width: BIG_BUTTON_HEIGHT,
    alignItems: "center",
  },
  mealCountdownText: {
    position: "absolute",
    top: BIG_BUTTON_HEIGHT + 6,
    fontSize: 16,
    lineHeight: 20,
    fontFamily: fonts.BASIC,
    color: colors.DANGER,
    includeFontPadding: false,
  },
  quizCountdownText: {
    position: "absolute",
    top: BIG_BUTTON_HEIGHT + 6,
    fontSize: 16,
    lineHeight: 20,
    fontFamily: fonts.BASIC,
    color: colors.DANGER,
    includeFontPadding: false,
  },
  container: {
    flex: 1,
    paddingVertical: 24,
    paddingHorizontal: 28,
    zIndex: 0,
  },
  interactionBlocker: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1500,
    elevation: 1500,
  },
  evolutionBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  characterLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    elevation: 1,
  },
  characterContainer: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: CHARACTER_SIZE,
    height: CHARACTER_SIZE,
    transform: [
      { translateX: -CHARACTER_SIZE / 2 },
      { translateY: -CHARACTER_SIZE / 2 },
    ],
  },
  characterVisual: {
    flex: 1,
  },
  booChatAnchor: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1,
  },
  booChat: {
    position: "relative",
  },
});
