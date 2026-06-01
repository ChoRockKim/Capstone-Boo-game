import CrossIcon from "@/assets/icons/cross.svg";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { useGameStore } from "@/stores/useGameStore";
import {
  confirmPasswordReset,
  getServerApiErrorMessage,
  loginUser,
  requestPasswordReset,
} from "@/utils/serverApi";
import { playSoundEffect } from "@/utils/soundEffects";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import {
  Keyboard,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import InputField from "../Inputs/InputField";
import PasswordInput from "../Inputs/PasswordInput";
import StudentIdInput from "../Inputs/StudentIdInput";
import MainButton from "../MainButton/MainButton";
import TopAlert from "../TopAlert/TopAlert";

interface RegisterProps {
  setIsLoginOpen: (value: boolean) => void;
}

const LOGIN_BASE_HEIGHT = 333;
const RESET_REQUEST_BASE_HEIGHT = 330;
const RESET_CONFIRM_BASE_HEIGHT = 500;
const KEYBOARD_SHOW_EVENT =
  Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
const KEYBOARD_HIDE_EVENT =
  Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

type LoginMode = "login" | "passwordResetRequest" | "passwordResetConfirm";

type LoginValues = {
  studentId: string;
  password: string;
  resetPassword: string;
  resetPasswordConfirm: string;
  resetStudentId: string;
  resetToken: string;
};

type LoginTopAlertState = {
  autoHideDuration: number;
  closable: boolean;
  id: number;
  message: string;
  title: string;
  visible: boolean;
};

const Login = ({ setIsLoginOpen }: RegisterProps) => {
  const { width } = useWindowDimensions();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isAutoLoginEnabled, setIsAutoLoginEnabled] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRequestingPasswordReset, setIsRequestingPasswordReset] =
    useState(false);
  const [isConfirmingPasswordReset, setIsConfirmingPasswordReset] =
    useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>("login");
  const [resetGuideMessage, setResetGuideMessage] = useState(
    "가입한 학번을 입력하면 학교 이메일로 재설정 토큰을 보내드려요.",
  );
  const [topAlert, setTopAlert] = useState<LoginTopAlertState>({
    autoHideDuration: 2500,
    closable: true,
    id: 0,
    message: "",
    title: "",
    visible: false,
  });
  const clearAuthSession = useGameStore((state) => state.clearAuthSession);
  const setAuthSession = useGameStore((state) => state.setAuthSession);
  const buttonWidth = width - 56;
  const loginForm = useForm<LoginValues>({
    defaultValues: {
      studentId: "",
      password: "",
      resetPassword: "",
      resetPasswordConfirm: "",
      resetStudentId: "",
      resetToken: "",
    },
  });
  const { clearErrors, getValues, handleSubmit, setError, setFocus } =
    loginForm;
  const isPasswordResetBusy =
    isRequestingPasswordReset || isConfirmingPasswordReset;
  const containerBaseHeight =
    loginMode === "login"
      ? LOGIN_BASE_HEIGHT
      : loginMode === "passwordResetRequest"
        ? RESET_REQUEST_BASE_HEIGHT
        : RESET_CONFIRM_BASE_HEIGHT;
  const busyAlertTitle = isLoggingIn
    ? "로그인 중이에요"
    : isRequestingPasswordReset
      ? "재설정 메일 전송 중이에요"
      : "비밀번호 변경 중이에요";
  const busyAlertMessage = isLoggingIn
    ? "계정 정보를 확인하고 있어요."
    : isRequestingPasswordReset
      ? "학교 이메일로 재설정 토큰을 보내고 있어요."
      : "새 비밀번호로 변경하고 있어요.";
  const isBusyAlertVisible = isLoggingIn || isPasswordResetBusy;

  const hideBusyAlert = useCallback(() => {
    setIsLoggingIn(false);
    setIsRequestingPasswordReset(false);
    setIsConfirmingPasswordReset(false);
  }, []);

  const showTopAlert = useCallback((title: string, message: string) => {
    setTopAlert((prev) => ({
      autoHideDuration: 2500,
      closable: true,
      id: prev.id + 1,
      message,
      title,
      visible: true,
    }));
  }, []);

  const hideTopAlert = useCallback(() => {
    setTopAlert((prev) => ({
      ...prev,
      visible: false,
    }));
  }, []);

  const onSubmit = async (value: LoginValues) => {
    if (isLoggingIn) {
      return;
    }

    Keyboard.dismiss();
    hideTopAlert();
    setIsLoggingIn(true);
    let didSetAuthSession = false;

    try {
      const token = await loginUser({
        student_id: value.studentId.trim(),
        password: value.password,
        remember_me: isAutoLoginEnabled,
      });

      setAuthSession({
        accessToken: token.access_token,
        autoLoginEnabled: isAutoLoginEnabled,
        refreshToken: token.refresh_token,
      });
      didSetAuthSession = true;

      setIsLoginOpen(false);
      Keyboard.dismiss();
      router.replace("/game");
    } catch (error) {
      if (didSetAuthSession) {
        clearAuthSession();
      }

      loginForm.setError("password", {
        type: "server",
        message: getServerApiErrorMessage(
          error,
          "학번 또는 비밀번호를 확인해주세요.",
        ),
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAutoLoginPress = () => {
    playSoundEffect("basicClick");
    setIsAutoLoginEnabled((currentValue) => !currentValue);
  };

  const handlePasswordFindPress = () => {
    playSoundEffect("basicClick");
    Keyboard.dismiss();
    clearErrors();
    setResetGuideMessage(
      "가입한 학번을 입력하면 학교 이메일로 재설정 토큰을 보내드려요.",
    );
    setLoginMode("passwordResetRequest");
  };

  const handleBackToLoginPress = () => {
    playSoundEffect("basicClick");
    Keyboard.dismiss();
    clearErrors();
    setLoginMode("login");
  };

  const handlePasswordResetRequest = async (value: LoginValues) => {
    if (isPasswordResetBusy) {
      return;
    }

    const studentId = value.resetStudentId.trim();

    Keyboard.dismiss();
    clearErrors("resetStudentId");
    hideTopAlert();
    setIsRequestingPasswordReset(true);

    try {
      await requestPasswordReset(studentId);
      setResetGuideMessage(
        "이메일로 받은 재설정 토큰과 새 비밀번호를 입력해주세요.",
      );
      setLoginMode("passwordResetConfirm");
      showTopAlert(
        "재설정 메일을 보냈어요",
        "이메일에서 재설정 토큰을 확인해주세요.",
      );
      setTimeout(() => {
        setFocus("resetToken");
      }, 0);
    } catch (error) {
      setError("resetStudentId", {
        message: getServerApiErrorMessage(
          error,
          "재설정 메일 전송에 실패했어요.",
        ),
        type: "server",
      });
    } finally {
      setIsRequestingPasswordReset(false);
    }
  };

  const handlePasswordResetConfirm = async (value: LoginValues) => {
    if (isPasswordResetBusy) {
      return;
    }

    Keyboard.dismiss();
    hideTopAlert();
    setIsConfirmingPasswordReset(true);

    try {
      await confirmPasswordReset({
        new_password: value.resetPassword,
        token: value.resetToken.trim(),
      });
      loginForm.reset({
        ...getValues(),
        password: "",
        resetPassword: "",
        resetPasswordConfirm: "",
        resetToken: "",
      });
      setLoginMode("login");
      showTopAlert(
        "비밀번호가 변경됐어요",
        "새 비밀번호로 로그인해주세요.",
      );
    } catch (error) {
      setError("resetToken", {
        message: getServerApiErrorMessage(
          error,
          "비밀번호 변경에 실패했어요.",
        ),
        type: "server",
      });
    } finally {
      setIsConfirmingPasswordReset(false);
    }
  };

  const onError = () => {
    console.log("로그인 정보를 확인해주세요.");
  };

  useEffect(() => {
    const show = Keyboard.addListener(KEYBOARD_SHOW_EVENT, (e) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hide = Keyboard.addListener(KEYBOARD_HIDE_EVENT, () => {
      setKeyboardHeight(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const renderPasswordResetRequest = () => (
    <>
      <View style={styles.mainContainer}>
        <Text style={styles.mainText}>학번을 입력해주세요</Text>
        <Text style={styles.guideText}>{resetGuideMessage}</Text>
      </View>
      <Controller
        name="resetStudentId"
        control={loginForm.control}
        rules={{
          required: "학번을 입력해주세요",
          validate: (v) => /^\d{9}$/.test(String(v)) || "잘못된 학번입니다",
        }}
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <InputField
            placeholder="학번 입력"
            returnKeyType="done"
            value={value}
            inputMode="decimal"
            maxLength={9}
            onChangeText={onChange}
            onSubmitEditing={handleSubmit(
              handlePasswordResetRequest,
              onError,
            )}
            submitBehavior="submit"
            error={error?.message}
          />
        )}
      />
      <View style={styles.buttonContainer}>
        <MainButton
          label="재설정 메일 보내기"
          size="S"
          width={buttonWidth}
          onPress={handleSubmit(handlePasswordResetRequest, onError)}
        />
      </View>
      <Pressable
        hitSlop={8}
        onPress={handleBackToLoginPress}
        style={styles.backToLoginButton}
      >
        <Text style={styles.optionText}>로그인으로 돌아가기</Text>
      </Pressable>
    </>
  );

  const renderPasswordResetConfirm = () => (
    <>
      <View style={styles.mainContainer}>
        <Text style={styles.mainText}>새 비밀번호 설정</Text>
        <Text style={styles.guideText}>{resetGuideMessage}</Text>
      </View>
      <Controller
        name="resetToken"
        control={loginForm.control}
        rules={{
          required: "재설정 토큰을 입력해주세요.",
        }}
        render={({ field: { onChange, ref, value }, fieldState: { error } }) => (
          <InputField
            ref={ref}
            placeholder="재설정 토큰"
            returnKeyType="next"
            value={value}
            onChangeText={onChange}
            onSubmitEditing={() => setFocus("resetPassword")}
            submitBehavior="submit"
            error={error?.message}
          />
        )}
      />
      <Controller
        name="resetPassword"
        control={loginForm.control}
        rules={{
          required: "새 비밀번호를 입력해주세요.",
          validate: (v) =>
            /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(String(v)) ||
            "비밀번호는 8자 이상, 영문과 숫자를 포함해야 합니다",
        }}
        render={({ field: { onChange, ref, value }, fieldState: { error } }) => (
          <InputField
            ref={ref}
            placeholder="새 비밀번호"
            returnKeyType="next"
            value={value}
            onChangeText={(text) => {
              onChange(text);
              clearErrors("resetPasswordConfirm");
            }}
            onSubmitEditing={() => setFocus("resetPasswordConfirm")}
            submitBehavior="submit"
            autoComplete="off"
            importantForAutofill="no"
            secureTextEntry
            textContentType="none"
            error={error?.message}
          />
        )}
      />
      <Controller
        name="resetPasswordConfirm"
        control={loginForm.control}
        rules={{
          required: "새 비밀번호를 다시 입력해주세요.",
          validate: (v) =>
            v === getValues("resetPassword") ||
            "비밀번호가 일치하지 않습니다",
        }}
        render={({ field: { onChange, ref, value }, fieldState: { error } }) => (
          <InputField
            ref={ref}
            placeholder="새 비밀번호 확인"
            returnKeyType="done"
            value={value}
            onChangeText={onChange}
            onSubmitEditing={handleSubmit(
              handlePasswordResetConfirm,
              onError,
            )}
            submitBehavior="submit"
            autoComplete="off"
            importantForAutofill="no"
            secureTextEntry
            textContentType="none"
            error={error?.message}
          />
        )}
      />
      <View style={styles.buttonContainer}>
        <MainButton
          label="비밀번호 변경"
          size="S"
          width={buttonWidth}
          onPress={handleSubmit(handlePasswordResetConfirm, onError)}
        />
      </View>
      <Pressable
        hitSlop={8}
        onPress={handleBackToLoginPress}
        style={styles.backToLoginButton}
      >
        <Text style={styles.optionText}>로그인으로 돌아가기</Text>
      </Pressable>
    </>
  );

  const renderLoginFields = () => (
    <>
      {/* <View style={styles.mainContainer}>
            <Text style={styles.mainText}></Text>
          </View> */}
      {/* 입력 필드 */}
      <FormProvider {...loginForm}>
        <StudentIdInput />
        <PasswordInput
          rules={{
            required: "비밀번호를 입력해주세요.",
          }}
          returnKeyType="done"
          onValidSubmit={() => handleSubmit(onSubmit, onError)()}
        />
      </FormProvider>
      <View style={styles.loginOptionRow}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isAutoLoginEnabled }}
          hitSlop={8}
          onPress={handleAutoLoginPress}
          style={styles.autoLoginButton}
        >
          <View
            style={[
              styles.autoLoginRadio,
              isAutoLoginEnabled && styles.autoLoginRadioChecked,
            ]}
          >
            {isAutoLoginEnabled ? (
              <View style={styles.autoLoginRadioDot} />
            ) : null}
          </View>
          <Text style={styles.optionText}>자동 로그인</Text>
        </Pressable>
        <Pressable hitSlop={8} onPress={handlePasswordFindPress}>
          <Text style={[styles.optionText, styles.passwordFindText]}>
            비밀번호 찾기
          </Text>
        </Pressable>
      </View>
      <View style={styles.buttonContainer}>
        <MainButton
          label="로그인"
          size="S"
          width={buttonWidth}
          onPress={handleSubmit(onSubmit, onError)}
        />
      </View>
    </>
  );

  return (
    <>
      <View style={styles.wrapper} onTouchStart={Keyboard.dismiss}>
        <View
          style={[
            styles.container,
            { height: containerBaseHeight + keyboardHeight },
          ]}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.headerText}>
              {loginMode === "login" ? "로그인" : "비밀번호 찾기"}
            </Text>
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                setIsLoginOpen(false);
              }}
            >
              <CrossIcon width={24} height={24} fill="black" />
            </Pressable>
          </View>
          {loginMode === "login"
            ? renderLoginFields()
            : loginMode === "passwordResetRequest"
              ? renderPasswordResetRequest()
              : renderPasswordResetConfirm()}
        </View>
      </View>
      <TopAlert
        autoHideDuration={
          isBusyAlertVisible ? 0 : topAlert.autoHideDuration
        }
        closable={isBusyAlertVisible ? false : topAlert.closable}
        message={isBusyAlertVisible ? busyAlertMessage : topAlert.message}
        onClose={isBusyAlertVisible ? hideBusyAlert : hideTopAlert}
        textSize="compact"
        title={isBusyAlertVisible ? busyAlertTitle : topAlert.title}
        visibilityKey={isBusyAlertVisible ? 0 : topAlert.id}
        visible={isBusyAlertVisible || topAlert.visible}
      />
    </>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    borderTopWidth: 2,
    borderTopColor: colors.BLACK_NORMAL,
  },
  container: {
    backgroundColor: colors.WHITE_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 20,
    paddingHorizontal: 28,
    paddingVertical: 24,
  },
  headerText: {
    fontFamily: fonts.BASIC,
    fontSize: 24,
    flex: 1,
  },
  headerContainer: {
    marginBottom: 10,
    flexDirection: "row",
  },
  mainText: {
    fontFamily: fonts.BASIC,
    fontSize: 23,
    lineHeight: 30,
  },
  mainContainer: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  guideText: {
    marginTop: 8,
    fontFamily: fonts.BASIC,
    fontSize: 14,
    lineHeight: 20,
    color: colors.SILVER_NORMAL_ACTIVE,
    includeFontPadding: false,
  },
  buttonContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },
  backToLoginButton: {
    alignSelf: "center",
    marginTop: 14,
    minHeight: 24,
    justifyContent: "center",
  },
  loginOptionRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  autoLoginButton: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
  },
  autoLoginRadio: {
    width: 14,
    height: 14,
    marginRight: 8,
    borderWidth: 2,
    borderColor: colors.BLACK_NORMAL,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.WHITE_NORMAL,
  },
  autoLoginRadioChecked: {
    borderColor: colors.BLACK_NORMAL,
    backgroundColor: colors.GREEN_LIGHT_ACTIVE,
  },
  autoLoginRadioDot: {
    width: 6,
    height: 6,
    backgroundColor: colors.BLACK_NORMAL,
  },
  optionText: {
    fontFamily: fonts.BASIC,
    fontSize: 14,
    lineHeight: 18,
    includeFontPadding: false,
    color: colors.BLACK_NORMAL,
  },
  passwordFindText: {
    color: colors.SILVER_NORMAL_ACTIVE,
  },
});

export default Login;
