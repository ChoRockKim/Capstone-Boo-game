/**
 * @description  전공책 받기 미니게임의 4레인 아이템 낙하/충돌 테스트 화면입니다.
 * @depends      assets/icons/arrow-back-return.svg, assets/icons/cross.svg, assets/miniGame/book-catch/*, components/FriendList/FriendListDummyData.ts, components/MainButton/MainButton.tsx, components/MiniGame/MiniGameData.ts, components/OutlinedText/OutlinedText.tsx, components/SquareButton/SquareButton.tsx, components/TopAlert/TopAlert.tsx, constants/character.ts, constants/colors.ts, constants/fonts.ts, stores/useGameStore.ts, utils/backgroundMusic.ts, utils/soundEffects.ts, utils/xpProgress.ts
 * @used-by      expo-router
 * @side-effects miniGameIngame BGM 세션 시작, book-catch 이미지 preload, Reanimated animation/frame callback 관리, 성공 시 coin 변경, basicClick SFX/충돌 haptic 재생, router 이동
 */
import ArrowBackIcon from "@/assets/icons/arrow-back-return.svg";
import CrossIcon from "@/assets/icons/cross.svg";
import HeartFilledIcon from "@/assets/icons/heart-filled.svg";
import HeartWhiteIcon from "@/assets/icons/heart-white.svg";
import HourglassTimeIcon from "@/assets/icons/hourglass-time.svg";
import { getFriendMiniGameScore } from "@/components/FriendList/FriendListDummyData";
import MainButton from "@/components/MainButton/MainButton";
import { preloadMiniGameBookCatchImageAssets } from "@/components/MiniGame/MiniGameData";
import OutlinedText from "@/components/OutlinedText/OutlinedText";
import SquareButton from "@/components/SquareButton/SquareButton";
import TopAlert from "@/components/TopAlert/TopAlert";
import { CHARACTER_IMAGES } from "@/constants/character";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { useGameStore } from "@/stores/useGameStore";
import { startBackgroundMusicSession } from "@/utils/backgroundMusic";
import { playSoundEffect } from "@/utils/soundEffects";
import { getXpProgressInfo } from "@/utils/xpProgress";
import * as Haptics from "expo-haptics";
import { Image as ExpoImage } from "expo-image";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const LIBRARY_GAME_BACKGROUND = require("@/assets/miniGame/book-catch/library-background.png");

const LANE_COUNT = 4;
const GAME_DURATION_MS = 30 * 1000;
const RUSH_START_MS = 25 * 1000;
const FALL_DURATION_MS = 4160;
const BASE_SPAWN_INTERVAL_MS = 750;
const RUSH_SPAWN_INTERVAL_MS = 500;
const MAX_ACTIVE_ITEMS = 12;
const ITEM_SIZE = 64;
const BOO_SIZE = 92;
const BOO_BOTTOM_OFFSET = 92;
const BOO_HITBOX_TOP_PADDING = 18;
const BOO_HITBOX_BOTTOM_PADDING = 16;
const BOO_MOVE_DURATION_MS = 70;
const SHAKE_STEP_DURATION_MS = 18;
const SUCCESS_SCORE_THRESHOLD = 50;
const SUCCESS_COIN_REWARD = 3;
const INFINITE_OBSTACLE_HIT_LIMIT = 3;
const INFINITE_SPEED_INCREASE_PER_SCORE_ITEM = 0.01;
const INFINITE_MAX_SPEED_MULTIPLIER = 1.8;
const INFINITE_MIN_SPAWN_INTERVAL_MS = 220;

const BOOK_CATCH_ITEM_CONFIG = {
  book1: {
    image: require("@/assets/miniGame/book-catch/book-1.png"),
    point: 1,
  },
  book2: {
    image: require("@/assets/miniGame/book-catch/book-2.png"),
    point: 5,
  },
  book3: {
    image: require("@/assets/miniGame/book-catch/book-3.png"),
    point: 10,
  },
  comic: {
    image: require("@/assets/miniGame/book-catch/comic.png"),
    point: -1,
  },
  phone: {
    image: require("@/assets/miniGame/book-catch/phone.png"),
    point: -5,
  },
  gameMachine: {
    image: require("@/assets/miniGame/book-catch/game-machine.png"),
    point: -10,
  },
} as const;

