/**
 * @description  부 잡기 미니게임의 규칙과 점수표를 표시하는 설명 모달입니다.
 * @depends      assets/icons/cross.svg, assets/miniGame/boo-catch/*, constants/colors.ts, constants/fonts.ts, expo-image, utils/soundEffects.ts
 * @used-by      components/MiniGame/MiniGameStartScreen.tsx
 * @side-effects basicClick SFX 재생, onClose 콜백 호출
 */
import CrossIcon from "@/assets/icons/cross.svg";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { playSoundEffect } from "@/utils/soundEffects";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

const BOO_SCORE_ITEMS = [
  {
    id: "basic",
    image: require("@/assets/miniGame/boo-catch/boo-basic.png"),
    point: "+1P",
    type: "plus",
  },
  {
    id: "gold",
    image: require("@/assets/miniGame/boo-catch/boo-gold.png"),
    point: "+3P",
    type: "plus",
  },
  {
    id: "penguin",
    image: require("@/assets/miniGame/boo-catch/boo-penguin.png"),
    point: "-5P",
    type: "minus",
  },
  {
    id: "pigeon",
    image: require("@/assets/miniGame/boo-catch/boo-pigeon.png"),
    point: "-5P",
    type: "minus",
  },
] as const;

type BooCatchRuleModalProps = {
  onClose: () => void;
};

const BooCatchRuleModal = ({ onClose }: BooCatchRuleModalProps) => {
  const handleClose = () => {
    playSoundEffect("basicClick");
    onClose();
  };

  return (
    <View pointerEvents="auto" style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.titleText}>게임설명</Text>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <CrossIcon width={28} height={28} fill={colors.BLACK_NORMAL} />
          </Pressable>
        </View>

        <Text style={styles.descriptionText}>
          {"오늘은 학교 축제날!\n사람과 부스가 가득한 곳에서\n부를 잡아봐요!"}
        </Text>

        <Text style={styles.sectionTitleText}>점수 안내</Text>
        <View style={styles.scoreGrid}>
          {BOO_SCORE_ITEMS.map((item) => (
            <View key={item.id} style={styles.scoreItem}>
              <Image
                cachePolicy="memory-disk"
                contentFit="contain"
                source={item.image}
                style={styles.scoreIcon}
              />
              <Text
                style={[
                  styles.scorePointText,
                  item.type === "plus"
                    ? styles.plusPointText
                    : styles.minusPointText,
                ]}
              >
                {item.point}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.rewardText}>
          30초 내 <Text style={styles.rewardHighlightText}>50P</Text> 달성 시,
          <Text style={styles.coinText}> 3코인</Text> 지급!
        </Text>
        <Text style={styles.tipText}>
          TIP!{"\n"}종료 5초 전부터 더 많이, 더 빨리 움직인대요!
        </Text>
      </View>
    </View>
  );
};

const ruleModalShadow = {
  elevation: 3,
  shadowColor: colors.NAVY_NORMAL,
  shadowOffset: {
    width: 2,
    height: 2,
  },
  shadowOpacity: 0.25,
  shadowRadius: 2,
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 1001,
    elevation: 1001,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(18, 18, 49, 0.34)",
    paddingHorizontal: 28,
  },
  card: {
    width: 325,
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 16,
    backgroundColor: colors.WHITE_NORMAL,
    borderColor: colors.BLACK_NORMAL,
    borderWidth: 2,
    ...ruleModalShadow,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
  },
  titleText: {
    flex: 1,
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 20,
    includeFontPadding: false,
    lineHeight: 25,
  },
  closeButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  descriptionText: {
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 15,
    includeFontPadding: false,
    lineHeight: 21,
    marginBottom: 8,
  },
  sectionTitleText: {
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 15,
    includeFontPadding: false,
    lineHeight: 19,
    marginBottom: 5,
  },
  scoreGrid: {
    flexDirection: "row",
    marginBottom: 8,
  },
  scoreItem: {
    width: "25%",
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  scoreIcon: {
    width: 34,
    height: 39,
  },
  scorePointText: {
    fontFamily: fonts.BASIC,
    fontSize: 15,
    includeFontPadding: false,
    lineHeight: 18,
  },
  plusPointText: {
    color: "#3C68FF",
  },
  minusPointText: {
    color: colors.DANGER,
  },
  rewardText: {
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 15,
    includeFontPadding: false,
    lineHeight: 20,
  },
  rewardHighlightText: {
    color: "#FFB52B",
  },
  coinText: {
    color: "#FFB52B",
  },
  tipText: {
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 11,
    includeFontPadding: false,
    lineHeight: 15,
    marginTop: 3,
  },
});

export default BooCatchRuleModal;
