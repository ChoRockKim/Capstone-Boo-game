import ArrowOutsideIcon from "@/assets/icons/arrow-outside.svg";
import CrossIcon from "@/assets/icons/cross.svg";
import CustomizationIcon from "@/assets/icons/Customization.svg";
import Speaker from "@/assets/icons/speaker.svg";
import UserCircleIcon from "@/assets/icons/User-circle.svg";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { useGameStore } from "@/stores/useGameStore";
import {
  deleteCharacter,
  deleteCurrentUser,
  getServerApiErrorMessage,
  logoutUser,
} from "@/utils/serverApi";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
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
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [accountErrorMessage, setAccountErrorMessage] = useState("");
  const accessToken = useGameStore((state) => state.accessToken);
  const refreshToken = useGameStore((state) => state.refreshToken);
  const isGuestMode = useGameStore((state) => state.isGuestMode);
  const clearAuthSession = useGameStore((state) => state.clearAuthSession);
  const serverCharacterId = useGameStore((state) => state.serverCharacterId);
  const developerModeEnabled = useGameStore(
    (state) => state.developerModeEnabled,
  );
  const resetGameState = useGameStore((state) => state.resetGameState);
  const toggleDeveloperModeEnabled = useGameStore(
    (state) => state.toggleDeveloperModeEnabled,
  );

  const performLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      if (refreshToken) {
        await logoutUser(refreshToken);
      }
    } catch (error) {
      console.warn("로그아웃 API 요청 실패. 로컬 세션을 정리합니다.", error);
    } finally {
      clearAuthSession();
      resetGameState();
      setIsOptionOpen(false);
      router.replace("/");
      setIsLoggingOut(false);
    }
  };

  const handleLogoutPress = () => {
    if (isLoggingOut) {
      return;
    }

    Alert.alert(
      isGuestMode ? "게스트 종료" : "로그아웃",
      isGuestMode ? "게스트 모드를 종료하시겠습니까?" : "로그아웃 하시겠습니까?",
      [
      {
        text: "취소",
        style: "cancel",
      },
      {
        text: "확인",
        onPress: () => {
          void performLogout();
        },
      },
      ],
    );
  };

  const finishLocalSignOut = () => {
    clearAuthSession();
    resetGameState();
    setIsOptionOpen(false);
    router.replace("/");
  };

  const performDeleteAccount = async () => {
    if (!accessToken || isDeletingAccount) {
      return;
    }

    setIsDeletingAccount(true);
    setAccountErrorMessage("");

    try {
      if (serverCharacterId !== null) {
        await deleteCharacter(serverCharacterId).catch((error) => {
          console.warn("회원 탈퇴 전 서버 캐릭터 삭제 실패", error);
        });
      }

      await deleteCurrentUser(accessToken);
      finishLocalSignOut();
    } catch (error) {
      setAccountErrorMessage(
        getServerApiErrorMessage(error, "계정 삭제에 실패했어요."),
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleDeleteAccountPress = () => {
    if (!accessToken || isDeletingAccount) {
      return;
    }

    Alert.alert("회원 탈퇴", "회원 탈퇴 하시겠습니까?", [
      {
        text: "취소",
        style: "cancel",
      },
      {
        text: "탈퇴",
        onPress: () => {
          void performDeleteAccount();
        },
        style: "destructive",
      },
    ]);
  };

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
          disabled={isLoggingOut}
          onPress={handleLogoutPress}
          icon={(pressed) => (
            <ArrowOutsideIcon
              width={20}
              height={20}
              color={
                pressed ? colors.WHITE_NORMAL : colors.SILVER_NORMAL_ACTIVE
              }
            />
          )}
          label={
            isLoggingOut
              ? isGuestMode
                ? "종료 중"
                : "로그아웃 중"
              : isGuestMode
                ? "게스트 종료"
                : "로그아웃"
          }
        />
        {accessToken ? (
          <OptionButton
            disabled={isDeletingAccount}
            onPress={handleDeleteAccountPress}
            icon={(pressed) => (
              <Feather
                name="trash-2"
                size={20}
                color={pressed ? colors.WHITE_NORMAL : colors.DANGER}
              />
            )}
            label={
              isDeletingAccount
                ? "탈퇴 처리 중"
                : "회원 탈퇴"
            }
            textColor={colors.DANGER}
          />
        ) : null}
      </View>
      {accountErrorMessage ? (
        <Text style={styles.accountErrorText}>{accountErrorMessage}</Text>
      ) : null}
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
  accountErrorText: {
    marginTop: 10,
    color: colors.DANGER,
    fontFamily: fonts.BASIC,
    fontSize: 14,
    includeFontPadding: false,
    lineHeight: 18,
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
