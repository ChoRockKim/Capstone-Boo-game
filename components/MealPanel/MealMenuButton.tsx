import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MealMenuItem } from "./MealMenuData";

interface MealMenuButtonProps {
  item: MealMenuItem;
  onPress: () => void;
  selected?: boolean;
  width: number;
}

const MealMenuButton = ({
  item,
  onPress,
  selected = false,
  width,
}: MealMenuButtonProps) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { width },
        selected && styles.selectedContainer,
        pressed && styles.pressedContainer,
      ]}
    >
      <Image
        style={styles.image}
        source={item.image}
        contentFit="contain"
        cachePolicy="memory-disk"
      />
      <View style={styles.textBlock}>
        <Text style={styles.nameText}>{item.name}</Text>
        <Text style={styles.priceText}>$ {item.price}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 126,
    paddingTop: 6,
    paddingBottom: 10,
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "transparent",
    borderStyle: "dashed",
    alignItems: "center",
  },
  selectedContainer: {
    borderColor: colors.GOLD_NORMAL,
  },
  pressedContainer: {
    backgroundColor: colors.GOLD_LIGHT_ACTIVE,
  },
  image: {
    width: 34,
    height: 34,
    marginBottom: 8,
  },
  textBlock: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nameText: {
    fontFamily: fonts.BASIC,
    fontSize: 12,
    lineHeight: 17,
    color: colors.BLACK_NORMAL,
    textAlign: "center",
    includeFontPadding: false,
  },
  priceText: {
    fontFamily: fonts.BASIC,
    fontSize: 14,
    lineHeight: 16,
    color: colors.BLACK_NORMAL,
    textAlign: "center",
    includeFontPadding: false,
  },
});

export default MealMenuButton;
