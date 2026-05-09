import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { playSoundEffect } from "@/utils/soundEffects";
import React from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

interface OptionButtonProps {
  icon: React.ReactNode | ((pressed: boolean) => React.ReactNode);
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textColor?: string;
}

const OptionButton = ({
  icon,
  label,
  onPress,
  disabled = false,
  style,
  textColor = colors.BLACK_NORMAL,
}: OptionButtonProps) => {
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
        styles.button,
        pressed && !disabled && styles.buttonPressed,
        disabled && styles.buttonDisabled,
        style,
      ]}
    >
      {({ pressed }) => {
        const isPressed = pressed && !disabled;
        const iconNode = typeof icon === "function" ? icon(isPressed) : icon;

        return (
          <>
            <View style={[styles.iconBox, isPressed && styles.iconBoxPressed]}>
              {iconNode}
            </View>
            <Text style={[styles.label, { color: textColor }]}>{label}</Text>
          </>
        );
      }}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: "100%",
    minHeight: 40,
    borderWidth: 1.5,
    borderRadius: 16,
    borderColor: colors.GOLD_NORMAL,
    borderStyle: "dotted",
    backgroundColor: colors.WHITE_NORMAL,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  buttonPressed: {
    backgroundColor: colors.GOLD_LIGHT_ACTIVE,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  iconBox: {
    width: 28,
    height: 28,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.SILVER_LIGHT_HOVER,
    borderWidth: 1,
    borderColor: colors.SILVER_NORMAL,
  },
  iconBoxPressed: {
    backgroundColor: colors.GOLD_LIGHT_ACTIVE,
    borderColor: colors.WHITE_DARK,
  },
  label: {
    flex: 1,
    fontFamily: fonts.BASIC,
    fontSize: 20,
    includeFontPadding: false,
  },
});

export default OptionButton;
