import { CharacterGrade } from "@/constants/character";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import React from "react";
import { StyleSheet, View } from "react-native";
import OutlinedText from "../OutlinedText/OutlinedText";

interface ProgressBarProps {
  bottomOffset: number;
  grade: CharacterGrade;
  maxXp: number;
  nickName: string;
  xp: number;
}

const ProgressBar = ({
  bottomOffset,
  grade,
  maxXp,
  nickName,
  xp,
}: ProgressBarProps) => {
  const progressPercent = Math.min(100, Math.max(0, (xp / maxXp) * 100));

  return (
    <View style={[styles.container, { bottom: bottomOffset }]}>
      <View style={styles.textContainer}>
        <OutlinedText style={styles.stateText}>Lv. {grade}학년</OutlinedText>
        <OutlinedText style={styles.nickNameText}>{nickName}</OutlinedText>
      </View>
      <View style={styles.totalBar}>
        <View style={[styles.currentBar, { width: `${progressPercent}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    alignSelf: "center",
  },
  totalBar: {
    width: 270,
    height: 24,
    backgroundColor: colors.WHITE_NORMAL,
    borderWidth: 1,
    borderColor: colors.BLACK_NORMAL,
    marginTop: 4,
  },
  currentBar: {
    height: "100%",
    backgroundColor: colors.GREEN_LIGHT_ACTIVE,
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
});

export default ProgressBar;