const BOOK_CATCH_ITEM_IMAGE_ASSETS = Object.values(BOOK_CATCH_ITEM_CONFIG).map(
  (item) => item.image,
) as ImageSourcePropType[];

type BookCatchItemKind = keyof typeof BOOK_CATCH_ITEM_CONFIG;
type BookCatchDifficulty = "normal" | "infinite";
type GamePhase = "preparing" | "countdown" | "playing" | "finished";

type WeightedItemKind = {
  kind: BookCatchItemKind;
  weight: number;
};

type FallingItem = {
  fallDurationMs: number;
  id: number;
  kind: BookCatchItemKind;
  laneIndex: number;
  point: number;
};

type BookCatchFallingItemProps = {
  booLaneSharedValue: SharedValue<number>;
  collisionBottom: number;
  collisionTop: number;
  fallDurationMs: number;
  gameAreaHeight: number;
  id: number;
  image: ImageSourcePropType;
  laneIndex: number;
  laneLeft: number;
  onCollide: (id: number, point: number) => void;
  onFinish: (id: number) => void;
  point: number;
};

const SCORE_ITEM_KINDS: WeightedItemKind[] = [
  { kind: "book1", weight: 4 },
  { kind: "book2", weight: 3 },
  { kind: "book3", weight: 1 },
];

const PENALTY_ITEM_KINDS: WeightedItemKind[] = [
  { kind: "comic", weight: 4 },
  { kind: "phone", weight: 3 },
  { kind: "gameMachine", weight: 1 },
];

const INFINITE_SCORE_ITEM_KINDS: WeightedItemKind[] = [
  { kind: "book1", weight: 6 },
  { kind: "book2", weight: 2 },
  { kind: "book3", weight: 1 },
];

const INFINITE_PENALTY_ITEM_KINDS: WeightedItemKind[] = [
  { kind: "comic", weight: 2 },
  { kind: "phone", weight: 4 },
  { kind: "gameMachine", weight: 3 },
];

type BookCatchDifficultyConfig = {
  baseSpawnIntervalMs: number;
  fallDurationMs: number;
  maxActiveItems: number;
  penaltyItemKinds: WeightedItemKind[];
  rushSpawnIntervalMs: number;
  scoreItemKinds: WeightedItemKind[];
  scoreSpawnProbability: number;
};

const BOOK_CATCH_DIFFICULTY_CONFIG: Record<
  BookCatchDifficulty,
  BookCatchDifficultyConfig
> = {
  normal: {
    baseSpawnIntervalMs: BASE_SPAWN_INTERVAL_MS,
    fallDurationMs: FALL_DURATION_MS,
    maxActiveItems: MAX_ACTIVE_ITEMS,
    penaltyItemKinds: PENALTY_ITEM_KINDS,
    rushSpawnIntervalMs: RUSH_SPAWN_INTERVAL_MS,
    scoreItemKinds: SCORE_ITEM_KINDS,
    scoreSpawnProbability: 3 / 5,
  },
  infinite: {
    baseSpawnIntervalMs: 420,
    fallDurationMs: 2600,
    maxActiveItems: 24,
    penaltyItemKinds: INFINITE_PENALTY_ITEM_KINDS,
    rushSpawnIntervalMs: 260,
    scoreItemKinds: INFINITE_SCORE_ITEM_KINDS,
    scoreSpawnProbability: 1 / 3,
  },
};

const getInfiniteSpeedMultiplier = (collectedScoreItemCount: number) =>
  Math.min(
    INFINITE_MAX_SPEED_MULTIPLIER,
    1 + collectedScoreItemCount * INFINITE_SPEED_INCREASE_PER_SCORE_ITEM,
  );

