import CrossIcon from "@/assets/icons/cross.svg";
import { colors } from "@/constants/colors";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface RegisterProps {
  isRegisterOpen: boolean;
  setIsRegisterOpen: (value: boolean) => void;
}

const Register = ({ isRegisterOpen, setIsRegisterOpen }: RegisterProps) => {
  const [email, setEmail] = useState<string>("");

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === "ios" ? "position" : "height"}
    >
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>회원가입</Text>
          <Pressable>
            <CrossIcon
              width={24}
              height={24}
              fill="black"
              onPress={() => setIsRegisterOpen(false)}
            />
          </Pressable>
        </View>
        <View style={styles.mainContainer}>
          <Text style={styles.mainText}>학교 이메일을 입력해주세요</Text>
        </View>

        <TextInput
          style={styles.inputText}
          placeholder="ex) boo@hufs.ac.kr"
          placeholderTextColor={colors.WHITE_DARK}
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="done"
          onChangeText={setEmail}
          value={email}
          onSubmitEditing={() => console.log(email)}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  container: {
    backgroundColor: colors.WHITE_NORMAL,
    height: 188,
    fontFamily: "NeoDunggeunmo",
    fontSize: 20,
    paddingHorizontal: 28,
    paddingVertical: 24,
  },
  headerText: {
    fontFamily: "NeoDunggeunmo",
    fontSize: 24,
    flex: 1,
  },
  headerContainer: {
    marginBottom: 10,
    flexDirection: "row",
  },
  mainText: {
    fontFamily: "NeoDunggeunmo",
    fontSize: 23,
  },
  mainContainer: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  inputText: {
    backgroundColor: colors.SILVER_LIGHT_HOVER,
    height: 40,
    borderRadius: 12,
    marginTop: 10,
    fontFamily: "NeoDunggeunmo",
    paddingVertical: 6,
    paddingHorizontal: 12,
    fontSize: 20,
  },
});

export default Register;
