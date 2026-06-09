/**
 * @description  퀴즈 문제 데이터와 하루 제한/쿨타임/정답 판정 유틸을 제공합니다.
 * @depends      없음
 * @used-by      stores/useGameStore.ts, app/game/index.tsx, components/QuizPanel/QuizPanel.tsx
 * @side-effects Math.random 기반 문제 선택
 */
export const QUIZ_DAILY_LIMIT = 3;
export const QUIZ_COOLDOWN_MS = 1000 * 60 * 60 * 3;
export const QUIZ_CORRECT_COIN_REWARD = 10;
export const QUIZ_CORRECT_XP_REWARD = 30;
export const QUIZ_WRONG_XP_PENALTY = 10;

type QuizQuestionBase = {
  answer: string;
  id: string;
  question: string;
  resultText: string;
  serverQuizId?: number;
};

export type MultipleChoiceQuizQuestion = QuizQuestionBase & {
  options: string[];
  type: "multiple-choice";
};

export type OxQuizQuestion = QuizQuestionBase & {
  answer: "O" | "X";
  type: "ox";
};

export type QuizQuestion = MultipleChoiceQuizQuestion | OxQuizQuestion;

const MULTIPLE_CHOICE_QUIZ: MultipleChoiceQuizQuestion[] = [
  {
    id: "mc-1",
    type: "multiple-choice",
    question: "한국외국어대학교가 세워진 해는?",
    options: ["1946년", "1954년", "1981년"],
    answer: "1954년",
    resultText: "한국외국어대학교는\n1954년에 세워졌습니다.",
  },
  {
    id: "mc-2",
    type: "multiple-choice",
    question: "한국외국어대학교의 상징에 포함되는 조합은?",
    options: ["호랑이·방패·태극", "미네르바·부엉이·지구", "독수리·책·촛불"],
    answer: "미네르바·부엉이·지구",
    resultText: "한국외대의 상징에는\n미네르바·부엉이·지구가 포함됩니다.",
  },
  {
    id: "mc-6",
    type: "multiple-choice",
    question: "한국외국어대학교의 창학 배경과 가장 가까운 것은?",
    options: ["조국의 근대화와 세계 평화", "체육 인재 양성", "농업 기술 보급"],
    answer: "조국의 근대화와 세계 평화",
    resultText:
      "한국외대의 창학 배경은\n조국의 근대화와 세계 평화에 가깝습니다.",
  },
  {
    id: "mc-7",
    type: "multiple-choice",
    question: "계절학기에서 한 학기에 신청할 수 있는 최대 수강 학점은?",
    options: ["1) 3학점", "2) 6학점", "3) 9학점"],
    answer: "2)",
    resultText: "계절학기에는 한 학기에\n최대 6학점까지 신청할 수 있습니다.",
  },
  {
    id: "mc-8",
    type: "multiple-choice",
    question: "휴학생의 계절학기 수강 및 성적 인정 조건으로 옳은 것은?",
    options: [
      "1) 복학 여부와 상관없이 누구나 수강 가능하다.",
      "2) 계절학기 종료 후 곧바로 정규학기에 복학해야 성적이 인정된다.",
      "3) 휴학 중에는 최대 12학점까지 수강 및 인정이 가능하다.",
    ],
    answer: "2)",
    resultText:
      "휴학생은 계절학기 종료 후\n곧바로 정규학기에 복학해야 성적이 인정됩니다.",
  },
  {
    id: "mc-9",
    type: "multiple-choice",
    question: "한국외대 정규학기에 신청할 수 있는 최대 수강학점은?",
    options: ["18학점", "20학점", "24학점"],
    answer: "20학점",
    resultText: "정규학기에는 최대\n20학점까지 신청할 수 있습니다.",
  },
  {
    id: "mc-10",
    type: "multiple-choice",
    question: "수강신청 취소 기간에 취소할 수 없는 기준은? (4학년 제외)",
    options: ["10학점 미만", "12학점 미만", "15학점 미만"],
    answer: "12학점 미만",
    resultText:
      "4학년을 제외하면 수강신청 취소 후\n12학점 미만이 되면 안 됩니다.",
  },
  {
    id: "mc-11",
    type: "multiple-choice",
    question: "재수강을 할 수 있는 이전 취득 성적 기준은?",
    options: ["B+ 이하", "C+ 이하", "D+ 이하"],
    answer: "C+ 이하",
    resultText: "재수강은 이전 취득 성적이\nC+ 이하일 때 가능합니다.",
  },
  {
    id: "mc-12",
    type: "multiple-choice",
    question: "재학 중 재수강할 수 있는 총 학점 한도는? (계절학기 제외)",
    options: ["18학점", "21학점", "27학점"],
    answer: "21학점",
    resultText: "재학 중 재수강 가능 학점은\n계절학기 제외 총 21학점입니다.",
  },
  {
    id: "mc-13",
    type: "multiple-choice",
    question: "재수강할 때 받을 수 있는 최고 성적 등급은?",
    options: ["A+", "A0", "B+"],
    answer: "A0",
    resultText: "재수강 과목의 최고 성적은\nA0까지입니다.",
  },
  {
    id: "mc-14",
    type: "multiple-choice",
    question: "관심강좌(구 예비수강신청함)에 담을 수 있는 최대 과목 수는?",
    options: ["10과목", "15과목", "20과목"],
    answer: "15과목",
    resultText: "관심강좌에는 최대\n15과목까지 담을 수 있습니다.",
  },
  {
    id: "mc-15",
    type: "multiple-choice",
    question: "1학기 잔여 수강학점을 2학기로 이월할 수 있는 최대 학점은?",
    options: ["2학점", "3학점", "5학점"],
    answer: "3학점",
    resultText: "1학기 잔여 수강학점은\n최대 3학점까지 2학기로 이월됩니다.",
  },
  {
    id: "mc-16",
    type: "multiple-choice",
    question: "학사경고는 정규학기 평점평균이 얼마 미만일 때 받게 되는가?",
    options: ["1.50 미만", "1.75 미만", "2.00 미만"],
    answer: "1.75 미만",
    resultText: "정규학기 평점평균이\n1.75 미만이면 학사경고를 받습니다.",
  },
  {
    id: "mc-17",
    type: "multiple-choice",
    question: "학사경고가 몇 회 누적되면 학업성적불량으로 제적되는가?",
    options: ["3회", "4회", "5회"],
    answer: "4회",
    resultText: "학사경고가 4회 누적되면\n학업성적불량으로 제적됩니다.",
  },
  {
    id: "mc-18",
    type: "multiple-choice",
    question: "졸업을 위해 충족해야 하는 전체 평점평균 기준은?",
    options: ["1.75 이상", "2.00 이상", "2.50 이상"],
    answer: "2.00 이상",
    resultText: "졸업을 위해서는 전체 평점평균\n2.00 이상을 충족해야 합니다.",
  },
  {
    id: "mc-19",
    type: "multiple-choice",
    question: "학점포기제로 포기할 수 있는 총 학점 한도는?",
    options: ["3학점", "6학점", "9학점"],
    answer: "6학점",
    resultText: "학점포기로 포기할 수 있는 총 학점은\n최대 6학점입니다.",
  },
  {
    id: "mc-20",
    type: "multiple-choice",
    question: "학점포기는 어떤 성적의 과목만 가능한가?",
    options: ["B+ 이하", "C+ 이하", "D+ 이하"],
    answer: "C+ 이하",
    resultText: "학점포기는 C+ 이하 성적의 과목만\n신청할 수 있습니다.",
  },
  {
    id: "mc-21",
    type: "multiple-choice",
    question: "일반 강의의 상대평가에서 A+·A0를 받을 수 있는 학생 비율 상한은?",
    options: ["30%", "35%", "40%"],
    answer: "35%",
    resultText: "상대평가 강의에서 A+·A0 비율 상한은\n35%입니다.",
  },
  {
    id: "mc-22",
    type: "multiple-choice",
    question:
      "수강생 몇 명 이하 강좌에는 상대평가가 아닌 자율평가가 적용되는가?",
    options: ["5명 이하", "10명 이하", "15명 이하"],
    answer: "10명 이하",
    resultText: "수강생 10명 이하 강좌에는\n자율평가가 적용됩니다.",
  },
  {
    id: "mc-23",
    type: "multiple-choice",
    question:
      "비영어 전공자가 영어로 졸업 외국어인증을 받으려면 TOEIC 최소 몇 점이어야 하는가?",
    options: ["650점", "710점", "800점"],
    answer: "710점",
    resultText: "비영어 전공자의 영어 졸업인증 기준은\nTOEIC 710점 이상입니다.",
  },
  {
    id: "mc-24",
    type: "multiple-choice",
    question: "2025학번 이후 학생의 이중전공 이수 필요학점은?",
    options: ["36학점", "42학점", "54학점"],
    answer: "42학점",
    resultText: "2025학번 이후 학생의 이중전공 이수학점은\n42학점입니다.",
  },
  {
    id: "mc-25",
    type: "multiple-choice",
    question: "2015~2024학번 학생의 이중전공 이수 필요학점은?",
    options: ["42학점", "54학점", "60학점"],
    answer: "54학점",
    resultText: "2015~2024학번 학생의 이중전공 이수학점은\n54학점입니다.",
  },
  {
    id: "mc-26",
    type: "multiple-choice",
    question: "부전공을 이수하기 위해 필요한 최소 학점은?",
    options: ["18학점", "21학점", "30학점"],
    answer: "21학점",
    resultText: "부전공을 이수하려면 최소\n21학점이 필요합니다.",
  },
  {
    id: "mc-27",
    type: "multiple-choice",
    question: "후기이중전공이란 어떤 제도인가?",
    options: [
      "1전공 없이 이중전공만 이수하는 제도",
      "부전공 완료 후 추가 학기를 통해 이중전공 학위도 취득하는 제도",
      "계절학기로만 이중전공을 이수하는 제도",
    ],
    answer: "부전공 완료 후 추가 학기를 통해 이중전공 학위도 취득하는 제도",
    resultText:
      "후기이중전공은 부전공 완료 후 추가 학기를 통해\n이중전공 학위도 취득하는 제도입니다.",
  },
  {
    id: "mc-28",
    type: "multiple-choice",
    question:
      "비사범대 학생은 어느 대학의 학과를 이중전공으로 이수할 수 없는가?",
    options: ["경영대학", "사범대학", "AI융합대학"],
    answer: "사범대학",
    resultText:
      "비사범대 학생은 사범대학 학과를\n이중전공으로 이수할 수 없습니다.",
  },
];

