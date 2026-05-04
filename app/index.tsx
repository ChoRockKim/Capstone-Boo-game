import MainButton from "@/components/Button/MainButton";
import { ImageBackground, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  return (
    <ImageBackground
      style={styles.backgroundImage}
      source={require("../assets/images/main-building.png")}
      resizeMode="cover"
    >
      <SafeAreaView>
        <MainButton />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
});
