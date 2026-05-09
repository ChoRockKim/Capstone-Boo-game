import CrossIcon from "@/assets/icons/cross.svg";
import MainButton from "@/components/MainButton/MainButton";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { playSoundEffect } from "@/utils/soundEffects";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type FriendDeleteModalMode = "confirm" | "success";

interface FriendDeleteModalProps {
  friendName: string;
  mode: FriendDeleteModalMode;
  onClose: () => void;
  onConfirmDelete: () => void;
}

const FriendDeleteModal = ({
  friendName,
  mode,
  onClose,
  onConfirmDelete,
}: FriendDeleteModalProps) => {
  const handleClose = () => {
    playSoundEffect("basicClick");
    onClose();
  };

  const handleConfirmDelete = () => {
    playSoundEffect("basicClick");
    onConfirmDelete();
  };

  const renderConfirmContent = () => (
    <>
      <Text style={styles.messageText}>{`${friendName} 님을 삭제할까요?`}</Text>
      <View style={styles.choiceList}>
        <Pressable onPress={handleConfirmDelete} style={styles.choiceButton}>
          {({ pressed }) => (
            <>
              <Feather
                name="chevron-right"
                size={18}
                color={pressed ? colors.GREEN_NORMAL : colors.BLACK_NORMAL}
              />
              <Text
                style={[
                  styles.choiceText,
                  pressed && styles.choiceTextPressed,
                ]}
              >
                예
              </Text>
            </>
          )}
        </Pressable>
        <Pressable onPress={handleClose} style={styles.choiceButton}>
          {({ pressed }) => (
            <>
              <Feather
                name="chevron-right"
                size={18}
                color={pressed ? colors.GREEN_NORMAL : colors.BLACK_NORMAL}
              />
              <Text
                style={[
                  styles.choiceText,
                  pressed && styles.choiceTextPressed,
                ]}
              >
                아니요
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </>
  );

  const renderSuccessContent = () => (
    <>
      <Text style={styles.messageText}>삭제되었습니다</Text>
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
    </>
  );

  return (
    <View style={styles.overlay}>
      <View style={styles.modalCard}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>친구 관리</Text>
          <Pressable onPress={handleClose} style={styles.headerButton}>
            <CrossIcon width={24} height={24} fill={colors.BLACK_NORMAL} />
          </Pressable>
        </View>
        {mode === "confirm" ? renderConfirmContent() : renderSuccessContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    backgroundColor: "rgba(18, 18, 49, 0.28)",
    zIndex: 1000,
    elevation: 1000,
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
  choiceList: {
    gap: 12,
    marginTop: 28,
  },
  choiceButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 2,
  },
  choiceText: {
    fontFamily: fonts.BASIC,
    fontSize: 20,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  choiceTextPressed: {
    color: colors.GREEN_NORMAL,
  },
  confirmButtonWrapper: {
    alignItems: "center",
    marginTop: 28,
  },
});

export default FriendDeleteModal;