const OX_QUIZ: OxQuizQuestion[] = [
  {
    id: "ox-5",
    type: "ox",
    question:
      "한국외국어대학교의 상징 색상 중 진한 청색은 글로벌 의지와 미래를 뜻한다.",
    answer: "O",
    resultText: "상징 색상 중 진한 청색은\n글로벌 의지와 미래를 뜻합니다.",
  },
  {
    id: "ox-7",
    type: "ox",
    question: "한국외대 캠퍼스는 지하에 공부할 수 있는 공간이 있다.",
    answer: "O",
    resultText: "지하 1층의 애플라운지에서 공부할 수 있어요.",
  },
  {
    id: "ox-8",
    type: "ox",
    question:
      "2026학년도부터 사전수강신청(정원 내 자동 확정) 제도가 새로 도입되었다.",
    answer: "O",
    resultText: "2026학년도부터는 사전수강신청 제도가\n새로 도입되었습니다.",
  },
  {
    id: "ox-9",
    type: "ox",
    question:
      "수강신청 취소 기간에도 집중수업 강좌는 원칙적으로 취소할 수 없다.",
    answer: "O",
    resultText:
      "집중수업 강좌는 수강신청 취소 기간에도\n원칙적으로 취소할 수 없습니다.",
  },
  {
    id: "ox-10",
    type: "ox",
    question: "재수강을 하면 A+ 성적도 받을 수 있다.",
    answer: "X",
    resultText: "재수강 과목의 최고 성적은\nA+가 아니라 A0입니다.",
  },
  {
    id: "ox-11",
    type: "ox",
    question: "계절학기에 직전 정규학기에 수강한 과목을 바로 재수강할 수 있다.",
    answer: "X",
    resultText: "계절학기에는 직전 정규학기 과목을\n바로 재수강할 수 없습니다.",
  },
  {
    id: "ox-12",
    type: "ox",
    question:
      "매크로를 이용한 수강신청이 적발되면 수강신청 내역이 일괄 삭제된다.",
    answer: "O",
    resultText: "매크로 수강신청이 적발되면\n수강신청 내역이 일괄 삭제됩니다.",
  },
  {
    id: "ox-13",
    type: "ox",
    question:
      "1학기에 남은 잔여 수강학점은 다음 학년도 1학기에도 이월할 수 있다.",
    answer: "X",
    resultText:
      "잔여 수강학점은 다음 학년도까지가 아니라\n같은 학년도 2학기로만 이월됩니다.",
  },
  {
    id: "ox-14",
    type: "ox",
    question: "학점포기를 한 과목은 이후 재수강이 가능하다.",
    answer: "X",
    resultText: "학점포기한 과목은 이후에\n재수강할 수 없습니다.",
  },
  {
    id: "ox-15",
    type: "ox",
    question: "학사경고는 학기당 평점평균 1.75 미만일 때 부여된다.",
    answer: "O",
    resultText: "학사경고는 학기 평점평균이\n1.75 미만일 때 부여됩니다.",
  },
  {
    id: "ox-16",
    type: "ox",
    question:
      "이중전공을 이수해도 해당 이중전공의 졸업시험을 반드시 통과해야 한다.",
    answer: "O",
    resultText:
      "이중전공을 이수해도 해당 전공의\n졸업시험은 반드시 통과해야 합니다.",
  },
  {
    id: "ox-17",
    type: "ox",
    question:
      "이중전공자는 1전공 소속 학과에서 이중전공 영역에 개설된 과목도 자유롭게 수강할 수 있다.",
    answer: "X",
    resultText:
      "이중전공자는 1전공 소속 학과에서 개설된 이중전공 영역 과목을\n자유롭게 수강할 수 없습니다.",
  },
  {
    id: "ox-18",
    type: "ox",
    question: "후기이중전공을 이수하면 9학기를 반드시 등록해야 한다.",
    answer: "O",
    resultText: "후기이중전공을 이수하려면\n9학기를 등록해야 합니다.",
  },
  {
    id: "ox-19",
    type: "ox",
    question: "부전공은 융합전공으로도 이수할 수 있다.",
    answer: "X",
    resultText: "부전공은 융합전공 형태로는\n이수할 수 없습니다.",
  },
  {
    id: "ox-20",
    type: "ox",
    question:
      "외국어인증은 시험 성적 없이 교육과정 이수(80시간)로 대체할 수 있다.",
    answer: "O",
    resultText:
      "외국어인증은 시험 성적 없이도\n80시간 교육과정 이수로 대체할 수 있습니다.",
  },
  {
    id: "ox-21",
    type: "ox",
    question:
      "졸업에 필요한 학점을 다 채웠다면 외국어인증 없이도 졸업할 수 있다.",
    answer: "X",
    resultText: "졸업 학점을 충족해도\n외국어인증 없이는 졸업할 수 없습니다.",
  },
  {
    id: "ox-22",
    type: "ox",
    question: "학업성적불량 제적 후 1년간은 재입학 신청이 제한된다.",
    answer: "O",
    resultText: "학업성적불량 제적 후에는\n1년간 재입학 신청이 제한됩니다.",
  },
  {
    id: "ox-23",
    type: "ox",
    question:
      "수강신청을 한 과목이라도 다른 분반에서 수업을 들으면 성적이 인정되지 않는다.",
    answer: "O",
    resultText:
      "수강신청한 분반이 아닌 다른 분반 수업을 들으면\n성적이 인정되지 않습니다.",
  },
  {
    id: "ox-25",
    type: "ox",
    question: "타 대학에서 취득한 학점도 재수강 처리가 가능하다.",
    answer: "X",
    resultText: "타 대학에서 취득한 학점은\n재수강 처리할 수 없습니다.",
  },
  {
    id: "ox-26",
    type: "ox",
    question:
      "사전수강신청 인원이 수강정원을 초과하면 초과 신청자는 자동으로 수강보류 처리된다.",
    answer: "O",
    resultText: "사전수강신청 초과 인원은\n자동으로 수강보류 처리됩니다.",
  },
  {
    id: "ox-27",
    type: "ox",
    question:
      "졸업 학점을 모두 충족했지만 졸업시험에 통과하지 못한 경우, '졸업대기(수료)' 상태가 된다.",
    answer: "O",
    resultText:
      "졸업 학점을 충족했지만 졸업시험을 통과하지 못하면\n졸업대기(수료) 상태가 됩니다.",
  },
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  ...MULTIPLE_CHOICE_QUIZ,
  ...OX_QUIZ,
];

