import { MealSectionId } from "@/components/MealPanel/MealMenuData";
import axios from "axios";

const TODAY_MEAL_API_URL = "https://hufs-clock-api.vercel.app/api/data";
const UNAVAILABLE_MEAL_KEYWORDS = [
  "운영 정보 없음",
  "운영정보없음",
  "미운영",
  "휴무",
  "운영안함",
  "없음",
] as const;
const WEEKEND_BOO_CHAT_MESSAGES = [
  "주말인데 오늘 뭐해?",
  "주말엔 맛있는 거 먹으러 가고 싶어!",
  "주말인데 과제 해야 돼",
];

export interface TodayMealSection {
  id: MealSectionId;
  title: string;
  menus: string[];
}

interface RawMealMenu {
  name?: string | null;
}

interface RawMealSection {
  mealType?: string | null;
  menus?: (RawMealMenu | string)[] | null;
  name?: string | null;
  title?: string | null;
  type?: string | null;
}

const MEAL_SECTION_LABELS: Record<MealSectionId, string> = {
  breakfast: "조식",
  lunch: "중식",
  dinner: "석식",
};

const normalizeMealSectionId = (value: string): MealSectionId | null => {
  const normalizedValue = value.toLowerCase().replace(/\s/g, "");

  if (
    normalizedValue.includes("조식") ||
    normalizedValue.includes("아침") ||
    normalizedValue.includes("breakfast")
  ) {
    return "breakfast";
  }

  if (
    normalizedValue.includes("중식") ||
    normalizedValue.includes("점심") ||
    normalizedValue.includes("lunch")
  ) {
    return "lunch";
  }

  if (
    normalizedValue.includes("석식") ||
    normalizedValue.includes("저녁") ||
    normalizedValue.includes("dinner")
  ) {
    return "dinner";
  }

  return null;
};

const normalizeMenuName = (menu: RawMealMenu | string): string | null => {
  const rawName = typeof menu === "string" ? menu : menu?.name;

  if (!rawName) {
    return null;
  }

  const normalizedName = rawName.replace(/\s+/g, " ").trim();

  return normalizedName || null;
};

const isUnavailableMealMenu = (menuName: string) => {
  const normalizedMenuName = menuName.replace(/\s/g, "");

  return UNAVAILABLE_MEAL_KEYWORDS.some((keyword) =>
    normalizedMenuName.includes(keyword),
  );
};

const isWeekend = (date: Date) => {
  const day = date.getDay();

  return day === 0 || day === 6;
};

const normalizeMealSection = (
  rawMealSection: RawMealSection,
): TodayMealSection | null => {
  const mealSectionSource =
    rawMealSection.type ??
    rawMealSection.mealType ??
    rawMealSection.title ??
    rawMealSection.name;

  if (!mealSectionSource) {
    return null;
  }

  const mealSectionId = normalizeMealSectionId(mealSectionSource);

  if (!mealSectionId) {
    return null;
  }

  const menus = Array.isArray(rawMealSection.menus)
    ? rawMealSection.menus
        .map(normalizeMenuName)
        .filter((menuName): menuName is string => !!menuName)
        .filter((menuName) => !isUnavailableMealMenu(menuName))
    : [];

  return {
    id: mealSectionId,
    title: MEAL_SECTION_LABELS[mealSectionId],
    menus,
  };
};

export const getTodayMeal = async (): Promise<TodayMealSection[]> => {
  const response = await axios.get(TODAY_MEAL_API_URL);
  const rawMealSections = Array.isArray(response.data?.meals)
    ? (response.data.meals as RawMealSection[])
    : [];
  const normalizedSections = rawMealSections
    .map(normalizeMealSection)
    .filter((section): section is TodayMealSection => !!section);

  return normalizedSections.reduce<TodayMealSection[]>((sections, section) => {
    if (sections.some((existingSection) => existingSection.id === section.id)) {
      return sections;
    }

    sections.push(section);
    return sections;
  }, []);
};

export const getTodayMealTalkMessage = (
  todayMealSections: TodayMealSection[],
): string | null => {
  const availableMealSections = todayMealSections.filter(
    (section) => section.menus.length > 0,
  );

  if (!availableMealSections.length) {
    return null;
  }

  const randomSection =
    availableMealSections[
      Math.floor(Math.random() * availableMealSections.length)
    ];
  const randomMenu = randomSection.menus.length
    ? randomSection.menus[
        Math.floor(Math.random() * randomSection.menus.length)
      ]
    : null;

  if (!randomMenu) {
    return `오늘 ${randomSection.title}은 뭐가 나올까?`;
  }

  return `오늘 ${randomSection.title}은 ${randomMenu}야 알고 있어?`;
};

export const getWeekendBooChatMessage = (date: Date = new Date()) => {
  if (!isWeekend(date)) {
    return null;
  }

  const randomWeekendIndex = Math.floor(
    Math.random() * WEEKEND_BOO_CHAT_MESSAGES.length,
  );

  return WEEKEND_BOO_CHAT_MESSAGES[randomWeekendIndex];
};
