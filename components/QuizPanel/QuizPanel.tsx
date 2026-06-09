/**
 * @description  퀴즈 풀이, 정답 확인, 쿨타임/하루 제한 상태를 표시하는 패널입니다.
 * @depends      stores/useGameStore.ts, utils/soundEffects.ts, components/MainButton/MainButton.tsx, components/QuizPanel/QuizData.ts, components/QuizPanel/QuizAnswerButton.tsx
 * @used-by      app/game/index.tsx
 * @side-effects submitQuizAttempt Zustand 액션 호출, quiz SFX 재생, clock interval 관리
 */
import CrossIcon from "@/assets/icons/cross.svg";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { useGameStore } from "@/stores/useGameStore";
import {
  getQuizPlayStatus,
  getServerApiErrorMessage,
  listAvailableQuizzes,
  QuizQuestionOut,
  submitQuizAnswer,
} from "@/utils/serverApi";
import { playSoundEffect } from "@/utils/soundEffects";
import { useQuery } from "@tanstack/react-query";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import MainButton from "../MainButton/MainButton";
import QuizAnswerButton from "./QuizAnswerButton";
import {
  formatQuizCooldownRemaining,
  getAvailableQuizQuestions,
  getNextQuizAvailabilityTime,
  getQuizAnswerLabel,
  getQuizDailyCountForDate,
  isQuizAnswerCorrect,
  pickRandomQuizQuestion,
  QUIZ_CORRECT_COIN_REWARD,
  QUIZ_CORRECT_XP_REWARD,
  QUIZ_DAILY_LIMIT,
  QUIZ_WRONG_XP_PENALTY,
  QuizQuestion,
} from "./QuizData";