const chooseWeightedItemKind = (items: WeightedItemKind[]) => {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let randomWeight = Math.random() * totalWeight;

  for (const item of items) {
    randomWeight -= item.weight;

    if (randomWeight <= 0) {
      return item.kind;
    }
  }

  return items[items.length - 1].kind;
};

const createRandomBookCatchItemKind = (config: BookCatchDifficultyConfig) => {
  const shouldSpawnScoreItem = Math.random() < config.scoreSpawnProbability;

  return chooseWeightedItemKind(
    shouldSpawnScoreItem ? config.scoreItemKinds : config.penaltyItemKinds,
  );
};

const getObstacleImpactIntensity = (point: number) => {
  if (point <= -10) {
    return { haptic: Haptics.ImpactFeedbackStyle.Heavy, shake: 12 };
  }

  if (point <= -5) {
    return { haptic: Haptics.ImpactFeedbackStyle.Medium, shake: 9 };
  }

  return { haptic: Haptics.ImpactFeedbackStyle.Light, shake: 6 };
};

const BookCatchFallingItem = memo(
  ({
    booLaneSharedValue,
    collisionBottom,
    collisionTop,
    fallDurationMs,
    gameAreaHeight,
    id,
    image,
    laneIndex,
    laneLeft,
    onCollide,
    onFinish,
    point,
  }: BookCatchFallingItemProps) => {
    const didHandleItem = useSharedValue(false);
    const translateY = useSharedValue(-ITEM_SIZE);

    useEffect(() => {
      didHandleItem.value = false;
      translateY.value = -ITEM_SIZE;
      translateY.value = withTiming(
        gameAreaHeight + ITEM_SIZE,
        {
          duration: fallDurationMs,
          easing: Easing.linear,
        },
        (finished) => {
          if (!finished || didHandleItem.value) {
            return;
          }

          didHandleItem.value = true;
          runOnJS(onFinish)(id);
        },
      );

      return () => {
        cancelAnimation(translateY);
      };
    }, [
      didHandleItem,
      fallDurationMs,
      gameAreaHeight,
      id,
      onFinish,
      translateY,
    ]);

    useFrameCallback(() => {
      if (didHandleItem.value) {
        return;
      }

      const itemTop = translateY.value;
      const itemBottom = itemTop + ITEM_SIZE;
      const didCollide =
        booLaneSharedValue.value === laneIndex &&
        itemBottom >= collisionTop &&
        itemTop <= collisionBottom;

      if (!didCollide) {
        return;
      }

      didHandleItem.value = true;
      cancelAnimation(translateY);
      runOnJS(onCollide)(id, point);
    });

    const animatedStyle = useAnimatedStyle(
      () => ({
        transform: [
          { translateX: laneLeft },
          { translateY: translateY.value },
        ],
      }),
      [laneLeft],
    );

    return (
      <Animated.View
        style={[styles.fallingItem, animatedStyle]}
      >
        <ExpoImage
          cachePolicy="memory-disk"
          contentFit="contain"
          source={image}
          style={styles.fallingItemImage}
        />
      </Animated.View>
    );
  },
);

BookCatchFallingItem.displayName = "BookCatchFallingItem";

