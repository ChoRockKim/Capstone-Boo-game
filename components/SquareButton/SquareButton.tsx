/**
 * @description  메인/마이룸에서 쓰는 정사각 픽셀 아이콘 버튼입니다.
 * @depends      constants/colors.ts, utils/soundEffects.ts
 * @used-by      app/game/index.tsx, app/room/index.tsx
 * @side-effects basicClick SFX 재생, onPress 콜백 호출
 */
import { colors } from "@/constants/colors";
import { playSoundEffect } from "@/utils/soundEffects";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SvgProps } from "react-native-svg";

interface SquareButtonProps {
  active?: boolean;
  allowDisabledPress?: boolean;
  borderWidth?: number;
  disabled?: boolean;
  Icon: React.FC<SvgProps>;
  onPress?: () => void;
  shadow?: boolean;
  size?: "S" | "M";
}

const SquareButton = ({
  active = false,
  allowDisabledPress = false,
  borderWidth = 1,
  disabled = false,
  Icon,
  onPress,
  shadow = false,
  size = "S",
}: SquareButtonProps) => {
  const handlePress = () => {
    if (disabled && !allowDisabledPress) {
      return;
    }

    playSoundEffect("basicClick");
    onPress?.();
  };

  return (
    <Pressable
      disabled={disabled && !allowDisabledPress}
      onPress={handlePress}
      style={({ pressed }) => [
        {
          width: size === "S" ? 48 : 76,
          height: size === "S" ? 48 : 76,
          padding: size === "S" ? 8 : 18,
        },
        styles.button,
        { borderWidth },
        shadow && styles.shadow,
        active && styles.activeButton,
        disabled && styles.disabledButton,
        pressed && !disabled && !active && styles.pressedButton,
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
                : active
                  ? colors.GOLD_NORMAL
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
    borderColor: colors.BLACK_NORMAL,
  },
  pressedButton: {
    backgroundColor: colors.GOLD_LIGHT_ACTIVE,
  },
  activeButton: {
    backgroundColor: colors.GOLD_LIGHT_ACTIVE,
    borderColor: colors.WHITE_NORMAL,
  },
  disabledButton: {
    backgroundColor: colors.GRAY_NORMAL_ACTIVE,
    borderColor: colors.SILVER_NORMAL_ACTIVE,
  },
  shadow: {
    elevation: 3,
    shadowColor: colors.NAVY_NORMAL,
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 2,
  },

  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default SquareButton;