interface QuizPanelProps {
  onQuizResultAlert: (isCorrect: boolean) => void;
  setIsQuizOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

type QuizResultState = {
  answerLabel: string;
  coinDelta: number;
  description: string;
  isCorrect: boolean;
  xpDelta: number;
};

const PANEL_HORIZONTAL_PADDING = 28;
const normalizeServerQuizOptions = (
  options: QuizQuestionOut["options"],
): string[] => {
  if (Array.isArray(options)) {
    return options.map(String);
  }

  if (options && typeof options === "object") {
    return Object.values(options).map(String);
  }

  return [];
};

const mapServerQuizQuestion = (
  quizQuestion: QuizQuestionOut | null | undefined,
): QuizQuestion | null => {
  if (!quizQuestion) {
    return null;
  }

  const options = normalizeServerQuizOptions(quizQuestion.options);

  if (options.length > 0) {
    return {
      answer: quizQuestion.answer ?? "",
      id: `server-quiz-${quizQuestion.quiz_id}`,
      options,
      question: quizQuestion.question,
      resultText: "서버에서 채점한 결과입니다.",
      serverQuizId: quizQuestion.quiz_id,
      type: "multiple-choice",
    };
  }

  if (quizQuestion.answer === "O" || quizQuestion.answer === "X") {
    return {
      answer: quizQuestion.answer,
      id: `server-quiz-${quizQuestion.quiz_id}`,
      question: quizQuestion.question,
      resultText: "서버에서 채점한 결과입니다.",
      serverQuizId: quizQuestion.quiz_id,
      type: "ox",
    };
  }

  return {
    answer: "",
    id: `server-quiz-${quizQuestion.quiz_id}`,
    options: ["O", "X"],
    question: quizQuestion.question,
    resultText: "서버에서 채점한 결과입니다.",
    serverQuizId: quizQuestion.quiz_id,
    type: "multiple-choice",
  };
};

function QuizPanel({ onQuizResultAlert, setIsQuizOpen }: QuizPanelProps) {
  const { width } = useWindowDimensions();
  const accessToken = useGameStore((state) => state.accessToken);
  const applyServerQuizSubmit = useGameStore(
    (state) => state.applyServerQuizSubmit,
  );
  const quizAttemptHistory = useGameStore((state) => state.quizAttemptHistory);
  const quizDailyCount = useGameStore((state) => state.quizDailyCount);
  const quizDailyCountDateKey = useGameStore(
    (state) => state.quizDailyCountDateKey,
  );
  const quizDailyLimitEnabled = useGameStore(
    (state) => state.quizDailyLimitEnabled,
  );
  const pendingEvolution = useGameStore((state) => state.pendingEvolution);
  const submitQuizAttempt = useGameStore((state) => state.submitQuizAttempt);
  const [now, setNow] = useState(() => new Date());
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(
    null,
  );
  const [currentQuestionOrder, setCurrentQuestionOrder] = useState(1);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [resultState, setResultState] = useState<QuizResultState | null>(null);
  const isServerQuizEnabled = !!accessToken;
  const {
    data: serverQuizStatus,
    isLoading: isServerQuizStatusLoading,
    refetch: refetchServerQuizStatus,
  } = useQuery({
    queryKey: ["quizzes", "playStatus", accessToken],
    queryFn: () => getQuizPlayStatus(accessToken ?? undefined),
    enabled: isServerQuizEnabled,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    retry: 1,
  });
  const {
    data: serverAvailableQuizzes,
    isLoading: isServerAvailableQuizzesLoading,
    refetch: refetchServerAvailableQuizzes,
  } = useQuery({
    queryKey: [
      "quizzes",
      "available",
      accessToken,
      serverQuizStatus?.solved_today,
    ],
    queryFn: () => listAvailableQuizzes(accessToken ?? undefined),
    enabled: isServerQuizEnabled && serverQuizStatus?.can_play_now === true,
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
    retry: 1,
  });
  const serverQuestion = useMemo(
    () => mapServerQuizQuestion(serverAvailableQuizzes?.[0] ?? null),
    [serverAvailableQuizzes],
  );

  const quizCountToday = useMemo(
    () =>
      isServerQuizEnabled
        ? (serverQuizStatus?.solved_today ?? 0)
        : getQuizDailyCountForDate(quizDailyCount, quizDailyCountDateKey, now),
    [
      isServerQuizEnabled,
      now,
      quizDailyCount,
      quizDailyCountDateKey,
      serverQuizStatus,
    ],
  );
  const availableQuestions = useMemo(
    () =>
      getAvailableQuizQuestions(quizAttemptHistory, now, {
        ignoreCooldown: !quizDailyLimitEnabled,
      }),
    [now, quizAttemptHistory, quizDailyLimitEnabled],
  );
  const nextAvailableAt = useMemo(
    () =>
      isServerQuizEnabled
        ? serverQuizStatus?.can_play_now === false &&
          serverQuizStatus?.next_available_at
          ? new Date(serverQuizStatus.next_available_at)
          : null
        : quizDailyLimitEnabled
          ? getNextQuizAvailabilityTime(quizAttemptHistory, now)
          : null,
    [
      isServerQuizEnabled,
      now,
      quizAttemptHistory,
      quizDailyLimitEnabled,
      serverQuizStatus,
    ],
  );
  const canTakeMoreQuizzesToday =
    isServerQuizEnabled
      ? (serverQuizStatus?.remaining_today ?? 0) > 0
      : !quizDailyLimitEnabled || quizCountToday < QUIZ_DAILY_LIMIT;
  const hasAvailableQuestion = isServerQuizEnabled
    ? !!serverQuestion
    : availableQuestions.length > 0;
  const autoQuestion =
    !resultState && canTakeMoreQuizzesToday && hasAvailableQuestion
      ? isServerQuizEnabled
        ? serverQuestion
        : (availableQuestions[0] ?? null)
      : null;
  const activeQuestion = currentQuestion ?? autoQuestion;
  const activeQuestionOrder =
    currentQuestion === null ? quizCountToday + 1 : currentQuestionOrder;
  const isInfoOnlyState = !resultState && !activeQuestion;
  const canSubmitAnswer =
    !resultState &&
    !!activeQuestion &&
    !!selectedAnswer &&
    canTakeMoreQuizzesToday &&
    !isSubmittingAnswer;
  const actionButtonWidth = width - PANEL_HORIZONTAL_PADDING * 2;

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, nextAvailableAt ? 1000 : 60000);

