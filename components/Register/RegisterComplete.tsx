import CrossIcon from "@/assets/icons/cross.svg";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import MainButton from "../MainButton/MainButton";

interface RegisterCompleteProps {
  setIsRegisterOpen: (value: boolean) => void;
  setIsLoginOpen: (value: boolean) => void;
}

const RegisterComplete = ({
  setIsRegisterOpen,
  setIsLoginOpen,
}: RegisterCompleteProps) => {
  const { width } = useWindowDimensions();
  const buttonWidth = width - 56;

  const handleSubmit = () => {
    setIsRegisterOpen(false);
    setIsLoginOpen(true);
  };
  return (
    <View style={styles.wrapper}>
      <View style={[styles.container]}>
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
          <Text style={styles.mainText}>가입이 완료되었습니다!</Text>
        </View>
        <View style={styles.buttonContainer}>
          <MainButton
            onPress={handleSubmit}
            label="로그인 하러 가기"
            size="S"
            width={buttonWidth}
          />
        </View>
      </View>
    </View>
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
    height: 208,
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
    marginTop: 10,
  },
  buttonContainer: {
    alignItems: "center",
    marginTop: 10,
  },
});

export default RegisterComplete;
