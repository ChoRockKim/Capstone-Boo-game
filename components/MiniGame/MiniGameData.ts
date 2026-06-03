/**
 * @description  미니게임 장소/시작 화면 이미지, 라벨, 설명, 하트 더미 상태와 preload를 관리합니다.
 * @depends      assets/places/*, assets/miniGame/icons/*, assets/miniGame/book-catch/*, assets/miniGame/boo-catch/*, react-native, utils/preloadImageAssets.ts
 * @used-by      app/game/index.tsx, app/miniGame/index.tsx, components/MiniGame/MiniGameStartScreen.tsx
 * @side-effects preloadMiniGamePlaceImageAssets 호출 시 이미지 캐시 preload
 */
import {
  preloadImageAssets,
  type PreloadableImageAsset,
} from "@/utils/preloadImageAssets";
import type { ImageSourcePropType } from "react-native";

const LIBRARY_PLACE_IMAGE = require("@/assets/places/library.png");
const LAWN_PLAZA_PLACE_IMAGE = require("@/assets/places/lawn-plaza.png");
const MAIN_BUILDING_PLACE_IMAGE = require("@/assets/places/main-building.png");
const OBAMA_HALL_PLACE_IMAGE = require("@/assets/places/obama-hall.png");
const HUMANITIES_BUILDING_PLACE_IMAGE = require("@/assets/places/humanities-building.png");
const TEACHING_LEARNING_CENTER_PLACE_IMAGE = require("@/assets/places/teaching-learning-center.png");
const STADIUM_PLACE_IMAGE = require("@/assets/places/stadium.png");

const BOOK_CATCH_ICON_IMAGE = require("@/assets/miniGame/icons/book-catch.png");
const BOO_CATCH_ICON_IMAGE = require("@/assets/miniGame/icons/boo-catch.png");
const BASEBALL_THROW_ICON_IMAGE = require("@/assets/miniGame/icons/baseball-throw.png");
const BOOK_CATCH_RULE_BOOK_1_IMAGE = require("@/assets/miniGame/book-catch/book-1.png");
const BOOK_CATCH_RULE_BOOK_2_IMAGE = require("@/assets/miniGame/book-catch/book-2.png");
const BOOK_CATCH_RULE_BOOK_3_IMAGE = require("@/assets/miniGame/book-catch/book-3.png");
const BOOK_CATCH_RULE_COMIC_IMAGE = require("@/assets/miniGame/book-catch/comic.png");
const BOOK_CATCH_RULE_PHONE_IMAGE = require("@/assets/miniGame/book-catch/phone.png");
const BOOK_CATCH_RULE_GAME_MACHINE_IMAGE = require("@/assets/miniGame/book-catch/game-machine.png");
const BOOK_CATCH_LIBRARY_BACKGROUND_IMAGE = require("@/assets/miniGame/book-catch/library-background.png");
const BOO_CATCH_RULE_BASIC_IMAGE = require("@/assets/miniGame/boo-catch/boo-basic.png");
const BOO_CATCH_RULE_GOLD_IMAGE = require("@/assets/miniGame/boo-catch/boo-gold.png");
const BOO_CATCH_RULE_PENGUIN_IMAGE = require("@/assets/miniGame/boo-catch/boo-penguin.png");
const BOO_CATCH_RULE_PIGEON_IMAGE = require("@/assets/miniGame/boo-catch/boo-pigeon.png");

export type MiniGameId = "catchTheMajor" | "catchBoo" | "freeThrow";
export type MiniGameRoutePath =
  | "/miniGame/catchTheMajor"
  | "/miniGame/catchBoo"
  | "/miniGame/freeThrow";

export type MiniGameStartScreenConfig = {
  backgroundImage: ImageSourcePropType;
  iconImage: ImageSourcePropType;
  id: MiniGameId;
  placeId: "library" | "lawnPlaza" | "obamaHall";
  readyAlertMessage: string;
  routePath: MiniGameRoutePath;
  title: string;
};

