import { colors } from "@/constants/colors";
import { createAudioPlayer } from "expo-audio";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SvgProps } from "react-native-svg";

interface SquareButtonProps {
  Icon: React.FC<SvgProps>;
  onPress?: () => void;
  size?: "S" | "M";
}

const clickPlayer = createAudioPlayer(require("@/assets/musics/click.mp3"), {
  keepAudioSessionActive: true,
});
clickPlayer.volume = 1;

const playClickSound = () => {
  void clickPlayer
    .seekTo(0)
    .then(() => clickPlayer.play())
    .catch(() => clickPlayer.play());
};

const SquareButton = ({ Icon, onPress, size = "S" }: SquareButtonProps) => {
  const handlePress = () => {
    playClickSound();
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        {
          width: size === "S" ? 48 : 76,
          height: size === "S" ? 48 : 76,
          padding: size === "S" ? 8 : 18,
        },
        styles.button,
        pressed && styles.pressedButton,
      ]}
    >
      {({ pressed }) => (
        <View style={styles.iconContainer}>
          <Icon
            width={size === "S" ? 32 : 40}
            height={size === "S" ? 32 : 40}
            color={pressed ? colors.GOLD_NORMAL : colors.GREEN_NORMAL}
          />
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.WHITE_NORMAL,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.BLACK_NORMAL,
  },
  pressedButton: {
    backgroundColor: colors.GOLD_LIGHT_ACTIVE,
  },

  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default SquareButton;
