import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { playSoundEffect } from "@/utils/soundEffects";
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

interface FriendPanelButtonProps {
  friendName: string;
  onVisitPress?: () => void;
  order: number;
  style?: StyleProp<ViewStyle>;
}

const FriendPanelButton = ({
  friendName,
  onVisitPress,
  order,
  style,
}: FriendPanelButtonProps) => {
  const handleVisitPress = () => {
    playSoundEffect("basicClick");
    onVisitPress?.();
  };

  return (
    <View style={[styles.button, style]}>
      <View style={styles.orderBox}>
        <Text style={styles.orderText}>{order}</Text>
      </View>
      <Text style={styles.nameText}>{friendName}</Text>
      <Pressable
        hitSlop={8}
        onPress={handleVisitPress}
        style={styles.actionButton}
      >
        {({ pressed }) => (
          <>
            <Feather
              name="chevron-right"
              size={16}
              color={pressed ? colors.BLACK_NORMAL : colors.GREEN_NORMAL}
            />
            <Text
              style={[
                styles.actionText,
                pressed && styles.actionTextPressed,
              ]}
            >
              방 구경
            </Text>
          </>
        )}
      </Pressable>
    </View>
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
  orderBox: {
    width: 28,
    height: 28,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.SILVER_LIGHT_HOVER,
    borderWidth: 1,
    borderColor: colors.SILVER_NORMAL,
  },
  orderText: {
    fontFamily: fonts.BASIC,
    fontSize: 14,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  nameText: {
    flex: 1,
    fontFamily: fonts.BASIC,
    fontSize: 20,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginLeft: 12,
    paddingVertical: 2,
  },
  actionText: {
    fontFamily: fonts.BASIC,
    fontSize: 20,
    color: colors.GREEN_NORMAL,
    includeFontPadding: false,
  },
  actionTextPressed: {
    color: colors.BLACK_NORMAL,
  },
});

export default FriendPanelButton;
