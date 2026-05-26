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
import { playSoundEffect } from "@/utils/soundEffects";
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
} from "./MealMenuData";

interface MealPanelProps {
  onFeedInsufficientCoin?: () => void;
  onFeedSuccess?: () => void;
  setIsMealOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const PANEL_HORIZONTAL_PADDING = 28;

const MealPanel = ({
  onFeedInsufficientCoin,
  onFeedSuccess,
  setIsMealOpen,
}: MealPanelProps) => {
  const { width } = useWindowDimensions();
  const coin = useGameStore((state) => state.coin);
  const feedBoo = useGameStore((state) => state.feedBoo);
  const lastFedMeals = useGameStore((state) => state.lastFedMeals);
  const mealDayMode = useGameStore((state) => state.mealDayMode);
  const mealRestrictionEnabled = useGameStore(
    (state) => state.mealRestrictionEnabled,
  );
  const [now, setNow] = useState(() => new Date());
  const [selectedMealId, setSelectedMealId] = useState(DEFAULT_MEAL_MENU_ID);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  const isWeekend = isWeekendDate(now, mealDayMode);
  const activeMealSectionId = getActiveMealSectionId(now);
  const currentSection = activeMealSectionId
    ? getMealSectionById(activeMealSectionId, now, mealDayMode)
    : getMealSectionById(MEAL_SECTIONS[0].id, now, mealDayMode);
  const selectedMeal = useMemo(
    () =>
      currentSection.menus.find((menu) => menu.id === selectedMealId) ??
      currentSection.menus[0],
    [currentSection.menus, selectedMealId],
  );
  const mealHeroText = getMealHeroText(now, mealDayMode);
  const todayKey = getLocalDateKey(now);
  const hasFedCurrentMeal =
    !!activeMealSectionId && lastFedMeals[activeMealSectionId] === todayKey;
  const canFeedBySchedule =
    !mealRestrictionEnabled || (!!activeMealSectionId && !hasFedCurrentMeal);
  const canAffordSelectedMeal = coin >= selectedMeal.price;
  const canFeedSelectedMeal = canAffordSelectedMeal && canFeedBySchedule;
  const feedButtonWidth = width - PANEL_HORIZONTAL_PADDING * 2;
  const mealColumnCount = isWeekend ? 3 : 5;
  const mealButtonWidth = isWeekend
    ? Math.max(72, Math.min(Math.floor((width - 120) / 3), 96))
    : Math.max(52, Math.min(Math.floor((width - 80) / 5), 64));
  const mealStatusMessage = !mealRestrictionEnabled
    ? "테스트 모드: 시간 제한이 꺼져 있어요."
    : !activeMealSectionId
      ? "지금은 학식 시간이 아니에요."
      : hasFedCurrentMeal
        ? `${currentSection.title}은 이미 먹였어요.`
        : `${currentSection.title} 시간에 한 번만 먹일 수 있어요.`;

  useEffect(() => {
    if (!currentSection.menus.some((menu) => menu.id === selectedMealId)) {
      setSelectedMealId(currentSection.menus[0].id);
    }
  }, [currentSection.menus, selectedMealId]);

  const handleClosePress = () => {
    playSoundEffect("basicClick");
    setIsMealOpen(false);
  };

  const handleFeedPress = () => {
    if (!canAffordSelectedMeal) {
      onFeedInsufficientCoin?.();
      return;
    }

    if (!canFeedBySchedule) {
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
            label="먹이기"
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
