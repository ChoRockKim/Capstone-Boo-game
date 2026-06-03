/**
 * @description  메인 화면에서 업적 달성 상태와 보상을 확인하는 하단 패널입니다.
 * @depends      assets/icons/cross.svg, constants/achievements.ts, stores/useGameStore.ts
 * @used-by      app/game/index.tsx
 * @side-effects basicClick SFX 재생, onClose 콜백 호출
 */
import CrossIcon from "@/assets/icons/cross.svg";
import {
  ACHIEVEMENT_DEFINITIONS,
  AchievementConditionType,
  getAchievementRewardLabel,
} from "@/constants/achievements";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { useGameStore } from "@/stores/useGameStore";
import { playSoundEffect } from "@/utils/soundEffects";
import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type AchievementPanelProps = {
  onClose: () => void;
};

const COLLAPSED_VISIBLE_COUNT = 5;

const getProgressValue = (
  conditionType: AchievementConditionType,
  state: {
    achievementCompletedCount: number;
    feedCount: number;
    friendCount: number;
    hasEnteredRoom: boolean;
    hasFirstLogin: boolean;
    hasVisitedCampus: boolean;
    miniGamePlayCount: number;
    quizCorrectCount: number;
    roomItemEquipCount: number;
    totalXp: number;
  },
) => {
  switch (conditionType) {
    case "achievement_completed_count":
      return state.achievementCompletedCount;
    case "campus_first_visit":
      return state.hasVisitedCampus ? 1 : 0;
    case "feed_count":
      return state.feedCount;
    case "first_login":
      return state.hasFirstLogin ? 1 : 0;
    case "friend_count":
      return state.friendCount;
    case "minigame_play_count":
      return state.miniGamePlayCount;
    case "quiz_correct_count":
      return state.quizCorrectCount;
    case "room_first_enter":
      return state.hasEnteredRoom ? 1 : 0;
    case "room_item_equip_count":
      return state.roomItemEquipCount;
    case "total_xp":
      return state.totalXp;
  }
};

