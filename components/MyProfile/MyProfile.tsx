import ArrowReturn from "@/assets/icons/arrow-back-return.svg";
import CrossIcon from "@/assets/icons/cross.svg";
import UserCircleIcon from "@/assets/icons/User-circle.svg";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { useGameStore } from "@/stores/useGameStore";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ProfileButton from "./ProfileButton";

interface MyProfileType {
  setIsOptionOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsProfileOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const MyProfile = ({ setIsOptionOpen, setIsProfileOpen }: MyProfileType) => {
  const booName = useGameStore((state) => state.booName);
  const studentId = useGameStore((state) => state.studentId);

  const handleBackPress = () => {
    setIsProfileOpen(false);
    setIsOptionOpen(true);
  };

  const handleClosePress = () => {
    setIsProfileOpen(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>나의 계정</Text>
        <View style={styles.headerButtonGroup}>
          <Pressable onPress={handleBackPress} style={styles.headerButton}>
            <ArrowReturn width={24} height={24} color={colors.BLACK_NORMAL} />
          </Pressable>
          <Pressable onPress={handleClosePress} style={styles.headerButton}>
            <CrossIcon width={24} height={24} fill={colors.BLACK_NORMAL} />
          </Pressable>
        </View>
      </View>
      <View style={styles.optionList}>
        <ProfileButton
          icon={(pressed) => (
            <UserCircleIcon
              width={20}
              height={20}
              color={
                pressed ? colors.WHITE_NORMAL : colors.SILVER_NORMAL_ACTIVE
              }
            />
          )}
          label="아이디"
          value={studentId}
        />
        <ProfileButton
          icon={(pressed) => (
            <Feather
              name="user"
              size={20}
              color={
                pressed ? colors.WHITE_NORMAL : colors.SILVER_NORMAL_ACTIVE
              }
            />
          )}
          label="닉네임"
          value={booName}
        />
        <ProfileButton
          icon={(pressed) => (
            <Feather
              name="lock"
              size={20}
              color={
                pressed ? colors.WHITE_NORMAL : colors.SILVER_NORMAL_ACTIVE
              }
            />
          )}
          label="비밀번호"
          rightAccessory={(pressed) => (
            <Feather
              name="chevron-right"
              size={18}
              color={pressed ? colors.WHITE_NORMAL : colors.GREEN_NORMAL}
            />
          )}
          value="수정하기"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    paddingHorizontal: 28,
    position: "absolute",
    zIndex: 999,
    elevation: 999,
    backgroundColor: colors.WHITE_NORMAL,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopColor: colors.BLACK_NORMAL,
    borderTopWidth: 2,
  },
  headerText: {
    fontFamily: fonts.BASIC,
    fontSize: 24,
    flex: 1,
  },
  headerContainer: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  headerButtonGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  headerButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  optionList: {
    gap: 10,
  },
});

export default MyProfile;
