/**
 * @description  미니게임 친구 랭킹 목록을 표시하는 하단 패널입니다.
 * @depends      assets/icons/cross.svg, constants/colors.ts, constants/fonts.ts, utils/soundEffects.ts
 * @used-by      app/miniGame/catchTheMajor.tsx
 * @side-effects basicClick SFX 재생, 내부 더보기 상태 변경, onClose 콜백 호출
 */
import CrossIcon from "@/assets/icons/cross.svg";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { playSoundEffect } from "@/utils/soundEffects";
import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export type MiniGameRankingEntry = {
  friendId: string;
  name: string;
  score: number;
};

type MiniGameRankingModalProps = {
  entries: MiniGameRankingEntry[];
  onClose: () => void;
  title?: string;
};

const INITIAL_VISIBLE_ENTRY_COUNT = 5;

const MiniGameRankingModal = ({
  entries,
  onClose,
  title = "랭킹",
}: MiniGameRankingModalProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const rankingEntries = useMemo(
    () => [...entries].sort((a, b) => b.score - a.score),
    [entries],
  );
  const visibleEntries = isExpanded
    ? rankingEntries
    : rankingEntries.slice(0, INITIAL_VISIBLE_ENTRY_COUNT);
  const shouldShowMoreButton =
    rankingEntries.length > INITIAL_VISIBLE_ENTRY_COUNT;

  const handleClose = () => {
    playSoundEffect("basicClick");
    onClose();
  };

  const handleMorePress = () => {
    playSoundEffect("basicClick");
    setIsExpanded((currentValue) => !currentValue);
  };

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <View style={styles.modalCard}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>{title}</Text>
          <Pressable onPress={handleClose} style={styles.headerButton}>
            <CrossIcon width={24} height={24} fill={colors.BLACK_NORMAL} />
          </Pressable>
        </View>

        <ScrollView
          bounces={false}
          contentContainerStyle={styles.entryListContent}
          showsVerticalScrollIndicator={false}
          style={styles.entryList}
        >
          {visibleEntries.map((entry, index) => {
            const rank = index + 1;

            return (
              <Pressable
                key={entry.friendId}
                onPress={() => playSoundEffect("basicClick")}
                style={({ pressed }) => [
                  styles.entryRow,
                  pressed && styles.entryRowPressed,
                ]}
              >
                {({ pressed }) => (
                  <>
                    <View
                      style={[
                        styles.rankBox,
                        pressed && styles.rankBoxPressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.rankText,
                          pressed && styles.rankTextPressed,
                        ]}
                      >
                        {rank}
                      </Text>
                    </View>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.nameText,
                        pressed && styles.nameTextPressed,
                      ]}
                    >
                      {entry.name}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.scoreText,
                        pressed && styles.scoreTextPressed,
                      ]}
                    >
                      {entry.score.toLocaleString()}P
                    </Text>
                  </>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {shouldShowMoreButton ? (
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
                  color={pressed ? colors.WHITE_NORMAL : colors.BLACK_NORMAL}
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 999,
    elevation: 999,
    justifyContent: "flex-end",
  },
  modalCard: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    elevation: 999,
    minHeight: 360,
    paddingVertical: 24,
    paddingHorizontal: 28,
    backgroundColor: colors.WHITE_NORMAL,
    borderTopColor: colors.BLACK_NORMAL,
    borderTopWidth: 2,
  },
  headerContainer: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 24,
    includeFontPadding: false,
  },
  headerButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  entryList: {
    minHeight: 220,
    flexGrow: 0,
  },
  entryListContent: {
    gap: 10,
  },
  entryRow: {
    width: "100%",
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: colors.WHITE_NORMAL,
    borderColor: colors.GOLD_NORMAL,
    borderRadius: 16,
    borderStyle: "dotted",
    borderWidth: 1.5,
  },
  entryRowPressed: {
    borderColor: colors.GREEN_NORMAL,
    backgroundColor: colors.WHITE_NORMAL,
  },
  rankBox: {
    width: 28,
    height: 28,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.SILVER_LIGHT_HOVER,
    borderColor: colors.SILVER_NORMAL,
    borderWidth: 1,
  },
  rankBoxPressed: {
    backgroundColor: colors.GREEN_NORMAL,
    borderColor: colors.GREEN_NORMAL,
  },
  rankText: {
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 14,
    includeFontPadding: false,
  },
  rankTextPressed: {
    color: colors.WHITE_NORMAL,
  },
  nameText: {
    flex: 1,
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 20,
    includeFontPadding: false,
  },
  nameTextPressed: {
    color: colors.GREEN_NORMAL,
  },
  scoreText: {
    minWidth: 78,
    marginLeft: 12,
    color: colors.GREEN_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 20,
    includeFontPadding: false,
    textAlign: "right",
  },
  scoreTextPressed: {
    color: colors.GREEN_NORMAL,
  },
  moreButton: {
    marginTop: 16,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.WHITE_NORMAL,
    borderColor: colors.BLACK_NORMAL,
    borderRadius: 4,
    borderWidth: 1,
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
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 20,
    includeFontPadding: false,
  },
  moreButtonTextPressed: {
    color: colors.WHITE_NORMAL,
  },
});

export default MiniGameRankingModal;
