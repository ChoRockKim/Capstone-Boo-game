import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CHARACTER_SIZE = 319;

export default function Index() {
  return (
    <View style={styles.backgroundImage}>
      <StatusBar hidden={true} />
      <Image
        style={StyleSheet.absoluteFill}
        source={require("../../assets/images/inGameMain.png")}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <View pointerEvents="none" style={styles.characterLayer}>
        <View style={styles.characterContainer}></View>
      </View>
      <SafeAreaView style={styles.container}></SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingVertical: 24,
    paddingHorizontal: 28,
  },
  characterLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  characterContainer: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: CHARACTER_SIZE,
    height: CHARACTER_SIZE,
    backgroundColor: "blue",
    transform: [
      { translateX: -CHARACTER_SIZE / 2 },
      { translateY: -CHARACTER_SIZE / 2 },
    ],
  },
});
