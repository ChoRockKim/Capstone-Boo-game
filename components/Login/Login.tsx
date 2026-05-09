import CrossIcon from "@/assets/icons/cross.svg";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import {
  Keyboard,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from "react-native";
import EmailInput from "../Inputs/EmailInput";
import PasswordInput from "../Inputs/PasswordInput";
import MainButton from "../MainButton/MainButton";

interface RegisterProps {
  setIsLoginOpen: (value: boolean) => void;
}

const BASE_HEIGHT = 293;
const KEYBOARD_SHOW_EVENT =
  Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
const KEYBOARD_HIDE_EVENT =
  Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

type LoginValues = {
  email: string;
  password: string;
};

const Login = ({ setIsLoginOpen }: RegisterProps) => {
  const { width } = useWindowDimensions();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const buttonWidth = width - 56;
  const loginForm = useForm<LoginValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const { handleSubmit } = loginForm;

  const onSubmit = (value: LoginValues) => {
    console.log("로그인 성공!");
    console.log("로그인 정보:", value);
    //회원정보 검증 로직
    setIsLoginOpen(false);
    Keyboard.dismiss();
    router.replace("/game");
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

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.wrapper}>
        <View
          style={[styles.container, { height: BASE_HEIGHT + keyboardHeight }]}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.headerText}>로그인</Text>
            <Pressable
              onPress={() => {
                setIsLoginOpen(false);
              }}
            >
              <CrossIcon width={24} height={24} fill="black" />
            </Pressable>
          </View>
          {/* <View style={styles.mainContainer}>
            <Text style={styles.mainText}></Text>
          </View> */}
          {/* 입력 필드 */}
          <FormProvider {...loginForm}>
            <EmailInput
              rules={{
                required: "이메일을 입력해주세요",
              }}
              returnKeyType="next"
              onValidSubmit={() => loginForm.setFocus("password")}
            />
            <PasswordInput
              rules={{
                required: "비밀번호를 입력해주세요.",
              }}
              returnKeyType="done"
              onValidSubmit={() => handleSubmit(onSubmit, onError)()}
            />
          </FormProvider>
          <View style={styles.buttonContainer}>
            <MainButton
              label="로그인"
              size="S"
              width={buttonWidth}
              onPress={handleSubmit(onSubmit, onError)}
            />
          </View>
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
  buttonContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
});

export default Login;
