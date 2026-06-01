/**
 * @description  부의 자동/터치/방/퀴즈/진화 말풍선 문구와 랜덤 선택 함수를 관리합니다.
 * @depends      constants/character.ts
 * @used-by      app/game/index.tsx, components/Room/RoomMiniBoo.tsx
 * @side-effects Math.random 기반 문구 선택
 */
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
  "정답이야!\n우리 제법 잘 맞는다",
  "히히,\n나 조금 똑똑해졌어",
  "오답인 줄 알고\n살짝 떨렸어",
  "맞혔다!\n기분 좋아졌어",
  "다음 문제도\n같이 풀어보자",
  "오늘 감이 좋은데?",
  "부 지식이\n한 칸 자랐어",
  "이 정도면\n칭찬 받아도 돼?",
  "방금 좀 멋졌지?",
  "좋아!\n이 흐름 그대로 가자",
  "헷갈렸는데\n맞아서 다행이야",
  "너랑 풀면\n더 잘 되는 것 같아",
];

const ROOM_BOO_CHAT_MESSAGES = [
  "내 방이다!\n괜히 뿌듯해",
  "여기 있으면\n마음이 포근해져",
  "가구를 바꾸면\n기분도 바뀔까?",
  "오늘은 방에서\n조용히 쉬고 싶어",
  "책상 앞에 앉으면\n괜히 의젓해져",
  "침대가 나를\n살짝 부르는 것 같아",
  "나만의 공간이\n생긴 기분이야",
  "방 분위기\n점점 좋아지고 있어",
  "여기 있으면\n괜히 안심돼",
  "가구 배치가\n생각보다 중요하네",
  "오늘은 이불 속에서\n충전하고 싶어",
  "공부는 조금 있다가...\n진짜로!",
  "장롱 안에\n비밀 간식 없을까?",
  "내 방 꾸미기\n은근 재밌다",
  "가끔은 조용한 시간이 좋아",
  "이 방 점점\n내 공간 같아지고 있어",
  "침대 쪽으로\n슬쩍 가도 될까?",
  "여기서 낮잠 자면\n기분 좋겠다",
  "방이 예쁘면\n하루가 조금 좋아져",
  "오늘은 여기서\n느긋하게 있고 싶어",
];

const BOO_CHAT_LIST_BY_MODE: Record<
  BooChatMode,
  Record<BooChatCategory, string[]>
