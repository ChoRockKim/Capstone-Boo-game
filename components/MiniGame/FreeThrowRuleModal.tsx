/**
 * @description  자유투 넣기 미니게임의 규칙을 표시하는 설명 모달입니다.
 * @depends      assets/icons/cross.svg, constants/colors.ts, constants/fonts.ts, utils/soundEffects.ts
 * @used-by      components/MiniGame/MiniGameStartScreen.tsx
 * @side-effects basicClick SFX 재생, onClose 콜백 호출
 */
import CrossIcon from "@/assets/icons/cross.svg";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { playSoundEffect } from "@/utils/soundEffects";
import { Pressable, StyleSheet, Text, View } from "react-native";

type FreeThrowRuleModalProps = {
  onClose: () => void;
};

const FreeThrowRuleModal = ({ onClose }: FreeThrowRuleModalProps) => {
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
          게이지 바가 좌우로 움직일 때, 타이밍에{"\n"}
          맞춰 빨간색 영역에서 버튼을 눌러 슛!
        </Text>

        <Text style={styles.rewardText}>
          실수 없이 연속으로 <Text style={styles.highlightText}>5번</Text>{" "}
          넣으면,
          <Text style={styles.highlightText}> 3코인</Text> 지급!
        </Text>

        <Text style={styles.tipText}>
          TIP!{"\n"}점점 속도가 빨라지고, 빨간색 영역도 좁아져요!
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
    width: 350,
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 18,
    backgroundColor: colors.WHITE_NORMAL,
    borderColor: colors.BLACK_NORMAL,
    borderWidth: 2,
    ...ruleModalShadow,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
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
  rewardText: {
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 15,
    includeFontPadding: false,
    lineHeight: 20,
  },
  highlightText: {
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

export default FreeThrowRuleModal;
