import ball from "@/assets/icons/ball.svg";
import cap from "@/assets/icons/cap.svg";
import home from "@/assets/icons/home.svg";
import meal from "@/assets/icons/meal.svg";
import setting from "@/assets/icons/setting.svg";
import user from "@/assets/icons/users-multiple.svg";
import Character from "@/components/Character/Character";
import CoinBox from "@/components/CoinBox/CoinBox";
import ProgressBar from "@/components/ProgressBar/ProgressBar";
import SquareButton from "@/components/SquareButton/SquareButton";
import { CharacterGrade, CharacterState } from "@/constants/character";
import { playBackgroundMusic } from "@/utils/backgroundMusic";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const CHARACTER_SIZE = 319;
const BIG_BUTTON_HEIGHT = 76;
const PROGRESS_BAR_GAP = 22;

const booStatus: {
  grade: CharacterGrade;
  maxXp: number;
  nickName: string;
  state: CharacterState;
  xp: number;
} = {
  grade: 1,
  maxXp: 1000,
  nickName: "찌들은 부",
  state: "basic1",
  xp: 700,
};

export default function Index() {
  const insets = useSafeAreaInsets();
  const bottomButtonOffset = Math.max(insets.bottom + 24, 46);
  const progressBarBottomOffset =
    bottomButtonOffset + BIG_BUTTON_HEIGHT + PROGRESS_BAR_GAP;

  useEffect(() => {
    playBackgroundMusic();
  }, []);

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
        <View style={styles.characterContainer}>
          <Character grade={booStatus.grade} state={booStatus.state} />
        </View>
      </View>
      <SafeAreaView style={styles.container}>
        <View style={styles.buttonContainer}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <SquareButton Icon={home} />
            <CoinBox />
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <SquareButton Icon={user} />
            <SquareButton Icon={setting} />
          </View>
        </View>
        <ProgressBar
          bottomOffset={progressBarBottomOffset}
          grade={booStatus.grade}
          maxXp={booStatus.maxXp}
          nickName={booStatus.nickName}
          xp={booStatus.xp}
        />
        <View
          style={[styles.bigButtonContainer, { bottom: bottomButtonOffset }]}
        >
          <SquareButton Icon={cap} size="M" />
          <SquareButton Icon={meal} size="M" />
          <SquareButton Icon={ball} size="M" />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bigButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    position: "absolute",
    left: 28,
    right: 28,
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
    transform: [
      { translateX: -CHARACTER_SIZE / 2 },
      { translateY: -CHARACTER_SIZE / 2 },
    ],
  },
});