const CatchTheMajorPlayScreen = () => {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const difficulty: BookCatchDifficulty =
    mode === "infinite" || mode === "hard" ? "infinite" : "normal";
  const isInfiniteMode = difficulty === "infinite";
  const difficultyConfig = BOOK_CATCH_DIFFICULTY_CONFIG[difficulty];
  const adjustCoin = useGameStore((state) => state.adjustCoin);
  const friendList = useGameStore((state) => state.friendList);
  const totalXp = useGameStore((state) => state.totalXp);
  const xpProgress = useMemo(() => getXpProgressInfo(totalXp), [totalXp]);
  const booImage = CHARACTER_IMAGES.grades[xpProgress.grade].basic1;
  const [gameAreaSize, setGameAreaSize] = useState({ height: 0, width: 0 });
  const [fallingItems, setFallingItems] = useState<FallingItem[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState(30);
  const [score, setScore] = useState(0);
  const [obstacleHitCount, setObstacleHitCount] = useState(0);
  const [collectedScoreItemCount, setCollectedScoreItemCount] = useState(0);
  const [areAssetsReady, setAreAssetsReady] = useState(false);
  const [gamePhase, setGamePhase] = useState<GamePhase>("preparing");
  const [countdownValue, setCountdownValue] = useState(3);
  const [coinRewardAlert, setCoinRewardAlert] = useState({
    id: 0,
    visible: false,
  });
  const booLaneRef = useRef(1);
  const nextItemIdRef = useRef(1);
  const gameStartedAtMsRef = useRef(Date.now());
  const gamePhaseRef = useRef<GamePhase>("preparing");
  const scoreRef = useRef(0);
  const obstacleHitCountRef = useRef(0);
  const collectedScoreItemCountRef = useRef(0);
  const didRewardCoinRef = useRef(false);
  const booLaneSharedValue = useSharedValue(1);
  const booTranslateX = useSharedValue(0);
  const shakeX = useSharedValue(0);
  const shakeY = useSharedValue(0);
  const shakeRotate = useSharedValue(0);

  const laneWidth = gameAreaSize.width / LANE_COUNT;
  const booTop = gameAreaSize.height - BOO_BOTTOM_OFFSET - BOO_SIZE;
  const collisionTop = booTop + BOO_HITBOX_TOP_PADDING;
  const collisionBottom = booTop + BOO_SIZE - BOO_HITBOX_BOTTOM_PADDING;
  const hasGameArea = gameAreaSize.width > 0 && gameAreaSize.height > 0;
  const didClearSuccessThreshold =
    isInfiniteMode || score >= SUCCESS_SCORE_THRESHOLD;
  const infiniteSpeedMultiplier = useMemo(
    () => getInfiniteSpeedMultiplier(collectedScoreItemCount),
    [collectedScoreItemCount],
  );
  const currentRank = useMemo(() => {
    const difficultyName = isInfiniteMode ? "infinite" : "normal";
    const higherScoreCount = friendList.filter(
      (friend) =>
        getFriendMiniGameScore(friend, "catchTheMajor", difficultyName) > score,
    ).length;

    return higherScoreCount + 1;
  }, [friendList, isInfiniteMode, score]);

  const getLaneLeft = useCallback(
    (laneIndex: number, itemWidth: number) => {
      return laneWidth * laneIndex + laneWidth / 2 - itemWidth / 2;
    },
    [laneWidth],
  );

  const booAnimatedStyle = useAnimatedStyle(
    () => ({
      transform: [
        { translateX: booTranslateX.value },
        { translateY: booTop },
      ],
    }),
    [booTop],
  );

  const worldShakeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shakeX.value },
      { translateY: shakeY.value },
      { rotate: `${shakeRotate.value}deg` },
    ],
  }));

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
      preloadMiniGameBookCatchImageAssets(),
      ExpoImage.loadAsync(booImage),
    ]).then(() => {
      if (!isMounted) {
        return;
      }

      setAreAssetsReady(true);
    });

    return () => {
      isMounted = false;
    };
  }, [booImage, difficulty]);

  useEffect(() => {
    if (!hasGameArea || gamePhase !== "preparing") {
      return;
    }

    gameStartedAtMsRef.current = Date.now();
    nextItemIdRef.current = 1;
    booLaneRef.current = 1;
    booLaneSharedValue.value = 1;
    booTranslateX.value = getLaneLeft(1, BOO_SIZE);
    cancelAnimation(shakeX);
    cancelAnimation(shakeY);
    cancelAnimation(shakeRotate);
    shakeX.value = 0;
    shakeY.value = 0;
    shakeRotate.value = 0;
    didRewardCoinRef.current = false;
    obstacleHitCountRef.current = 0;
    collectedScoreItemCountRef.current = 0;
    setCoinRewardAlert((currentAlert) => ({
      ...currentAlert,
      visible: false,
    }));
    setFallingItems([]);
    setRemainingSeconds(30);
    setScore(0);
    setObstacleHitCount(0);
    setCollectedScoreItemCount(0);
  }, [
    booLaneSharedValue,
    booTranslateX,
    difficulty,
    gamePhase,
    getLaneLeft,
    hasGameArea,
    shakeRotate,
    shakeX,
    shakeY,
  ]);

  useEffect(() => {
    if (!hasGameArea || !areAssetsReady || gamePhase !== "preparing") {
      return;
    }

    setCountdownValue(3);
    setGamePhase("countdown");
  }, [areAssetsReady, gamePhase, hasGameArea]);

  useEffect(() => {
    if (gamePhase !== "countdown") {
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
  }, [gamePhase]);

  useEffect(() => {
    if (gamePhase !== "playing" || !hasGameArea) {
      return;
    }

    gameStartedAtMsRef.current = Date.now();
    nextItemIdRef.current = 1;
    booLaneRef.current = 1;
    booLaneSharedValue.value = 1;
    booTranslateX.value = getLaneLeft(1, BOO_SIZE);
    cancelAnimation(shakeX);
    cancelAnimation(shakeY);
    cancelAnimation(shakeRotate);
    shakeX.value = 0;
    shakeY.value = 0;
    shakeRotate.value = 0;
    didRewardCoinRef.current = false;
    obstacleHitCountRef.current = 0;
    collectedScoreItemCountRef.current = 0;
    setCoinRewardAlert((currentAlert) => ({
      ...currentAlert,
      visible: false,
    }));
    setFallingItems([]);
    setRemainingSeconds(30);
    setScore(0);
    setObstacleHitCount(0);
    setCollectedScoreItemCount(0);
  }, [
    booLaneSharedValue,
    booTranslateX,
    gamePhase,
    getLaneLeft,
    hasGameArea,
    shakeRotate,
    shakeX,
    shakeY,
  ]);

  const resetRoundState = useCallback(() => {
    gameStartedAtMsRef.current = Date.now();
    nextItemIdRef.current = 1;
    booLaneRef.current = 1;
    booLaneSharedValue.value = 1;
    booTranslateX.value = getLaneLeft(1, BOO_SIZE);
    cancelAnimation(shakeX);
    cancelAnimation(shakeY);
    cancelAnimation(shakeRotate);
    shakeX.value = 0;
    shakeY.value = 0;
    shakeRotate.value = 0;
    didRewardCoinRef.current = false;
    obstacleHitCountRef.current = 0;
    collectedScoreItemCountRef.current = 0;
    setCoinRewardAlert((currentAlert) => ({
      ...currentAlert,
      visible: false,
    }));
    setFallingItems([]);
    setRemainingSeconds(30);
    setScore(0);
    setObstacleHitCount(0);
    setCollectedScoreItemCount(0);
  }, [
    booLaneSharedValue,
    booTranslateX,
    getLaneLeft,
    shakeRotate,
    shakeX,
    shakeY,
  ]);

  const showCoinRewardAlert = useCallback(() => {
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

  const removeFallingItem = useCallback((id: number) => {
    setFallingItems((currentItems) =>
      currentItems.filter((item) => item.id !== id),
    );
  }, []);

  const triggerObstacleImpact = useCallback((point: number) => {
    const { haptic, shake } = getObstacleImpactIntensity(point);

    Haptics.impactAsync(haptic).catch(() => undefined);

    cancelAnimation(shakeX);
    cancelAnimation(shakeY);
    cancelAnimation(shakeRotate);

    shakeX.value = 0;
    shakeY.value = 0;
    shakeRotate.value = 0;

    shakeX.value = withSequence(
      withTiming(-shake, { duration: SHAKE_STEP_DURATION_MS }),
      withTiming(shake * 0.85, { duration: SHAKE_STEP_DURATION_MS }),
      withTiming(-shake * 0.6, { duration: SHAKE_STEP_DURATION_MS }),
      withTiming(shake * 0.4, { duration: SHAKE_STEP_DURATION_MS }),
      withTiming(0, { duration: SHAKE_STEP_DURATION_MS }),
    );
    shakeY.value = withSequence(
      withTiming(shake * 0.35, { duration: SHAKE_STEP_DURATION_MS }),
      withTiming(-shake * 0.3, { duration: SHAKE_STEP_DURATION_MS }),
      withTiming(shake * 0.2, { duration: SHAKE_STEP_DURATION_MS }),
      withTiming(-shake * 0.12, { duration: SHAKE_STEP_DURATION_MS }),
      withTiming(0, { duration: SHAKE_STEP_DURATION_MS }),
    );
    shakeRotate.value = withSequence(
      withTiming(-shake * 0.06, { duration: SHAKE_STEP_DURATION_MS }),
      withTiming(shake * 0.05, { duration: SHAKE_STEP_DURATION_MS }),
      withTiming(-shake * 0.035, { duration: SHAKE_STEP_DURATION_MS }),
      withTiming(shake * 0.02, { duration: SHAKE_STEP_DURATION_MS }),
      withTiming(0, { duration: SHAKE_STEP_DURATION_MS }),
    );
  }, [shakeRotate, shakeX, shakeY]);

  const handleItemCollision = useCallback((id: number, point: number) => {
    if (gamePhaseRef.current !== "playing") {
      return;
    }

    removeFallingItem(id);

    if (point < 0) {
      triggerObstacleImpact(point);

      if (isInfiniteMode) {
        const nextHitCount = Math.min(
          INFINITE_OBSTACLE_HIT_LIMIT,
          obstacleHitCountRef.current + 1,
        );

        obstacleHitCountRef.current = nextHitCount;
        setObstacleHitCount(nextHitCount);

        if (nextHitCount >= INFINITE_OBSTACLE_HIT_LIMIT) {
          gamePhaseRef.current = "finished";
          setFallingItems([]);
          setGamePhase("finished");
        }
      }
    } else if (point > 0) {
      playSoundEffect("pointPlus");

      if (isInfiniteMode) {
        const nextCollectedCount = collectedScoreItemCountRef.current + 1;

        collectedScoreItemCountRef.current = nextCollectedCount;
        setCollectedScoreItemCount(nextCollectedCount);
      }
    }

    setScore((currentScore) => Math.max(0, currentScore + point));
  }, [isInfiniteMode, removeFallingItem, triggerObstacleImpact]);

  const spawnItem = useCallback(() => {
    setFallingItems((currentItems) => {
      if (currentItems.length >= difficultyConfig.maxActiveItems) {
        return currentItems;
      }

      const kind = createRandomBookCatchItemKind(difficultyConfig);
      const itemConfig = BOOK_CATCH_ITEM_CONFIG[kind];
      const speedMultiplier = isInfiniteMode
        ? getInfiniteSpeedMultiplier(collectedScoreItemCountRef.current)
        : 1;
      const nextItem: FallingItem = {
        fallDurationMs: Math.round(
          difficultyConfig.fallDurationMs / speedMultiplier,
        ),
        id: nextItemIdRef.current,
        kind,
        laneIndex: Math.floor(Math.random() * LANE_COUNT),
        point: itemConfig.point,
      };

      nextItemIdRef.current += 1;
      return [...currentItems, nextItem];
    });
  }, [difficultyConfig, isInfiniteMode]);

  useEffect(() => {
    if (!hasGameArea || gamePhase !== "playing" || isInfiniteMode) {
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

        clearInterval(timer);

        if (finalScore >= SUCCESS_SCORE_THRESHOLD && !didRewardCoinRef.current) {
          didRewardCoinRef.current = true;
          adjustCoin(SUCCESS_COIN_REWARD);
          showCoinRewardAlert();
        }

        setFallingItems([]);
        gamePhaseRef.current = "finished";
        setGamePhase("finished");
      }
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [adjustCoin, gamePhase, hasGameArea, isInfiniteMode, showCoinRewardAlert]);

  useEffect(() => {
    if (!hasGameArea || gamePhase !== "playing") {
      return;
    }

    let spawnTimer: ReturnType<typeof setTimeout> | null = null;
    let isCanceled = false;

    const scheduleNextSpawn = () => {
      const elapsedMs = Math.max(0, Date.now() - gameStartedAtMsRef.current);
      const spawnIntervalMs = isInfiniteMode
        ? Math.max(
            INFINITE_MIN_SPAWN_INTERVAL_MS,
            Math.round(
              difficultyConfig.baseSpawnIntervalMs /
                getInfiniteSpeedMultiplier(collectedScoreItemCountRef.current),
            ),
          )
        : elapsedMs >= RUSH_START_MS
          ? difficultyConfig.rushSpawnIntervalMs
          : difficultyConfig.baseSpawnIntervalMs;

      spawnTimer = setTimeout(() => {
        if (isCanceled) {
          return;
        }

        spawnItem();
        scheduleNextSpawn();
      }, spawnIntervalMs);
    };

    spawnItem();
    scheduleNextSpawn();

    return () => {
      isCanceled = true;

      if (spawnTimer) {
        clearTimeout(spawnTimer);
      }
    };
  }, [difficultyConfig, gamePhase, hasGameArea, isInfiniteMode, spawnItem]);

  const handleExitPress = () => {
    router.replace("/miniGame/catchTheMajor");
  };

  const handleRestartPress = () => {
    resetRoundState();
    setCountdownValue(3);
    setGamePhase("countdown");
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

  const moveBoo = (direction: -1 | 1) => {
    if (gamePhase !== "playing") {
      return;
    }

    const currentLaneIndex = booLaneRef.current;
    const nextLaneIndex = Math.min(
      LANE_COUNT - 1,
      Math.max(0, currentLaneIndex + direction),
    );

    if (nextLaneIndex === currentLaneIndex) {
      return;
    }

    booLaneRef.current = nextLaneIndex;
    booLaneSharedValue.value = nextLaneIndex;
    booTranslateX.value = withTiming(getLaneLeft(nextLaneIndex, BOO_SIZE), {
      duration: BOO_MOVE_DURATION_MS,
      easing: Easing.linear,
    });
  };

  return (
    <View style={styles.root} onLayout={handleGameAreaLayout}>
      <StatusBar hidden />
      <TopAlert
        autoHideDuration={1600}
        closable={false}
        message="보상으로 코인이 추가되었어요."
        onClose={hideCoinRewardAlert}
        textSize="compact"
        title={"+" + SUCCESS_COIN_REWARD + " 코인 획득!"}
        visibilityKey={coinRewardAlert.id}
        visible={coinRewardAlert.visible}
      />
      <View pointerEvents="none" style={styles.imageWarmupLayer}>
        <RNImage
          resizeMode="contain"
          source={booImage}
          style={styles.imageWarmupItem}
        />
        {BOOK_CATCH_ITEM_IMAGE_ASSETS.map((source, index) => (
          <RNImage
            key={index}
            resizeMode="contain"
            source={source}
            style={styles.imageWarmupItem}
          />
        ))}
      </View>
      <Animated.View
        pointerEvents="none"
        style={[styles.worldLayer, worldShakeAnimatedStyle]}
      >
        <ExpoImage
          cachePolicy="memory-disk"
          contentFit="cover"
          source={LIBRARY_GAME_BACKGROUND}
          style={styles.backgroundImage}
        />

        {hasGameArea ? (
          <>
            {fallingItems.map((item) => {
              const itemConfig = BOOK_CATCH_ITEM_CONFIG[item.kind];

              return (
                <BookCatchFallingItem
                  key={item.id}
                  booLaneSharedValue={booLaneSharedValue}
                  collisionBottom={collisionBottom}
                  collisionTop={collisionTop}
                  fallDurationMs={item.fallDurationMs}
                  gameAreaHeight={gameAreaSize.height}
                  id={item.id}
                  image={itemConfig.image}
                  laneIndex={item.laneIndex}
                  laneLeft={getLaneLeft(item.laneIndex, ITEM_SIZE)}
                  onCollide={handleItemCollision}
                  onFinish={removeFallingItem}
                  point={item.point}
                />
              );
            })}
            <Animated.Image
              resizeMode="contain"
              source={booImage}
              style={[styles.booImage, booAnimatedStyle]}
            />
          </>
        ) : null}
      </Animated.View>

      <SafeAreaView pointerEvents="box-none" style={styles.topLayer}>
        <View style={styles.topBar}>
          <View style={styles.leftStatusGroup}>
            <View style={styles.backControlRow}>
              <SquareButton
                Icon={ArrowBackIcon}
                onPress={() => router.replace("/miniGame/catchTheMajor")}
                shadow
              />
              {isInfiniteMode ? (
                <View style={styles.infiniteHeartRow}>
                  {Array.from({ length: INFINITE_OBSTACLE_HIT_LIMIT }).map(
                    (_, index) => {
                      const isActive =
                        index < INFINITE_OBSTACLE_HIT_LIMIT - obstacleHitCount;

                      return (
                        <View
                          key={index}
                          style={[
                            styles.infiniteHeartItem,
                            !isActive && styles.infiniteHeartItemInactive,
                          ]}
                        >
                          <HeartWhiteIcon
                            width={32}
                            height={32}
                            style={styles.infiniteHeartBackdrop}
                          />
                          <HeartFilledIcon width={28} height={28} />
                        </View>
                      );
                    },
                  )}
                </View>
              ) : null}
            </View>
            {!isInfiniteMode ? (
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
            ) : null}
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.statusText}>{score} P</Text>
            {isInfiniteMode ? (
              <Text style={styles.scoreSubText}>
                x{infiniteSpeedMultiplier.toFixed(2)}
              </Text>
            ) : null}
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
              <Pressable onPress={handleExitPress} style={styles.resultCloseButton}>
                <CrossIcon width={32} height={32} fill={colors.BLACK_NORMAL} />
              </Pressable>
            </View>

            <View style={styles.resultContentBox}>
              {isInfiniteMode ? (
                <>
                  <Text style={styles.resultScoreText}>{score} P</Text>
                  <Text style={styles.resultDescriptionText}>
                    무한 랭킹 {currentRank}위입니다
                  </Text>
                </>
              ) : didClearSuccessThreshold ? (
                <>
                  <Text style={styles.resultScoreText}>{score} P</Text>
                  <Text style={styles.resultDescriptionText}>
                    현재 랭킹 {currentRank}위입니다
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

      <View pointerEvents="box-none" style={styles.touchLayer}>
        <Pressable onPressIn={() => moveBoo(-1)} style={styles.touchZone} />
        <Pressable onPressIn={() => moveBoo(1)} style={styles.touchZone} />
      </View>
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
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    opacity: 0.01,
    pointerEvents: "none",
  },
  imageWarmupItem: {
    position: "absolute",
    left: 0,
    top: 0,
    width: ITEM_SIZE,
    height: ITEM_SIZE,
  },
  worldLayer: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
  },
  backgroundImage: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
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
  backControlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infiniteHeartRow: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  infiniteHeartItem: {
    position: "relative",
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    opacity: 1,
  },
  infiniteHeartBackdrop: {
    position: "absolute",
    left: -2,
    top: -2,
  },
  infiniteHeartItemInactive: {
    opacity: 0.18,
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
  scoreSubText: {
    marginTop: -4,
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 10,
    includeFontPadding: false,
    lineHeight: 12,
  },
  statusText: {
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 24,
    includeFontPadding: false,
    lineHeight: 30,
  },
  fallingItem: {
    position: "absolute",
    left: 0,
    top: 0,
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    zIndex: 1,
    elevation: 1,
  },
  fallingItemImage: {
    width: "100%",
    height: "100%",
  },
  booImage: {
    position: "absolute",
    left: 0,
    top: 0,
    width: BOO_SIZE,
    height: BOO_SIZE,
    zIndex: 2,
    elevation: 2,
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
  touchLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 2,
    flexDirection: "row",
  },
  touchZone: {
    flex: 1,
  },
});

export default CatchTheMajorPlayScreen;
