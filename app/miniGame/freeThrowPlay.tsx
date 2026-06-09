/**
 * @description  자유투 넣기 미니게임의 인게임 화면입니다.
 * @depends      assets/icons/arrow-back-return.svg, assets/icons/trophy.svg, assets/miniGame/basketball/*, assets/places/obama-hall.png, components/CoinBox/CoinBox.tsx, components/MainButton/MainButton.tsx, components/SquareButton/SquareButton.tsx, components/TopAlert/TopAlert.tsx, constants/colors.ts, stores/useGameStore.ts, utils/backgroundMusic.ts, utils/serverApi.ts, utils/soundEffects.ts
 * @used-by      expo-router, components/MiniGame/MiniGameStartScreen.tsx
 * @side-effects miniGameIngame BGM 세션 시작, 게이지/공/골대 애니메이션 실행, 미니게임 보상 서버 동기화, router 이동
 */
/* eslint-disable react-hooks/refs -- React Native Animated.Value instances are rendered directly into Animated styles. */
import ArrowBackIcon from "@/assets/icons/arrow-back-return.svg";
import CrossIcon from "@/assets/icons/cross.svg";
import CoinBox from "@/components/CoinBox/CoinBox";
import MainButton from "@/components/MainButton/MainButton";
import { simulateFreeThrowShot } from "@/components/MiniGame/freeThrow/freeThrowPhysics";
import OutlinedText from "@/components/OutlinedText/OutlinedText";
import SquareButton from "@/components/SquareButton/SquareButton";
import TopAlert from "@/components/TopAlert/TopAlert";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { useGameStore } from "@/stores/useGameStore";
import { useRequirePlayableSession } from "@/useHook/useRequirePlayableSession";
import { startBackgroundMusicSession } from "@/utils/backgroundMusic";
import {
  createMiniGameResult,
  getServerApiErrorMessage,
  rewardMiniGameEconomy,
  startMiniGameEconomy,
} from "@/utils/serverApi";
import { playSoundEffect } from "@/utils/soundEffects";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const BACKBOARD_IMAGE = require("@/assets/miniGame/basketball/backboard-trimmed.png");
const BALL_IMAGE = require("@/assets/miniGame/basketball/ball.png");
const OBAMA_HALL_GAME_BACKGROUND = require("@/assets/places/obama-hall.png");

const HOOP_FRAMES = [
  require("@/assets/miniGame/basketball/basketball-hoop-01.png"),
  require("@/assets/miniGame/basketball/basketball-hoop-02.png"),
  require("@/assets/miniGame/basketball/basketball-hoop-03.png"),
  require("@/assets/miniGame/basketball/basketball-hoop-04.png"),
  require("@/assets/miniGame/basketball/basketball-hoop-05.png"),
  require("@/assets/miniGame/basketball/basketball-hoop-06.png"),
  require("@/assets/miniGame/basketball/basketball-hoop-07.png"),
  require("@/assets/miniGame/basketball/basketball-hoop-08.png"),
  require("@/assets/miniGame/basketball/basketball-hoop-09.png"),
  require("@/assets/miniGame/basketball/basketball-hoop-10.png"),
  require("@/assets/miniGame/basketball/basketball-hoop-11.png"),
  require("@/assets/miniGame/basketball/basketball-hoop-12.png"),
  require("@/assets/miniGame/basketball/basketball-hoop-13.png"),
  require("@/assets/miniGame/basketball/basketball-hoop-14.png"),
  require("@/assets/miniGame/basketball/basketball-hoop-15.png"),
  require("@/assets/miniGame/basketball/basketball-hoop-16.png"),
];

const BASKETBALL_GOAL_LAYOUT = {
  backboard: {
    maxWidth: 300,
    widthRatio: 0.6,
    xOffset: 0,
    yOffset: 0,
  },
  group: {
    maxTop: 230,
    minTop: 168,
    topRatio: 0.52,
  },
  hoop: {
    sizeRatio: 0.525,
    xOffset: -2.3,
    yOffsetRatio: 0.52,
  },
} as const;

const BASKETBALL_BALL_LAYOUT = {
  size: 140,
  xOffset: 0,
  yOffset: -20,
} as const;

const SHOW_SUCCESS_SHOT_PATH_GUIDES = false;
const SUCCESS_SHOT_PATH_HOOP_DEPTH_START_INDEX = 2;

type SuccessShotPathPoint = {
  duration: number;
  scale: number;
  x: number;
  y: number;
};

const SUCCESS_SHOT_PATH_POINTS = [
  {
    duration: 0,
    scale: 1,
    x: 0,
    y: 0,
  },
  {
    duration: 300,
    scale: 0.8,
    x: 0,
    y: -200,
  },
  {
    duration: 350,
    scale: 0.75,
    x: 0,
    y: -320,
  },
  {
    duration: 200,
    scale: 0.7,
    x: 0,
    y: -40,
  },
] as const satisfies readonly SuccessShotPathPoint[];

const FREE_THROW_SHOT_PLAYBACK_DURATION_SCALE = 0.88;
const FREE_THROW_SUCCESS_NEXT_ATTEMPT_DELAY_MS = 80;
const HOOP_SUCCESS_FRAME_INTERVAL_MS = 18;

const FREE_THROW_GAME = {
  gauge: {
    horizontalPadding: 56,
    innerHorizontalInset: 2,
    innerVerticalInset: 2,
    markerWidth: 4,
    maxTrackWidth: 492,
    minTrackWidth: 300,
    trackHeight: 76,
    visualScaleY: 2 / 3,
  },
  rewardCoin: 3,
  successGoal: 5,
} as const;

const FREE_THROW_DIFFICULTY = {
  maxLevel: 10,
  markerDuration: {
    maxMs: 1650,
    minMs: 720,
  },
  targetWidth: {
    max: 36,
    min: 20,
  },
} as const;