export const MINI_GAME_START_SCREEN_REGISTRY: Record<
  MiniGameId,
  MiniGameStartScreenConfig
> = {
  catchTheMajor: {
    backgroundImage: LIBRARY_PLACE_IMAGE,
    iconImage: BOOK_CATCH_ICON_IMAGE,
    id: "catchTheMajor",
    placeId: "library",
    readyAlertMessage: "전공책 받기 게임은 곧 시작할 수 있어요.",
    routePath: "/miniGame/catchTheMajor",
    title: "전공책 받기",
  },
  catchBoo: {
    backgroundImage: LAWN_PLAZA_PLACE_IMAGE,
    iconImage: BOO_CATCH_ICON_IMAGE,
    id: "catchBoo",
    placeId: "lawnPlaza",
    readyAlertMessage: "부 잡기 게임은 곧 시작할 수 있어요.",
    routePath: "/miniGame/catchBoo",
    title: "부 잡기",
  },
  freeThrow: {
    backgroundImage: OBAMA_HALL_PLACE_IMAGE,
    iconImage: BASEBALL_THROW_ICON_IMAGE,
    id: "freeThrow",
    placeId: "obamaHall",
    readyAlertMessage: "자유투 넣기 게임은 곧 시작할 수 있어요.",
    routePath: "/miniGame/freeThrow",
    title: "자유투 넣기",
  },
};

export const MINI_GAME_PLACE_OPTIONS = [
  {
    description:
      "1978년에 중앙도서관으로 처음 지어졌으며, 2020년에 전면 리모델링을 거쳐 현재의 스마트도서관으로 재탄생했습니다. 개방형 스터디 라운지와 카페 같은 분위기를 제공하며 첨단 IT 설비가 갖춰져 있어 조별 과제나 노트북 작업, 개인 공부 등 다양한 형태의 학습에 활발히 쓰입니다.",
    hasMiniGame: true,
    id: "library",
    image: LIBRARY_PLACE_IMAGE,
    label: "도서관",
    miniGameId: "catchTheMajor",
    miniGameRoute: MINI_GAME_START_SCREEN_REGISTRY.catchTheMajor.routePath,
  },
  {
    description:
      "학생들의 휴식처이자 캠퍼스의 허브 역할을 하는 야외 공간으로, 평소에는 학생들이 삼삼오오 모여 대화를 나누거나 쉴 때 사용합니다. 날씨가 좋을 때는 야외에서 배달 음식을 먹기도 하며, 축제나 동아리 홍보 행사 등 교내 주요 야외 행사가 열리는 중심 무대이기도 합니다.",
    hasMiniGame: true,
    id: "lawnPlaza",
    image: LAWN_PLAZA_PLACE_IMAGE,
    label: "잔디광장",
    miniGameId: "catchBoo",
    miniGameRoute: MINI_GAME_START_SCREEN_REGISTRY.catchBoo.routePath,
  },
  {
    description:
      "대학 행정의 중심이자 중추적인 역할을 하는 건물로, 총장실, 기획처, 교무처 등 학교 운영에 필수적인 핵심 행정 부서들이 모여 있습니다. 교수님들의 연구실과 일부 강의실도 포함되어 있어 행정과 교육이 동시에 이루어집니다.",
    hasMiniGame: false,
    id: "mainBuilding",
    image: MAIN_BUILDING_PLACE_IMAGE,
    label: "본관",
  },
  {
    description:
      "지하 캠퍼스인 미네르바 콤플렉스 내에 위치해 있습니다. 2012년 3월 버락 오바마 전 미국 대통령이 한국외대를 방문해 강연한 것을 기념하여, 2013년에 오바마홀로 공식 명명되었습니다. 입학식, 졸업식, 명사 초청 특강, 대형 국제회의, 그리고 채용 박람회 등 학교의 굵직한 행사들이 모두 이곳에서 열립니다.",
    hasMiniGame: true,
    id: "obamaHall",
    image: OBAMA_HALL_PLACE_IMAGE,
    label: "오바마홀",
    miniGameId: "freeThrow",
    miniGameRoute: MINI_GAME_START_SCREEN_REGISTRY.freeThrow.routePath,
  },
  {
    description:
      "주로 인문계열 어문학, 철학, 사학 등 전공 수업과 교양 수업이 진행되는 교육 공간입니다. 수많은 강의실과 인문대학 학과 사무실들이 밀집해 있습니다. 1층에 외대의 학식을 먹을 수 있는 교내식당이 있습니다.",
    hasMiniGame: false,
    id: "humanitiesBuilding",
    image: HUMANITIES_BUILDING_PLACE_IMAGE,
    label: "인문과학관",
  },
  {
    description:
      "교수자의 강의 역량과 학생의 학습 역량을 지원하고, 어학 및 다매체 실습을 진행하는 공간입니다. 스마트 강의실과 어학 실습실이 주로 배치되어 있고, 외국어대학교라는 특성에 맞게 회화 수업이나 랩실 기반의 수업이 이곳에서 많이 이루어집니다.",
    hasMiniGame: false,
    id: "teachingLearningCenter",
    image: TEACHING_LEARNING_CENTER_PLACE_IMAGE,
    label: "교수학습개발원",
  },
  {
    description:
      "교내 체육대회인 해방제나 축제 시 메인 무대와 부스가 설치되는 공간입니다. 오랜 기간 흙먼지가 날리는 모래 운동장이었으나, 인조잔디가 깔린 이후로는 학생들이 축구장 등으로 훨씬 쾌적하게 이용하고 있습니다.",
    hasMiniGame: false,
    id: "stadium",
    image: STADIUM_PLACE_IMAGE,
    label: "운동장",
  },
] as const;