export type QuizAttemptHistory = Record<string, string>;

export const getQuizLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const getQuizDailyCountForDate = (
  dailyCount: number,
  dailyCountDateKey: string,
  now = new Date(),
) => {
  return dailyCountDateKey === getQuizLocalDateKey(now) ? dailyCount : 0;
};

const getNextQuizDailyResetAt = (date: Date) => {
  const nextDate = new Date(date);

  nextDate.setDate(nextDate.getDate() + 1);
  nextDate.setHours(0, 0, 0, 0);

  return nextDate;
};

const getQuizAttemptDatesForDate = (
  quizAttemptHistory: QuizAttemptHistory,
  now = new Date(),
) => {
  const todayKey = getQuizLocalDateKey(now);

  return Object.values(quizAttemptHistory)
    .map((attemptedAtIso) => new Date(attemptedAtIso))
    .filter(
      (attemptedAt) =>
        !Number.isNaN(attemptedAt.getTime()) &&
        getQuizLocalDateKey(attemptedAt) === todayKey,
    )
    .sort((a, b) => a.getTime() - b.getTime());
};

export const getLastQuizAttemptAtForDate = (
  quizAttemptHistory: QuizAttemptHistory,
  now = new Date(),
) => {
  const todayAttemptDates = getQuizAttemptDatesForDate(
    quizAttemptHistory,
    now,
  );

  return todayAttemptDates.length > 0
    ? todayAttemptDates[todayAttemptDates.length - 1]
    : null;
};

