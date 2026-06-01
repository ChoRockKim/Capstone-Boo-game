import CrossIcon from "@/assets/icons/cross.svg";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import type { User } from "@/types";
import {
  getServerApiErrorMessage,
  verifySignupEmail,
} from "@/utils/serverApi";
import React, { useContext, useEffect, useState } from "react";
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
import EmailConfirmInput from "../Inputs/EmailConfirmInput";
import { StepContext } from "./StepContext";

interface RegisterProps {
  setIsRegisterOpen: (value: boolean) => void;
}

const BASE_HEIGHT = 222;
const KEYBOARD_SHOW_EVENT =
  Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
const KEYBOARD_HIDE_EVENT =
  Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

const RegisterEmailConfirm = ({ setIsRegisterOpen }: RegisterProps) => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const { clearErrors, getValues, setError } = useFormContext<User>();
  const { setStep } = useContext(StepContext);

  const handleEmailConfirmSubmit = async () => {
    if (isVerifyingEmail) {
      return;
    }

    setIsVerifyingEmail(true);
    clearErrors("emailConfirm");

    try {
      await verifySignupEmail({
        code: getValues("emailConfirm").trim(),
        email: getValues("email").trim(),
      });
      setStep(2);
    } catch (error) {
      setError("emailConfirm", {
        message: getServerApiErrorMessage(
          error,
          "인증번호 확인에 실패했어요.",
        ),
        type: "server",
      });
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  useEffect(() => {
    const show = Keyboard.addListener(KEYBOARD_SHOW_EVENT, (e) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hide = Keyboard.addListener(KEYBOARD_HIDE_EVENT, () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKeyboardHeight(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return (
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
            <Text style={styles.mainText}>
              {isVerifyingEmail
                ? "인증번호를 확인하고 있어요"
                : "이메일로 전송된 \n인증번호를 입력해주세요"}
            </Text>
          </View>
          {/* 입력 필드 */}
          <EmailConfirmInput onValidSubmit={handleEmailConfirmSubmit} />
        </View>
      </View>
    </TouchableWithoutFeedback>
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

export default RegisterEmailConfirm;