export const MINI_GAME_DEFAULT_PLACE_ID = "mainBuilding";
export const MINI_GAME_DEFAULT_PLACE_INDEX = Math.max(
  MINI_GAME_PLACE_OPTIONS.findIndex(
    (place) => place.id === MINI_GAME_DEFAULT_PLACE_ID,
  ),
  0,
);

export const MINI_GAME_HEART_RECOVERY_MS = 30 * 60 * 1000;

export type MiniGamePlayerStatus = {
  heartCount: number;
  heartRecoveryStartedAt: string | null;
  maxHeartCount: number;
};

export type MiniGameHeartStatus = {
  heartCount: number;
  isFull: boolean;
  maxHeartCount: number;
  nextHeartRecoveryRemainingMs: number;
};

const createMiniGameHeartRecoveryStartedAt = (minutesAgo: number) => {
  return new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
};

const DEFAULT_MINI_GAME_PLAYER_STATUS: MiniGamePlayerStatus = {
  heartCount: 5,
  heartRecoveryStartedAt: null,
  maxHeartCount: 5,
};

export const MINI_GAME_PLAYER_STATUS_DUMMY_DATA: Record<
  string,
  MiniGamePlayerStatus
> = {
  "202101108": {
    heartCount: 5,
    heartRecoveryStartedAt: createMiniGameHeartRecoveryStartedAt(4),
    maxHeartCount: 5,
  },
  "202100010": {
    heartCount: 4,
    heartRecoveryStartedAt: createMiniGameHeartRecoveryStartedAt(4),
    maxHeartCount: 5,
  },
  "202100020": {
    heartCount: 3,
    heartRecoveryStartedAt: createMiniGameHeartRecoveryStartedAt(17),
    maxHeartCount: 5,
  },
  "202100030": {
    heartCount: 5,
    heartRecoveryStartedAt: null,
    maxHeartCount: 5,
  },
};

export const getMiniGamePlayerStatus = (studentId: string) => {
  return (
    MINI_GAME_PLAYER_STATUS_DUMMY_DATA[studentId] ??
    DEFAULT_MINI_GAME_PLAYER_STATUS
  );
};

