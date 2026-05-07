import CoinIcon from "@/assets/icons/coin.svg";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

interface CoinBoxProps {}

function CoinBox({}: CoinBoxProps) {
  // 추후 커스텀훅으로 coin 가져오게 할 예정
  const [coin, setCoin] = useState(1000);
  return (
    <View style={styles.container}>
      <CoinIcon width={32} height={32} />
      <Text style={styles.coinText}>{coin}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    backgroundColor: colors.WHITE_NORMAL,
    minWidth: 102,
    maxWidth: 130,
    height: 48,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.BLACK_NORMAL,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  coinText: {
    fontFamily: fonts.BASIC,
    fontSize: 24,
    alignItems: "center",
  },
});

export default CoinBox;
