import CrossIcon from "@/assets/icons/cross.svg";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import type { User } from "@/types";
import {
  getServerApiErrorMessage,
  requestSignupEmailVerification,
} from "@/utils/serverApi";
import React, { useCallback, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  Keyboard,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import EmailInput from "../Inputs/EmailInput";
import TopAlert from "../TopAlert/TopAlert";

interface RegisterProps {
  setIsRegisterOpen: (value: boolean) => void;
  setStep: (value: number) => void;
}

const BASE_HEIGHT = 188;
const KEYBOARD_SHOW_EVENT =
  Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
const KEYBOARD_HIDE_EVENT =
  Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

const RegisterEmail = ({ setStep, setIsRegisterOpen }: RegisterProps) => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isRequestingSignupEmail, setIsRequestingSignupEmail] =
    useState(false);
  const { clearErrors, getValues, setError } = useFormContext<User>();

  const hideRequestingAlert = useCallback(() => {
    setIsRequestingSignupEmail(false);
  }, []);

  const handleSignupEmailSubmit = async () => {
    if (isRequestingSignupEmail) {
      return;
    }

    const email = getValues("email").trim();

    Keyboard.dismiss();
    setIsRequestingSignupEmail(true);
    clearErrors("email");

    try {
      const result = await requestSignupEmailVerification(email);

      if (result.verification_code) {
        console.log("회원가입 인증번호:", result.verification_code);
      }

      setStep(1);
    } catch (error) {
      setError("email", {
        message: getServerApiErrorMessage(
          error,
          "인증번호 요청에 실패했어요.",
        ),
        type: "server",
      });
    } finally {
      setIsRequestingSignupEmail(false);
    }
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

  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.wrapper}>
          <View
            style={[styles.container, { height: BASE_HEIGHT + keyboardHeight }]}
          >
            <View style={styles.headerContainer}>
              <Text style={styles.headerText}>회원가입</Text>
              <Pressable
                onPress={() => {
                  setIsRegisterOpen(false);
                }}
              >
                <CrossIcon width={24} height={24} fill="black" />
              </Pressable>
            </View>
            <View style={styles.mainContainer}>
              <Text style={styles.mainText}>학교 이메일을 입력해주세요</Text>
            </View>
            {/* 입력 필드 */}
            <EmailInput
              rules={{
                required: "이메일을 입력해주세요",
                validate: (v) =>
                  String(v).endsWith("@hufs.ac.kr") ||
                  "한국외대 이메일(@hufs.ac.kr)만 가능해요",
              }}
              onValidSubmit={handleSignupEmailSubmit}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
      <TopAlert
        autoHideDuration={0}
        closable={false}
        message="학교 이메일로 인증번호를 보내고 있어요."
        onClose={hideRequestingAlert}
        textSize="compact"
        title="인증번호 전송 중이에요"
        visible={isRequestingSignupEmail}
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
});

export default RegisterEmail;
