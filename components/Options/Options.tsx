import AlarmIcon from "@/assets/icons/alarm.svg";
import ArrowOutsideIcon from "@/assets/icons/arrow-outside.svg";
import CrossIcon from "@/assets/icons/cross.svg";
import CustomizationIcon from "@/assets/icons/Customization.svg";
import Speaker from "@/assets/icons/speaker.svg";
import UserCircleIcon from "@/assets/icons/User-circle.svg";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { useGameStore } from "@/stores/useGameStore";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import OptionButton from "./OptionButton";

interface OptionsType {
  setIsFriendListOpen: (value: boolean) => void;
  setIsOptionOpen: (value: boolean) => void;
  setIsProfileOpen: (value: boolean) => void;
  setIsSoundSettingsOpen: (value: boolean) => void;
}

const Options = ({
  setIsFriendListOpen,
  setIsOptionOpen,
  setIsProfileOpen,
  setIsSoundSettingsOpen,
}: OptionsType) => {
  const developerModeEnabled = useGameStore(
    (state) => state.developerModeEnabled,
  );
  const toggleDeveloperModeEnabled = useGameStore(
    (state) => state.toggleDeveloperModeEnabled,
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>설정</Text>
        <Pressable
          onPress={() => {
            setIsOptionOpen(false);
          }}
        >
          <CrossIcon width={24} height={24} fill={colors.BLACK_NORMAL} />
        </Pressable>
      </View>
      <View style={styles.optionList}>
        <OptionButton
          onPress={() => {
            setIsOptionOpen(false);
            setIsProfileOpen(true);
          }}
          icon={(pressed) => (
            <UserCircleIcon
              width={20}
              height={20}
              color={
                pressed ? colors.WHITE_NORMAL : colors.SILVER_NORMAL_ACTIVE
              }
            />
          )}
          label="나의 계정"
        />
        <OptionButton
          onPress={() => {
            setIsOptionOpen(false);
            setIsFriendListOpen(true);
          }}
          icon={(pressed) => (
            <CustomizationIcon
              width={20}
              height={20}
              color={
                pressed ? colors.WHITE_NORMAL : colors.SILVER_NORMAL_ACTIVE
              }
            />
          )}
          label="친구 관리"
        />
        <OptionButton
          onPress={() => {
            setIsOptionOpen(false);
            setIsSoundSettingsOpen(true);
          }}
          icon={(pressed) => (
            <Speaker
              width={20}
              height={20}
              color={
                pressed ? colors.WHITE_NORMAL : colors.SILVER_NORMAL_ACTIVE
              }
            />
          )}
          label="사운드 설정"
        />
        <OptionButton
          icon={(pressed) => (
            <AlarmIcon
              width={20}
              height={20}
              color={
                pressed ? colors.WHITE_NORMAL : colors.SILVER_NORMAL_ACTIVE
              }
            />
          )}
          label="알림"
        />
        <OptionButton
          onPress={() => router.replace("/")}
          icon={(pressed) => (
            <ArrowOutsideIcon
              width={20}
              height={20}
              color={
                pressed ? colors.WHITE_NORMAL : colors.SILVER_NORMAL_ACTIVE
              }
            />
          )}
          label="로그아웃"
        />
      </View>
      <View style={styles.developerSection}>
        <View style={styles.developerHeaderRow}>
          <Text style={styles.developerLabel}>개발자 모드</Text>
          <Pressable
            onPress={toggleDeveloperModeEnabled}
            style={({ pressed }) => [
              styles.developerToggleButton,
              developerModeEnabled
                ? styles.developerToggleButtonOn
                : styles.developerToggleButtonOff,
              pressed && styles.developerToggleButtonPressed,
            ]}
          >
            <Text
              style={[
                styles.developerToggleText,
                developerModeEnabled && styles.developerToggleTextOn,
              ]}
            >
              {developerModeEnabled ? "ON" : "OFF"}
            </Text>
          </Pressable>
        </View>
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
  },
  optionList: {
    gap: 10,
  },
  developerSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.GRAY_NORMAL_ACTIVE,
    gap: 8,
  },
  developerHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  developerLabel: {
    fontFamily: fonts.BASIC,
    fontSize: 12,
    lineHeight: 16,
    color: colors.SILVER_NORMAL_ACTIVE,
    includeFontPadding: false,
  },
  developerToggleButton: {
    minWidth: 54,
    minHeight: 26,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.BLACK_NORMAL,
    alignItems: "center",
    justifyContent: "center",
  },
  developerToggleButtonOn: {
    backgroundColor: colors.GREEN_NORMAL,
  },
  developerToggleButtonOff: {
    backgroundColor: colors.GRAY_NORMAL,
  },
  developerToggleButtonPressed: {
    opacity: 0.86,
  },
  developerToggleText: {
    fontFamily: fonts.BASIC,
    fontSize: 10,
    lineHeight: 14,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  developerToggleTextOn: {
    color: colors.WHITE_NORMAL,
  },
});

export default Options;