type FreeThrowOutcome = "overPower" | "success" | "underPower";
type GamePhase = "animating" | "countdown" | "ended" | "playing" | "preparing";
type GaugeTarget = {
  left: number;
  width: number;
};
type FreeThrowShotAttempt = {
  missRatio: number;
  outcome: FreeThrowOutcome;
};

const PIXEL_OUTER_BORDER_WIDTH = 2;
const PIXEL_INNER_STEP = 4;
const PIXEL_OUTER_STEP = 8;

const createPixelPath = (width: number, height: number) => {
  const firstStep = PIXEL_INNER_STEP;
  const secondStep = PIXEL_OUTER_STEP;

  return [
    `M ${secondStep} 0`,
    `L ${width - secondStep} 0`,
    `L ${width - secondStep} ${firstStep}`,
    `L ${width - firstStep} ${firstStep}`,
    `L ${width - firstStep} ${secondStep}`,
    `L ${width} ${secondStep}`,
    `L ${width} ${height - secondStep}`,
    `L ${width - firstStep} ${height - secondStep}`,
    `L ${width - firstStep} ${height - firstStep}`,
    `L ${width - secondStep} ${height - firstStep}`,
    `L ${width - secondStep} ${height}`,
    `L ${secondStep} ${height}`,
    `L ${secondStep} ${height - firstStep}`,
    `L ${firstStep} ${height - firstStep}`,
    `L ${firstStep} ${height - secondStep}`,
    `L 0 ${height - secondStep}`,
    `L 0 ${secondStep}`,
    `L ${firstStep} ${secondStep}`,
    `L ${firstStep} ${firstStep}`,
    `L ${secondStep} ${firstStep}`,
    "Z",
  ].join(" ");
};

const getFreeThrowRoundConfig = (round: number) => {
  const difficultyLevel = Math.min(round, FREE_THROW_DIFFICULTY.maxLevel);
  const difficultyProgress =
    FREE_THROW_DIFFICULTY.maxLevel <= 1
      ? 1
      : (difficultyLevel - 1) / (FREE_THROW_DIFFICULTY.maxLevel - 1);

  const targetWidth =
    FREE_THROW_DIFFICULTY.targetWidth.max -
    (FREE_THROW_DIFFICULTY.targetWidth.max -
      FREE_THROW_DIFFICULTY.targetWidth.min) *
      difficultyProgress;
  const markerDuration =
    FREE_THROW_DIFFICULTY.markerDuration.maxMs -
    (FREE_THROW_DIFFICULTY.markerDuration.maxMs -
      FREE_THROW_DIFFICULTY.markerDuration.minMs) *
      difficultyProgress;

  return {
    markerDuration,
    targetWidth,
  };
};

const createGaugeTarget = (round: number, trackWidth: number): GaugeTarget => {
  const { targetWidth } = getFreeThrowRoundConfig(round);
  const contentWidth =
    trackWidth - FREE_THROW_GAME.gauge.innerHorizontalInset * 2;
  const maxLeft = contentWidth - targetWidth;

  return {
    left: Math.round(Math.random() * maxLeft),
    width: targetWidth,
  };
};

