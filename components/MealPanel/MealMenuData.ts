/**
 * @description  학식 메뉴 데이터, 시간대, 주말/평일 분기, 카운트다운 계산 함수를 제공합니다.
 * @depends      assets/plates/*
 * @used-by      stores/useGameStore.ts, utils/getTodayMeal.ts, app/game/index.tsx, components/MealPanel/MealPanel.tsx, components/DeveloperPanel/DeveloperPanel.tsx
 * @side-effects 정적 이미지 require
 */
export type MealSectionId = "breakfast" | "lunch" | "dinner";
export type MealHistory = Partial<Record<MealSectionId, string>>;
export type MealDayMode = "auto" | "weekday" | "weekend";
const MEAL_SECTION_ORDER: MealSectionId[] = ["breakfast", "lunch", "dinner"];
const MEAL_SLOT_COUNT_PER_DAY = MEAL_SECTION_ORDER.length;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

export interface MealMenuItem {
  id: string;
  image: number;
  name: string;
  price: number;
  schoolFoodId?: number;
}

export interface MealSection {
  endMinutes: number;
  id: MealSectionId;
  menus: MealMenuItem[];
  pageLabel: string;
  startMinutes: number;
  timeLabel: string;
  title: string;
}

export interface MealAvailabilityStatus {
  activeMealSectionId: MealSectionId | null;
  canFeedNow: boolean;
  hasFedCurrentMeal: boolean;
  shouldShowCountdown: boolean;
  nextMeal: {
    id: MealSectionId;
    startsAt: Date;
    timeLabel: string;
    title: string;
  };
}

export const normalizeMealSectionId = (
  value?: string | null,
): MealSectionId | null => {
  if (!value) {
    return null;
  }

  const normalizedValue = value.toLowerCase().replace(/\s/g, "");

  if (
    normalizedValue.includes("breakfast") ||
    normalizedValue.includes("조식") ||
    normalizedValue.includes("아침")
  ) {
    return "breakfast";
  }

  if (
    normalizedValue.includes("lunch") ||
    normalizedValue.includes("중식") ||
    normalizedValue.includes("점심")
  ) {
    return "lunch";
  }

  if (
    normalizedValue.includes("dinner") ||
    normalizedValue.includes("석식") ||
    normalizedValue.includes("저녁")
  ) {
    return "dinner";
  }

  return null;
};

const getResolvedMealDayMode = (
  date: Date = new Date(),
  mode: MealDayMode = "auto",
) => {
  if (mode !== "auto") {
    return mode;
  }

  const day = date.getDay();

  return day === 0 || day === 6 ? "weekend" : "weekday";
};

const BREAKFAST_MENUS: MealMenuItem[] = [
  {
    id: "meal-sangbulbi",
    image: require("@/assets/plates/sangbulbi.png"),
    name: "상불비",
    price: 4,
  },
  {
    id: "meal-ramen",
    image: require("@/assets/plates/ramen.png"),
    name: "라멘",
    price: 4,
  },
  {
    id: "meal-jeyuk",
    image: require("@/assets/plates/jeyuk.png"),
    name: "제육덮밥",
    price: 4,
  },
  {
    id: "meal-tuna",
    image: require("@/assets/plates/tuna.png"),
    name: "참치\n회덮밥",
    price: 4,
  },
  {
    id: "meal-curry",
    image: require("@/assets/plates/curry.png"),
    name: "카레",
    price: 4,
  },
  {
    id: "meal-galbi",
    image: require("@/assets/plates/galbi.png"),
    name: "갈비탕",
    price: 4,
  },
  {
    id: "meal-banchicken",
    image: require("@/assets/plates/banchicken.png"),
    name: "반계탕",
    price: 4,
  },
  {
    id: "meal-jjajang",
    image: require("@/assets/plates/jjajang.png"),
    name: "짜장면",
    price: 4,
  },
  {
    id: "meal-pork-cutlet",
    image: require("@/assets/plates/pork-cutlet.png"),
    name: "치즈\n돈가스",
    price: 4,
  },
  {
    id: "meal-toast",
    image: require("@/assets/plates/toast.png"),
    name: "토스트",
    price: 4,
  },
];

const WEEKEND_MENUS: MealMenuItem[] = [
  {
    id: "weekend-tteok-bokki",
    image: require("@/assets/plates/tteok-bokki.png"),
    name: "이상한떡볶이",
    price: 4,
  },
  {
    id: "weekend-bossam",
    image: require("@/assets/plates/bossam.png"),
    name: "할머니보쌈",
    price: 4,
  },
  {
    id: "weekend-kfc",
    image: require("@/assets/plates/kfc.png"),
    name: "KFC",
    price: 4,
  },
];

export const MEAL_SECTIONS: MealSection[] = [
  {
    id: "breakfast",
    menus: BREAKFAST_MENUS,
    pageLabel: "1 / 3",
    startMinutes: 8 * 60,
    endMinutes: 10 * 60,
    timeLabel: "08:00 ~ 10:00",
    title: "조식",
  },
  {
    id: "lunch",
    menus: BREAKFAST_MENUS,
    pageLabel: "2 / 3",
    startMinutes: 11 * 60,
    endMinutes: 14 * 60 + 30,
    timeLabel: "11:00 ~ 14:30",
    title: "중식",
  },
  {
    id: "dinner",
    menus: BREAKFAST_MENUS,
    pageLabel: "3 / 3",
    startMinutes: 16 * 60 + 40,
    endMinutes: 18 * 60 + 40,
    timeLabel: "16:40 ~ 18:40",
    title: "석식",
  },
];

