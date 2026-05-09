import { colors } from "@/constants/colors";
import { playSoundEffect } from "@/utils/soundEffects";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SvgProps } from "react-native-svg";

interface SquareButtonProps {
  disabled?: boolean;
  Icon: React.FC<SvgProps>;
  onPress?: () => void;
  size?: "S" | "M";
}

const SquareButton = ({
  disabled = false,
  Icon,
  onPress,
  size = "S",
}: SquareButtonProps) => {
  const handlePress = () => {
    if (disabled) {
      return;
    }

    playSoundEffect("basicClick");
    onPress?.();
  };

  return (
    <Pressable
      disabled={disabled}
      onPress={handlePress}
      style={({ pressed }) => [
        {
          width: size === "S" ? 48 : 76,
          height: size === "S" ? 48 : 76,
          padding: size === "S" ? 8 : 18,
        },
        styles.button,
        disabled && styles.disabledButton,
        pressed && styles.pressedButton,
      ]}
    >
      {({ pressed }) => (
        <View style={styles.iconContainer}>
          <Icon
            width={size === "S" ? 32 : 40}
            height={size === "S" ? 32 : 40}
            color={
              disabled
                ? colors.WHITE_NORMAL
                : pressed
                  ? colors.GOLD_NORMAL
                  : colors.GREEN_NORMAL
            }
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
  disabledButton: {
    backgroundColor: colors.GRAY_NORMAL_ACTIVE,
    borderColor: colors.SILVER_NORMAL_ACTIVE,
  },

  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default SquareButton;
