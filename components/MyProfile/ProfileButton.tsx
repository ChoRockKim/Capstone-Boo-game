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

interface ProfileButtonProps {
  icon: React.ReactNode | ((pressed: boolean) => React.ReactNode);
  label: string;
  onPress?: () => void;
  rightAccessory?: React.ReactNode | ((pressed: boolean) => React.ReactNode);
  style?: StyleProp<ViewStyle>;
  value?: string;
  valueColor?: string;
}

const ProfileButton = ({
  icon,
  label,
  onPress,
  rightAccessory,
  style,
  value,
  valueColor = colors.GREEN_NORMAL,
}: ProfileButtonProps) => {
  const handlePress = () => {
    playSoundEffect("basicClick");
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        style,
      ]}
    >
      {({ pressed }) => {
        const iconNode = typeof icon === "function" ? icon(pressed) : icon;
        const accessoryNode =
          typeof rightAccessory === "function"
            ? rightAccessory(pressed)
            : rightAccessory;

        return (
          <>
            <View style={[styles.iconBox, pressed && styles.iconBoxPressed]}>
              {iconNode}
            </View>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.rightContainer}>
              {accessoryNode}
              {value ? (
                <Text
                  numberOfLines={1}
                  style={[styles.valueText, { color: valueColor }]}
                >
                  {value}
                </Text>
              ) : null}
            </View>
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
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  rightContainer: {
    flex: 1.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginLeft: 12,
  },
  valueText: {
    flexShrink: 1,
    fontFamily: fonts.BASIC,
    fontSize: 20,
    includeFontPadding: false,
    textAlign: "right",
  },
});

export default ProfileButton;
