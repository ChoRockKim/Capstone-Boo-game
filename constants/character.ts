export type CharacterGrade = 1 | 2 | 3 | 4;

export type CharacterState =
  | "basic1"
  | "basic2"
  | "happy1"
  | "happy2"
  | "hungry"
  | "eating"
  | "talking";

export type CharacterLifeStage = CharacterGrade | "graduate";

export type GradeCharacterImages = Record<CharacterState, string>;

export type CharacterImages = {
  grades: Record<CharacterGrade, GradeCharacterImages>;
  graduate: string;
};

export const CHARACTER_STATE_LABELS: Record<CharacterState, string> = {
  basic1: "기본1",
  basic2: "기본2",
  happy1: "기쁨1",
  happy2: "기쁨2",
  hungry: "배고픔",
  eating: "먹음",
  talking: "메시지",
};

export const CHARACTER_IMAGES: CharacterImages = {
  grades: {
    1: {
      basic1: require("@/assets/characters/first/freshman_basic1.png"),
      basic2: require("@/assets/characters/first/freshman_basic2.png"),
      happy1: require("@/assets/characters/first/freshman_pleasure1.png"),
      happy2: require("@/assets/characters/first/freshman_pleasure2.png"),
      hungry: require("@/assets/characters/first/freshman_hungry.png"),
      eating: require("@/assets/characters/first/freshman_eat.png"),
      talking: require("@/assets/characters/first/freshman_talk.png"),
    },
    2: {
      basic1: require("@/assets/characters/second/sophomore_basic1.png"),
      basic2: require("@/assets/characters/second/sophomore_basic2.png"),
      happy1: require("@/assets/characters/second/sophomore_pleasure1.png"),
      happy2: require("@/assets/characters/second/sophomore_pleasure2.png"),
      hungry: require("@/assets/characters/second/sophomore_hungry.png"),
      eating: require("@/assets/characters/second/sophomore_eat.png"),
      talking: require("@/assets/characters/second/sophomore_talk.png"),
    },
    3: {
      basic1: require("@/assets/characters/third/junior_basic1.png"),
      basic2: require("@/assets/characters/third/junior_basic2.png"),
      happy1: require("@/assets/characters/third/junior_pleasure1.png"),
      happy2: require("@/assets/characters/third/junior_pleasure2.png"),
      hungry: require("@/assets/characters/third/junior_hungry.png"),
      eating: require("@/assets/characters/third/junior_eat.png"),
      talking: require("@/assets/characters/third/junior_talk.png"),
    },
    4: {
      basic1: require("@/assets/characters/fourth/senior_basic1.png"),
      basic2: require("@/assets/characters/fourth/senior_basic2.png"),
      happy1: require("@/assets/characters/fourth/senior_pleasure1.png"),
      happy2: require("@/assets/characters/fourth/senior_pleasure2.png"),
      hungry: require("@/assets/characters/fourth/senior_hungry.png"),
      eating: require("@/assets/characters/fourth/senior_eat.png"),
      talking: require("@/assets/characters/fourth/senior_talk.png"),
    },
  },
  graduate: require("@/assets/characters/graduate.png"),
};

export const getNextCharacterState = (
  state: CharacterState,
): CharacterState => {
  switch (state) {
    case "basic1":
      return "basic2";
    case "basic2":
      return "basic1";
    case "happy1":
      return "happy2";
    case "happy2":
      return "happy1";
    default:
      return state;
  }
};