export const DEFAULT_MEAL_MENU_ID = BREAKFAST_MENUS[0].id;

export const getLocalDateKey = (date: Date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

export const getActiveMealSectionId = (
  date: Date = new Date(),
): MealSectionId | null => {
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const activeSection = MEAL_SECTIONS.find(
    (section) =>
      currentMinutes >= section.startMinutes &&
      currentMinutes <= section.endMinutes,
  );

  return activeSection?.id ?? null;
};

export const getMealSectionById = (
  mealSectionId: MealSectionId,
  date: Date = new Date(),
  mode: MealDayMode = "auto",
) => {
  const baseSection =
    MEAL_SECTIONS.find((section) => section.id === mealSectionId) ??
    MEAL_SECTIONS[0];

  if (getResolvedMealDayMode(date, mode) !== "weekend") {
    return baseSection;
  }

  return {
    ...baseSection,
    menus: WEEKEND_MENUS,
  };
};

export const getMealHeroText = (
  date: Date = new Date(),
  mode: MealDayMode = "auto",
) => {
  if (getResolvedMealDayMode(date, mode) === "weekend") {
    return "오늘은 주말!\n외대 근처 맛집을 탐방해요!";
  }

  return "부에게 학식을 먹여주세요!";
};

const buildDateFromMinutes = (
  date: Date,
  totalMinutes: number,
  dayOffset = 0,
) => {
  const nextDate = new Date(date);

  nextDate.setHours(0, 0, 0, 0);
  nextDate.setDate(nextDate.getDate() + dayOffset);
  nextDate.setMinutes(totalMinutes);

  return nextDate;
};

export const getNextMeal = (date: Date = new Date()) => {
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const nextSection = MEAL_SECTIONS.find(
    (section) => currentMinutes < section.startMinutes,
  );

  if (nextSection) {
    return {
      id: nextSection.id,
      startsAt: buildDateFromMinutes(date, nextSection.startMinutes),
      timeLabel: nextSection.timeLabel,
      title: nextSection.title,
    };
  }

  return {
    id: MEAL_SECTIONS[0].id,
    startsAt: buildDateFromMinutes(date, MEAL_SECTIONS[0].startMinutes, 1),
    timeLabel: MEAL_SECTIONS[0].timeLabel,
    title: MEAL_SECTIONS[0].title,
  };
};

export const getLatestCompletedMealSectionId = (
  date: Date = new Date(),
): MealSectionId | null => {
  const currentMinutes = date.getHours() * 60 + date.getMinutes();

  if (currentMinutes > MEAL_SECTIONS[2].endMinutes) {
    return MEAL_SECTIONS[2].id;
  }

  if (currentMinutes > MEAL_SECTIONS[1].endMinutes) {
    return MEAL_SECTIONS[1].id;
  }

  if (currentMinutes > MEAL_SECTIONS[0].endMinutes) {
    return MEAL_SECTIONS[0].id;
  }

  return null;
};

export const getMealAvailabilityStatus = (
  date: Date = new Date(),
  lastFedMeals: MealHistory = {},
  mealRestrictionEnabled = true,
): MealAvailabilityStatus => {
  const activeMealSectionId = getActiveMealSectionId(date);
  const todayKey = getLocalDateKey(date);
  const hasFedCurrentMeal = Boolean(
    activeMealSectionId && lastFedMeals[activeMealSectionId] === todayKey,
  );

  return {
    activeMealSectionId,
    canFeedNow:
      !mealRestrictionEnabled ||
      (Boolean(activeMealSectionId) && !hasFedCurrentMeal),
    hasFedCurrentMeal,
    shouldShowCountdown:
      mealRestrictionEnabled &&
      (!activeMealSectionId || hasFedCurrentMeal),
    nextMeal: getNextMeal(date),
  };
};

export const formatMealCountdown = (
  targetDate: Date,
  now: Date = new Date(),
) => {
  const remainingMs = Math.max(targetDate.getTime() - now.getTime(), 0);
  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
};

const getMealSectionOrderIndex = (mealSectionId: MealSectionId) =>
  MEAL_SECTION_ORDER.indexOf(mealSectionId);

const getLocalDayIndex = (date: Date = new Date()) =>
  Math.floor(
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() /
      DAY_IN_MS,
  );

export const getMealSlotIndex = (
  date: Date = new Date(),
  mealSectionId: MealSectionId,
) =>
  getLocalDayIndex(date) * MEAL_SLOT_COUNT_PER_DAY +
  getMealSectionOrderIndex(mealSectionId);

export const getLatestCompletedMealSlotIndex = (date: Date = new Date()) => {
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const daySlotBaseIndex = getLocalDayIndex(date) * MEAL_SLOT_COUNT_PER_DAY;

  if (currentMinutes > MEAL_SECTIONS[2].endMinutes) {
    return daySlotBaseIndex + 2;
  }

  if (currentMinutes > MEAL_SECTIONS[1].endMinutes) {
    return daySlotBaseIndex + 1;
  }

  if (currentMinutes > MEAL_SECTIONS[0].endMinutes) {
    return daySlotBaseIndex;
  }

  return daySlotBaseIndex - 1;
};

export const PLATE_IMAGE_ASSETS = Array.from(
  new Set([
    ...MEAL_SECTIONS.flatMap((section) =>
      section.menus.map((menu) => menu.image),
    ),
    ...WEEKEND_MENUS.map((menu) => menu.image),
  ]),
);

export const isWeekendDate = (
  date: Date = new Date(),
  mode: MealDayMode = "auto",
) => getResolvedMealDayMode(date, mode) === "weekend";