export const getQuizCooldownEndAt = (
  quizAttemptHistory: QuizAttemptHistory,
  now = new Date(),
) => {
  const lastAttemptAt = getLastQuizAttemptAtForDate(quizAttemptHistory, now);

  if (!lastAttemptAt) {
    return null;
  }

  const cooldownEndAt = new Date(lastAttemptAt.getTime() + QUIZ_COOLDOWN_MS);
  const nextDailyResetAt = getNextQuizDailyResetAt(now);

  return cooldownEndAt.getTime() < nextDailyResetAt.getTime()
    ? cooldownEndAt
    : nextDailyResetAt;
};

export const isQuizAvailableByCooldown = (
  quizAttemptHistory: QuizAttemptHistory,
  now = new Date(),
) => {
  const cooldownEndAt = getQuizCooldownEndAt(quizAttemptHistory, now);

  return !cooldownEndAt || cooldownEndAt.getTime() <= now.getTime();
};

export const getAvailableQuizQuestions = (
  quizAttemptHistory: QuizAttemptHistory,
  now = new Date(),
  options?: {
    ignoreCooldown?: boolean;
  },
) => {
  if (options?.ignoreCooldown) {
    return QUIZ_QUESTIONS;
  }

  if (!isQuizAvailableByCooldown(quizAttemptHistory, now)) {
    return [];
  }

  const todayAttemptedQuizIds = new Set(
    Object.entries(quizAttemptHistory)
      .filter(([, attemptedAtIso]) => {
        const attemptedAt = new Date(attemptedAtIso);

        return (
          !Number.isNaN(attemptedAt.getTime()) &&
          getQuizLocalDateKey(attemptedAt) === getQuizLocalDateKey(now)
        );
      })
      .map(([quizId]) => quizId),
  );

  return QUIZ_QUESTIONS.filter((question) =>
    !todayAttemptedQuizIds.has(question.id),
  );
};

