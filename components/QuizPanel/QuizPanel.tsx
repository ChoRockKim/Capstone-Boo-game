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
import { playSoundEffect } from "@/utils/soundEffects";
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
  description: string;
  isCorrect: boolean;
};

const PANEL_HORIZONTAL_PADDING = 28;

function QuizPanel({ onQuizResultAlert, setIsQuizOpen }: QuizPanelProps) {
  const { width } = useWindowDimensions();
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
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [resultState, setResultState] = useState<QuizResultState | null>(null);

  const quizCountToday = useMemo(
    () => getQuizDailyCountForDate(quizDailyCount, quizDailyCountDateKey, now),
    [now, quizDailyCount, quizDailyCountDateKey],
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
      quizDailyLimitEnabled
        ? getNextQuizAvailabilityTime(quizAttemptHistory, now)
        : null,
    [now, quizAttemptHistory, quizDailyLimitEnabled],
  );
  const canTakeMoreQuizzesToday =
    !quizDailyLimitEnabled || quizCountToday < QUIZ_DAILY_LIMIT;
  const hasAvailableQuestion = availableQuestions.length > 0;
  const isInfoOnlyState = !resultState && !currentQuestion;
  const canSubmitAnswer =
    !resultState &&
    !!currentQuestion &&
    !!selectedAnswer &&
    canTakeMoreQuizzesToday;
  const actionButtonWidth = width - PANEL_HORIZONTAL_PADDING * 2;

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (resultState) {
      return;
    }

    if (!currentQuestion && canTakeMoreQuizzesToday && hasAvailableQuestion) {
      setCurrentQuestion(pickRandomQuizQuestion(availableQuestions));
      setCurrentQuestionOrder(quizCountToday + 1);
    }
  }, [
    availableQuestions,
    canTakeMoreQuizzesToday,
    currentQuestion,
    hasAvailableQuestion,
    quizCountToday,
    resultState,
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
    ).filter((question) => question.id !== currentQuestion?.id);
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

  const handleActionPress = () => {
    if (resultState) {
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

    if (!currentQuestion) {
      closeQuizPanel();
      return;
    }

    if (!selectedAnswer) {
      return;
    }

    const isCorrect = isQuizAnswerCorrect(currentQuestion, selectedAnswer);
    const attemptResult = submitQuizAttempt(currentQuestion.id, isCorrect);

    if (!attemptResult.ok) {
      setCurrentQuestion(null);
      setSelectedAnswer(null);
      setResultState(null);
      setNow(new Date());
      return;
    }

    setResultState({
      answerLabel: getQuizAnswerLabel(currentQuestion),
      description: currentQuestion.resultText,
      isCorrect,
    });
    onQuizResultAlert(isCorrect);
  };

  const panelHeroText = useMemo(() => {
    if (resultState) {
      return `${resultState.isCorrect ? ">> 정답 <<" : ">> 땡 <<"}\n${resultState.description}`;
    }

    if (currentQuestion) {
      return currentQuestion.question;
    }

    if (!canTakeMoreQuizzesToday) {
      return "오늘의 퀴즈를\n모두 완료했어요!";
    }

    if (nextAvailableAt) {
      return `다음 퀴즈는\n${formatQuizCooldownRemaining(nextAvailableAt, now)} 뒤에 열려요.`;
    }

    return "지금 풀 수 있는\n퀴즈가 없어요.";
  }, [
    canTakeMoreQuizzesToday,
    currentQuestion,
    nextAvailableAt,
    now,
    pendingEvolution,
    resultState,
  ]);

  const actionButtonLabel = resultState
    ? "> 확인"
    : currentQuestion
      ? "> 정답 확인"
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
              {quizDailyLimitEnabled
                ? `${Math.min(currentQuestionOrder, QUIZ_DAILY_LIMIT)} / ${QUIZ_DAILY_LIMIT}`
                : `${currentQuestionOrder} / ∞`}
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
        {!resultState && currentQuestion?.type === "ox" ? (
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
        currentQuestion?.type === "multiple-choice" &&
        currentQuestion.options.length > 0 ? (
          <View style={styles.choiceList}>
            {currentQuestion.options.map((option) => (
              <QuizAnswerButton
                key={option}
                label={option}
                onPress={() => setSelectedAnswer(option)}
                selected={selectedAnswer === option}
              />
            ))}
          </View>
        ) : null}
        {!resultState && !currentQuestion ? (
          <Text style={styles.helperText}>
            {canTakeMoreQuizzesToday
              ? "조금 뒤에 다시 확인해보세요."
              : "내일 다시 퀴즈에 도전할 수 있어요."}
          </Text>
        ) : null}
        {resultState ? (
          <Text style={styles.helperText}>
            정답: {resultState.answerLabel}
            {resultState.isCorrect
              ? `  /  XP +${QUIZ_CORRECT_XP_REWARD}  /  코인 +${QUIZ_CORRECT_COIN_REWARD}`
              : `  /  XP -${QUIZ_WRONG_XP_PENALTY}`}
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
              canSubmitAnswer || resultState || !currentQuestion
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
