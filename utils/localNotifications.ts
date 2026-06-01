/**
 * @description  Expo 로컬 알림 권한, 채널 초기화, 게임 이벤트별 예약을 관리합니다.
 * @depends      expo-notifications, react-native, components/MealPanel/MealMenuData.ts, utils/getTodayMeal.ts
 * @used-by      app/_layout.tsx, app/game/index.tsx, components/Options/Options.tsx, components/QuizPanel/QuizPanel.tsx
 * @side-effects OS 알림 권한 요청, Android notification channel 생성, 로컬 알림 예약/취소
 */
import {
  getLocalDateKey,
  MEAL_SECTIONS,
  type MealSectionId,
} from "@/components/MealPanel/MealMenuData";
import type { TodayMealSection } from "@/utils/getTodayMeal";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const BOO_NOTIFICATION_CHANNEL_ID = "boo-local-reminders";
const QUIZ_COOLDOWN_NOTIFICATION_ID = "boo-quiz-cooldown-ready";
const MEAL_NOTIFICATION_IDENTIFIER_PREFIX = "boo-meal";

let hasInitializedLocalNotifications = false;

const getMealNotificationIdentifier = (
  dateKey: string,
  mealSectionId: MealSectionId,
) => `${MEAL_NOTIFICATION_IDENTIFIER_PREFIX}-${dateKey}-${mealSectionId}`;

const getMealStartDate = (date: Date, startMinutes: number) => {
  const startDate = new Date(date);

  startDate.setHours(0, 0, 0, 0);
  startDate.setMinutes(startMinutes);

  return startDate;
};

const getMealNotificationBody = (mealSection: TodayMealSection) => {
  const previewMenus = mealSection.menus.slice(0, 3);
  const extraMenuCount = Math.max(
    mealSection.menus.length - previewMenus.length,
    0,
  );

  if (!previewMenus.length) {
    return null;
  }

  const menuSummary =
    extraMenuCount > 0
      ? `${previewMenus.join(", ")} 외 ${extraMenuCount}개`
      : previewMenus.join(", ");

  return `오늘의 ${mealSection.title}은 ${menuSummary}예요.`;
};

export const initializeLocalNotifications = async () => {
  if (hasInitializedLocalNotifications) {
    return;
  }

  hasInitializedLocalNotifications = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(
      BOO_NOTIFICATION_CHANNEL_ID,
      {
        description: "부 키우기 로컬 알림",
        importance: Notifications.AndroidImportance.DEFAULT,
        name: "부 알림",
      },
    );
  }
};

export const requestLocalNotificationPermission = async () => {
  await initializeLocalNotifications();

  const currentPermission = await Notifications.getPermissionsAsync();

  if (currentPermission.granted) {
    return true;
  }

  if (!currentPermission.canAskAgain) {
    return false;
  }

  const requestedPermission = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: true,
    },
  });

  return requestedPermission.granted;
};

export const cancelQuizCooldownNotification = async () => {
  await Notifications.cancelScheduledNotificationAsync(
    QUIZ_COOLDOWN_NOTIFICATION_ID,
  ).catch(() => undefined);
};

export const cancelScheduledMealNotifications = async () => {
  const scheduledNotifications =
    await Notifications.getAllScheduledNotificationsAsync().catch(() => []);

  await Promise.all(
    scheduledNotifications
      .filter((notification) =>
        notification.identifier.startsWith(MEAL_NOTIFICATION_IDENTIFIER_PREFIX),
      )
      .map((notification) =>
        Notifications.cancelScheduledNotificationAsync(
          notification.identifier,
        ).catch(() => undefined),
      ),
  );
};

export const cancelAllBooLocalNotifications = async () => {
  await cancelQuizCooldownNotification();
  await cancelScheduledMealNotifications();
};

export const scheduleTodayMealNotifications = async (
  todayMealSections: TodayMealSection[],
  options?: {
    enabled?: boolean;
    now?: Date;
  },
) => {
  await initializeLocalNotifications();
  await cancelScheduledMealNotifications();

  if (!options?.enabled) {
    return;
  }

  const now = options.now ?? new Date();
  const dateKey = getLocalDateKey(now);

  await Promise.all(
    MEAL_SECTIONS.map(async (mealSection) => {
      const todayMealSection = todayMealSections.find(
        (section) => section.id === mealSection.id,
      );
      const body = todayMealSection
        ? getMealNotificationBody(todayMealSection)
        : null;
      const triggerDate = getMealStartDate(now, mealSection.startMinutes);

      if (
        !todayMealSection ||
        !body ||
        triggerDate.getTime() <= now.getTime()
      ) {
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          body,
          data: {
            mealSectionId: mealSection.id,
            type: "todayMeal",
          },
          title: `오늘의 ${mealSection.title}`,
        },
        identifier: getMealNotificationIdentifier(dateKey, mealSection.id),
        trigger: {
          channelId: BOO_NOTIFICATION_CHANNEL_ID,
          date: triggerDate,
          type: Notifications.SchedulableTriggerInputTypes.DATE,
        },
      }).catch(() => undefined);
    }),
  );
};

export const scheduleQuizCooldownNotification = async (
  availableAt: Date | null,
  options?: {
    enabled?: boolean;
  },
) => {
  await initializeLocalNotifications();
  await cancelQuizCooldownNotification();

  if (!options?.enabled || !availableAt) {
    return;
  }

  if (availableAt.getTime() <= Date.now()) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      body: "새 문제를 풀고 부를 성장시켜봐요.",
      data: {
        type: "quizCooldown",
      },
      title: "퀴즈를 다시 풀 수 있어요!",
    },
    identifier: QUIZ_COOLDOWN_NOTIFICATION_ID,
    trigger: {
      channelId: BOO_NOTIFICATION_CHANNEL_ID,
      date: availableAt,
      type: Notifications.SchedulableTriggerInputTypes.DATE,
    },
  }).catch(() => undefined);
};
