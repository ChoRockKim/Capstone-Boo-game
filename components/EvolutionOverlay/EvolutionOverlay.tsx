/**
 * @description  학년 상승 진화 컷신의 캐릭터 깜빡임과 smoke 이미지를 렌더링합니다.
 * @depends      constants/character.ts, assets/images/big-smoke.png
 * @used-by      app/game/index.tsx
 * @side-effects Animated timing, blink/smoke timeout 관리
 */
/* eslint-disable react-hooks/refs, react-hooks/set-state-in-effect -- React Native Animated values and cutscene phase state are imperative by design. */
import MainButton from "@/components/MainButton/MainButton";
import type { CharacterGrade } from "@/constants/character";
import { CHARACTER_IMAGES } from "@/constants/character";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import type { GraduationSummary } from "@/utils/serverApi";
import { Image } from "expo-image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

interface EvolutionOverlayProps {
  fromGrade: CharacterGrade;
  phase: "blink" | "smoke" | null;
  toGrade: CharacterGrade;
  visible: boolean;
}

type GraduationOverlayProps = {
  achievementStats?: GraduationStatsSnapshot;
  graduationSummary?: GraduationSummary | null;
  onExit: () => void;
  onRestart: () => void;
  userCreatedAt?: string | null;
  visible: boolean;
};

type GraduationStep = "intro" | "certificate" | "stats" | "outro";
type GraduationStatsSnapshot = {
  feedCount: number;
  miniGameBestScores?: {
    catchBoo?: number;
    catchTheMajor?: number;
    freeThrow?: number;
  };
  quizAttemptCount?: number;
  quizCorrectCount: number;
};

export const EVOLUTION_BLINK_DURATIONS = [
  1000, 800, 700, 600, 550, 500, 450, 400, 350, 300, 250, 200, 100, 100, 100,
  100, 100, 100, 100, 100, 100, 100, 100, 50, 50, 50, 50, 50, 50, 50, 50, 50,
] as const;

export const EVOLUTION_BLINK_DURATION_MS = EVOLUTION_BLINK_DURATIONS.reduce(
  (sum, duration) => sum + duration,
  0,
);

const GRADUATION_STEPS: GraduationStep[] = [
  "intro",
  "certificate",
  "stats",
  "outro",
];

const DAY_MS = 24 * 60 * 60 * 1000;

const getLocalDateStartMs = (date: Date) => {
  const dateStart = new Date(date);

  dateStart.setHours(0, 0, 0, 0);

  return dateStart.getTime();
};

const getPlayDayCount = (createdAt?: string | null) => {
  const createdAtMs = createdAt ? Date.parse(createdAt) : NaN;

  if (!Number.isFinite(createdAtMs)) {
    return 1;
  }

  const createdDateStartMs = getLocalDateStartMs(new Date(createdAtMs));
  const todayStartMs = getLocalDateStartMs(new Date());
  const elapsedDays = Math.floor((todayStartMs - createdDateStartMs) / DAY_MS);

  return Math.max(elapsedDays + 1, 1);
};

const getGraduationStats = (
  playDayCount: number,
  achievementStats?: GraduationStatsSnapshot,
) => {
  const stats = [
    ["졸업까지 걸린 날:", `${playDayCount}일`],
    ["먹은 학식", `${achievementStats?.feedCount ?? 0}끼`],
  ];

  if (achievementStats?.quizAttemptCount !== undefined) {
    stats.push(["푼 퀴즈 수:", `${achievementStats.quizAttemptCount}개`]);
  }

  stats.push(
    ["맞춘 퀴즈 수:", `${achievementStats?.quizCorrectCount ?? 0}개`],
    [
    "전공책 받기 최고 점수:",
    `${achievementStats?.miniGameBestScores?.catchTheMajor ?? 0}P`,
    ],
    [
    "부 잡기 최고 점수:",
    `${achievementStats?.miniGameBestScores?.catchBoo ?? 0}P`,
    ],
    [
    "자유투 넣기 최고 점수:",
    `${achievementStats?.miniGameBestScores?.freeThrow ?? 0}P`,
    ],
  );

  return stats;
};

const normalizeMiniGameType = (gameType?: string | null) =>
  gameType?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";

const getServerMiniGameBestScores = (
  graduationSummary?: GraduationSummary | null,
): GraduationStatsSnapshot["miniGameBestScores"] | undefined => {
  if (!graduationSummary) {
    return undefined;
  }

  return graduationSummary.minigame_best_scores.reduce<
    NonNullable<GraduationStatsSnapshot["miniGameBestScores"]>
  >(
    (scores, score) => {
      const normalizedGameType = normalizeMiniGameType(score.game_type);

      if (
        normalizedGameType === "catchthemajor" ||
        normalizedGameType === "bookcatch" ||
        normalizedGameType === "catchmajor"
      ) {
        scores.catchTheMajor = score.best_score;
      }

      if (normalizedGameType === "catchboo") {
        scores.catchBoo = score.best_score;
      }

      if (
        normalizedGameType === "freethrow" ||
        normalizedGameType === "basketball"
      ) {
        scores.freeThrow = score.best_score;
      }

      return scores;
    },
    {
      catchBoo: 0,
      catchTheMajor: 0,
      freeThrow: 0,
    },
  );
};