const AchievementPanel = ({ onClose }: AchievementPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const achievementStats = useGameStore((state) => state.achievementStats);
  const completedAchievementKeys = useGameStore(
    (state) => state.completedAchievementKeys,
  );
  const friendList = useGameStore((state) => state.friendList);
  const totalXp = useGameStore((state) => state.totalXp);
  const completedKeySet = useMemo(
    () => new Set(completedAchievementKeys),
    [completedAchievementKeys],
  );
  const progressState = useMemo(
    () => ({
      achievementCompletedCount: completedAchievementKeys.length,
      feedCount: achievementStats.feedCount,
      friendCount: Math.max(
        achievementStats.friendAddCount,
        friendList.length,
      ),
      hasEnteredRoom: achievementStats.hasEnteredRoom,
      hasFirstLogin: achievementStats.hasFirstLogin,
      hasVisitedCampus: achievementStats.hasVisitedCampus,
      miniGamePlayCount: achievementStats.miniGamePlayCount,
      quizCorrectCount: achievementStats.quizCorrectCount,
      roomItemEquipCount: achievementStats.roomItemEquipCount,
      totalXp,
    }),
    [achievementStats, completedAchievementKeys.length, friendList.length, totalXp],
  );
  const achievements = useMemo(
    () =>
      [...ACHIEVEMENT_DEFINITIONS]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((achievement) => {
          const progress = getProgressValue(
            achievement.conditionType,
            progressState,
          );

          return {
            ...achievement,
            isCompleted: completedKeySet.has(achievement.key),
            progress,
          };
        }),
    [completedKeySet, progressState],
  );
  const visibleAchievements = isExpanded
    ? achievements
    : achievements.slice(0, COLLAPSED_VISIBLE_COUNT);

  const handleClosePress = () => {
    playSoundEffect("basicClick");
    onClose();
  };

  const handleMorePress = () => {
    playSoundEffect("basicClick");
    setIsExpanded((currentValue) => !currentValue);
  };

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <View style={styles.panel}>
        <View style={styles.headerRow}>
          <Text style={styles.titleText}>업적</Text>
          <Pressable onPress={handleClosePress} style={styles.closeButton}>
            <CrossIcon width={28} height={28} color={colors.BLACK_NORMAL} />
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {visibleAchievements.map((achievement) => {
            const rewardLabel = getAchievementRewardLabel(achievement.reward);
            const progressLabel = `${Math.min(
              achievement.progress,
              achievement.targetValue,
            ).toLocaleString()}/${achievement.targetValue.toLocaleString()}`;

            return (
              <View
                key={achievement.key}
                style={[
                  styles.achievementRow,
                  achievement.isCompleted && styles.achievementRowCompleted,
                ]}
              >
                <View
                  style={[
                    styles.indexBox,
                    achievement.isCompleted && styles.indexBoxCompleted,
                  ]}
                >
                  <Text style={styles.indexText}>{achievement.sortOrder}</Text>
                </View>
                <View style={styles.achievementTextGroup}>
                  <Text
                    numberOfLines={2}
                    style={[
                      styles.achievementTitleText,
                      achievement.isCompleted &&
                        styles.achievementTitleTextCompleted,
                    ]}
                  >
                    {achievement.title}
                  </Text>
                  {!achievement.isCompleted ? (
                    <Text style={styles.progressText}>{progressLabel}</Text>
                  ) : null}
                </View>
                <Text
                  numberOfLines={2}
                  style={[
                    styles.rewardText,
                    achievement.isCompleted && styles.rewardTextCompleted,
                  ]}
                >
                  {achievement.isCompleted ? "달성" : rewardLabel}
                </Text>
              </View>
            );
          })}
          {achievements.length > COLLAPSED_VISIBLE_COUNT ? (
            <Pressable
              onPress={handleMorePress}
              style={({ pressed }) => [
                styles.moreButton,
                pressed && styles.moreButtonPressed,
              ]}
            >
              {({ pressed }) => (
                <>
                  <Feather
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={
                      pressed ? colors.WHITE_NORMAL : colors.BLACK_NORMAL
                    }
                  />
                  <Text
                    style={[
                      styles.moreButtonText,
                      pressed && styles.moreButtonTextPressed,
                    ]}
                  >
                    {isExpanded ? "접기" : "더보기"}
                  </Text>
                </>
              )}
            </Pressable>
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    justifyContent: "flex-end",
    zIndex: 999,
    elevation: 999,
  },
  panel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    elevation: 999,
    maxHeight: "64%",
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderTopWidth: 2,
    borderTopColor: colors.BLACK_NORMAL,
    backgroundColor: colors.WHITE_NORMAL,
  },
  headerRow: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleText: {
    flex: 1,
    fontFamily: fonts.BASIC,
    fontSize: 24,
    lineHeight: 28,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  closeButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    gap: 10,
    paddingBottom: 2,
  },
  achievementRow: {
    width: "100%",
    minHeight: 52,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderStyle: "dotted",
    borderRadius: 16,
    borderColor: colors.GOLD_NORMAL,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.WHITE_NORMAL,
  },
  achievementRowCompleted: {
    borderColor: colors.GOLD_NORMAL,
    backgroundColor: colors.GOLD_LIGHT_ACTIVE,
  },
  indexBox: {
    width: 26,
    height: 26,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.GRAY_NORMAL_ACTIVE,
    backgroundColor: colors.GRAY_LIGHT_ACTIVE,
  },
  indexBoxCompleted: {
    borderColor: colors.WHITE_NORMAL,
    backgroundColor: colors.GRAY_LIGHT_ACTIVE,
  },
  indexText: {
    fontFamily: fonts.BASIC,
    fontSize: 13,
    lineHeight: 15,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  achievementTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  achievementTitleText: {
    fontFamily: fonts.BASIC,
    fontSize: 17,
    lineHeight: 20,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  achievementTitleTextCompleted: {
    color: colors.GOLD_NORMAL,
  },
  progressText: {
    marginTop: 2,
    fontFamily: fonts.BASIC,
    fontSize: 12,
    lineHeight: 14,
    color: colors.SILVER_NORMAL_ACTIVE,
    includeFontPadding: false,
  },
  rewardText: {
    width: 88,
    marginLeft: 8,
    textAlign: "right",
    fontFamily: fonts.BASIC,
    fontSize: 15,
    lineHeight: 18,
    color: colors.GREEN_NORMAL,
    includeFontPadding: false,
  },
  rewardTextCompleted: {
    color: colors.GOLD_NORMAL,
  },
  moreButton: {
    marginTop: 6,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 4,
    borderColor: colors.BLACK_NORMAL,
    backgroundColor: colors.WHITE_NORMAL,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    elevation: 3,
    shadowColor: colors.NAVY_NORMAL,
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 2,
  },
  moreButtonPressed: {
    backgroundColor: colors.GOLD_LIGHT_ACTIVE,
  },
  moreButtonText: {
    fontFamily: fonts.BASIC,
    fontSize: 20,
    lineHeight: 22,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  moreButtonTextPressed: {
    color: colors.WHITE_NORMAL,
  },
});

export default AchievementPanel;
