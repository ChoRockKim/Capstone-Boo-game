import CrossIcon from "@/assets/icons/cross.svg";
import MainButton from "@/components/MainButton/MainButton";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { playSoundEffect } from "@/utils/soundEffects";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface GuestModeUnavailableModalProps {
  featureName?: string;
  onClose: () => void;
}

const GuestModeUnavailableModal = ({
  featureName = "친구",
  onClose,
}: GuestModeUnavailableModalProps) => {
  const handleClose = () => {
    playSoundEffect("basicClick");
    onClose();
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.modalCard}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>사용 불가</Text>
          <Pressable onPress={handleClose} style={styles.headerButton}>
            <CrossIcon width={24} height={24} fill={colors.BLACK_NORMAL} />
          </Pressable>
        </View>
        <Text style={styles.messageText}>
          {`게스트 모드에서는 ${featureName} 기능을 사용할 수 없어요.`}
        </Text>
        <Text style={styles.subMessageText}>
          로그인 후 다시 이용해주세요.
        </Text>
        <View style={styles.confirmButtonWrapper}>
          <MainButton
            color="blue"
            height={64}
            label="확인"
            onPress={handleClose}
            size="S"
            width={280}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "flex-end",
    backgroundColor: "rgba(18, 18, 49, 0.28)",
    zIndex: 1200,
    elevation: 1200,
  },
  modalCard: {
    width: "100%",
    paddingVertical: 28,
    paddingHorizontal: 28,
    borderWidth: 2,
    borderColor: colors.BLACK_NORMAL,
    backgroundColor: colors.WHITE_NORMAL,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  headerText: {
    flex: 1,
    fontFamily: fonts.BASIC,
    fontSize: 24,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  headerButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  messageText: {
    fontFamily: fonts.BASIC,
    fontSize: 20,
    lineHeight: 28,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  subMessageText: {
    marginTop: 10,
    fontFamily: fonts.BASIC,
    fontSize: 18,
    lineHeight: 26,
    color: colors.GRAY_NORMAL_ACTIVE,
    includeFontPadding: false,
  },
  confirmButtonWrapper: {
    alignItems: "center",
    marginTop: 28,
  },
});

export default GuestModeUnavailableModal;
