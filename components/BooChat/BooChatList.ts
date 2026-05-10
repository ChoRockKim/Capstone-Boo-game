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
  4: "내가 4학년이라고...?? 거짓말..!",
};

const QUIZ_CORRECT_BOO_CHAT_MESSAGES = [
  "오 나 찍었는데 맞혔네!?",
  "이번건 조금 어려웠어",
  "후후 나 좀 똑똑한 듯?",
  "우리 꽤 잘 맞는 것 같아!",
  "정답이다!\n기분 좋은데?",
  "이 정도면 A+ 가능?",
  "오... 나 성장하고 있어!",
  "다음 문제도 가보자!",
  "오늘 감이 좋다!",
  "지식이 쌓이는 소리 들려!",
];

const ROOM_BOO_CHAT_MESSAGES = [
  "내 방이다!",
  "여기 은근 아늑해",
  "가구 바꾸면\n기분도 바뀔까?",
  "오늘은 방에서\n쉬고 싶어",
  "책상 앞에 가면\n공부해야 할 것 같아...",
  "침대가 부른다...",
  "나만의 공간이 생겼어!",
  "방 냄새 좋다...",
  "여기 있으면 마음이 편해",
  "가구 배치가\n은근 중요하더라",
  "오늘은 이불 밖이 위험해",
  "책상은 멋진데\n공부는 조금 나중에...",
  "장롱 안엔 뭐가 있을까?",
  "내 방 꾸미기 재밌다!",
  "가끔은 조용한 게 좋아",
  "이 방 점점\n내 공간 같아지고 있어",
  "침대 쪽으로\n슬금슬금 가는 중...",
];

const BOO_CHAT_LIST_BY_MODE: Record<
  BooChatMode,
  Record<BooChatCategory, string[]>
> = {
  auto: {
    basic: [
      "과제가 너무 많다...",
      "학교를 왜 다니는걸까?",
      "종설 때문에 힘들다",
      "졸업 논문은 또 언제 쓰지....",
      "나 이번 학기 전액등록금이야",
      "나 19학번 화석이야",
      "출석만 해도\n칭찬받아야 해",
      "오늘 수업은\n몇 교시까지야?",
      "강의실이 너무 멀어...",
      "팀플은 왜 늘\n갑자기 찾아올까",
      "이번 학기는\n진짜 갓생 산다",
      "라고 어제도 말했어",
      "캠퍼스 걷다 보면\n괜히 기분 좋아져",
      "오늘은 뭔가\n느긋하게 가고 싶어",
      "학식 줄 짧으면 좋겠다",
      "과제 알림은\n잠깐 못 본 척...",
      "부지런한 부가 되고 싶어",
      "근데 누워있고 싶어",
    ],
    happy: [
      "기분이 좋아서 날아갈 것 같아!",
      "오늘은 왠지 웃음이 나와!",
      "같이 있으면 행복해!",
      "지금 완전 신났어!",
      "오늘은 좋은 일이\n생길 것 같아!",
      "나 지금 에너지 충전 완료!",
      "히히, 괜히 웃음 나와",
      "이 기분으로\n과제도 할 수 있을까?",
      "좋아!\n오늘도 잘해보자",
      "칭찬받으면 더 힘나!",
      "발걸음이 가벼워졌어",
      "오늘 컨디션 최고야!",
    ],
    hungry: [
      "슬슬 배가 고파지는걸...",
      "뭐라도 먹고 싶어...",
      "간식 타임 아직 멀었어?",
      "따뜻한 밥 냄새 나는 것 같아...",
      "배에서 꼬르륵 소리 났어",
      "학식 메뉴 확인했어?",
      "오늘은 든든한 게 땡겨",
      "밥 먹으면\n집중력도 오를 거야",
      "공복으로는\n강의 못 들어...",
      "나 지금 젓가락 준비 완료",
      "배고프면 조금 예민해져...",
      "혹시 간식 있어?",
    ],
    eating: [
      "오늘도 즐거운\n혼밥 시간...",
      "맛있는 거 먹으면 힘이 나!",
      "배부르면 기분이 좋아져!",
      "한 입 더 먹어도 되지?",
      "냠...\n이건 인정이야",
      "식사는 역시 중요해",
      "먹는 동안은\n세상이 평화로워",
      "이 맛이면 출석 가능",
      "밥 먹고 나면\n조금 강해진 기분이야",
      "잘 먹겠습니다!",
    ],
    talking: [
      "내 얘기 좀 들어볼래?",
      "나 오늘 할 말 많아!",
      "조잘조잘...",
      "지금 말 걸고 싶었어!",
      "오늘 있었던 일\n들어줄래?",
      "가끔은 그냥\n수다 떨고 싶어",
      "너는 오늘 어땠어?",
      "나랑 잠깐 얘기하자",
      "생각보다 말하는 거 좋아해",
      "쉿, 중요한 얘기야",
      "사실 별 얘긴 아닌데...",
    ],
  },
  tap: {
    basic: [
      "만지지 마",
      "과제가 너무 많다",
      "학교를 왜 다니는걸까?",
      "나 좀 쉴게",
      "어? 불렀어?",
      "지금 생각 중이었어",
      "놀랐잖아...",
      "손가락 출석 체크야?",
      "나 여기 있어",
      "잠깐 멍 때리고 있었어",
      "응?\n무슨 일이야?",
      "오늘은 살살 눌러줘",
    ],
    happy: [
      "헤헤, 불러줘서 좋아!",
      "지금 완전 기분 좋아!",
      "같이 있으니까 행복해!",
      "심장이 두근두근해!",
      "또 불러줘!",
      "나 지금 웃고 있어",
      "기분 좋은 터치 인정!",
      "오늘은 뭐든 할 수 있어!",
      "헤헤,\n관심받는 중",
      "나 좀 귀엽지?",
      "좋아 좋아!",
    ],
    hungry: [
      "배고파...",
      "뭐라도 먹고 싶어...",
      "밥 얘기만 해도 좋을 것 같아...",
      "밥 버튼 어디 있어...?",
      "나 지금 충전이 필요해",
      "터치보다 밥...",
      "식당 쪽으로 가자",
      "꼬르륵...",
      "배고프면 말수가 줄어...",
    ],
    eating: [
      "맛있다~!",
      "냠냠~!",
      "우물우물...",
      "이거 진짜 맛있어!",
      "한 입만 더!",
      "먹을 때 건드리면\n놀라!",
      "이 맛 기억해둘래",
      "든든해지는 중...",
    ],
    talking: [
      "응응, 듣고 있어!",
      "나한테 말 걸어준 거야?",
      "좋아, 같이 얘기하자!",
      "무슨 얘기 할까?",
      "나도 할 말 있어!",
      "잠깐만,\n말 정리 중...",
      "오늘의 부 뉴스!",
      "대화 신청 접수 완료",
      "귀 기울이는 중이야",
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

export const getRandomRoomBooChat = () => {
  const randomIndex = Math.floor(Math.random() * ROOM_BOO_CHAT_MESSAGES.length);

  return ROOM_BOO_CHAT_MESSAGES[randomIndex];
};

export const getRandomBooChat = getRandomTapBooChat;
