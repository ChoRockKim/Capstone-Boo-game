/**
 * @description  학식 메뉴 선택, 식사 가능 여부, 먹이기 액션과 관련 UI를 렌더링합니다.
 * @depends      stores/useGameStore.ts, utils/soundEffects.ts, components/MainButton/MainButton.tsx, components/MealPanel/MealMenuData.ts, components/MealPanel/MealMenuButton.tsx
 * @used-by      app/game/index.tsx
 * @side-effects feedBoo Zustand 액션 호출, eating SFX 재생, clock interval 관리
 */
import CrossIcon from "@/assets/icons/cross.svg";
import MainButton from "@/components/MainButton/MainButton";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { useGameStore } from "@/stores/useGameStore";
import {
  feedSchoolFood,
  getSchoolFood,
  getSchoolFoodFeedStatus,
  getServerApiErrorMessage,
  listSchoolFoods,
  listTodaySchoolFoods,
  type SchoolFood,
} from "@/utils/serverApi";
import { playSoundEffect } from "@/utils/soundEffects";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import MealMenuButton from "./MealMenuButton";
import {
  DEFAULT_MEAL_MENU_ID,
  getActiveMealSectionId,
  getLocalDateKey,
  getMealHeroText,
  getMealSectionById,
  isWeekendDate,
  MEAL_SECTIONS,
  MealMenuItem,
  normalizeMealSectionId,
} from "./MealMenuData";

