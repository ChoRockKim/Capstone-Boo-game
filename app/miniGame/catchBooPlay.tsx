/**
 * @description  부 잡기 미니게임의 15개 지정 구역 랜덤 출몰 프로토타입 화면입니다.
 * @depends      assets/icons/arrow-back-return.svg, assets/icons/hourglass-time.svg, assets/miniGame/boo-catch/*, assets/places/lawn-plaza.png, components/MainButton/MainButton.tsx, components/MiniGame/MiniGameData.ts, components/OutlinedText/OutlinedText.tsx, components/SquareButton/SquareButton.tsx, components/TopAlert/TopAlert.tsx, constants/colors.ts, constants/fonts.ts, stores/useGameStore.ts, utils/backgroundMusic.ts, utils/soundEffects.ts
 * @used-by      expo-router
 * @side-effects miniGameIngame BGM 세션 시작, boo-catch 이미지 preload, 성공 시 coin 변경, SFX/haptic 재생, router 이동
 */
/* eslint-disable react-hooks/set-state-in-effect -- Game-loop setup intentionally synchronizes timers, assets, and phase state in effects. */
import ArrowBackIcon from "@/assets/icons/arrow-back-return.svg";
import CrossIcon from "@/assets/icons/cross.svg";
import HourglassTimeIcon from "@/assets/icons/hourglass-time.svg";
import { getFriendMiniGameScore } from "@/components/FriendList/FriendListDummyData";
import MainButton from "@/components/MainButton/MainButton";
import { preloadMiniGameBooCatchRuleImageAssets } from "@/components/MiniGame/MiniGameData";
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
import * as Haptics from "expo-haptics";
import { Image as ExpoImage } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Image as RNImage,
  ImageSourcePropType,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const LAWN_PLAZA_GAME_BACKGROUND = require("@/assets/places/lawn-plaza.png");

const GAME_DURATION_MS = 30 * 1000;
const SUCCESS_SCORE_THRESHOLD = 50;
const SUCCESS_COIN_REWARD = 3;
const TARGET_SIZE = 72;
const SCORE_TARGET_PROBABILITY = 0.75;

const BOO_CATCH_TARGET_CONFIG = {
  basic: {
    image: require("@/assets/miniGame/boo-catch/boo-basic.png"),
    point: 1,
  },
  gold: {
    image: require("@/assets/miniGame/boo-catch/boo-gold.png"),
    point: 3,
  },
  penguin: {
    image: require("@/assets/miniGame/boo-catch/boo-penguin.png"),
    point: -5,
  },
  pigeon: {
    image: require("@/assets/miniGame/boo-catch/boo-pigeon.png"),
    point: -5,
  },
} as const;

const BOO_CATCH_TARGET_IMAGE_ASSETS = Object.values(
  BOO_CATCH_TARGET_CONFIG,
).map((target) => target.image) as ImageSourcePropType[];

const BOO_CATCH_SPAWN_ZONES = [
  { emergeFrom: "bottom", id: "building-left-window", x: 0.22, y: 0.35 },
  { emergeFrom: "bottom", id: "building-center-window", x: 0.43, y: 0.33 },
  { emergeFrom: "right", id: "building-right-window", x: 0.76, y: 0.36 },
  { emergeFrom: "right", id: "tree-right", x: 0.88, y: 0.47 },
  { emergeFrom: "left", id: "booth-roof-left", x: 0.21, y: 0.53 },
  { emergeFrom: "bottom", id: "booth-center", x: 0.63, y: 0.58 },
  { emergeFrom: "right", id: "booth-right", x: 0.80, y: 0.58 },
  { emergeFrom: "bottom", id: "crowd-left-front", x: 0.23, y: 0.72 },
  { emergeFrom: "bottom", id: "crowd-center-front", x: 0.50, y: 0.72 },
  { emergeFrom: "right", id: "crowd-right-front", x: 0.76, y: 0.70 },
  { emergeFrom: "bottom", id: "grass-left-bottom", x: 0.13, y: 0.91 },
  { emergeFrom: "bottom", id: "grass-center-bottom", x: 0.39, y: 0.88 },
  { emergeFrom: "bottom", id: "grass-right-bottom", x: 0.90, y: 0.88 },
  { emergeFrom: "left", id: "left-tent-edge", x: 0.09, y: 0.62 },
  { emergeFrom: "bottom", id: "center-path", x: 0.56, y: 0.82 },
] as const;