    return () => clearInterval(timer);
  }, [nextAvailableAt]);

  useEffect(() => {
    if (!isServerQuizEnabled || !nextAvailableAt || activeQuestion) {
      return;
    }

    const remainingMs = nextAvailableAt.getTime() - Date.now();
    if (remainingMs <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setNow(new Date());
      void refetchServerQuizStatus();
    }, Math.max(remainingMs, 0) + 300);

    return () => clearTimeout(timer);
  }, [
    activeQuestion,
    isServerQuizEnabled,
    nextAvailableAt,
    refetchServerQuizStatus,
  ]);

  const closeQuizPanel = useCallback(() => {
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setResultState(null);
    setCurrentQuestionOrder(1);
    setNow(new Date());
    setIsQuizOpen(false);
  }, [setIsQuizOpen]);

  const handleClosePress = () => {
    playSoundEffect("basicClick");
    closeQuizPanel();
  };

  const moveToNextQuestion = () => {
    const isNextQuizDailyLimitEnabled =
      useGameStore.getState().quizDailyLimitEnabled;
    const nextQuestions = getAvailableQuizQuestions(
      useGameStore.getState().quizAttemptHistory,
      new Date(),
      {
        ignoreCooldown: !isNextQuizDailyLimitEnabled,
      },
    ).filter((question) => question.id !== activeQuestion?.id);
    const nextQuestion = pickRandomQuizQuestion(nextQuestions);
    const nextQuizCountToday = getQuizDailyCountForDate(
      useGameStore.getState().quizDailyCount,
      useGameStore.getState().quizDailyCountDateKey,
      new Date(),
    );

    if (
      !nextQuestion ||
      (isNextQuizDailyLimitEnabled && nextQuizCountToday >= QUIZ_DAILY_LIMIT)
    ) {
      closeQuizPanel();
      return;
    }

    setCurrentQuestion(nextQuestion);
    setCurrentQuestionOrder(nextQuizCountToday + 1);
    setSelectedAnswer(null);
    setResultState(null);
  };

  const handleActionPress = async () => {
    if (resultState) {
      if (isServerQuizEnabled) {
        closeQuizPanel();
        return;
      }

      if (pendingEvolution?.trigger === "quiz") {
        closeQuizPanel();
        return;
      }

      if (quizDailyLimitEnabled) {
        closeQuizPanel();
        return;
      }

      moveToNextQuestion();
      return;
    }

    if (!activeQuestion) {
      closeQuizPanel();
      return;
    }

    if (!selectedAnswer) {
      return;
    }

    if (
      isServerQuizEnabled &&
      accessToken &&
      typeof activeQuestion.serverQuizId === "number"
    ) {
      const hasServerAnswer = activeQuestion.answer.trim().length > 0;

      if (!hasServerAnswer) {
        setIsSubmittingAnswer(true);

        try {
          const submitResult = await submitQuizAnswer(
            {
              answer: selectedAnswer,
              quiz_id: activeQuestion.serverQuizId,
            },
            accessToken,
          );

          applyServerQuizSubmit({
            coin: submitResult.coin,
            isCorrect: submitResult.correct,
            totalXp: submitResult.xp_point,
            unlockedAchievements: submitResult.unlocked_achievements,
          });
          setResultState({
            answerLabel: submitResult.correct_answer,
            coinDelta: submitResult.awarded_coin,
            description:
              submitResult.detail ||
              (submitResult.correct ? "정답입니다!" : "아쉽지만 오답이에요."),
            isCorrect: submitResult.correct,
            xpDelta: submitResult.awarded_points,
          });
          onQuizResultAlert(submitResult.correct);

          await Promise.all([
            refetchServerQuizStatus(),
            refetchServerAvailableQuizzes(),
          ]);
        } catch (error) {
          setCurrentQuestion(null);
          setSelectedAnswer(null);
          setResultState({
            answerLabel: "",
            coinDelta: 0,
            description: getServerApiErrorMessage(
              error,
              "퀴즈 제출에 실패했어요.",
            ),
            isCorrect: false,
            xpDelta: 0,
          });
        } finally {
          setIsSubmittingAnswer(false);
        }

        return;
      }

      const rollbackState = useGameStore.getState();
      const optimisticIsCorrect = isQuizAnswerCorrect(
        activeQuestion,
        selectedAnswer,
      );
      const optimisticXpDelta = optimisticIsCorrect
        ? QUIZ_CORRECT_XP_REWARD
        : -QUIZ_WRONG_XP_PENALTY;

      applyServerQuizSubmit({
        coin: optimisticIsCorrect
          ? rollbackState.coin + QUIZ_CORRECT_COIN_REWARD
          : rollbackState.coin,
        isCorrect: optimisticIsCorrect,
        totalXp: Math.max(rollbackState.totalXp + optimisticXpDelta, 0),
      });
      setResultState({
        answerLabel: getQuizAnswerLabel(activeQuestion),
        coinDelta: optimisticIsCorrect ? QUIZ_CORRECT_COIN_REWARD : 0,
        description: optimisticIsCorrect
          ? "정답입니다!"
          : "아쉽지만 오답이에요.",
        isCorrect: optimisticIsCorrect,
        xpDelta: optimisticXpDelta,
      });
      onQuizResultAlert(optimisticIsCorrect);

      const optimisticState = useGameStore.getState();
      const optimisticCoinBase =
        rollbackState.coin +
        (optimisticIsCorrect ? QUIZ_CORRECT_COIN_REWARD : 0);
      const optimisticXpBase = Math.max(
        rollbackState.totalXp +
          (optimisticIsCorrect
            ? QUIZ_CORRECT_XP_REWARD
            : -QUIZ_WRONG_XP_PENALTY),
        0,
      );
      const optimisticAchievementCoinDelta = Math.max(
        optimisticState.coin - optimisticCoinBase,
        0,
      );
      const optimisticAchievementXpDelta = Math.max(
        optimisticState.totalXp - optimisticXpBase,
        0,
      );

      setIsSubmittingAnswer(true);

      try {
        const submitResult = await submitQuizAnswer(
          {
            answer: selectedAnswer,
            quiz_id: activeQuestion.serverQuizId,
          },
          accessToken,
        );

        if (
          optimisticIsCorrect !== submitResult.correct
        ) {
          useGameStore.getState().setGameState({
            achievementAlertQueue: rollbackState.achievementAlertQueue,
            achievementStats: rollbackState.achievementStats,
            coin: rollbackState.coin,
            completedAchievementKeys: rollbackState.completedAchievementKeys,
            ownedAchievementSkins: rollbackState.ownedAchievementSkins,
            pendingEvolution: rollbackState.pendingEvolution,
            totalXp: rollbackState.totalXp,
          });
        }

        applyServerQuizSubmit({
          coin:
            submitResult.coin +
            (optimisticIsCorrect === submitResult.correct
              ? optimisticAchievementCoinDelta
              : 0),
          countAchievement: optimisticIsCorrect !== submitResult.correct,
          isCorrect: submitResult.correct,
          totalXp:
            submitResult.xp_point +
            (optimisticIsCorrect === submitResult.correct
              ? optimisticAchievementXpDelta
              : 0),
          unlockedAchievements: submitResult.unlocked_achievements,
        });
        if (
          optimisticIsCorrect !== submitResult.correct
        ) {
          setResultState({
            answerLabel: submitResult.correct_answer,
            coinDelta: submitResult.awarded_coin,
            description:
              submitResult.detail ||
              (submitResult.correct ? "정답입니다!" : "아쉽지만 오답이에요."),
            isCorrect: submitResult.correct,
            xpDelta: submitResult.awarded_points,
          });
          onQuizResultAlert(submitResult.correct);
        }
        await Promise.all([
          refetchServerQuizStatus(),
          refetchServerAvailableQuizzes(),
        ]);
      } catch (error) {
        useGameStore.getState().setGameState({
          achievementAlertQueue: rollbackState.achievementAlertQueue,
          achievementStats: rollbackState.achievementStats,
          coin: rollbackState.coin,
          completedAchievementKeys: rollbackState.completedAchievementKeys,
          ownedAchievementSkins: rollbackState.ownedAchievementSkins,
          pendingEvolution: rollbackState.pendingEvolution,
          totalXp: rollbackState.totalXp,
        });
        setCurrentQuestion(null);
        setSelectedAnswer(null);
        setResultState({
          answerLabel: "",
          coinDelta: 0,
          description: getServerApiErrorMessage(
            error,
            "퀴즈 제출에 실패했어요.",
          ),
          isCorrect: false,
          xpDelta: 0,
        });
      } finally {
        setIsSubmittingAnswer(false);
      }

      return;
    }

    const isCorrect = isQuizAnswerCorrect(activeQuestion, selectedAnswer);
    const attemptResult = submitQuizAttempt(activeQuestion.id, isCorrect);

    if (!attemptResult.ok) {
      setCurrentQuestion(null);
      setSelectedAnswer(null);
      setResultState(null);
      setNow(new Date());
      return;
    }

    setResultState({
      answerLabel: getQuizAnswerLabel(activeQuestion),
      coinDelta: isCorrect ? QUIZ_CORRECT_COIN_REWARD : 0,
      description: activeQuestion.resultText,
      isCorrect,
      xpDelta: isCorrect ? QUIZ_CORRECT_XP_REWARD : -QUIZ_WRONG_XP_PENALTY,
    });
    onQuizResultAlert(isCorrect);
  };

  const panelHeroText = useMemo(() => {
    if (resultState) {
      return `${resultState.isCorrect ? ">> 정답 <<" : ">> 땡 <<"}\n${resultState.description}`;
    }

    if (activeQuestion) {
      return activeQuestion.question;
    }

    if (isServerAvailableQuizzesLoading) {
      return "퀴즈를\n불러오고 있어요.";
    }

    if (isServerQuizStatusLoading) {
      return "퀴즈 상태를\n확인하고 있어요.";
    }

    if (!canTakeMoreQuizzesToday) {
      return "오늘의 퀴즈를\n모두 완료했어요!";
    }

    if (nextAvailableAt) {
      return `다음 퀴즈는\n${formatQuizCooldownRemaining(nextAvailableAt, now)} 뒤에 열려요.`;
    }

    return isServerQuizEnabled
      ? "새로 풀 수 있는\n퀴즈가 없어요."
      : "지금 풀 수 있는\n퀴즈가 없어요.";
  }, [
    canTakeMoreQuizzesToday,
    activeQuestion,
    nextAvailableAt,
    now,
    isServerAvailableQuizzesLoading,
    isServerQuizStatusLoading,
    isServerQuizEnabled,
    resultState,
  ]);
  const quizDailyLimit =
    isServerQuizEnabled
      ? (serverQuizStatus?.daily_limit ?? QUIZ_DAILY_LIMIT)
      : QUIZ_DAILY_LIMIT;
  const shouldUseDailyLimitText =
    isServerQuizEnabled || quizDailyLimitEnabled;

  const actionButtonLabel = resultState
    ? "> 확인"
    : activeQuestion
      ? isSubmittingAnswer
        ? "> 제출 중"
        : "> 정답 확인"
      : "> 닫기";

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <View
        style={[styles.container, isInfoOnlyState && styles.compactContainer]}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerText}>퀴즈</Text>
            <Text style={styles.pageText}>
              {shouldUseDailyLimitText
                ? `${Math.min(activeQuestionOrder, quizDailyLimit)} / ${quizDailyLimit}`
                : `${activeQuestionOrder} / ∞`}
            </Text>
          </View>
          <Pressable
            hitSlop={16}
            onPress={handleClosePress}
            style={styles.headerButton}
          >
            <CrossIcon width={24} height={24} fill={colors.BLACK_NORMAL} />
          </Pressable>
        </View>
        <View style={styles.heroBanner}>
          <Text style={styles.heroText}>{panelHeroText}</Text>
        </View>
        {!resultState && activeQuestion?.type === "ox" ? (
          <View style={styles.oxRow}>
            <QuizAnswerButton
              label="맞다"
              onPress={() => setSelectedAnswer("O")}
              selected={selectedAnswer === "O"}
              symbol="check"
              variant="ox"
            />
            <QuizAnswerButton
              label="아니다"
              onPress={() => setSelectedAnswer("X")}
              selected={selectedAnswer === "X"}
              symbol="x"
              variant="ox"
            />
          </View>
        ) : null}
        {!resultState &&
        activeQuestion?.type === "multiple-choice" &&
        activeQuestion.options.length > 0 ? (
          <View style={styles.choiceList}>
            {activeQuestion.options.map((option) => (
              <QuizAnswerButton
                key={option}
                label={option}
                onPress={() => setSelectedAnswer(option)}
                selected={selectedAnswer === option}
              />
            ))}
          </View>
        ) : null}
        {!resultState &&
        !activeQuestion &&
        !isServerQuizStatusLoading &&
        !isServerAvailableQuizzesLoading ? (
          <Text style={styles.helperText}>
            {isServerQuizEnabled && canTakeMoreQuizzesToday
              ? "아직 서버에 새 퀴즈가 없어요."
              : canTakeMoreQuizzesToday
              ? "조금 뒤에 다시 확인해보세요."
              : "내일 다시 퀴즈에 도전할 수 있어요."}
          </Text>
        ) : null}
        {resultState ? (
          <Text style={styles.helperText}>
            {`정답: ${resultState.answerLabel}${
              resultState.isCorrect
                ? `  /  XP +${resultState.xpDelta}  /  코인 +${resultState.coinDelta}`
                : `  /  XP ${resultState.xpDelta}`
            }`}
          </Text>
        ) : null}
        <View
          style={[
            styles.buttonWrapper,
            isInfoOnlyState && styles.compactButtonWrapper,
          ]}
        >
          <MainButton
            color={
              canSubmitAnswer ||
              resultState ||
              !activeQuestion
                ? "blue"
                : "gray"
            }
            label={actionButtonLabel}
            onPress={handleActionPress}
            size="S"
            width={actionButtonWidth}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 999,
    elevation: 999,
    justifyContent: "flex-end",
  },
  container: {
    width: "100%",
    minHeight: 430,
    paddingTop: 24,
    paddingHorizontal: PANEL_HORIZONTAL_PADDING,
    paddingBottom: 30,
    backgroundColor: colors.WHITE_NORMAL,
    borderTopWidth: 2,
    borderTopColor: colors.BLACK_NORMAL,
  },
  compactContainer: {
    minHeight: 330,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  headerTextGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  headerText: {
    fontFamily: fonts.BASIC,
    fontSize: 24,
    lineHeight: 34,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  pageText: {
    fontFamily: fonts.BASIC,
    fontSize: 12,
    lineHeight: 18,
    color: colors.SILVER_NORMAL_ACTIVE,
    includeFontPadding: false,
    marginBottom: 4,
  },
  heroBanner: {
    marginBottom: 18,
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: colors.SILVER_LIGHT_HOVER,
    alignItems: "center",
    justifyContent: "center",
  },
  heroText: {
    fontFamily: fonts.BASIC,
    fontSize: 20,
    lineHeight: 32,
    color: colors.BLACK_NORMAL,
    textAlign: "center",
    includeFontPadding: false,
  },
  oxRow: {
    flexDirection: "row",
    gap: 12,
  },
  choiceList: {
    gap: 10,
  },
  helperText: {
    marginTop: 16,
    fontFamily: fonts.BASIC,
    fontSize: 14,
    lineHeight: 20,
    color: colors.SILVER_NORMAL_ACTIVE,
    textAlign: "center",
    includeFontPadding: false,
  },
  buttonWrapper: {
    marginTop: 28,
    width: "100%",
    alignItems: "center",
  },
  compactButtonWrapper: {
    marginTop: 20,
  },
  headerButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
  },
});

export default QuizPanel;
