/**
 * @description  로그인/회원가입으로 진입하는 루트 화면입니다.
 * @depends      components/Login/Login.tsx, components/MainButton/MainButton.tsx, components/Register/RegisterContainer.tsx, utils/backgroundMusic.ts
 * @used-by      expo-router/entry
 * @side-effects titleLogin BGM 세션 시작, 로그인/회원가입 패널 UI 상태 변경
 */
import Login from "@/components/Login/Login";
import MainButton from "@/components/MainButton/MainButton";
import RegisterContainer from "@/components/Register/RegisterContainer";
import { colors } from "@/constants/colors";
import { useGameStore } from "@/stores/useGameStore";
import { startBackgroundMusicSession } from "@/utils/backgroundMusic";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const hasHandledInitialNavigationRef = useRef(false);
  const [hasHydratedStore, setHasHydratedStore] = useState(() =>
    useGameStore.persist.hasHydrated(),
  );
  const accessToken = useGameStore((state) => state.accessToken);
  const autoLoginEnabled = useGameStore((state) => state.autoLoginEnabled);
  const isGuestMode = useGameStore((state) => state.isGuestMode);
  const startGuestMode = useGameStore((state) => state.startGuestMode);
  const shouldSkipLoginScreen =
    hasHydratedStore && ((autoLoginEnabled && !!accessToken) || isGuestMode);

  useEffect(() => {
    if (hasHydratedStore) {
      return undefined;
    }

    const unsubscribe = useGameStore.persist.onFinishHydration(() => {
      setHasHydratedStore(true);
    });

    return unsubscribe;
  }, [hasHydratedStore]);

  useFocusEffect(
    useCallback(() => {
      if (!hasHydratedStore || shouldSkipLoginScreen) {
        return undefined;
      }

      return startBackgroundMusicSession("titleLogin");
    }, [hasHydratedStore, shouldSkipLoginScreen]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!shouldSkipLoginScreen) {
        return undefined;
      }

      if (hasHandledInitialNavigationRef.current) {
        return undefined;
      }

      hasHandledInitialNavigationRef.current = true;

      router.replace("/game");

      return undefined;
    }, [shouldSkipLoginScreen]),
  );

  if (!hasHydratedStore || shouldSkipLoginScreen) {
    return <View style={styles.backgroundImage} />;
  }

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
        <View style={[styles.buttonArea, { bottom: 68 }]}>
          <View style={styles.guestButtonOverlay}>
            <MainButton
              onPress={() => {
                startGuestMode();
                router.replace("/game");
              }}
              color="gray"
              label="게스트로 시작"
              size="S"
              width={156}
              height={48}
            />
          </View>
          <View style={styles.buttonContainer}>
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
  buttonArea: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  guestButtonOverlay: {
    position: "absolute",
    left: "50%",
    top: -58,
    marginLeft: 4,
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