type BooCatchTargetKind = keyof typeof BOO_CATCH_TARGET_CONFIG;
type GamePhase = "preparing" | "countdown" | "playing" | "finished";

type BooCatchTarget = {
  emergeFrom: "bottom" | "left" | "right";
  exposureMs: number;
  id: number;
  kind: BooCatchTargetKind;
  point: number;
  zoneId: string;
  x: number;
  y: number;
};

type ScoreFeedback = {
  id: number;
  point: number;
  x: number;
  y: number;
};

type BooCatchTargetSpriteProps = {
  image: ImageSourcePropType;
  onPress: () => void;
  target: BooCatchTarget;
};

type BooCatchScoreFeedbackProps = {
  feedback: ScoreFeedback;
};

const getDifficultyConfig = (elapsedMs: number) => {
  if (elapsedMs >= 25 * 1000) {
    return { exposureMs: 700, simultaneousCount: 6 };
  }

  if (elapsedMs >= 20 * 1000) {
    return { exposureMs: 1000, simultaneousCount: 8 };
  }

  if (elapsedMs >= 10 * 1000) {
    return { exposureMs: 1000, simultaneousCount: 4 };
  }

  return { exposureMs: 1000, simultaneousCount: 2 };
};

const createTargetKind = (): BooCatchTargetKind => {
  const shouldSpawnScoreTarget = Math.random() < SCORE_TARGET_PROBABILITY;

  if (!shouldSpawnScoreTarget) {
    return Math.random() < 0.5 ? "penguin" : "pigeon";
  }

  return Math.random() < 2 / 3 ? "basic" : "gold";
};

const getTargetEntryOffset = (emergeFrom: BooCatchTarget["emergeFrom"]) => {
  if (emergeFrom === "left") {
    return { x: -22, y: 6 };
  }

  if (emergeFrom === "right") {
    return { x: 22, y: 6 };
  }

  return { x: 0, y: 28 };
};

const pickRandomSpawnZones = (count: number) => {
  const zones = [...BOO_CATCH_SPAWN_ZONES];

  for (let index = zones.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [zones[index], zones[swapIndex]] = [zones[swapIndex], zones[index]];
  }

  return zones.slice(0, Math.min(count, zones.length));
};

