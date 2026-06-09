/**
 * @description  캐릭터 학년/상태 타입과 상태별 이미지 registry를 정의합니다.
 * @depends      assets/characters/*
 * @used-by      stores/useGameStore.ts, utils/xpProgress.ts, app/game/index.tsx, components/Character/Character.tsx, components/EvolutionOverlay/EvolutionOverlay.tsx, components/Room/RoomMiniBoo.tsx, components/BooChat/BooChatList.ts
 * @side-effects 정적 이미지 require
 */
import type { AchievementSkinKey } from "@/constants/achievements";

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

export type GradeCharacterImages = Record<CharacterState, number>;

export type CharacterImages = {
  grades: Record<CharacterGrade, GradeCharacterImages>;
  graduate: number;
};

export type CharacterCostumeKey = "default" | AchievementSkinKey;

export type CharacterCostumeDefinition = {
  key: CharacterCostumeKey;
  label: string;
  skinKey?: AchievementSkinKey;
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

export const CHARACTER_COSTUMES = [
  {
    key: "default",
    label: "기본",
  },
  {
    key: "skin_truth",
    label: "진리",
    skinKey: "skin_truth",
  },
  {
    key: "skin_peace",
    label: "평화",
    skinKey: "skin_peace",
  },
  {
    key: "skin_creation",
    label: "창조",
    skinKey: "skin_creation",
  },
] as const satisfies readonly CharacterCostumeDefinition[];

export const isCharacterCostumeKey = (
  value: string | null | undefined,
): value is CharacterCostumeKey =>
  CHARACTER_COSTUMES.some((costume) => costume.key === value);

const CHARACTER_COSTUME_IMAGE_OVERRIDES: Partial<
  Record<CharacterCostumeKey, Partial<Record<CharacterGrade, GradeCharacterImages>>>
> = {
  skin_truth: {
    2: {
      basic1: require("@/assets/characters/second/sophomore_sky_basic1.png"),
      basic2: require("@/assets/characters/second/sophomore_sky_basic2.png"),
      happy1: require("@/assets/characters/second/sophomore_sky_pleasure1.png"),
      happy2: require("@/assets/characters/second/sophomore_sky_pleasure2.png"),
      hungry: require("@/assets/characters/second/sophomore_sky_hungry.png"),
      eating: require("@/assets/characters/second/sophomore_sky_eat.png"),
      talking: require("@/assets/characters/second/sophomore_sky_talk.png"),
    },
    3: {
      basic1: require("@/assets/characters/third/junior_sky_basic1.png"),
      basic2: require("@/assets/characters/third/junior_sky_basic2.png"),
      happy1: require("@/assets/characters/third/junior_sky_pleasure1.png"),
      happy2: require("@/assets/characters/third/junior_sky_pleasure2.png"),
      hungry: require("@/assets/characters/third/junior_sky_hungry.png"),
      eating: require("@/assets/characters/third/junior_sky_eat.png"),
      talking: require("@/assets/characters/third/junior_sky_talk.png"),
    },
    4: {
      basic1: require("@/assets/characters/fourth/senior_sky_basic1.png"),
      basic2: require("@/assets/characters/fourth/senior_sky_basic2.png"),
      happy1: require("@/assets/characters/fourth/senior_sky_pleasure1.png"),
      happy2: require("@/assets/characters/fourth/senior_sky_pleasure2.png"),
      hungry: require("@/assets/characters/fourth/senior_sky_hungry.png"),
      eating: require("@/assets/characters/fourth/senior_sky_eat.png"),
      talking: require("@/assets/characters/fourth/senior_sky_talk.png"),
    },
  },
  skin_peace: {
    2: {
      basic1: require("@/assets/characters/second/sophomore_cream_basic1.png"),
      basic2: require("@/assets/characters/second/sophomore_cream_basic2.png"),
      happy1: require("@/assets/characters/second/sophomore_cream_pleasure1.png"),
      happy2: require("@/assets/characters/second/sophomore_cream_pleasure2.png"),
      hungry: require("@/assets/characters/second/sophomore_cream_hungry.png"),
      eating: require("@/assets/characters/second/sophomore_cream_eat.png"),
      talking: require("@/assets/characters/second/sophomore_cream_talk.png"),
    },
    3: {
      basic1: require("@/assets/characters/third/junior_cream_basic1.png"),
      basic2: require("@/assets/characters/third/junior_cream_basic2.png"),
      happy1: require("@/assets/characters/third/junior_cream_pleasure1.png"),
      happy2: require("@/assets/characters/third/junior_cream_pleasure2.png"),
      hungry: require("@/assets/characters/third/junior_cream_hungry.png"),
      eating: require("@/assets/characters/third/junior_cream_eat.png"),
      talking: require("@/assets/characters/third/junior_cream_talk.png"),
    },
    4: {
      basic1: require("@/assets/characters/fourth/senior_cream_basic1.png"),
      basic2: require("@/assets/characters/fourth/senior_cream_basic2.png"),
      happy1: require("@/assets/characters/fourth/senior_cream_pleasure1.png"),
      happy2: require("@/assets/characters/fourth/senior_cream_pleasure2.png"),
      hungry: require("@/assets/characters/fourth/senior_cream_hungry.png"),
      eating: require("@/assets/characters/fourth/senior_cream_eat.png"),
      talking: require("@/assets/characters/fourth/senior_cream_talk.png"),
    },
  },
  skin_creation: {
    2: {
      basic1: require("@/assets/characters/second/sophomore_pink_basic1.png"),
      basic2: require("@/assets/characters/second/sophomore_pink_basic2.png"),
      happy1: require("@/assets/characters/second/sophomore_pink_pleasure1.png"),
      happy2: require("@/assets/characters/second/sophomore_pink_pleasure2.png"),
      hungry: require("@/assets/characters/second/sophomore_pink_hungry.png"),
      eating: require("@/assets/characters/second/sophomore_pink_eat.png"),
      talking: require("@/assets/characters/second/sophomore_pink_talk.png"),
    },
    3: {
      basic1: require("@/assets/characters/third/junior_pink_basic1.png"),
      basic2: require("@/assets/characters/third/junior_pink_basic2.png"),
      happy1: require("@/assets/characters/third/junior_pink_pleasure1.png"),
      happy2: require("@/assets/characters/third/junior_pink_pleasure2.png"),
      hungry: require("@/assets/characters/third/junior_pink_hungry.png"),
      eating: require("@/assets/characters/third/junior_pink_eat.png"),
      talking: require("@/assets/characters/third/junior_pink_talk.png"),
    },
    4: {
      basic1: require("@/assets/characters/fourth/senior_pink_basic1.png"),
      basic2: require("@/assets/characters/fourth/senior_pink_basic2.png"),
      happy1: require("@/assets/characters/fourth/senior_pink_pleasure1.png"),
      happy2: require("@/assets/characters/fourth/senior_pink_pleasure2.png"),
      hungry: require("@/assets/characters/fourth/senior_pink_hungry.png"),
      eating: require("@/assets/characters/fourth/senior_pink_eat.png"),
      talking: require("@/assets/characters/fourth/senior_pink_talk.png"),
    },
  },
};

export const getCharacterImage = (
  grade: CharacterGrade,
  state: CharacterState,
  costumeKey: CharacterCostumeKey = "default",
) =>
  CHARACTER_COSTUME_IMAGE_OVERRIDES[costumeKey]?.[grade]?.[state] ??
  CHARACTER_IMAGES.grades[grade][state];

export const getAllCharacterImageAssets = () => [
  ...Object.values(CHARACTER_IMAGES.grades).flatMap((gradeImages) =>
    Object.values(gradeImages),
  ),
  ...Object.values(CHARACTER_COSTUME_IMAGE_OVERRIDES).flatMap((gradeMap) =>
    Object.values(gradeMap ?? {}).flatMap((gradeImages) =>
      Object.values(gradeImages),
    ),
  ),
  CHARACTER_IMAGES.graduate,
];

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