export const pickRandomQuizQuestion = (questions: QuizQuestion[]) => {
  if (questions.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * questions.length);

  return questions[randomIndex];
};

export const getNextQuizAvailabilityTime = (
  quizAttemptHistory: QuizAttemptHistory,
  now = new Date(),
) => {
  const cooldownEndAt = getQuizCooldownEndAt(quizAttemptHistory, now);

  if (!cooldownEndAt || cooldownEndAt.getTime() <= now.getTime()) {
    return null;
  }

  return cooldownEndAt;
};

export const getQuizAnswerLabel = (question: QuizQuestion) => {
  if (question.type === "ox") {
    return question.answer === "O" ? "맞다" : "아니다";
  }

  const normalizedAnswer = question.answer.trim();
  const exactOption = question.options.find(
    (option) => option.trim() === normalizedAnswer,
  );

  if (exactOption) {
    return exactOption;
  }

  const prefixedOption = question.options.find((option) =>
    option.trim().startsWith(normalizedAnswer),
  );

  return prefixedOption ?? question.answer;
};

export const isQuizAnswerCorrect = (
  question: QuizQuestion,
  selectedAnswer: string,
) => {
  if (question.type === "ox") {
    return selectedAnswer === question.answer;
  }

  const normalizedSelectedAnswer = selectedAnswer.trim();
  const normalizedAnswer = question.answer.trim();

  return (
    normalizedSelectedAnswer === normalizedAnswer ||
    normalizedSelectedAnswer.startsWith(normalizedAnswer)
  );
};

export const formatQuizCooldownRemaining = (
  targetDate: Date,
  now = new Date(),
) => {
  const remainingMs = Math.max(targetDate.getTime() - now.getTime(), 0);
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (totalSeconds <= 0) {
    return "0초";
  }

  if (totalSeconds < 60) {
    return `${totalSeconds}초`;
  }

  if (hours <= 0) {
    if (seconds > 0) {
      return `${minutes}분 ${seconds}초`;
    }

    return `${minutes}분`;
  }

  if (minutes === 0) {
    return `${hours}시간`;
  }

  return `${hours}시간 ${minutes}분`;
};
