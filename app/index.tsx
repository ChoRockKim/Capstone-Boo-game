import MainButton from "@/components/Button/MainButton";
import { StatusBar } from "expo-status-bar";
import { Image, ImageBackground, StyleSheet, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function Index() {
  const insets = useSafeAreaInsets();
  console.log(insets);
  return (
    <ImageBackground
      style={styles.backgroundImage}
      source={require("../assets/images/main-building.png")}
      resizeMode="cover"
    >
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1 }}>
        {/* 메인 타이틀 부분 */}
        <View style={[styles.titleContainer, { top: insets.top + 19 }]}>
          <Image
            style={styles.mainTitle}
            source={require("../assets/images/main-title.png")}
            resizeMode="contain"
          />
        </View>
        {/* 버튼 부분 */}
        <View style={[styles.buttonContainer, { bottom: insets.bottom + 34 }]}>
          <MainButton color="gray" label="회원가입" width={156} />
          <MainButton color="blue" label="로그인" width={156} />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
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
