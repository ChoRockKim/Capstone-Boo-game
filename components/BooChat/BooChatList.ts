import { CharacterGrade, CharacterState } from "@/constants/character";

export type BooChatCategory =
  | "basic"
  | "happy"
  | "hungry"
  | "eating"
  | "talking";

export type BooChatMode = "auto" | "tap";

const EVOLUTION_BOO_CHAT_BY_GRADE: Record<CharacterGrade, string> = {
  1: "새내기 부로 태어났어!",
  2: "나 이제 새내기 아니야..?",
  3: "벌써 3학년이라니... 왠지 든든해진 기분이야!",
  4: "내가 4학년이라고...?? 응애 응애...",
};

const QUIZ_CORRECT_BOO_CHAT_MESSAGES = [
  "오 나 찍었는데 맞혔네!?",
  "이번건 조금 어려웠어",
  "후후 나 좀 똑똑한 듯?",
];

const BOO_CHAT_LIST_BY_MODE: Record<
  BooChatMode,
  Record<BooChatCategory, string[]>
> = {
  auto: {
    basic: [
      "과제가 너무 많다...",
      "학교를 왜 다니는걸까?",
      "자퇴 ㄱㄱ?",
      "종설 때문에 힘들다",
      "졸업 논문은 또 언제 쓰지....",
      "나 이번 학기 전액등록금이야",
      "나 19학번 화석이야",
    ],
    happy: [
      "기분이 좋아서 날아갈 것 같아!",
      "오늘은 왠지 웃음이 나와!",
      "같이 있으면 행복해!",
      "지금 완전 신났어!",
    ],
    hungry: [
      "슬슬 배가 고파지는걸...",
      "뭐라도 먹고 싶어...",
      "간식 타임 아직 멀었어?",
      "따뜻한 밥 냄새 나는 것 같아...",
    ],
    eating: [
      "오늘도 즐거운\n혼밥 시간...",
      "맛있는 거 먹으면 힘이 나!",
      "배부르면 기분이 좋아져!",
    ],
    talking: [
      "내 얘기 좀 들어볼래?",
      "나 오늘 할 말 많아!",
      "조잘조잘...",
      "지금 말 걸고 싶었어!",
    ],
  },
  tap: {
    basic: [
      "만지지 마",
      "과제가 너무 많다",
      "학교를 왜 다니는걸까?",
      "나 좀 쉴게",
    ],
    happy: [
      "헤헤, 불러줘서 좋아!",
      "지금 완전 기분 좋아!",
      "같이 있으니까 행복해!",
      "심장이 두근두근해!",
    ],
    hungry: [
      "배고파...",
      "뭐라도 먹고 싶어...",
      "밥 얘기만 해도 좋을 것 같아...",
    ],
    eating: ["맛있다~!", "냠냠~!", "우물우물...", "이거 진짜 맛있어!"],
    talking: [
      "응응, 듣고 있어!",
      "나한테 말 걸어준 거야?",
      "좋아, 같이 얘기하자!",
    ],
  },
};

const CHARACTER_STATE_TO_BOO_CHAT_CATEGORY: Record<
  CharacterState,
  BooChatCategory
> = {
  basic1: "basic",
  basic2: "basic",
  happy1: "happy",
  happy2: "happy",
  hungry: "hungry",
  eating: "eating",
  talking: "talking",
};

const isBooChatCategory = (
  value: CharacterState | BooChatCategory,
): value is BooChatCategory => value in BOO_CHAT_LIST_BY_MODE.auto;

export const getBooChatCategory = (state: CharacterState): BooChatCategory =>
  CHARACTER_STATE_TO_BOO_CHAT_CATEGORY[state];

const getRandomBooChatByMode = (
  stateOrCategory: CharacterState | BooChatCategory,
  mode: BooChatMode,
): string => {
  const category = isBooChatCategory(stateOrCategory)
    ? stateOrCategory
    : getBooChatCategory(stateOrCategory);
  const messages = BOO_CHAT_LIST_BY_MODE[mode][category];

  if (!messages.length) {
    return "";
  }

  const randomIndex = Math.floor(Math.random() * messages.length);

  return messages[randomIndex];
};

export const getRandomAutoBooChat = (
  stateOrCategory: CharacterState | BooChatCategory,
) => getRandomBooChatByMode(stateOrCategory, "auto");

export const getRandomTapBooChat = (
  stateOrCategory: CharacterState | BooChatCategory,
) => getRandomBooChatByMode(stateOrCategory, "tap");

export const getEvolutionBooChat = (grade: CharacterGrade) =>
  EVOLUTION_BOO_CHAT_BY_GRADE[grade];

export const getQuizCorrectBooChat = () => {
  const randomIndex = Math.floor(
    Math.random() * QUIZ_CORRECT_BOO_CHAT_MESSAGES.length,
  );

  return QUIZ_CORRECT_BOO_CHAT_MESSAGES[randomIndex];
};

export const getRandomBooChat = getRandomTapBooChat;