const mergeGraduationStats = (
  localStats?: GraduationStatsSnapshot,
  serverSummary?: GraduationSummary | null,
): GraduationStatsSnapshot | undefined => {
  if (!serverSummary) {
    return localStats;
  }

  const serverBestScores = getServerMiniGameBestScores(serverSummary);

  return {
    feedCount: Math.max(localStats?.feedCount ?? 0, serverSummary.feed_count),
    miniGameBestScores: {
      catchBoo: Math.max(
        localStats?.miniGameBestScores?.catchBoo ?? 0,
        serverBestScores?.catchBoo ?? 0,
      ),
      catchTheMajor: Math.max(
        localStats?.miniGameBestScores?.catchTheMajor ?? 0,
        serverBestScores?.catchTheMajor ?? 0,
      ),
      freeThrow: Math.max(
        localStats?.miniGameBestScores?.freeThrow ?? 0,
        serverBestScores?.freeThrow ?? 0,
      ),
    },
    quizAttemptCount: serverSummary.quiz_attempt_count,
    quizCorrectCount: Math.max(
      localStats?.quizCorrectCount ?? 0,
      serverSummary.quiz_correct_count,
    ),
  };
};

const JOBKOREA_URL = "https://www.jobkorea.co.kr/";

export function GraduationOverlay({
  achievementStats,
  graduationSummary,
  onExit,
  onRestart,
  userCreatedAt,
  visible,
}: GraduationOverlayProps) {
  const { width } = useWindowDimensions();
  const booSlideX = useRef(new Animated.Value(54)).current;
  const introAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (introAdvanceTimerRef.current) {
      clearTimeout(introAdvanceTimerRef.current);
      introAdvanceTimerRef.current = null;
    }

    if (visible) {
      setStepIndex(0);
      booSlideX.stopAnimation();
      booSlideX.setValue(54);

      Animated.timing(booSlideX, {
        duration: 1150,
        easing: Easing.out(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) {
          return;
        }

        introAdvanceTimerRef.current = setTimeout(() => {
          introAdvanceTimerRef.current = null;
          setStepIndex((currentStepIndex) =>
            currentStepIndex === 0 ? 1 : currentStepIndex,
          );
        }, 1000);
      });

      return () => {
        booSlideX.stopAnimation();
        if (introAdvanceTimerRef.current) {
          clearTimeout(introAdvanceTimerRef.current);
          introAdvanceTimerRef.current = null;
        }
      };
    }

    booSlideX.stopAnimation();
    booSlideX.setValue(54);

    return undefined;
  }, [booSlideX, visible]);

  const layout = useMemo(() => {
    const contentWidth = Math.min(width - 44, 304);
    const finalButtonWidth = Math.min((width - 76) / 2, 138);

    return {
      contentWidth,
      finalButtonWidth,
    };
  }, [width]);

  const currentStep = GRADUATION_STEPS[stepIndex];
  const playDayCount = useMemo(
    () =>
      graduationSummary?.play_days ??
      getPlayDayCount(graduationSummary?.created_at ?? userCreatedAt),
    [graduationSummary?.created_at, graduationSummary?.play_days, userCreatedAt],
  );
  const displayedAchievementStats = useMemo(
    () => mergeGraduationStats(achievementStats, graduationSummary),
    [achievementStats, graduationSummary],
  );
  const graduationStats = useMemo(
    () => getGraduationStats(playDayCount, displayedAchievementStats),
    [displayedAchievementStats, playDayCount],
  );
  const canGoBack = stepIndex > 0;
  const canGoNext = stepIndex < GRADUATION_STEPS.length - 1;

  const goBack = () => {
    if (!canGoBack) {
      return;
    }

    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const goNext = () => {
    if (!canGoNext) {
      return;
    }

    setStepIndex((prev) => Math.min(prev + 1, GRADUATION_STEPS.length - 1));
  };

  const handleLinkPress = () => {
    void Linking.openURL(JOBKOREA_URL).catch((error) => {
      console.warn("잡코리아 링크 열기 실패", error);
    });
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={goBack}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={graduationStyles.root}>
        <Image
          cachePolicy="memory-disk"
          contentFit="cover"
          source={require("@/assets/images/graduate-background.png")}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            graduationStyles.graduatedBoo,
            {
              transform: [{ translateX: booSlideX }],
            },
          ]}
        >
          <Image
            cachePolicy="memory-disk"
            contentFit="contain"
            source={require("@/assets/characters/graduated-boo.png")}
            style={graduationStyles.graduatedBooImage}
          />
        </Animated.View>

        <View pointerEvents="box-none" style={graduationStyles.touchLayer}>
          <Pressable
            disabled={!canGoBack}
            onPress={goBack}
            style={graduationStyles.touchHalf}
          />
          <Pressable
            disabled={!canGoNext}
            onPress={goNext}
            style={graduationStyles.touchHalf}
          />
        </View>

        <View pointerEvents="box-none" style={graduationStyles.contentLayer}>
          {currentStep === "certificate" ? (
            <View
              pointerEvents="none"
              style={[
                graduationStyles.panel,
                graduationStyles.certificatePanel,
                { width: layout.contentWidth },
              ]}
            >
              <Text style={graduationStyles.certificateTitle}>졸업장</Text>
              <Text style={graduationStyles.certificateBody}>
                위 부는 지난 {playDayCount}일 동안{"\n"}
                훌륭하게 성장하였기에{"\n"}이 졸업장을 수여합니다
              </Text>
              <Text style={graduationStyles.certificateDate}>
                2026년 5월 13일
              </Text>
            </View>
          ) : null}

          {currentStep === "stats" ? (
            <View
              pointerEvents="none"
              style={[
                graduationStyles.panel,
                graduationStyles.statsPanel,
                { width: layout.contentWidth },
              ]}
            >
              <Text style={graduationStyles.statsTitle}>
                졸업을 축하합니다!
              </Text>
              <View style={graduationStyles.statsList}>
                {graduationStats.map(([label, value]) => (
                  <View key={label} style={graduationStyles.statsRow}>
                    <Text style={graduationStyles.statsLabel}>{label}</Text>
                    <Text style={graduationStyles.statsValue}>{value}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {currentStep === "outro" ? (
            <View style={graduationStyles.outroContent}>
              <View
                style={[
                  graduationStyles.panel,
                  graduationStyles.outroPanel,
                  { width: layout.contentWidth },
                ]}
              >
                <Text style={graduationStyles.outroTitle}>이제는 사회다!</Text>
                <Pressable
                  onPress={handleLinkPress}
                  style={graduationStyles.linkButton}
                >
                  <Text style={graduationStyles.linkText}>
                    잡코리아 링크 〉
                  </Text>
                </Pressable>
              </View>
              <View style={graduationStyles.finalButtonRow}>
                <MainButton
                  color="gray"
                  label="게임종료"
                  onPress={onExit}
                  size="S"
                  width={layout.finalButtonWidth}
                />
                <MainButton
                  label="처음으로"
                  onPress={onRestart}
                  size="S"
                  width={layout.finalButtonWidth}
                />
              </View>
            </View>
          ) : null}

          {canGoNext ? (
            <Text pointerEvents="none" style={graduationStyles.continueText}>
              화면을 터치하여 계속
            </Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function EvolutionOverlay({
  fromGrade,
  phase,
  toGrade,
  visible,
}: EvolutionOverlayProps) {
  const bigSmokeOpacity = useRef(new Animated.Value(0)).current;
  const bigSmokeScale = useRef(new Animated.Value(0.9)).current;
  const blinkTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const smokeRevealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [showNextCharacter, setShowNextCharacter] = useState(false);

  useEffect(() => {
    bigSmokeOpacity.stopAnimation();
    bigSmokeScale.stopAnimation();
    blinkTimersRef.current.forEach((timer) => clearTimeout(timer));
    blinkTimersRef.current = [];
    if (smokeRevealTimerRef.current) {
      clearTimeout(smokeRevealTimerRef.current);
      smokeRevealTimerRef.current = null;
    }

    if (!visible || !phase) {
      setShowNextCharacter(false);
      bigSmokeOpacity.setValue(0);
      bigSmokeScale.setValue(0.9);
      return;
    }

    if (phase === "blink") {
      setShowNextCharacter(false);

      let elapsedMs = 0;
      let nextVisible = false;

      EVOLUTION_BLINK_DURATIONS.forEach((duration) => {
        elapsedMs += duration;
        nextVisible = !nextVisible;
        const visibleAtStep = nextVisible;

        const timer = setTimeout(() => {
          setShowNextCharacter(visibleAtStep);
        }, elapsedMs);

        blinkTimersRef.current.push(timer);
      });

      return;
    }

    setShowNextCharacter(false);
    bigSmokeOpacity.setValue(0);
    bigSmokeScale.setValue(0.9);

    smokeRevealTimerRef.current = setTimeout(() => {
      setShowNextCharacter(true);
      smokeRevealTimerRef.current = null;
    }, 180);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(bigSmokeOpacity, {
          duration: 280,
          easing: Easing.out(Easing.quad),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.delay(260),
        Animated.timing(bigSmokeOpacity, {
          duration: 460,
          easing: Easing.in(Easing.quad),
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(bigSmokeScale, {
        duration: 920,
        easing: Easing.out(Easing.quad),
        toValue: 1.18,
        useNativeDriver: true,
      }),
    ]).start();
  }, [bigSmokeOpacity, bigSmokeScale, phase, visible]);

  if (!visible || !phase) {
    return null;
  }

  const fromCharacterImage = CHARACTER_IMAGES.grades[fromGrade].happy1;
  const toCharacterImage = CHARACTER_IMAGES.grades[toGrade].happy1;
  const shouldShowNextSilhouette = phase === "blink" && showNextCharacter;

  return (
    <View pointerEvents="none" style={styles.root}>
      {showNextCharacter ? (
        <Image
          cachePolicy="memory-disk"
          contentFit="contain"
          source={toCharacterImage}
          style={[
            styles.characterImage,
            shouldShowNextSilhouette && styles.characterSilhouette,
          ]}
        />
      ) : (
        <Image
          cachePolicy="memory-disk"
          contentFit="contain"
          source={fromCharacterImage}
          style={styles.characterImage}
        />
      )}
      {phase === "smoke" ? (
        <View pointerEvents="none" style={styles.overlayLayer}>
          <Animated.View
            style={[
              styles.smokeWrapper,
              {
                opacity: bigSmokeOpacity,
                transform: [{ scale: bigSmokeScale }],
              },
            ]}
          >
            <Image
              cachePolicy="memory-disk"
              contentFit="contain"
              source={require("@/assets/images/big-smoke.png")}
              style={styles.bigSmoke}
            />
          </Animated.View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  overlayLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    elevation: 20,
  },
  characterImage: {
    width: "100%",
    height: "100%",
    zIndex: 1,
  },
  characterSilhouette: {
    tintColor: "#FFFFFF",
  },
  smokeWrapper: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 30,
    elevation: 30,
  },
  bigSmoke: {
    width: "124%",
    height: "124%",
  },
});

const graduationStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.BLACK_NORMAL,
  },
  contentLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    elevation: 20,
  },
  graduatedBoo: {
    position: "absolute",
    right: "-52%",
    bottom: "-18%",
    width: "177%",
    aspectRatio: 1,
  },
  graduatedBooImage: {
    width: "100%",
    height: "100%",
  },
  panel: {
    alignSelf: "center",
    backgroundColor: colors.WHITE_NORMAL,
    borderWidth: 2,
    borderColor: colors.BLACK_NORMAL,
    alignItems: "center",
  },
  certificatePanel: {
    paddingHorizontal: 22,
    paddingVertical: 28,
    gap: 16,
  },
  certificateTitle: {
    fontFamily: fonts.BASIC,
    fontSize: 26,
    lineHeight: 32,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  certificateBody: {
    fontFamily: fonts.BASIC,
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  certificateDate: {
    fontFamily: fonts.BASIC,
    fontSize: 13,
    lineHeight: 18,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  statsPanel: {
    paddingHorizontal: 22,
    paddingVertical: 22,
    gap: 16,
  },
  statsTitle: {
    fontFamily: fonts.BASIC,
    fontSize: 24,
    lineHeight: 30,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  statsList: {
    width: "100%",
    gap: 10,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
  },
  statsLabel: {
    minWidth: 142,
    textAlign: "right",
    fontFamily: fonts.BASIC,
    fontSize: 12,
    lineHeight: 17,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  statsValue: {
    minWidth: 44,
    fontFamily: fonts.BASIC,
    fontSize: 12,
    lineHeight: 17,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  outroContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  outroPanel: {
    position: "relative",
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 18,
  },
  outroTitle: {
    fontFamily: fonts.BASIC,
    fontSize: 24,
    lineHeight: 30,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  linkButton: {
    minHeight: 28,
    justifyContent: "center",
  },
  linkText: {
    fontFamily: fonts.BASIC,
    fontSize: 14,
    lineHeight: 18,
    color: colors.GREEN_NORMAL,
    includeFontPadding: false,
  },
  finalButtonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 28,
  },
  touchLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
    elevation: 10,
    flexDirection: "row",
  },
  touchHalf: {
    flex: 1,
  },
  continueText: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 46,
    textAlign: "center",
    fontFamily: fonts.BASIC,
    fontSize: 18,
    lineHeight: 18,
    color: colors.WHITE_NORMAL,
    includeFontPadding: false,
    textShadowColor: colors.BLACK_NORMAL,
    textShadowOffset: { height: 1, width: 1 },
    textShadowRadius: 0,
    opacity: 0.8,
  },
});

export default EvolutionOverlay;