export const getMiniGameHeartStatus = (
  playerStatus: MiniGamePlayerStatus,
  nowMs = Date.now(),
  fallbackRecoveryStartedAtMs = nowMs,
): MiniGameHeartStatus => {
  const maxHeartCount = playerStatus.maxHeartCount;
  const baseHeartCount = Math.min(playerStatus.heartCount, maxHeartCount);

  if (baseHeartCount >= maxHeartCount) {
    return {
      heartCount: maxHeartCount,
      isFull: true,
      maxHeartCount,
      nextHeartRecoveryRemainingMs: 0,
    };
  }

  const recoveryStartedAtMs = playerStatus.heartRecoveryStartedAt
    ? new Date(playerStatus.heartRecoveryStartedAt).getTime()
    : fallbackRecoveryStartedAtMs;

  if (!Number.isFinite(recoveryStartedAtMs)) {
    return {
      heartCount: baseHeartCount,
      isFull: baseHeartCount >= maxHeartCount,
      maxHeartCount,
      nextHeartRecoveryRemainingMs: MINI_GAME_HEART_RECOVERY_MS,
    };
  }

  const elapsedMs = Math.max(0, nowMs - recoveryStartedAtMs);
  const recoveredHeartCount = Math.floor(
    elapsedMs / MINI_GAME_HEART_RECOVERY_MS,
  );
  const heartCount = Math.min(
    maxHeartCount,
    baseHeartCount + recoveredHeartCount,
  );
  const isFull = heartCount >= maxHeartCount;
  const nextHeartRecoveryRemainingMs = isFull
    ? 0
    : MINI_GAME_HEART_RECOVERY_MS - (elapsedMs % MINI_GAME_HEART_RECOVERY_MS);

  return {
    heartCount,
    isFull,
    maxHeartCount,
    nextHeartRecoveryRemainingMs,
  };
};

export const formatMiniGameHeartCountdown = (remainingMs: number) => {
  const clampedRemainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(clampedRemainingSeconds / 60);
  const seconds = clampedRemainingSeconds % 60;

  return (
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0")
  );
};

export const MINI_GAME_START_SCREEN_ICON_ASSETS = [
  BOOK_CATCH_ICON_IMAGE,
  BOO_CATCH_ICON_IMAGE,
  BASEBALL_THROW_ICON_IMAGE,
];

export const MINI_GAME_BOOK_CATCH_RULE_IMAGE_ASSETS = [
  BOOK_CATCH_RULE_BOOK_1_IMAGE,
  BOOK_CATCH_RULE_BOOK_2_IMAGE,
  BOOK_CATCH_RULE_BOOK_3_IMAGE,
  BOOK_CATCH_RULE_COMIC_IMAGE,
  BOOK_CATCH_RULE_PHONE_IMAGE,
  BOOK_CATCH_RULE_GAME_MACHINE_IMAGE,
];

export const MINI_GAME_BOOK_CATCH_PLAY_IMAGE_ASSETS = [
  ...MINI_GAME_BOOK_CATCH_RULE_IMAGE_ASSETS,
  BOOK_CATCH_LIBRARY_BACKGROUND_IMAGE,
];

export const MINI_GAME_BOO_CATCH_RULE_IMAGE_ASSETS = [
  BOO_CATCH_RULE_BASIC_IMAGE,
  BOO_CATCH_RULE_GOLD_IMAGE,
  BOO_CATCH_RULE_PENGUIN_IMAGE,
  BOO_CATCH_RULE_PIGEON_IMAGE,
];

export const MINI_GAME_PLACE_IMAGE_ASSETS = [
  ...MINI_GAME_PLACE_OPTIONS.map((place) => place.image),
  ...MINI_GAME_START_SCREEN_ICON_ASSETS,
  ...MINI_GAME_BOOK_CATCH_PLAY_IMAGE_ASSETS,
  ...MINI_GAME_BOO_CATCH_RULE_IMAGE_ASSETS,
] as PreloadableImageAsset[];

