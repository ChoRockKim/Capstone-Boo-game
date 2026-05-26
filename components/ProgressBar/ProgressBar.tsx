/**
 * @description  현재 학년, 부 이름, 학년 내 XP 진행도를 표시합니다.
 * @depends      constants/character.ts, constants/colors.ts, constants/fonts.ts, components/OutlinedText/OutlinedText.tsx
 * @used-by      app/game/index.tsx, app/room/index.tsx
 * @side-effects 없음
 */
import { CharacterGrade } from "@/constants/character";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import React from "react";
import { StyleSheet, View } from "react-native";
import OutlinedText from "../OutlinedText/OutlinedText";

interface ProgressBarProps {
  booName: string;
  bottomOffset: number;
  dimmed?: boolean;
  grade: CharacterGrade;
  maxXp: number;
  shadow?: boolean;
  xp: number;
}

const ProgressBar = ({
  booName,
  bottomOffset,
  dimmed = false,
  grade,
  maxXp,
  shadow = false,
  xp,
}: ProgressBarProps) => {
  const progressPercent = Math.min(100, Math.max(0, (xp / maxXp) * 100));

  return (
    <View style={[styles.container, { bottom: bottomOffset }]}>
      <View style={styles.textContainer}>
        <OutlinedText style={styles.stateText}>Lv. {grade}학년</OutlinedText>
        <OutlinedText style={styles.nickNameText}>{booName}</OutlinedText>
      </View>
      <View style={[styles.totalBar, shadow && styles.shadow]}>
        <View style={[styles.currentBar, { width: `${progressPercent}%` }]} />
        <View pointerEvents="none" style={styles.xpOverlay}>
          <OutlinedText style={styles.xpText}>
            {xp} / {maxXp} XP
          </OutlinedText>
        </View>
      </View>
      {dimmed ? <View pointerEvents="none" style={styles.dimOverlay} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    alignSelf: "center",
    width: "100%",
  },
  dimOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  totalBar: {
    width: "100%",
    height: 24,
    backgroundColor: colors.WHITE_NORMAL,
    borderWidth: 1,
    borderColor: colors.BLACK_NORMAL,
    marginTop: 4,
  },
  shadow: {
    elevation: 3,
    shadowColor: colors.NAVY_NORMAL,
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 2,
  },
  currentBar: {
    height: "100%",
    backgroundColor: colors.GREEN_LIGHT_ACTIVE,
  },
  xpOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  stateText: {
    fontFamily: fonts.BASIC,
    fontSize: 16,
    lineHeight: 22,
    includeFontPadding: false,
  },
  nickNameText: {
    fontFamily: fonts.BASIC,
    fontSize: 20,
    lineHeight: 22,
    includeFontPadding: false,
  },
  xpText: {
    fontFamily: fonts.BASIC,
    fontSize: 15,
    lineHeight: 18,
    includeFontPadding: false,
  },
});

export default ProgressBar;