export default function FreeThrowPlayScreen() {
  const queryClient = useQueryClient();
  const canPlayMiniGame = useRequirePlayableSession();
  const { width } = useWindowDimensions();
  const accessToken = useGameStore((state) => state.accessToken);
  const adjustCoin = useGameStore((state) => state.adjustCoin);
  const coin = useGameStore((state) => state.coin);
  const consumeMiniGameHeart = useGameStore(
    (state) => state.consumeMiniGameHeart,
  );
  const applyServerUnlockedAchievements = useGameStore(
    (state) => state.applyServerUnlockedAchievements,
  );
  const recordMiniGameResult = useGameStore(
    (state) => state.recordMiniGameResult,
  );
  const recordServerMiniGamePlay = useGameStore(
    (state) => state.recordServerMiniGamePlay,
  );
  const setGameState = useGameStore((state) => state.setGameState);
  const [countdownValue, setCountdownValue] = useState(3);
  const [currentRound, setCurrentRound] = useState(1);
  const [gamePhase, setGamePhase] = useState<GamePhase>("preparing");
  const gaugeTrackWidth = useMemo(
    () =>
      Math.max(
        Math.min(
          width - FREE_THROW_GAME.gauge.horizontalPadding * 2,
          FREE_THROW_GAME.gauge.maxTrackWidth,
        ),
        FREE_THROW_GAME.gauge.minTrackWidth,
      ),
    [width],
  );
  const defaultShotSimulation = useMemo(
    () =>
      simulateFreeThrowShot({
        ballRadius: BASKETBALL_BALL_LAYOUT.size / 2,
        outcome: "success",
      }),
    [],
  );
  const [gaugeTarget, setGaugeTarget] = useState(() =>
    createGaugeTarget(1, gaugeTrackWidth),
  );
  const [hoopFrameIndex, setHoopFrameIndex] = useState(0);
  const [activeShotSimulation, setActiveShotSimulation] = useState(
    () => defaultShotSimulation,
  );
  const [isShotSimulationAnimating, setIsShotSimulationAnimating] =
    useState(false);
  const [coinRewardAmount, setCoinRewardAmount] = useState<number>(
    FREE_THROW_GAME.rewardCoin,
  );
  const [coinRewardAlert, setCoinRewardAlert] = useState({
    id: 0,
    visible: false,
  });
  const [restartErrorAlert, setRestartErrorAlert] = useState({
    id: 0,
    message: "하트가 부족해서 다시 시작할 수 없어요.",
    title: "미니게임 시작 실패",
    visible: false,
  });
  const [isRestartingRound, setIsRestartingRound] = useState(false);
  const markerProgress = useRef(new Animated.Value(0)).current;
  const markerProgressValueRef = useRef(0);
  const markerLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const ballTranslateX = useRef(new Animated.Value(0)).current;
  const ballTranslateY = useRef(new Animated.Value(0)).current;
  const ballScale = useRef(new Animated.Value(1)).current;
  const shotSimulationProgress = useRef(new Animated.Value(0)).current;
  const gamePhaseRef = useRef<GamePhase>("preparing");
  const hasConsumedEntryHeartRef = useRef(false);
  const didSubmitResultRef = useRef(false);
  const isStartingMiniGameSessionRef = useRef(false);
  const isRestartingRoundRef = useRef(false);
  const pendingSessionFinalizationRef = useRef<Promise<void> | null>(null);
  const playSessionIdRef = useRef<string | null>(null);
  const roundRunIdRef = useRef(0);
  const hoopFrameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hoopShakeDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const startMiniGameSessionOrExit = useCallback(async () => {
    if (isStartingMiniGameSessionRef.current) {
      return false;
    }

    isStartingMiniGameSessionRef.current = true;
    playSessionIdRef.current = null;

    try {
      if (accessToken) {
        const startResult = await startMiniGameEconomy(
          {
            game_type: "freeThrow",
            mode: "normal",
          },
          accessToken,
        );

        playSessionIdRef.current = startResult.play_session_id;
        didSubmitResultRef.current = false;
        setGameState({
          heart: startResult.heart,
          heartUpdatedAt:
            startResult.heart_updated_at ??
            (startResult.spent_heart > 0
              ? new Date().toISOString()
              : useGameStore.getState().heartUpdatedAt),
          maxHeart: startResult.max_heart,
        });
        applyServerUnlockedAchievements(startResult.unlocked_achievements);
        recordServerMiniGamePlay();
        return true;
      }

      if (consumeMiniGameHeart()) {
        didSubmitResultRef.current = false;
        return true;
      }

      setRestartErrorAlert((currentAlert) => ({
        id: currentAlert.id + 1,
        message: "하트가 부족해서 다시 시작할 수 없어요.",
        title: "미니게임 시작 실패",
        visible: true,
      }));
      return false;
    } catch (error) {
      const errorMessage = getServerApiErrorMessage(
        error,
        "미니게임을 시작할 수 없어요.",
      );

      console.warn("자유투 넣기 시작 실패", errorMessage);
      setRestartErrorAlert((currentAlert) => ({
        id: currentAlert.id + 1,
        message: errorMessage,
        title: "미니게임 시작 실패",
        visible: true,
      }));
      return false;
    } finally {
      isStartingMiniGameSessionRef.current = false;
    }
  }, [
    accessToken,
    applyServerUnlockedAchievements,
    consumeMiniGameHeart,
    recordServerMiniGamePlay,
    setGameState,
  ]);

  const roundConfig = useMemo(
    () => getFreeThrowRoundConfig(currentRound),
    [currentRound],
  );
  const currentHoopImage = HOOP_FRAMES[hoopFrameIndex] ?? HOOP_FRAMES[0];
  const goalLayout = useMemo(() => {
    const backboardWidth = Math.min(
      width * BASKETBALL_GOAL_LAYOUT.backboard.widthRatio,
      BASKETBALL_GOAL_LAYOUT.backboard.maxWidth,
    );
    const backboardHeight = backboardWidth * (2933 / 1857);
    const hoopSize = backboardWidth * BASKETBALL_GOAL_LAYOUT.hoop.sizeRatio;

    return {
      backboardHeight,
      backboardWidth,
      backboardXOffset: BASKETBALL_GOAL_LAYOUT.backboard.xOffset,
      backboardYOffset: BASKETBALL_GOAL_LAYOUT.backboard.yOffset,
      goalTop: Math.min(
        Math.max(
          width * BASKETBALL_GOAL_LAYOUT.group.topRatio,
          BASKETBALL_GOAL_LAYOUT.group.minTop,
        ),
        BASKETBALL_GOAL_LAYOUT.group.maxTop,
      ),
      hoopSize,
      hoopTop: backboardWidth * BASKETBALL_GOAL_LAYOUT.hoop.yOffsetRatio,
      hoopXOffset: BASKETBALL_GOAL_LAYOUT.hoop.xOffset,
    };
  }, [width]);
  const ballLayout = useMemo(
    () => ({
      bottom: 178 + BASKETBALL_BALL_LAYOUT.yOffset,
      marginLeft:
        -BASKETBALL_BALL_LAYOUT.size / 2 + BASKETBALL_BALL_LAYOUT.xOffset,
      size: BASKETBALL_BALL_LAYOUT.size,
    }),
    [],
  );
  const successPathGuideAnchor = useMemo(
    () => ({
      bottom: ballLayout.bottom + ballLayout.size / 2,
      x: width / 2 + ballLayout.marginLeft + ballLayout.size / 2,
    }),
    [ballLayout, width],
  );
  const markerTranslateX = markerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [
      0,
      gaugeTrackWidth -
        FREE_THROW_GAME.gauge.innerHorizontalInset * 2 -
        FREE_THROW_GAME.gauge.markerWidth,
    ],
  });
  const shotSimulationTranslateX = shotSimulationProgress.interpolate({
    inputRange: activeShotSimulation.inputRange,
    outputRange: activeShotSimulation.translateX,
  });
  const shotSimulationTranslateY = shotSimulationProgress.interpolate({
    inputRange: activeShotSimulation.inputRange,
    outputRange: activeShotSimulation.translateY,
  });
  const shotSimulationScale = shotSimulationProgress.interpolate({
    inputRange: activeShotSimulation.inputRange,
    outputRange: activeShotSimulation.scale,
  });
  const shotSimulationFrontOpacity = shotSimulationProgress.interpolate({
    inputRange: activeShotSimulation.inputRange,
    outputRange: activeShotSimulation.frontOpacity,
  });
  const shotSimulationBehindOpacity = shotSimulationProgress.interpolate({
    inputRange: activeShotSimulation.inputRange,
    outputRange: activeShotSimulation.behindOpacity,
  });
  const activeBallTranslateX = isShotSimulationAnimating
    ? shotSimulationTranslateX
    : ballTranslateX;
  const activeBallTranslateY = isShotSimulationAnimating
    ? shotSimulationTranslateY
    : ballTranslateY;
  const activeBallScale = isShotSimulationAnimating
    ? shotSimulationScale
    : ballScale;
  const activeFrontBallOpacity = isShotSimulationAnimating
    ? shotSimulationFrontOpacity
    : 1;
  const activeBehindBallOpacity = isShotSimulationAnimating
    ? shotSimulationBehindOpacity
    : 0;
  const gaugeOuterOffset = PIXEL_OUTER_BORDER_WIDTH / 2;
  const gaugeOuterWidth = gaugeTrackWidth - PIXEL_OUTER_BORDER_WIDTH;
  const gaugeOuterHeight =
    FREE_THROW_GAME.gauge.trackHeight - PIXEL_OUTER_BORDER_WIDTH;

  useFocusEffect(
    useCallback(() => {
      return startBackgroundMusicSession("miniGameIngame");
    }, []),
  );

  useEffect(() => {
    gamePhaseRef.current = gamePhase;
  }, [gamePhase]);

  useEffect(() => {
    const listenerId = markerProgress.addListener(({ value }) => {
      markerProgressValueRef.current = value;
    });

    return () => {
      markerProgress.removeListener(listenerId);
    };
  }, [markerProgress]);

  useEffect(() => {
    if (!canPlayMiniGame || gamePhase !== "playing") {
      return undefined;
    }

    markerLoopRef.current?.stop();
    markerProgressValueRef.current = 0;
    markerProgress.setValue(0);

    const markerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(markerProgress, {
          duration: roundConfig.markerDuration,
          easing: Easing.inOut(Easing.quad),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(markerProgress, {
          duration: roundConfig.markerDuration,
          easing: Easing.inOut(Easing.quad),
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    markerLoopRef.current = markerLoop;
    markerLoop.start();

    return () => {
      markerLoop.stop();
    };
  }, [
    canPlayMiniGame,
    gamePhase,
    markerProgress,
    roundConfig.markerDuration,
  ]);

  useEffect(() => {
    if (!canPlayMiniGame || hasConsumedEntryHeartRef.current) {
      return;
    }

    void startMiniGameSessionOrExit().then((didStart) => {
      if (!didStart) {
        setGamePhase("ended");
        gamePhaseRef.current = "ended";
        return;
      }

      hasConsumedEntryHeartRef.current = true;
      setCountdownValue(3);
      setGamePhase("countdown");
      gamePhaseRef.current = "countdown";
    });
  }, [canPlayMiniGame, startMiniGameSessionOrExit]);

  useEffect(() => {
    if (!canPlayMiniGame || gamePhase !== "countdown") {
      return;
    }

    let nextCountdownValue = 3;

    const countdownTimer = setInterval(() => {
      nextCountdownValue -= 1;

      if (nextCountdownValue >= 1) {
        setCountdownValue(nextCountdownValue);
        return;
      }

      clearInterval(countdownTimer);
      setGamePhase("playing");
      gamePhaseRef.current = "playing";
    }, 1000);

    return () => {
      clearInterval(countdownTimer);
    };
  }, [canPlayMiniGame, gamePhase]);

  useEffect(() => {
    return () => {
      markerLoopRef.current?.stop();

      if (hoopShakeDelayTimerRef.current) {
        clearTimeout(hoopShakeDelayTimerRef.current);
      }

      if (hoopFrameTimerRef.current) {
        clearInterval(hoopFrameTimerRef.current);
      }
    };
  }, []);

  const resetBallAnimation = useCallback(() => {
    markerLoopRef.current?.stop();
    markerProgress.stopAnimation();
    shotSimulationProgress.stopAnimation();
    setIsShotSimulationAnimating(false);
    markerProgressValueRef.current = 0;
    markerProgress.setValue(0);
    ballTranslateX.setValue(0);
    ballTranslateY.setValue(0);
    ballScale.setValue(1);
    shotSimulationProgress.setValue(0);
    setActiveShotSimulation(defaultShotSimulation);
    setHoopFrameIndex(0);

    if (hoopShakeDelayTimerRef.current) {
      clearTimeout(hoopShakeDelayTimerRef.current);
      hoopShakeDelayTimerRef.current = null;
    }

    if (hoopFrameTimerRef.current) {
      clearInterval(hoopFrameTimerRef.current);
      hoopFrameTimerRef.current = null;
    }
  }, [
    ballScale,
    ballTranslateX,
    ballTranslateY,
    defaultShotSimulation,
    markerProgress,
    shotSimulationProgress,
  ]);

  const resetFreeThrowRoundState = useCallback(() => {
    roundRunIdRef.current += 1;
    didSubmitResultRef.current = false;
    setCurrentRound(1);
    setGaugeTarget(createGaugeTarget(1, gaugeTrackWidth));
    setCountdownValue(3);
    setCoinRewardAlert((currentAlert) => ({
      ...currentAlert,
      visible: false,
    }));
    setRestartErrorAlert((currentAlert) => ({
      ...currentAlert,
      visible: false,
    }));
    resetBallAnimation();
  }, [gaugeTrackWidth, resetBallAnimation]);

  const hideCoinRewardAlert = useCallback(() => {
    setCoinRewardAlert((currentAlert) => ({
      ...currentAlert,
      visible: false,
    }));
  }, []);

  const hideRestartErrorAlert = useCallback(() => {
    setRestartErrorAlert((currentAlert) => ({
      ...currentAlert,
      visible: false,
    }));
  }, []);

  const showCoinRewardAlert = useCallback((amount: number) => {
    setCoinRewardAmount(amount);
    setCoinRewardAlert((currentAlert) => ({
      id: currentAlert.id + 1,
      visible: true,
    }));
  }, []);

  const submitMiniGameResult = useCallback(
    async (finalGoalCount: number, success: boolean) => {
      if (!accessToken || didSubmitResultRef.current) {
        return;
      }

      didSubmitResultRef.current = true;

      try {
        const result = await createMiniGameResult(
          {
            game_type: "freeThrow",
            ended_reason: success ? "success" : "failed",
            location: "obamaHall",
            mode: "normal",
            play_session_id: playSessionIdRef.current,
            score: finalGoalCount,
            success,
          },
          accessToken,
        );

        applyServerUnlockedAchievements(result.unlocked_achievements);
        void queryClient.invalidateQueries({
          queryKey: ["minigames", "rankings"],
        });
      } catch (error) {
        console.warn(
          "자유투 넣기 결과 저장 실패",
          getServerApiErrorMessage(error, "미니게임 결과 저장 실패"),
        );
      }
    },
    [accessToken, applyServerUnlockedAchievements, queryClient],
  );

  const finalizeMiniGameSession = useCallback(
    (finalGoalCount: number, success: boolean) => {
      recordMiniGameResult("freeThrow", finalGoalCount);

      const finalizationPromise = submitMiniGameResult(
        finalGoalCount,
        success,
      );

      pendingSessionFinalizationRef.current = finalizationPromise;
      void finalizationPromise.finally(() => {
        if (pendingSessionFinalizationRef.current === finalizationPromise) {
          pendingSessionFinalizationRef.current = null;
        }
      });

      return finalizationPromise;
    },
    [recordMiniGameResult, submitMiniGameResult],
  );

  const waitForPendingSessionFinalization = useCallback(async () => {
    const pendingSessionFinalization = pendingSessionFinalizationRef.current;

    if (pendingSessionFinalization) {
      await pendingSessionFinalization;
    }
  }, []);

  const applyMiniGameSuccessReward = useCallback(async () => {
    const optimisticRewardCoin = FREE_THROW_GAME.rewardCoin;

    adjustCoin(optimisticRewardCoin);
    showCoinRewardAlert(optimisticRewardCoin);

    if (!accessToken) {
      return;
    }

    if (!playSessionIdRef.current) {
      console.warn("자유투 넣기 보상 동기화 실패: play_session_id 없음");
      adjustCoin(-optimisticRewardCoin);
      return;
    }

    try {
      const rewardResult = await rewardMiniGameEconomy(
        {
          game_type: "freeThrow",
          mode: "normal",
          play_session_id: playSessionIdRef.current,
          score: currentRound,
          success: true,
        },
        accessToken,
      );

      setGameState({
        coin: rewardResult.coin,
      });
      applyServerUnlockedAchievements(rewardResult.unlocked_achievements, {
        coin: rewardResult.coin,
      });
      void queryClient.invalidateQueries({
        queryKey: ["minigames", "rankings"],
      });
    } catch (error) {
      adjustCoin(-optimisticRewardCoin);
      console.warn(
        "자유투 넣기 보상 동기화 실패",
        getServerApiErrorMessage(error, "미니게임 보상 동기화 실패"),
      );
    }
  }, [
    accessToken,
    adjustCoin,
    applyServerUnlockedAchievements,
    currentRound,
    queryClient,
    setGameState,
    showCoinRewardAlert,
  ]);

  const playHoopSuccessAnimation = useCallback(() => {
    if (hoopFrameTimerRef.current) {
      clearInterval(hoopFrameTimerRef.current);
    }

    let nextFrameIndex = 0;

    setHoopFrameIndex(0);
    hoopFrameTimerRef.current = setInterval(() => {
      nextFrameIndex += 1;

      if (nextFrameIndex >= HOOP_FRAMES.length) {
        if (hoopFrameTimerRef.current) {
          clearInterval(hoopFrameTimerRef.current);
          hoopFrameTimerRef.current = null;
        }

        setHoopFrameIndex(0);
        return;
      }

      setHoopFrameIndex(nextFrameIndex);
    }, HOOP_SUCCESS_FRAME_INTERVAL_MS);
  }, []);

  const runShotAnimation = useCallback(
    ({ missRatio, outcome }: FreeThrowShotAttempt) =>
      new Promise<boolean>((resolve) => {
        const shotSimulation = simulateFreeThrowShot({
          ballRadius: BASKETBALL_BALL_LAYOUT.size / 2,
          missRatio,
          outcome,
        });

        resetBallAnimation();
        setActiveShotSimulation(shotSimulation);
        setIsShotSimulationAnimating(true);

        const playbackDuration =
          shotSimulation.duration * FREE_THROW_SHOT_PLAYBACK_DURATION_SCALE;
        const hoopShakeDelay =
          shotSimulation.hoopShakeDelay *
          FREE_THROW_SHOT_PLAYBACK_DURATION_SCALE;

        if (outcome === "success" && shotSimulation.didScore) {
          if (hoopShakeDelayTimerRef.current) {
            clearTimeout(hoopShakeDelayTimerRef.current);
          }

          hoopShakeDelayTimerRef.current = setTimeout(() => {
            hoopShakeDelayTimerRef.current = null;
            playHoopSuccessAnimation();
          }, hoopShakeDelay);
        }

        requestAnimationFrame(() => {
          Animated.timing(shotSimulationProgress, {
            duration: playbackDuration,
            easing: Easing.linear,
            toValue: 1,
            useNativeDriver: true,
          }).start(() => {
            if (outcome !== "success" || !shotSimulation.didScore) {
              resolve(false);
              return;
            }

            setTimeout(() => {
              resolve(true);
            }, FREE_THROW_SUCCESS_NEXT_ATTEMPT_DELAY_MS);
          });
        });
      }),
    [
      playHoopSuccessAnimation,
      resetBallAnimation,
      shotSimulationProgress,
    ],
  );

  const prepareNextAttempt = useCallback(
    (nextRound: number) => {
      setCurrentRound(nextRound);
      setGaugeTarget(createGaugeTarget(nextRound, gaugeTrackWidth));
      resetBallAnimation();
      setGamePhase("playing");
      gamePhaseRef.current = "playing";
    },
    [gaugeTrackWidth, resetBallAnimation],
  );

  const endFreeThrowGame = useCallback((finalGoalCount: number) => {
    roundRunIdRef.current += 1;
    finalizeMiniGameSession(finalGoalCount, false);
    setGamePhase("ended");
    gamePhaseRef.current = "ended";
  }, [finalizeMiniGameSession]);

  const restartFreeThrowGame = useCallback(async () => {
    if (
      isStartingMiniGameSessionRef.current ||
      isRestartingRoundRef.current
    ) {
      return;
    }

    isRestartingRoundRef.current = true;
    setIsRestartingRound(true);

    try {
      roundRunIdRef.current += 1;
      resetFreeThrowRoundState();
      await waitForPendingSessionFinalization();
      const didStart = await startMiniGameSessionOrExit();

      if (!didStart) {
        gamePhaseRef.current = "ended";
        setGamePhase("ended");
        return;
      }

      hasConsumedEntryHeartRef.current = true;
      setGamePhase("countdown");
      gamePhaseRef.current = "countdown";
    } finally {
      isRestartingRoundRef.current = false;
      setIsRestartingRound(false);
    }
  }, [
    resetFreeThrowRoundState,
    startMiniGameSessionOrExit,
    waitForPendingSessionFinalization,
  ]);

  const resolveShot = useCallback(
    async (attempt: FreeThrowShotAttempt) => {
      const shotRunId = roundRunIdRef.current;
      const didScore = await runShotAnimation(attempt);

      if (shotRunId !== roundRunIdRef.current) {
        return;
      }

      if (!didScore) {
        endFreeThrowGame(Math.max(currentRound - 1, 0));
        return;
      }

      playSoundEffect("pointPlus");

      if (currentRound % FREE_THROW_GAME.successGoal === 0) {
        void applyMiniGameSuccessReward();
      }

      const nextRound = currentRound + 1;

      prepareNextAttempt(nextRound);
    },
    [
      applyMiniGameSuccessReward,
      currentRound,
      endFreeThrowGame,
      prepareNextAttempt,
      runShotAnimation,
    ],
  );

  const handleShootPress = useCallback(() => {
    if (gamePhaseRef.current !== "playing") {
      return;
    }

    if (!canPlayMiniGame || !hasConsumedEntryHeartRef.current) {
      return;
    }

    playSoundEffect("basicClick");
    markerLoopRef.current?.stop();
    markerProgress.stopAnimation((value) => {
      markerProgressValueRef.current = value;
    });
    gamePhaseRef.current = "animating";
    setGamePhase("animating");

    const markerCenter =
      markerProgressValueRef.current *
      (gaugeTrackWidth - FREE_THROW_GAME.gauge.innerHorizontalInset * 2);
    const targetLeft = gaugeTarget.left;
    const targetRight = gaugeTarget.left + gaugeTarget.width;
    const gaugeContentWidth =
      gaugeTrackWidth - FREE_THROW_GAME.gauge.innerHorizontalInset * 2;
    const outcome: FreeThrowOutcome =
      markerCenter >= targetLeft && markerCenter <= targetRight
        ? "success"
        : markerCenter > targetRight
          ? "overPower"
          : "underPower";
    const missRatio =
      outcome === "success"
        ? 0
        : outcome === "underPower"
          ? Math.min(
              Math.max((targetLeft - markerCenter) / Math.max(targetLeft, 1), 0),
              1,
            )
          : Math.min(
              Math.max(
                (markerCenter - targetRight) /
                  Math.max(gaugeContentWidth - targetRight, 1),
                0,
              ),
              1,
            );

    void resolveShot({
      missRatio,
      outcome,
    });
  }, [
    gaugeTarget.left,
    gaugeTarget.width,
    gaugeTrackWidth,
    canPlayMiniGame,
    markerProgress,
    resolveShot,
  ]);

  const handleExitPress = () => {
    router.replace("/miniGame/freeThrow");
  };
  const shouldShowSuccessPathGuides = SHOW_SUCCESS_SHOT_PATH_GUIDES;
  const currentGoalCount = Math.max(currentRound - 1, 0);

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <Image
        cachePolicy="memory-disk"
        contentFit="cover"
        source={OBAMA_HALL_GAME_BACKGROUND}
        style={styles.backgroundImage}
      />

      <View
        pointerEvents="none"
        style={[styles.backboardLayer, { top: goalLayout.goalTop }]}
      >
        <Image
          cachePolicy="memory-disk"
          contentFit="contain"
          source={BACKBOARD_IMAGE}
          style={[
            styles.backboardImage,
            {
              height: goalLayout.backboardHeight,
              top: goalLayout.backboardYOffset,
              transform: [{ translateX: goalLayout.backboardXOffset }],
              width: goalLayout.backboardWidth,
            },
          ]}
        />
      </View>

      {shouldShowSuccessPathGuides ? (
        <View pointerEvents="none" style={styles.successPathBehindHoopLayer}>
          {SUCCESS_SHOT_PATH_POINTS.map((point, index) =>
            index >= SUCCESS_SHOT_PATH_HOOP_DEPTH_START_INDEX ? (
              <Image
                key={index}
                cachePolicy="memory-disk"
                contentFit="contain"
                source={BALL_IMAGE}
                style={[
                  styles.successPathGuideBall,
                  {
                    bottom:
                      successPathGuideAnchor.bottom -
                      point.y -
                      (ballLayout.size * point.scale) / 2,
                    height: ballLayout.size * point.scale,
                    left:
                      successPathGuideAnchor.x +
                      point.x -
                      (ballLayout.size * point.scale) / 2,
                    width: ballLayout.size * point.scale,
                  },
                ]}
              />
            ) : null,
          )}
        </View>
      ) : null}

      <Animated.View
        pointerEvents="none"
        style={[
          styles.ballLayer,
          styles.ballBehindLayer,
          {
            bottom: ballLayout.bottom,
            marginLeft: ballLayout.marginLeft,
            opacity: activeBehindBallOpacity,
            transform: [
              { translateX: activeBallTranslateX },
              { translateY: activeBallTranslateY },
              { scale: activeBallScale },
            ],
          },
        ]}
      >
        <Image
          cachePolicy="memory-disk"
          contentFit="contain"
          source={BALL_IMAGE}
          style={[
            styles.ballImage,
            {
              height: ballLayout.size,
              width: ballLayout.size,
            },
          ]}
        />
      </Animated.View>

      <View
        pointerEvents="none"
        style={[styles.hoopLayer, { top: goalLayout.goalTop }]}
      >
        <Image
          cachePolicy="memory-disk"
          contentFit="contain"
          source={currentHoopImage}
          style={[
            styles.hoopImage,
            {
              height: goalLayout.hoopSize,
              marginLeft: -goalLayout.hoopSize / 2 + goalLayout.hoopXOffset,
              top: goalLayout.hoopTop,
              width: goalLayout.hoopSize,
            },
          ]}
        />
      </View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.ballLayer,
          styles.ballFrontLayer,
          {
            bottom: ballLayout.bottom,
            marginLeft: ballLayout.marginLeft,
            opacity: activeFrontBallOpacity,
            transform: [
              { translateX: activeBallTranslateX },
              { translateY: activeBallTranslateY },
              { scale: activeBallScale },
            ],
          },
        ]}
      >
        <Image
          cachePolicy="memory-disk"
          contentFit="contain"
          source={BALL_IMAGE}
          style={[
            styles.ballImage,
            {
              height: ballLayout.size,
              width: ballLayout.size,
            },
          ]}
        />
      </Animated.View>

      {shouldShowSuccessPathGuides ? (
        <View pointerEvents="none" style={styles.successPathGuideLayer}>
          {SUCCESS_SHOT_PATH_POINTS.map((point, index) => (
            <View key={index} style={styles.successPathGuidePoint}>
              {index < SUCCESS_SHOT_PATH_HOOP_DEPTH_START_INDEX ? (
                <Image
                  cachePolicy="memory-disk"
                  contentFit="contain"
                  source={BALL_IMAGE}
                  style={[
                    styles.successPathGuideBall,
                    {
                      bottom:
                        successPathGuideAnchor.bottom -
                        point.y -
                        (ballLayout.size * point.scale) / 2,
                      height: ballLayout.size * point.scale,
                      left:
                        successPathGuideAnchor.x +
                        point.x -
                        (ballLayout.size * point.scale) / 2,
                      width: ballLayout.size * point.scale,
                    },
                  ]}
                />
              ) : null}
              <View
                style={[
                  styles.successPathGuideMarker,
                  {
                    bottom: successPathGuideAnchor.bottom - point.y - 12,
                    left: successPathGuideAnchor.x + point.x - 12,
                  },
                ]}
              >
                <Text style={styles.successPathGuideText}>{index + 1}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <SafeAreaView pointerEvents="box-none" style={styles.topLayer}>
        <View style={styles.topBar}>
          <View style={styles.topLeftGroup}>
            <SquareButton
              Icon={ArrowBackIcon}
              onPress={handleExitPress}
              shadow
            />
            <CoinBox coin={coin} shadow />
          </View>

          <View style={styles.scoreBox}>
            <Text style={styles.statusText}>{currentGoalCount} 골</Text>
          </View>
        </View>
      </SafeAreaView>

      {gamePhase === "playing" || gamePhase === "animating" ? (
        <View style={styles.gaugeDock}>
          <View style={styles.gaugeStack}>
            <View
              style={[
                styles.gaugeTrack,
                {
                  height: FREE_THROW_GAME.gauge.trackHeight,
                  maxHeight: FREE_THROW_GAME.gauge.trackHeight,
                  minHeight: FREE_THROW_GAME.gauge.trackHeight,
                  transform: [{ scaleY: FREE_THROW_GAME.gauge.visualScaleY }],
                  width: gaugeTrackWidth,
                },
              ]}
            >
              <Svg
                height={FREE_THROW_GAME.gauge.trackHeight}
                style={[
                  StyleSheet.absoluteFill,
                  {
                    maxHeight: FREE_THROW_GAME.gauge.trackHeight,
                    minHeight: FREE_THROW_GAME.gauge.trackHeight,
                  },
                ]}
                width={gaugeTrackWidth}
              >
                <Path
                  d={createPixelPath(gaugeOuterWidth, gaugeOuterHeight)}
                  fill={colors.WHITE_NORMAL}
                  stroke={colors.BLACK_NORMAL}
                  strokeWidth={PIXEL_OUTER_BORDER_WIDTH}
                  transform={`translate(${gaugeOuterOffset}, ${gaugeOuterOffset})`}
                />
              </Svg>
              <View style={styles.gaugeContentLayer}>
                <View
                  style={[
                    styles.targetZone,
                    {
                      left: gaugeTarget.left,
                      width: gaugeTarget.width,
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.gaugeMarker,
                    {
                      transform: [{ translateX: markerTranslateX }],
                      width: FREE_THROW_GAME.gauge.markerWidth,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={[styles.shootButtonSlot, { width: gaugeTrackWidth }]}>
              <MainButton
                disabled={gamePhase !== "playing"}
                size="S"
                label="슛!"
                onPress={handleShootPress}
                width={gaugeTrackWidth}
              />
            </View>
          </View>
        </View>
      ) : null}

      {gamePhase === "countdown" ? (
        <View pointerEvents="none" style={styles.countdownLayer}>
          <OutlinedText
            color={colors.WHITE_NORMAL}
            outlineColor={colors.BLACK_NORMAL}
            outlineWidth={2}
            style={styles.countdownText}
          >
            {countdownValue}
          </OutlinedText>
        </View>
      ) : null}

      {gamePhase === "ended" ? (
        <View style={styles.resultOverlay}>
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitleText}>결과</Text>
              <Pressable
                onPress={handleExitPress}
                style={styles.resultCloseButton}
              >
                <CrossIcon width={32} height={32} fill={colors.BLACK_NORMAL} />
              </Pressable>
            </View>

            <View style={styles.resultContentBox}>
              <Text style={styles.resultFailText}>실패!</Text>
              <Text style={styles.resultScoreText}>{currentGoalCount} 골</Text>
              <Text style={styles.resultDescriptionText}>
                다시 도전하시겠습니까?
              </Text>
            </View>

            <View style={styles.resultActionRow}>
              <MainButton
                color="gray"
                height={60}
                label="> 나가기"
                onPress={handleExitPress}
                size="S"
                width={128}
              />
              <MainButton
                disabled={isRestartingRound}
                height={60}
                label="> 다시시작"
                onPress={restartFreeThrowGame}
                size="S"
                width={148}
              />
            </View>
          </View>
        </View>
      ) : null}

      <TopAlert
        message="자유투 연속 성공 보상이 지급됐어요."
        onClose={hideCoinRewardAlert}
        title={"+" + coinRewardAmount + " 코인 획득!"}
        visibilityKey={coinRewardAlert.id}
        visible={coinRewardAlert.visible}
      />
      <TopAlert
        message={restartErrorAlert.message}
        onClose={hideRestartErrorAlert}
        title={restartErrorAlert.title}
        visibilityKey={restartErrorAlert.id}
        visible={restartErrorAlert.visible}
      />
    </View>
  );
}

const miniGameUiShadow = {
  elevation: 3,
  shadowColor: colors.NAVY_NORMAL,
  shadowOffset: {
    width: 2,
    height: 2,
  },
  shadowOpacity: 0.25,
  shadowRadius: 2,
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.GRAY_NORMAL,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
  },
  backboardLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 1,
    alignItems: "center",
  },
  hoopLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 3,
    alignItems: "center",
  },
  backboardImage: {
    position: "absolute",
  },
  hoopImage: {
    position: "absolute",
    left: "50%",
  },
  ballLayer: {
    position: "absolute",
    left: "50%",
  },
  ballBehindLayer: {
    zIndex: 2,
  },
  ballFrontLayer: {
    zIndex: 4,
  },
  ballImage: {},
  countdownLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 8,
    elevation: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  countdownText: {
    fontFamily: fonts.BASIC,
    fontSize: 96,
    includeFontPadding: false,
    lineHeight: 104,
    textAlign: "center",
  },
  successPathGuideLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 6,
  },
  successPathBehindHoopLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 2,
  },
  successPathGuidePoint: {
    ...StyleSheet.absoluteFill,
  },
  successPathGuideBall: {
    opacity: 0.58,
    position: "absolute",
  },
  successPathGuideMarker: {
    position: "absolute",
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.88)",
    borderColor: colors.BLACK_NORMAL,
    borderRadius: 12,
    borderWidth: 1,
  },
  successPathGuideText: {
    color: colors.BLACK_NORMAL,
    fontFamily: "NeoDunggeunmo",
    fontSize: 14,
    includeFontPadding: false,
    lineHeight: 18,
  },
  topLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 5,
    paddingHorizontal: 28,
    paddingVertical: 24,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  topLeftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  scoreBox: {
    minWidth: 72,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.WHITE_NORMAL,
    borderColor: colors.BLACK_NORMAL,
    borderRadius: 4,
    borderWidth: 1,
    ...miniGameUiShadow,
  },
  statusText: {
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 24,
    includeFontPadding: false,
    lineHeight: 30,
  },
  gaugeDock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 38,
    zIndex: 4,
    alignItems: "center",
    paddingHorizontal: 28,
  },
  gaugeStack: {
    alignItems: "center",
    gap: 2,
  },
  resultOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 20,
    elevation: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  resultCard: {
    width: "100%",
    maxWidth: 360,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 26,
    backgroundColor: colors.WHITE_NORMAL,
    borderColor: colors.BLACK_NORMAL,
    borderWidth: 1,
  },
  resultHeader: {
    marginBottom: 28,
    flexDirection: "row",
    alignItems: "center",
  },
  resultTitleText: {
    flex: 1,
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 28,
    includeFontPadding: false,
    lineHeight: 34,
  },
  resultCloseButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  resultContentBox: {
    minHeight: 140,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    backgroundColor: colors.GRAY_LIGHT_ACTIVE,
  },
  resultScoreText: {
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 30,
    includeFontPadding: false,
    lineHeight: 36,
  },
  resultFailText: {
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 34,
    includeFontPadding: false,
    lineHeight: 40,
  },
  resultDescriptionText: {
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 22,
    includeFontPadding: false,
    lineHeight: 28,
    textAlign: "center",
  },
  resultActionRow: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  gaugeTrack: {
    position: "relative",
    justifyContent: "center",
    overflow: "visible",
    ...miniGameUiShadow,
  },
  gaugeContentLayer: {
    position: "absolute",
    top: FREE_THROW_GAME.gauge.innerVerticalInset,
    right: FREE_THROW_GAME.gauge.innerHorizontalInset,
    bottom: FREE_THROW_GAME.gauge.innerVerticalInset,
    left: FREE_THROW_GAME.gauge.innerHorizontalInset,
    zIndex: 1,
    overflow: "hidden",
  },
  targetZone: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: "#E60000",
  },
  gaugeMarker: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.BLACK_NORMAL,
  },
  shootButtonSlot: {
    height: 76,
    zIndex: 10,
    elevation: 10,
  },
});