export const MINI_GAME_PLACE_CRITICAL_IMAGE_ASSETS = [
  MINI_GAME_PLACE_OPTIONS[MINI_GAME_DEFAULT_PLACE_INDEX].image,
] as PreloadableImageAsset[];

export const MINI_GAME_PLACE_DEFERRED_IMAGE_ASSETS = MINI_GAME_PLACE_IMAGE_ASSETS;

let hasPreloadedMiniGamePlaceImageAssets = false;
let miniGamePlaceImageAssetsPreloadPromise: Promise<void> | null = null;
let hasPreloadedMiniGamePlaceCriticalImageAssets = false;
let miniGamePlaceCriticalImageAssetsPreloadPromise: Promise<void> | null = null;
let hasPreloadedMiniGameBookCatchImageAssets = false;
let miniGameBookCatchImageAssetsPreloadPromise: Promise<void> | null = null;
let hasPreloadedMiniGameBooCatchRuleImageAssets = false;
let miniGameBooCatchRuleImageAssetsPreloadPromise: Promise<void> | null = null;

export const preloadMiniGamePlaceCriticalImageAssets = () => {
  if (hasPreloadedMiniGamePlaceCriticalImageAssets) {
    return Promise.resolve();
  }

  if (!miniGamePlaceCriticalImageAssetsPreloadPromise) {
    miniGamePlaceCriticalImageAssetsPreloadPromise = preloadImageAssets(
      MINI_GAME_PLACE_CRITICAL_IMAGE_ASSETS,
    )
      .catch(() => undefined)
      .then(() => {
        hasPreloadedMiniGamePlaceCriticalImageAssets = true;
      });
  }

  return miniGamePlaceCriticalImageAssetsPreloadPromise;
};

export const preloadMiniGameBookCatchImageAssets = () => {
  if (hasPreloadedMiniGameBookCatchImageAssets) {
    return Promise.resolve();
  }

  if (!miniGameBookCatchImageAssetsPreloadPromise) {
    miniGameBookCatchImageAssetsPreloadPromise = preloadImageAssets(
      MINI_GAME_BOOK_CATCH_PLAY_IMAGE_ASSETS,
    )
      .catch(() => undefined)
      .then(() => {
        hasPreloadedMiniGameBookCatchImageAssets = true;
      });
  }

  return miniGameBookCatchImageAssetsPreloadPromise;
};

export const preloadMiniGameBooCatchRuleImageAssets = () => {
  if (hasPreloadedMiniGameBooCatchRuleImageAssets) {
    return Promise.resolve();
  }

  if (!miniGameBooCatchRuleImageAssetsPreloadPromise) {
    miniGameBooCatchRuleImageAssetsPreloadPromise = preloadImageAssets(
      MINI_GAME_BOO_CATCH_RULE_IMAGE_ASSETS,
    )
      .catch(() => undefined)
      .then(() => {
        hasPreloadedMiniGameBooCatchRuleImageAssets = true;
      });
  }

  return miniGameBooCatchRuleImageAssetsPreloadPromise;
};

export const preloadMiniGamePlaceImageAssets = () => {
  if (hasPreloadedMiniGamePlaceImageAssets) {
    return Promise.resolve();
  }

  if (!miniGamePlaceImageAssetsPreloadPromise) {
    miniGamePlaceImageAssetsPreloadPromise = preloadImageAssets(
      MINI_GAME_PLACE_DEFERRED_IMAGE_ASSETS,
    )
      .catch(() => undefined)
      .then(() => {
        hasPreloadedMiniGamePlaceImageAssets = true;
        hasPreloadedMiniGamePlaceCriticalImageAssets = true;
        hasPreloadedMiniGameBookCatchImageAssets = true;
        hasPreloadedMiniGameBooCatchRuleImageAssets = true;
      });
  }

  return miniGamePlaceImageAssetsPreloadPromise;
};
