/**
 * @description  학식 API 응답을 앱에서 쓰는 오늘 학식 데이터와 말풍선 문구로 정규화합니다.
 * @depends      components/MealPanel/MealMenuData.ts
 * @used-by      useHook/useTodayMeal.ts, app/game/index.tsx
 * @side-effects axios 네트워크 요청
 */
import { MealSectionId } from "@/components/MealPanel/MealMenuData";
import axios from "axios";

const TODAY_MEAL_API_URL = "https://hufs-clock-api.vercel.app/api/data";
const UNAVAILABLE_MEAL_KEYWORDS = [
  "운영 정보 없음",
  "운영정보없음",
  "미운영",
  "휴무",
  "공휴일",
  "대체휴일",
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

interface CrawledMealMenu {
  name: string;
  price: string;
}

interface CrawledMealSection {
  menus: CrawledMealMenu[];
  time: string;
}

interface CrawledMealApiResponse {
  meals?: unknown;
  notices?: unknown;
  schedule?: unknown;
  timestamp?: unknown;
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isCrawledMealMenu = (value: unknown): value is CrawledMealMenu =>
  isRecord(value) &&
  typeof value.name === "string" &&
  typeof value.price === "string";

const isCrawledMealSection = (value: unknown): value is CrawledMealSection =>
  isRecord(value) &&
  typeof value.time === "string" &&
  Array.isArray(value.menus) &&
  value.menus.every(isCrawledMealMenu);

const getCrawledMealSections = (
  responseData: CrawledMealApiResponse,
): CrawledMealSection[] => {
  if (!Array.isArray(responseData.meals)) {
    return [];
  }

  return responseData.meals.filter(isCrawledMealSection);
};

const normalizeMenuName = (menu: CrawledMealMenu): string | null => {
  const rawName = menu.name;
  const rawPrice = menu.price;

  if (!rawName || !rawPrice.trim()) {
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
  rawMealSection: CrawledMealSection,
): TodayMealSection | null => {
  const mealSectionSource = rawMealSection.time;

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

const MEAL_SECTION_LABEL_ORDER: MealSectionId[] = [
  "breakfast",
  "lunch",
  "dinner",
];

const getWeekdayMealIndex = (date: Date) => {
  const day = date.getDay();

  if (day === 0 || day === 6) {
    return null;
  }

  return day - 1;
};

export const getTodayMeal = async (
  date: Date = new Date(),
): Promise<TodayMealSection[]> => {
  const response = await axios.get<CrawledMealApiResponse>(TODAY_MEAL_API_URL);
  const rawMealSections = getCrawledMealSections(response.data);

  return getTodayMealFromRawSections(rawMealSections, date);
};

export const getTodayMealFromRawSections = (
  rawMealSections: CrawledMealSection[],
  date: Date = new Date(),
) => {
  const weekdayMealIndex = getWeekdayMealIndex(date);

  if (weekdayMealIndex === null) {
    return [];
  }

  const todayMealSections = rawMealSections
    .map((section) => ({
      ...section,
      menus: section.menus[weekdayMealIndex]
        ? [section.menus[weekdayMealIndex]]
        : [],
    }))
    .filter((section) => section.menus.length > 0);
  const normalizedSections = todayMealSections
    .map(normalizeMealSection)
    .filter((section): section is TodayMealSection => !!section);

  const sectionsById = normalizedSections.reduce<
    Partial<Record<MealSectionId, TodayMealSection>>
  >((sections, section) => {
    const existingSection = sections[section.id];

    if (existingSection) {
      section.menus.forEach((menuName) => {
        if (!existingSection.menus.includes(menuName)) {
          existingSection.menus.push(menuName);
        }
      });

      return sections;
    }

    sections[section.id] = {
      ...section,
      menus: [...section.menus],
    };
    return sections;
  }, {});

  return MEAL_SECTION_LABEL_ORDER.map((id) => sectionsById[id]).filter(
    (section): section is TodayMealSection => !!section,
  );
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