interface MealPanelProps {
  onFeedInsufficientCoin?: () => void;
  onFeedSuccess?: () => void;
  setIsMealOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const PANEL_HORIZONTAL_PADDING = 28;
const FALLBACK_SERVER_MEAL_PRICE = 4;
const OPTIMISTIC_FEED_XP_REWARD = 50;

const getServerMealMenuItems = (schoolFoods: SchoolFood[]): MealMenuItem[] => {
  const fallbackImages = MEAL_SECTIONS[0].menus.map((menu) => menu.image);

  return schoolFoods
    .filter((food) => food.name?.trim())
    .map((food, index) => ({
      id: `server-school-food-${food.school_food_id}`,
      image: fallbackImages[index % fallbackImages.length],
      name: food.name.trim(),
      price: FALLBACK_SERVER_MEAL_PRICE,
      schoolFoodId: food.school_food_id,
    }));
};

const MealPanel = ({
  onFeedInsufficientCoin,
  onFeedSuccess,
  setIsMealOpen,
}: MealPanelProps) => {
  const { width } = useWindowDimensions();
  const accessToken = useGameStore((state) => state.accessToken);
  const applyServerMealFeed = useGameStore((state) => state.applyServerMealFeed);
  const coin = useGameStore((state) => state.coin);
  const feedBoo = useGameStore((state) => state.feedBoo);
  const lastFedMeals = useGameStore((state) => state.lastFedMeals);
  const mealDayMode = useGameStore((state) => state.mealDayMode);
  const mealRestrictionEnabled = useGameStore(
    (state) => state.mealRestrictionEnabled,
  );
  const setGameState = useGameStore((state) => state.setGameState);
  const [now, setNow] = useState(() => new Date());
  const [feedErrorMessage, setFeedErrorMessage] = useState<string | null>(null);
  const [isFeeding, setIsFeeding] = useState(false);
  const [selectedMealId, setSelectedMealId] = useState(DEFAULT_MEAL_MENU_ID);
  const { data: todaySchoolFoods = [] } = useQuery({
    queryKey: ["schoolFoods", "today"],
    queryFn: listTodaySchoolFoods,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
  });
  const {
    data: feedStatus,
    isLoading: isFeedStatusLoading,
    refetch: refetchFeedStatus,
  } = useQuery({
    queryKey: ["schoolFoods", "feedStatus", accessToken],
    queryFn: () => getSchoolFoodFeedStatus(accessToken ?? undefined),
    enabled: !!accessToken,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    retry: 1,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  const isWeekend = isWeekendDate(now, mealDayMode);
  const activeMealSectionId = getActiveMealSectionId(now);
  const { data: fallbackSchoolFoods = [] } = useQuery({
    queryKey: ["schoolFoods", "list", activeMealSectionId],
    queryFn: () => listSchoolFoods(activeMealSectionId),
    enabled: todaySchoolFoods.length === 0,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
  });
  const baseCurrentSection = activeMealSectionId
    ? getMealSectionById(activeMealSectionId, now, mealDayMode)
    : getMealSectionById(MEAL_SECTIONS[0].id, now, mealDayMode);
  const serverMealMenuItems = useMemo(
    () =>
      getServerMealMenuItems(
        todaySchoolFoods.length > 0 ? todaySchoolFoods : fallbackSchoolFoods,
      ),
    [fallbackSchoolFoods, todaySchoolFoods],
  );
  const currentSection =
    serverMealMenuItems.length > 0
      ? {
          ...baseCurrentSection,
          menus: serverMealMenuItems,
        }
      : baseCurrentSection;
  const selectedMeal =
    currentSection.menus.find((menu) => menu.id === selectedMealId) ??
    currentSection.menus[0];
  const mealHeroText = getMealHeroText(now, mealDayMode);
  const serverActiveMealSectionId = normalizeMealSectionId(
    feedStatus?.current_slot,
  );
  const effectiveActiveMealSectionId =
    serverActiveMealSectionId ?? activeMealSectionId;
  const serverFedMealSectionIds = new Set(
    feedStatus?.fed_slots
      .map((slot) => normalizeMealSectionId(slot))
      .filter((slot) => slot !== null) ?? [],
  );
  const todayKey = getLocalDateKey(now);
  const hasFedCurrentMeal = accessToken
    ? !!effectiveActiveMealSectionId &&
      serverFedMealSectionIds.has(effectiveActiveMealSectionId)
    : !!activeMealSectionId && lastFedMeals[activeMealSectionId] === todayKey;
  const canFeedBySchedule =
    !mealRestrictionEnabled ||
    (accessToken
      ? feedStatus?.can_feed_now === true
      : !!activeMealSectionId && !hasFedCurrentMeal);
  const canAffordSelectedMeal = coin >= selectedMeal.price;
  const canFeedSelectedMeal =
    canAffordSelectedMeal && canFeedBySchedule && !isFeeding;
  const feedButtonWidth = width - PANEL_HORIZONTAL_PADDING * 2;
  const mealColumnCount = isWeekend ? 3 : 5;
  const mealButtonWidth = isWeekend
    ? Math.max(72, Math.min(Math.floor((width - 120) / 3), 96))
    : Math.max(52, Math.min(Math.floor((width - 80) / 5), 64));
  const mealStatusMessage = !mealRestrictionEnabled
    ? "테스트 모드: 시간 제한이 꺼져 있어요."
    : feedErrorMessage
      ? feedErrorMessage
      : isFeedStatusLoading
        ? "먹이기 가능 상태를 확인하고 있어요."
        : !effectiveActiveMealSectionId
      ? "지금은 학식 시간이 아니에요."
      : hasFedCurrentMeal
        ? `${currentSection.title}은 이미 먹였어요.`
        : `${currentSection.title} 시간에 한 번만 먹일 수 있어요.`;

  const handleClosePress = () => {
    playSoundEffect("basicClick");
    setIsMealOpen(false);
  };

  const handleFeedPress = async () => {
    setFeedErrorMessage(null);

    if (!canAffordSelectedMeal) {
      onFeedInsufficientCoin?.();
      return;
    }

    if (!canFeedBySchedule) {
      return;
    }

    if (accessToken && !selectedMeal.schoolFoodId) {
      setFeedErrorMessage("서버 학식 정보를 불러온 뒤 다시 시도해주세요.");
      return;
    }

    if (accessToken && selectedMeal.schoolFoodId) {
      const rollbackState = useGameStore.getState();
      const didOptimisticFeed = feedBoo(
        selectedMeal.price,
        effectiveActiveMealSectionId,
      );

      if (!didOptimisticFeed) {
        return;
      }

      const optimisticState = useGameStore.getState();
      const optimisticAchievementCoinDelta = Math.max(
        optimisticState.coin - (rollbackState.coin - selectedMeal.price),
        0,
      );
      const optimisticAchievementXpDelta = Math.max(
        optimisticState.totalXp -
          (rollbackState.totalXp + OPTIMISTIC_FEED_XP_REWARD),
        0,
      );

      setIsFeeding(true);
      playSoundEffect("eating");
      onFeedSuccess?.();
      setIsMealOpen(false);

      try {
        await getSchoolFood(selectedMeal.schoolFoodId);
        const result = await feedSchoolFood(
          selectedMeal.schoolFoodId,
          accessToken,
        );
        applyServerMealFeed({
          coin: result.coin + optimisticAchievementCoinDelta,
          countAchievement: false,
          mealSectionId:
            normalizeMealSectionId(result.meal_slot) ??
            effectiveActiveMealSectionId,
          totalXp: result.xp_point + optimisticAchievementXpDelta,
        });
        await refetchFeedStatus();
      } catch (error) {
        setGameState({
          achievementAlertQueue: rollbackState.achievementAlertQueue,
          achievementStats: rollbackState.achievementStats,
          characterState: rollbackState.characterState,
          coin: rollbackState.coin,
          completedAchievementKeys: rollbackState.completedAchievementKeys,
          lastFedMealSlotIndex: rollbackState.lastFedMealSlotIndex,
          lastFedMeals: rollbackState.lastFedMeals,
          ownedAchievementSkins: rollbackState.ownedAchievementSkins,
          pendingEvolution: rollbackState.pendingEvolution,
          skippedMealCount: rollbackState.skippedMealCount,
          totalXp: rollbackState.totalXp,
        });
        setFeedErrorMessage(
          getServerApiErrorMessage(error, "학식을 먹이지 못했어요."),
        );
        setIsMealOpen(true);
      } finally {
        setIsFeeding(false);
      }

      return;
    }

    const didFeed = feedBoo(selectedMeal.price, activeMealSectionId);

    if (didFeed) {
      playSoundEffect("eating");
      onFeedSuccess?.();
      setIsMealOpen(false);
    }
  };

  const renderMealItem = ({ item }: { item: MealMenuItem }) => (
    <MealMenuButton
      item={item}
      onPress={() => setSelectedMealId(item.id)}
      selected={selectedMeal.id === item.id}
      width={mealButtonWidth}
    />
  );

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerText}>학식</Text>
            <Text style={styles.pageText}>{currentSection.pageLabel}</Text>
          </View>
          <Pressable onPress={handleClosePress} style={styles.headerButton}>
            <CrossIcon width={24} height={24} fill={colors.BLACK_NORMAL} />
          </Pressable>
        </View>
        <View style={styles.heroBanner}>
          <Text style={styles.heroText}>{mealHeroText}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {currentSection.title} ({currentSection.timeLabel})
          </Text>
          <Text style={styles.metaText}>코인 : $ {coin}</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>{mealStatusMessage}</Text>
        </View>
        <FlatList
          key={isWeekend ? "weekend-meals" : "weekday-meals"}
          data={currentSection.menus}
          keyExtractor={(item) => item.id}
          renderItem={renderMealItem}
          numColumns={mealColumnCount}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={
            isWeekend
              ? styles.weekendColumnWrapper
              : styles.weekdayColumnWrapper
          }
        />
        <View style={styles.buttonWrapper}>
          <MainButton
            size="S"
            color={canFeedSelectedMeal ? "blue" : "gray"}
            label={isFeeding ? "먹이는 중" : "먹이기"}
            onPress={handleFeedPress}
            width={feedButtonWidth}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 999,
    elevation: 999,
    justifyContent: "flex-end",
  },
  container: {
    width: "100%",
    minHeight: 500,
    paddingTop: 24,
    paddingHorizontal: PANEL_HORIZONTAL_PADDING,
    paddingBottom: 30,
    backgroundColor: colors.WHITE_NORMAL,
    borderTopWidth: 2,
    borderTopColor: colors.BLACK_NORMAL,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  headerTextGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  headerText: {
    fontFamily: fonts.BASIC,
    fontSize: 24,
    lineHeight: 34,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  pageText: {
    fontFamily: fonts.BASIC,
    fontSize: 12,
    lineHeight: 18,
    color: colors.SILVER_NORMAL_ACTIVE,
    includeFontPadding: false,
    marginBottom: 4,
  },
  headerButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  heroBanner: {
    marginBottom: 28,
    paddingVertical: 18,
    paddingHorizontal: 12,
    backgroundColor: colors.SILVER_LIGHT_HOVER,
    alignItems: "center",
    justifyContent: "center",
  },
  heroText: {
    fontFamily: fonts.BASIC,
    fontSize: 22,
    lineHeight: 32,
    color: colors.BLACK_NORMAL,
    textAlign: "center",
    includeFontPadding: false,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  metaText: {
    fontFamily: fonts.BASIC,
    fontSize: 16,
    lineHeight: 24,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  statusRow: {
    marginBottom: 18,
  },
  statusText: {
    fontFamily: fonts.BASIC,
    fontSize: 12,
    lineHeight: 18,
    color: colors.SILVER_NORMAL_ACTIVE,
    includeFontPadding: false,
  },
  listContent: {
    gap: 18,
  },
  weekdayColumnWrapper: {
    justifyContent: "space-between",
  },
  weekendColumnWrapper: {
    justifyContent: "center",
    gap: 18,
  },
  buttonWrapper: {
    marginTop: 30,
    width: "100%",
  },
});

export default MealPanel;
