import ArrowReturn from "@/assets/icons/arrow-back-return.svg";
import CrossIcon from "@/assets/icons/cross.svg";
import UserCircleIcon from "@/assets/icons/User-circle.svg";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { useGameStore } from "@/stores/useGameStore";
import {
  getServerApiErrorMessage,
  updateCurrentUser,
} from "@/utils/serverApi";
import { syncServerUserStats } from "@/utils/syncServerUserStats";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import ProfileButton from "./ProfileButton";

type ProfileEditMode = "studentId" | "name" | "nickname" | "password";

interface MyProfileType {
  onActionAlert?: (
    title: string,
    message?: string,
    options?: {
      autoHideDuration?: number;
      textSize?: "compact" | "default";
    },
  ) => void;
  setIsOptionOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsProfileOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const MyProfile = ({
  onActionAlert,
  setIsOptionOpen,
  setIsProfileOpen,
}: MyProfileType) => {
  const accessToken = useGameStore((state) => state.accessToken);
  const booName = useGameStore((state) => state.booName);
  const userEmail = useGameStore((state) => state.userEmail);
  const userEmailVerified = useGameStore((state) => state.userEmailVerified);
  const userName = useGameStore((state) => state.userName);
  const userNickname = useGameStore((state) => state.userNickname);
  const studentId = useGameStore((state) => state.studentId);
  const isGuestMode = useGameStore((state) => state.isGuestMode);
  const setStudentId = useGameStore((state) => state.setStudentId);
  const setUserName = useGameStore((state) => state.setUserName);
  const setUserNickname = useGameStore((state) => state.setUserNickname);
  const [editMode, setEditMode] = useState<ProfileEditMode | null>(null);
  const [profileTextInput, setProfileTextInput] = useState(
    userNickname || booName,
  );
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    void syncServerUserStats(accessToken).catch((error) => {
      console.warn("내 정보 동기화 실패", error);
    });
  }, [accessToken]);

  const handleBackPress = () => {
    setIsProfileOpen(false);
    setIsOptionOpen(true);
  };

  const handleClosePress = () => {
    setIsProfileOpen(false);
  };

  const getEditModeLabel = (mode: Exclude<ProfileEditMode, "password">) => {
    switch (mode) {
      case "studentId":
        return "학번";
      case "name":
        return "이름";
      case "nickname":
        return "닉네임";
    }
  };

  const getProfileTextValue = (mode: Exclude<ProfileEditMode, "password">) => {
    switch (mode) {
      case "studentId":
        return studentId;
      case "name":
        return userName;
      case "nickname":
        return userNickname || booName;
    }
  };

  const openEditMode = (mode: ProfileEditMode) => {
    if (isGuestMode && mode === "password") {
      return;
    }

    setStatusMessage("");
    if (mode !== "password") {
      setProfileTextInput(getProfileTextValue(mode));
    }
    setEditMode(mode);
  };

  const cancelEditMode = () => {
    setEditMode(null);
    setStatusMessage("");
    setPasswordInput("");
    setConfirmPasswordInput("");
    setProfileTextInput(userNickname || booName);
  };

  const handleSavePress = async () => {
    if (!editMode || isSaving) {
      return;
    }

    const trimmedProfileText = profileTextInput.trim();

    if (editMode !== "password" && !trimmedProfileText) {
      const label = getEditModeLabel(editMode);
      setStatusMessage(`${label}을 입력해주세요.`);
      onActionAlert?.("입력 확인", `${label}을 입력해주세요.`, {
        autoHideDuration: 1600,
        textSize: "compact",
      });
      return;
    }

    if (editMode === "password") {
      if (
        passwordInput.length < 8 ||
        !/[A-Za-z]/.test(passwordInput) ||
        !/\d/.test(passwordInput)
      ) {
        setStatusMessage("비밀번호는 8자 이상, 영문과 숫자를 포함해야 해요.");
        onActionAlert?.(
          "입력 확인",
          "비밀번호는 8자 이상,\n영문과 숫자를 포함해야 해요.",
          {
            autoHideDuration: 1800,
            textSize: "compact",
          },
        );
        return;
      }

      if (passwordInput !== confirmPasswordInput) {
        setStatusMessage("비밀번호가 일치하지 않아요.");
        onActionAlert?.("입력 확인", "비밀번호가 일치하지 않아요.", {
          autoHideDuration: 1600,
          textSize: "compact",
        });
        return;
      }
    }

    if (isGuestMode && editMode !== "password") {
      const label = getEditModeLabel(editMode);

      if (editMode === "studentId") {
        setStudentId(trimmedProfileText);
      }

      if (editMode === "name") {
        setUserName(trimmedProfileText);
      }

      if (editMode === "nickname") {
        setUserNickname(trimmedProfileText);
      }

      setEditMode(null);
      setStatusMessage(`${label}을 변경했어요.`);
      onActionAlert?.(`${label} 변경 완료`, "게스트 정보가 저장됐어요.", {
        autoHideDuration: 1800,
        textSize: "compact",
      });
      return;
    }

    if (!accessToken) {
      return;
    }

    const serverUpdateParams =
      editMode === "nickname"
        ? { nickname: trimmedProfileText }
        : editMode === "studentId"
          ? { student_id: trimmedProfileText }
          : editMode === "password"
            ? { password: passwordInput }
            : null;

    if (!serverUpdateParams) {
      return;
    }

    const serverEditLabel =
      editMode === "password" ? "비밀번호" : getEditModeLabel(editMode);

    setIsSaving(true);
    setStatusMessage("");
    onActionAlert?.(
      `${serverEditLabel} 변경 중`,
      "서버에 계정 정보를 저장하고 있어요.",
      {
        autoHideDuration: 0,
        textSize: "compact",
      },
    );

    try {
      await updateCurrentUser(serverUpdateParams, accessToken);
      await syncServerUserStats(accessToken);
      setEditMode(null);
      setPasswordInput("");
      setConfirmPasswordInput("");
      setStatusMessage(`${serverEditLabel}을 변경했어요.`);
      onActionAlert?.(
        `${serverEditLabel} 변경 완료`,
        "계정 정보가 저장됐어요.",
        {
          autoHideDuration: 1800,
          textSize: "compact",
        },
      );
    } catch (error) {
      const errorMessage = getServerApiErrorMessage(
        error,
        "계정 정보를 변경하지 못했어요.",
      );

      setStatusMessage(errorMessage);
      onActionAlert?.("저장 실패", errorMessage, {
        autoHideDuration: 2200,
        textSize: "compact",
      });
    } finally {
      setIsSaving(false);
    }
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
          label="학번"
          onPress={isGuestMode ? () => openEditMode("studentId") : undefined}
          rightAccessory={
            isGuestMode
              ? (pressed) => (
                  <Feather
                    name="chevron-right"
                    size={18}
                    color={pressed ? colors.WHITE_NORMAL : colors.GREEN_NORMAL}
                  />
                )
              : undefined
          }
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
          label="이름"
          onPress={isGuestMode ? () => openEditMode("name") : undefined}
          rightAccessory={
            isGuestMode
              ? (pressed) => (
                  <Feather
                    name="chevron-right"
                    size={18}
                    color={pressed ? colors.WHITE_NORMAL : colors.GREEN_NORMAL}
                  />
                )
              : undefined
          }
          value={userName}
        />
        <ProfileButton
          icon={(pressed) => (
            <Feather
              name="at-sign"
              size={20}
              color={
                pressed ? colors.WHITE_NORMAL : colors.SILVER_NORMAL_ACTIVE
              }
            />
          )}
          label="이메일"
          value={userEmail || "미등록"}
          valueColor={
            userEmailVerified ? colors.GREEN_NORMAL : colors.SILVER_NORMAL
          }
        />
        <ProfileButton
          icon={(pressed) => (
            <Feather
              name="tag"
              size={20}
              color={
                pressed ? colors.WHITE_NORMAL : colors.SILVER_NORMAL_ACTIVE
              }
            />
          )}
          label="닉네임"
          onPress={() => openEditMode("nickname")}
          rightAccessory={(pressed) => (
            <Feather
              name="chevron-right"
              size={18}
              color={pressed ? colors.WHITE_NORMAL : colors.GREEN_NORMAL}
            />
          )}
          value={userNickname || booName}
        />
        {!isGuestMode ? (
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
            onPress={() => openEditMode("password")}
            rightAccessory={(pressed) => (
              <Feather
                name="chevron-right"
                size={18}
                color={pressed ? colors.WHITE_NORMAL : colors.GREEN_NORMAL}
              />
            )}
            value="수정하기"
          />
        ) : null}
      </View>
      {editMode ? (
        <View style={styles.editBox}>
          <Text style={styles.editTitle}>
            {editMode === "password"
              ? "비밀번호 수정"
              : `${getEditModeLabel(editMode)} 수정`}
          </Text>
          {editMode !== "password" ? (
            <TextInput
              autoCapitalize="none"
              onChangeText={setProfileTextInput}
              placeholder={getEditModeLabel(editMode)}
              placeholderTextColor={colors.SILVER_NORMAL}
              style={styles.input}
              value={profileTextInput}
            />
          ) : (
            <>
              <TextInput
                autoCapitalize="none"
                onChangeText={setPasswordInput}
                placeholder="새 비밀번호"
                placeholderTextColor={colors.SILVER_NORMAL}
                secureTextEntry
                style={styles.input}
                value={passwordInput}
              />
              <TextInput
                autoCapitalize="none"
                onChangeText={setConfirmPasswordInput}
                placeholder="새 비밀번호 확인"
                placeholderTextColor={colors.SILVER_NORMAL}
                secureTextEntry
                style={styles.input}
                value={confirmPasswordInput}
              />
            </>
          )}
          {statusMessage ? (
            <Text style={styles.statusText}>{statusMessage}</Text>
          ) : null}
          <View style={styles.editActions}>
            <Pressable
              onPress={cancelEditMode}
              style={({ pressed }) => [
                styles.editActionButton,
                pressed && styles.editActionButtonPressed,
              ]}
            >
              <Text style={styles.editActionText}>취소</Text>
            </Pressable>
            <Pressable
              disabled={isSaving}
              onPress={handleSavePress}
              style={({ pressed }) => [
                styles.editActionButton,
                styles.saveButton,
                pressed && !isSaving && styles.editActionButtonPressed,
                isSaving && styles.disabledButton,
              ]}
            >
              <Text style={styles.editActionText}>
                {isSaving ? "저장 중" : "저장"}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : statusMessage ? (
        <Text style={styles.statusText}>{statusMessage}</Text>
      ) : null}
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
  editBox: {
    marginTop: 14,
    gap: 8,
    padding: 12,
    backgroundColor: colors.GOLD_LIGHT_ACTIVE,
    borderColor: colors.GOLD_NORMAL,
    borderRadius: 4,
    borderWidth: 1,
  },
  editTitle: {
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 18,
    includeFontPadding: false,
  },
  input: {
    minHeight: 42,
    paddingHorizontal: 12,
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 18,
    backgroundColor: colors.WHITE_NORMAL,
    borderColor: colors.BLACK_NORMAL,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusText: {
    marginTop: 10,
    color: colors.GREEN_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 14,
    includeFontPadding: false,
    lineHeight: 18,
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  editActionButton: {
    minWidth: 74,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    backgroundColor: colors.WHITE_NORMAL,
    borderColor: colors.BLACK_NORMAL,
    borderRadius: 4,
    borderWidth: 1,
  },
  saveButton: {
    backgroundColor: colors.GOLD_NORMAL,
  },
  editActionButtonPressed: {
    opacity: 0.7,
  },
  disabledButton: {
    opacity: 0.5,
  },
  editActionText: {
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 16,
    includeFontPadding: false,
  },
});

export default MyProfile;