> = {
  auto: {
    basic: [
      "오늘은 왠지\n천천히 걷고 싶어",
      "캠퍼스 바람이\n기분 좋다",
      "부는 지금\n생각 정리 중이야",
      "오늘 하루도\n같이 보내자",
      "강의실까지\n같이 가줄래?",
      "잠깐 쉬었다 가도 돼?",
      "가방이 조금 무거운 날이야",
      "오늘은 작은 일에도\n기분 좋아지고 싶어",
      "하늘이 맑으면\n괜히 힘이 나",
      "나 오늘\n조금 차분한 부야",
      "쉬는 시간은\n왜 이렇게 짧을까?",
      "부지런한 부가\n되어보는 중이야",
      "물 한 모금 마시면\n다시 힘날 것 같아",
      "오늘도 출석한 우리,\n제법 멋져",
      "조금 졸리지만\n괜찮아",
      "따뜻한 햇빛이\n좋은 날이야",
      "지금은 멍하니\n충전하는 중",
      "너랑 있으면\n하루가 덜 심심해",
      "작은 칭찬도\n부한텐 큰 힘이야",
      "오늘도 무사히\n잘 지나가면 좋겠다",
    ],
    happy: [
      "히히,\n오늘 기분 좋아",
      "발걸음이\n가벼워진 것 같아",
      "같이 있으니까\n괜히 든든해",
      "지금 부 에너지\n가득 찼어",
      "오늘 좋은 일이\n생길 것 같아",
      "나 지금\n살짝 신났어",
      "웃음이 자꾸\n나오려고 해",
      "칭찬받으면\n더 힘이 나",
      "좋아!\n오늘도 잘해보자",
      "기분 좋은 날엔\n뭐든 할 수 있어",
      "부 마음이\n반짝거리는 중",
      "오늘 컨디션\n꽤 괜찮은데?",
      "너도 기분 좋으면\n좋겠다",
      "이대로 산책하면\n딱 좋겠다",
      "작은 행복을\n발견했어",
    ],
    hungry: [
      "슬슬 배가\n꼬르륵해",
      "뭐라도 먹으면\n힘이 날 것 같아",
      "따뜻한 밥 냄새가\n그리워졌어",
      "간식 시간은\n아직 멀었어?",
      "오늘은 든든한 게\n먹고 싶어",
      "밥 먹으면\n집중도 잘 될 거야",
      "공복 부는\n조금 약해져",
      "젓가락 들 준비는\n끝났어",
      "혹시 간식\n조금 있어?",
      "배고프니까\n말이 작아졌어",
      "따뜻한 국물\n생각나는 날이야",
      "밥 먹으러 가면\n발걸음 빨라질지도",
      "먹을 걸 생각하니까\n눈이 반짝했어",
    ],
    eating: [
      "냠냠,\n맛있게 먹는 중",
      "맛있는 거 먹으면\n힘이 나",
      "배가 차니까\n마음도 편해져",
      "한 입 더 먹어도 돼?",
      "냠...\n이건 마음에 들어",
      "식사는 역시\n소중한 시간이야",
      "먹는 동안은\n세상이 평화로워",
      "밥 먹고 나면\n조금 강해진 기분이야",
      "잘 먹겠습니다!",
      "따뜻해서\n기분이 풀렸어",
      "부 충전 중이야",
      "마지막 한 입까지\n소중하게 먹을래",
    ],
    talking: [
      "내 얘기\n조금 들어줄래?",
      "나 오늘\n할 말이 생겼어",
      "조잘조잘...\n부 수다 시작",
      "지금 말 걸고\n싶었어",
      "오늘 있었던 일\n들어줄래?",
      "가끔은 그냥\n수다 떨고 싶어",
      "너는 오늘 어땠어?",
      "나랑 잠깐\n얘기하자",
      "생각보다\n말하는 거 좋아해",
      "쉿,\n작은 비밀 얘기야",
      "사실 별 얘긴 아닌데\n말하고 싶었어",
      "너한테 먼저\n말해주고 싶었어",
      "부의 오늘 생각을\n정리해볼게",
    ],
  },
  tap: {
    basic: [
      "앗,\n불렀어?",
      "나 여기 있어",
      "지금 생각 중이었어",
      "살짝 놀랐잖아",
      "손가락으로\n인사한 거야?",
      "잠깐 멍 때리던 중이야",
      "응?\n무슨 일이야?",
      "오늘은 살살\n불러줘",
      "부 확인 완료!",
      "나랑 놀아줄 거야?",
      "톡톡,\n느낌 왔어",
      "기다리고 있었어",
      "잠깐 쉬는 중이었어",
    ],
    happy: [
      "헤헤,\n불러줘서 좋아",
      "지금 기분\n엄청 좋아",
      "같이 있으니까\n행복해",
      "마음이 두근두근해",
      "또 불러줘도 돼",
      "나 지금 웃고 있어",
      "기분 좋은 인사였어",
      "오늘은 뭐든\n할 수 있을 것 같아",
      "헤헤,\n관심받는 중",
      "나 조금\n귀엽지?",
      "좋아 좋아!",
      "부 기분이\n폭신해졌어",
      "너 손길은\n금방 알아채",
    ],
    hungry: [
      "배고파...",
      "뭐라도 먹고 싶어",
      "밥 얘기만 해도\n조금 설레",
      "밥 버튼은\n어디 있을까?",
      "나 지금\n충전이 필요해",
      "톡톡보다\n밥이 먼저일지도",
      "식당 쪽으로\n가볼까?",
      "꼬르륵...",
      "배고프면\n조금 조용해져",
      "따뜻한 밥이면\n금방 힘날 거야",
    ],
    eating: [
      "맛있다!",
      "냠냠!",
      "우물우물...",
      "이거 진짜\n마음에 들어",
      "한 입만 더!",
      "먹는 중이라\n조금 바빠",
      "이 맛\n기억해둘래",
      "든든해지는 중이야",
      "천천히 꼭꼭\n씹는 중",
      "먹고 나면\n기운 날 것 같아",
    ],
    talking: [
      "응응,\n듣고 있어",
      "나한테\n말 걸어준 거야?",
      "좋아,\n같이 얘기하자",
      "무슨 얘기 할까?",
      "나도 할 말 있어",
      "잠깐만,\n말 정리 중이야",
      "오늘의 부 소식!",
      "대화 신청\n접수 완료",
      "귀 기울이는 중이야",
      "네 얘기\n더 듣고 싶어",
      "조용히 듣고 있을게",
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
