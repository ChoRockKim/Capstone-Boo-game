import CrossIcon from "@/assets/icons/cross.svg";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { User } from "@/types";
import React, { useContext, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  Keyboard,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  UIManager,
  useWindowDimensions,
  View,
} from "react-native";
import BooNameInput from "../Inputs/BooNameInput";
import NameInput from "../Inputs/NameInput";
import PasswordConfirmInput from "../Inputs/PasswordConfirmInput";
import PasswordInput from "../Inputs/PasswordInput";
import StudentIdInput from "../Inputs/StudentIdInput";
import MainButton from "../MainButton/MainButton";
import { StepContext } from "./RegisterContainer";

interface RegisterProps {
  setIsRegisterOpen: (value: boolean) => void;
}

const BASE_HEIGHT = 468;
const KEYBOARD_SHOW_EVENT =
  Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
const KEYBOARD_HIDE_EVENT =
  Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const RegisterDetail = ({ setIsRegisterOpen }: RegisterProps) => {
  const { width } = useWindowDimensions();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const buttonWidth = width - 56;
  const { setStep } = useContext(StepContext);
  const { clearErrors, handleSubmit, setFocus } = useFormContext<User>();

  const onSubmit = (value: User) => {
    //유저 회원가입 응답 성공 로직
    console.log("회원가입 정보:", value);
    setStep(3);
  };
  const onError = () => {
    console.log("다 확인을 안 하셨네요;");
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
        <ScrollView
          alwaysBounceVertical={false}
          bounces={false}
          //   keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.screenScrollContent}
          style={styles.screenScroll}
        >
          <View
            style={[
              styles.container,
              { minHeight: BASE_HEIGHT + keyboardHeight },
            ]}
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
              <Text style={styles.mainText}>정보를 입력해주세요</Text>
            </View>
            {/* 입력 필드 */}
            <StudentIdInput />
            <PasswordInput
              rules={{
                required: "비밀번호를 입력해주세요.",
                validate: (v) =>
                  /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(String(v)) ||
                  true ||
                  "비밀번호는 8자 이상, 영문과 숫자를 포함해야 합니다",
              }}
              onValidSubmit={() => {
                clearErrors("passwordConfirm");
                setFocus("passwordConfirm");
              }}
            />
            <PasswordConfirmInput />
            <NameInput />
            <BooNameInput />
            <View style={styles.buttonContainer}>
              <MainButton
                onPress={handleSubmit(onSubmit, onError)}
                size="S"
                label="완료"
                width={buttonWidth}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  screenScroll: {
    flex: 1,
  },
  screenScrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: colors.WHITE_NORMAL,
    borderTopWidth: 2,
    borderTopColor: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 20,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 24,
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
  buttonContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
});

export default RegisterDetail;