const BooCatchTargetSprite = memo(
  ({ image, onPress, target }: BooCatchTargetSpriteProps) => {
    const opacity = useSharedValue(0);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const scaleX = useSharedValue(0.86);
    const scaleY = useSharedValue(0.72);
    const rotate = useSharedValue(0);
    const wobbleDirectionRef = useRef<-1 | 1>(1);

    useEffect(() => {
      wobbleDirectionRef.current = Math.random() < 0.5 ? -1 : 1;
      const entryOffset = getTargetEntryOffset(target.emergeFrom);
      const isFast = target.exposureMs <= 500;
      const anticipationMs = isFast ? 40 : 70;
      const popMs = isFast ? 90 : 130;
      const settleMs = isFast ? 40 : 70;
      const hideMs = isFast ? 70 : 100;
      const holdMs = Math.max(
        0,
        target.exposureMs - anticipationMs - popMs - settleMs - hideMs,
      );
      const wobble = wobbleDirectionRef.current * (isFast ? 3 : 5);

      opacity.value = 0;
      translateX.value = entryOffset.x;
      translateY.value = entryOffset.y;
      scaleX.value = 0.86;
      scaleY.value = 0.72;
      rotate.value = 0;

      opacity.value = withSequence(
        withTiming(0.42, { duration: anticipationMs }),
        withTiming(1, { duration: popMs }),
        withDelay(holdMs + settleMs, withTiming(0, { duration: hideMs })),
      );
      translateX.value = withSequence(
        withTiming(entryOffset.x * 0.55, { duration: anticipationMs }),
        withTiming(-entryOffset.x * 0.18, {
          duration: popMs,
          easing: Easing.out(Easing.back(1.4)),
        }),
        withTiming(0, { duration: settleMs }),
        withDelay(holdMs, withTiming(entryOffset.x * 0.55, { duration: hideMs })),
      );
      translateY.value = withSequence(
        withTiming(entryOffset.y * 0.55, { duration: anticipationMs }),
        withTiming(-7, {
          duration: popMs,
          easing: Easing.out(Easing.back(1.35)),
        }),
        withTiming(0, { duration: settleMs }),
        withDelay(holdMs, withTiming(entryOffset.y * 0.75, { duration: hideMs })),
      );
      scaleX.value = withSequence(
        withTiming(1.16, { duration: anticipationMs }),
        withTiming(0.9, { duration: popMs }),
        withTiming(1, { duration: settleMs }),
        withDelay(holdMs, withTiming(0.9, { duration: hideMs })),
      );
      scaleY.value = withSequence(
        withTiming(0.76, { duration: anticipationMs }),
        withTiming(1.17, { duration: popMs }),
        withTiming(1, { duration: settleMs }),
        withDelay(holdMs, withTiming(0.76, { duration: hideMs })),
      );
      rotate.value = withSequence(
        withTiming(-wobble * 0.5, { duration: anticipationMs }),
        withTiming(wobble, { duration: popMs }),
        withTiming(0, { duration: settleMs }),
        withDelay(holdMs, withTiming(-wobble * 0.35, { duration: hideMs })),
      );

      return () => {
        cancelAnimation(opacity);
        cancelAnimation(translateX);
        cancelAnimation(translateY);
        cancelAnimation(scaleX);
        cancelAnimation(scaleY);
        cancelAnimation(rotate);
      };
    }, [
      opacity,
      rotate,
      scaleX,
      scaleY,
      target.emergeFrom,
      target.exposureMs,
      translateX,
      translateY,
    ]);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate.value}deg` },
        { scaleX: scaleX.value },
        { scaleY: scaleY.value },
      ],
    }));

    return (
      <Pressable onPress={onPress} style={styles.targetButton}>
        <Animated.View style={[styles.targetAnimatedBody, animatedStyle]}>
          <ExpoImage
            cachePolicy="memory-disk"
            contentFit="contain"
            source={image}
            style={styles.targetImage}
          />
        </Animated.View>
      </Pressable>
    );
  },
);

BooCatchTargetSprite.displayName = "BooCatchTargetSprite";

const BooCatchScoreFeedback = memo(({ feedback }: BooCatchScoreFeedbackProps) => {
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0.88);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, { duration: 80 }),
      withTiming(0, { duration: 360 }),
    );
    translateY.value = withTiming(-28, {
      duration: 440,
      easing: Easing.out(Easing.quad),
    });
    scale.value = withSequence(
      withTiming(1.12, { duration: 80 }),
      withTiming(1, { duration: 120 }),
    );

    return () => {
      cancelAnimation(opacity);
      cancelAnimation(translateY);
      cancelAnimation(scale);
    };
  }, [opacity, scale, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const isPlus = feedback.point > 0;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.scoreFeedback,
        {
          left: feedback.x,
          top: feedback.y,
        },
        animatedStyle,
      ]}
    >
      <Text
        style={[
          styles.scoreFeedbackText,
          isPlus ? styles.scoreFeedbackPlusText : styles.scoreFeedbackMinusText,
        ]}
      >
        {isPlus ? "+" : ""}
        {feedback.point}P
      </Text>
    </Animated.View>
  );
});

BooCatchScoreFeedback.displayName = "BooCatchScoreFeedback";

const CatchBooPlayScreen = () => {
  const queryClient = useQueryClient();
  const canPlayMiniGame = useRequirePlayableSession();
  const accessToken = useGameStore((state) => state.accessToken);
  const adjustCoin = useGameStore((state) => state.adjustCoin);
  const consumeMiniGameHeart = useGameStore(
    (state) => state.consumeMiniGameHeart,
  );
  const friendList = useGameStore((state) => state.friendList);
  const isGuestMode = useGameStore((state) => state.isGuestMode);
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
  const [gameAreaSize, setGameAreaSize] = useState({ height: 0, width: 0 });
  const [activeTargets, setActiveTargets] = useState<BooCatchTarget[]>([]);
  const [scoreFeedbacks, setScoreFeedbacks] = useState<ScoreFeedback[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState(30);
  const [score, setScore] = useState(0);
  const [areAssetsReady, setAreAssetsReady] = useState(false);
  const [gamePhase, setGamePhase] = useState<GamePhase>("preparing");
  const [countdownValue, setCountdownValue] = useState(3);
  const [coinRewardAlert, setCoinRewardAlert] = useState({
    id: 0,
    visible: false,
  });
  const [coinRewardAmount, setCoinRewardAmount] =
    useState(SUCCESS_COIN_REWARD);
  const [restartErrorAlert, setRestartErrorAlert] = useState({
    id: 0,
    message: "하트가 부족해서 다시 시작할 수 없어요.",
    title: "미니게임 시작 실패",
    visible: false,
  });
  const [isRestartingRound, setIsRestartingRound] = useState(false);
  const nextTargetIdRef = useRef(1);
  const nextScoreFeedbackIdRef = useRef(1);
  const gameStartedAtMsRef = useRef(0);
  const gamePhaseRef = useRef<GamePhase>("preparing");
  const scoreRef = useRef(0);
  const didRewardCoinRef = useRef(false);
  const didSubmitResultRef = useRef(false);
  const isStartingMiniGameSessionRef = useRef(false);
  const isRestartingRoundRef = useRef(false);
  const pendingSessionFinalizationRef = useRef<Promise<void> | null>(null);
  const playSessionIdRef = useRef<string | null>(null);
  const hasGameArea = gameAreaSize.width > 0 && gameAreaSize.height > 0;
  const didClearSuccessThreshold = score >= SUCCESS_SCORE_THRESHOLD;

  const currentRank = useMemo(() => {
    if (accessToken || isGuestMode) {
      return null;
    }

    const higherScoreCount = friendList.filter(
      (friend) => getFriendMiniGameScore(friend, "catchBoo", "normal") > score,
    ).length;

    return higherScoreCount + 1;
  }, [accessToken, friendList, isGuestMode, score]);

  useFocusEffect(
    useCallback(() => {
      return startBackgroundMusicSession("miniGameIngame");
    }, []),
  );

  useEffect(() => {
    gamePhaseRef.current = gamePhase;
  }, [gamePhase]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    let isMounted = true;

    setAreAssetsReady(false);
    setGamePhase("preparing");
    setCountdownValue(3);

    void Promise.all([
      preloadMiniGameBooCatchRuleImageAssets(),
      ExpoImage.loadAsync(LAWN_PLAZA_GAME_BACKGROUND),
    ]).then(() => {
      if (!isMounted) {
        return;
      }

      setAreAssetsReady(true);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!canPlayMiniGame || !hasGameArea || gamePhase !== "preparing") {
      return;
    }

    nextTargetIdRef.current = 1;
    didRewardCoinRef.current = false;
    setCoinRewardAlert((currentAlert) => ({
      ...currentAlert,
      visible: false,
    }));
    setActiveTargets([]);
    setScoreFeedbacks([]);
    setRemainingSeconds(30);
    setScore(0);
  }, [canPlayMiniGame, gamePhase, hasGameArea]);

  const startMiniGameRound = useCallback(async () => {
    if (isStartingMiniGameSessionRef.current) {
      return false;
    }

    isStartingMiniGameSessionRef.current = true;
    playSessionIdRef.current = null;

    try {
      if (accessToken) {
        const startResult = await startMiniGameEconomy(
          {
            game_type: "catchBoo",
            mode: "normal",
          },
          accessToken,
        );

        playSessionIdRef.current = startResult.play_session_id;
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
      } else if (!consumeMiniGameHeart()) {
        setRestartErrorAlert((currentAlert) => ({
          id: currentAlert.id + 1,
          message: "하트가 부족해서 다시 시작할 수 없어요.",
          title: "미니게임 시작 실패",
          visible: true,
        }));
        return false;
      }

      setCountdownValue(3);
      setGamePhase("countdown");
      return true;
    } catch (error) {
      const errorMessage = getServerApiErrorMessage(
        error,
        "미니게임을 시작할 수 없어요.",
      );

      console.warn("부 잡기 시작 실패", errorMessage);
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

  useEffect(() => {
    if (
      !canPlayMiniGame ||
      !hasGameArea ||
      !areAssetsReady ||
      gamePhase !== "preparing"
    ) {
      return;
    }

    void startMiniGameRound();
  }, [
    areAssetsReady,
    canPlayMiniGame,
    gamePhase,
    hasGameArea,
    startMiniGameRound,
  ]);

  useEffect(() => {
    if (!canPlayMiniGame || gamePhase !== "countdown") {
      return;
    }

    let nextCountdownValue = 3;
    setCountdownValue(nextCountdownValue);

    const countdownTimer = setInterval(() => {
      nextCountdownValue -= 1;

      if (nextCountdownValue >= 1) {
        setCountdownValue(nextCountdownValue);
        return;
      }

      clearInterval(countdownTimer);
      setGamePhase("playing");
    }, 1000);

    return () => {
      clearInterval(countdownTimer);
    };
  }, [canPlayMiniGame, gamePhase]);

  useEffect(() => {
    if (gamePhase !== "playing" || !hasGameArea) {
      return;
    }

    gameStartedAtMsRef.current = Date.now();
    nextTargetIdRef.current = 1;
    nextScoreFeedbackIdRef.current = 1;
    didRewardCoinRef.current = false;
    didSubmitResultRef.current = false;
    setCoinRewardAlert((currentAlert) => ({
      ...currentAlert,
      visible: false,
    }));
    setActiveTargets([]);
    setScoreFeedbacks([]);
    setRemainingSeconds(30);
    setScore(0);
  }, [gamePhase, hasGameArea]);

  const showCoinRewardAlert = useCallback((rewardAmount: number) => {
    setCoinRewardAmount(rewardAmount);
    setCoinRewardAlert((currentAlert) => ({
      id: currentAlert.id + 1,
      visible: true,
    }));
  }, []);

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

  const submitMiniGameResult = useCallback(
    async (finalScore: number, success: boolean) => {
      if (!accessToken || didSubmitResultRef.current) {
        return;
      }

      didSubmitResultRef.current = true;

      try {
        const result = await createMiniGameResult(
          {
            game_type: "catchBoo",
            ended_reason: success ? "success" : "failed",
            location: "lawnPlaza",
            mode: "normal",
            play_session_id: playSessionIdRef.current,
            play_time_seconds: Math.round(GAME_DURATION_MS / 1000),
            score: finalScore,
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
          "부 잡기 결과 저장 실패",
          getServerApiErrorMessage(error, "미니게임 결과 저장 실패"),
        );
      }
    },
    [accessToken, applyServerUnlockedAchievements, queryClient],
  );

  const applyMiniGameSuccessReward = useCallback(async (finalScore: number) => {
    const optimisticRewardCoin = SUCCESS_COIN_REWARD;

    adjustCoin(optimisticRewardCoin);
    showCoinRewardAlert(optimisticRewardCoin);

    if (!accessToken) {
      return;
    }

    if (!playSessionIdRef.current) {
      console.warn("부 잡기 보상 동기화 실패: play_session_id 없음");
      adjustCoin(-optimisticRewardCoin);
      return;
    }

    try {
      const rewardResult = await rewardMiniGameEconomy(
        {
          game_type: "catchBoo",
          mode: "normal",
          play_session_id: playSessionIdRef.current,
          score: finalScore,
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
        "부 잡기 보상 동기화 실패",
        getServerApiErrorMessage(error, "미니게임 보상 동기화 실패"),
      );
    }
  }, [
    accessToken,
    adjustCoin,
    applyServerUnlockedAchievements,
    queryClient,
    setGameState,
    showCoinRewardAlert,
  ]);

  const finalizeMiniGameSession = useCallback(
    (finalScore: number, success: boolean, shouldReward: boolean) => {
      recordMiniGameResult("catchBoo", finalScore);

      const resultPromise = submitMiniGameResult(finalScore, success);
      const rewardPromise =
        shouldReward && !didRewardCoinRef.current
          ? (() => {
              didRewardCoinRef.current = true;

              return applyMiniGameSuccessReward(finalScore);
            })()
          : Promise.resolve();
      const finalizationPromise = Promise.allSettled([
        resultPromise,
        rewardPromise,
      ]).then(() => undefined);

      pendingSessionFinalizationRef.current = finalizationPromise;
      void finalizationPromise.finally(() => {
        if (pendingSessionFinalizationRef.current === finalizationPromise) {
          pendingSessionFinalizationRef.current = null;
        }
      });

      return finalizationPromise;
    },
    [applyMiniGameSuccessReward, recordMiniGameResult, submitMiniGameResult],
  );

  const waitForPendingSessionFinalization = useCallback(async () => {
    const pendingSessionFinalization = pendingSessionFinalizationRef.current;

    if (pendingSessionFinalization) {
      await pendingSessionFinalization;
    }
  }, []);

  const createTargetWave = useCallback((elapsedMs: number) => {
    const { simultaneousCount } = getDifficultyConfig(elapsedMs);
    const selectedZones = pickRandomSpawnZones(simultaneousCount);

    return selectedZones.map((zone) => {
      const kind = createTargetKind();
      const targetConfig = BOO_CATCH_TARGET_CONFIG[kind];
      const nextTarget: BooCatchTarget = {
        emergeFrom: zone.emergeFrom,
        exposureMs: getDifficultyConfig(elapsedMs).exposureMs,
        id: nextTargetIdRef.current,
        kind,
        point: targetConfig.point,
        zoneId: zone.id,
        x: zone.x,
        y: zone.y,
      };

      nextTargetIdRef.current += 1;
      return nextTarget;
    });
  }, []);

  useEffect(() => {
    if (gamePhase !== "playing" || !hasGameArea) {
      return;
    }

    const timer = setInterval(() => {
      const elapsedMs = Math.max(0, Date.now() - gameStartedAtMsRef.current);
      const nextRemainingSeconds = Math.max(
        0,
        Math.ceil((GAME_DURATION_MS - elapsedMs) / 1000),
      );

      setRemainingSeconds((currentRemainingSeconds) => {
        if (currentRemainingSeconds === nextRemainingSeconds) {
          return currentRemainingSeconds;
        }

        return nextRemainingSeconds;
      });

      if (nextRemainingSeconds <= 0) {
        const finalScore = scoreRef.current;
        const didClear = finalScore >= SUCCESS_SCORE_THRESHOLD;

        clearInterval(timer);
        finalizeMiniGameSession(finalScore, didClear, didClear);

        setActiveTargets([]);
        setScoreFeedbacks([]);
        gamePhaseRef.current = "finished";
        setGamePhase("finished");
      }
    }, 250);

    return () => {
      clearInterval(timer);
    };
  }, [
    finalizeMiniGameSession,
    gamePhase,
    hasGameArea,
  ]);

  useEffect(() => {
    if (gamePhase !== "playing" || !hasGameArea) {
      return;
    }

    let waveTimer: ReturnType<typeof setTimeout> | null = null;
    let isCanceled = false;

    const scheduleNextWave = () => {
      const elapsedMs = Math.max(0, Date.now() - gameStartedAtMsRef.current);
      const { exposureMs } = getDifficultyConfig(elapsedMs);

      setActiveTargets(createTargetWave(elapsedMs));

      waveTimer = setTimeout(() => {
        if (isCanceled) {
          return;
        }

        scheduleNextWave();
      }, exposureMs);
    };

    scheduleNextWave();

    return () => {
      isCanceled = true;

      if (waveTimer) {
        clearTimeout(waveTimer);
      }
    };
  }, [createTargetWave, gamePhase, hasGameArea]);

  const resetRoundState = useCallback(() => {
    nextTargetIdRef.current = 1;
    nextScoreFeedbackIdRef.current = 1;
    didRewardCoinRef.current = false;
    didSubmitResultRef.current = false;
    setCoinRewardAlert((currentAlert) => ({
      ...currentAlert,
      visible: false,
    }));
    setRestartErrorAlert((currentAlert) => ({
      ...currentAlert,
      visible: false,
    }));
    setActiveTargets([]);
    setScoreFeedbacks([]);
    setRemainingSeconds(30);
    setScore(0);
  }, []);

  const handleExitPress = () => {
    router.replace("/miniGame/catchBoo");
  };

  const handleRestartPress = async () => {
    if (
      isStartingMiniGameSessionRef.current ||
      isRestartingRoundRef.current
    ) {
      return;
    }

    isRestartingRoundRef.current = true;
    setIsRestartingRound(true);

    try {
      await waitForPendingSessionFinalization();
      const didStart = await startMiniGameRound();

      if (didStart) {
        resetRoundState();
        return;
      }

      gamePhaseRef.current = "finished";
      setGamePhase("finished");
    } finally {
      isRestartingRoundRef.current = false;
      setIsRestartingRound(false);
    }
  };

  const handleGameAreaLayout = (event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout;

    setGameAreaSize((currentSize) => {
      if (currentSize.height === height && currentSize.width === width) {
        return currentSize;
      }

      return { height, width };
    });
  };

  const handleTargetPress = (target: BooCatchTarget) => {
    if (gamePhaseRef.current !== "playing") {
      return;
    }

    setActiveTargets((currentTargets) =>
      currentTargets.filter((currentTarget) => currentTarget.id !== target.id),
    );
    const scoreFeedbackId = nextScoreFeedbackIdRef.current;

    nextScoreFeedbackIdRef.current += 1;
    setScoreFeedbacks((currentFeedbacks) => [
      ...currentFeedbacks,
      {
        id: scoreFeedbackId,
        point: target.point,
        x: target.x * gameAreaSize.width - 20,
        y: target.y * gameAreaSize.height - TARGET_SIZE / 2 - 8,
      },
    ]);
    setTimeout(() => {
      setScoreFeedbacks((currentFeedbacks) =>
        currentFeedbacks.filter((feedback) => feedback.id !== scoreFeedbackId),
      );
    }, 520);
    setScore((currentScore) => Math.max(0, currentScore + target.point));

    if (target.point > 0) {
      playSoundEffect("pointPlus");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
      () => undefined,
    );
  };

  return (
    <View style={styles.root} onLayout={handleGameAreaLayout}>
      <StatusBar hidden />
      <TopAlert
        autoHideDuration={3000}
        closable={false}
        message="보상으로 코인이 추가되었어요."
        onClose={hideCoinRewardAlert}
        textSize="compact"
        title={"+" + coinRewardAmount + " 코인 획득!"}
        visibilityKey={coinRewardAlert.id}
        visible={coinRewardAlert.visible}
      />
      <View pointerEvents="none" style={styles.imageWarmupLayer}>
        {BOO_CATCH_TARGET_IMAGE_ASSETS.map((source, index) => (
          <RNImage
            key={index}
            resizeMode="contain"
            source={source}
            style={styles.imageWarmupItem}
          />
        ))}
      </View>
      <ExpoImage
        cachePolicy="memory-disk"
        contentFit="cover"
        source={LAWN_PLAZA_GAME_BACKGROUND}
        style={styles.backgroundImage}
      />

      {hasGameArea ? (
        <View pointerEvents="box-none" style={styles.targetLayer}>
          {activeTargets.map((target) => {
            const targetConfig = BOO_CATCH_TARGET_CONFIG[target.kind];
            const targetLeft = target.x * gameAreaSize.width - TARGET_SIZE / 2;
            const targetTop = target.y * gameAreaSize.height - TARGET_SIZE / 2;

            return (
              <View
                key={target.id}
                style={[styles.targetAnchor, { left: targetLeft, top: targetTop }]}
              >
                <BooCatchTargetSprite
                  image={targetConfig.image}
                  onPress={() => handleTargetPress(target)}
                  target={target}
                />
              </View>
            );
          })}
          {scoreFeedbacks.map((feedback) => (
            <BooCatchScoreFeedback key={feedback.id} feedback={feedback} />
          ))}
        </View>
      ) : null}

      <SafeAreaView pointerEvents="box-none" style={styles.topLayer}>
        <View style={styles.topBar}>
          <View style={styles.leftStatusGroup}>
            <SquareButton
              Icon={ArrowBackIcon}
              onPress={() => router.replace("/miniGame/catchBoo")}
              shadow
            />
            <View style={styles.timerBox}>
              <View style={styles.timerValueRow}>
                <View style={styles.timerIconSlot}>
                  <HourglassTimeIcon width={24} height={24} />
                </View>
                <View style={styles.timerTextSlot}>
                  <Text style={[styles.statusText, styles.timerText]}>
                    {remainingSeconds}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.statusText}>{score} P</Text>
          </View>
        </View>
      </SafeAreaView>

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

      {gamePhase === "finished" ? (
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
              {didClearSuccessThreshold ? (
                <>
                  <Text style={styles.resultScoreText}>{score} P</Text>
                  <Text style={styles.resultDescriptionText}>
                    {currentRank
                      ? `현재 랭킹 ${currentRank}위입니다`
                      : "랭킹은 서버 기록으로 집계돼요"}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.resultFailText}>실패!</Text>
                  <Text style={styles.resultDescriptionText}>
                    다시 도전하시겠습니까?
                  </Text>
                </>
              )}
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
                onPress={handleRestartPress}
                size="S"
                width={148}
              />
            </View>
          </View>
        </View>
      ) : null}
      <TopAlert
        message={restartErrorAlert.message}
        onClose={hideRestartErrorAlert}
        title={restartErrorAlert.title}
        visibilityKey={restartErrorAlert.id}
        visible={restartErrorAlert.visible}
      />
    </View>
  );
};

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
  imageWarmupLayer: {
    position: "absolute",
    left: 0,
    top: 0,
    width: TARGET_SIZE,
    height: TARGET_SIZE,
    opacity: 0.01,
    pointerEvents: "none",
  },
  imageWarmupItem: {
    position: "absolute",
    left: 0,
    top: 0,
    width: TARGET_SIZE,
    height: TARGET_SIZE,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
  },
  targetLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 2,
  },
  targetAnchor: {
    position: "absolute",
    width: TARGET_SIZE,
    height: TARGET_SIZE,
  },
  targetButton: {
    width: TARGET_SIZE,
    height: TARGET_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  targetAnimatedBody: {
    position: "relative",
    width: TARGET_SIZE,
    height: TARGET_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  targetImage: {
    width: "100%",
    height: "100%",
    zIndex: 1,
  },
  scoreFeedback: {
    position: "absolute",
    zIndex: 4,
    minWidth: 40,
    alignItems: "center",
  },
  scoreFeedbackText: {
    fontFamily: fonts.BASIC,
    fontSize: 18,
    includeFontPadding: false,
    lineHeight: 22,
    textShadowColor: colors.WHITE_NORMAL,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  scoreFeedbackPlusText: {
    color: "#3C68FF",
  },
  scoreFeedbackMinusText: {
    color: colors.DANGER,
  },
  topLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 3,
    paddingHorizontal: 28,
    paddingVertical: 24,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  leftStatusGroup: {
    gap: 12,
  },
  timerBox: {
    minWidth: 88,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.WHITE_NORMAL,
    borderColor: colors.BLACK_NORMAL,
    borderRadius: 4,
    borderWidth: 1,
    ...miniGameUiShadow,
  },
  timerValueRow: {
    height: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  timerIconSlot: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateY: -1.5 }],
  },
  timerTextSlot: {
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  timerText: {
    fontSize: 24,
    lineHeight: 24,
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
  countdownLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 4,
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
  resultOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 5,
    elevation: 5,
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
    gap: 22,
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
});

export default CatchBooPlayScreen;
