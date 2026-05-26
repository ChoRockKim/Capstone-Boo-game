/**
 * @description  로그인/회원가입으로 진입하는 루트 화면입니다.
 * @depends      components/Login/Login.tsx, components/MainButton/MainButton.tsx, components/Register/RegisterContainer.tsx, utils/backgroundMusic.ts
 * @used-by      expo-router/entry
 * @side-effects titleLogin BGM 세션 시작, 로그인/회원가입 패널 UI 상태 변경
 */
import { colors } from "@/constants/colors";
import Login from "@/components/Login/Login";
import MainButton from "@/components/MainButton/MainButton";
import RegisterContainer from "@/components/Register/RegisterContainer";
import { startBackgroundMusicSession } from "@/utils/backgroundMusic";
import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      return startBackgroundMusicSession("titleLogin");
    }, []),
  );

  return (
    <View style={styles.backgroundImage}>
      <Image
        style={[StyleSheet.absoluteFill]}
        source={require("../assets/images/main-building.png")}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <StatusBar style="light" hidden={true} />
      <SafeAreaView style={{ flex: 1 }}>
        {/* 메인 타이틀 부분 */}
        <View style={[styles.titleContainer, { top: 68 }]}>
          <Image
            style={styles.mainTitle}
            source={require("../assets/images/main-title.png")}
            contentFit="contain"
          />
        </View>
        {/* 버튼 부분 */}
        <View style={[styles.buttonContainer, { bottom: 68 }]}>
          <MainButton
            onPress={() => {
              setIsRegisterOpen(true);
            }}
            color="gray"
            label="회원가입"
            width={156}
          />
          <MainButton
            onPress={() => setIsLoginOpen(true)}
            color="blue"
            label="로그인"
            width={156}
          />
        </View>
      </SafeAreaView>
      {(isRegisterOpen || isLoginOpen) && (
        <View pointerEvents="none" style={styles.dimOverlay} />
      )}
      {isRegisterOpen && (
        <RegisterContainer
          isRegisterOpen={isRegisterOpen}
          setIsRegisterOpen={setIsRegisterOpen}
          isLoginOpen={isLoginOpen}
          setIsLoginOpen={setIsLoginOpen}
        />
      )}
      {isLoginOpen && <Login setIsLoginOpen={setIsLoginOpen} />}
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    backgroundColor: colors.GRAY_NORMAL,
  },
  buttonContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  dimOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.28)",
  },
  mainTitle: {
    width: 319,
    height: 136,
  },
  titleContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
  },
});
