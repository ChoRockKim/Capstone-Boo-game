import CoinIcon from "@/assets/icons/coin.svg";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface CoinBoxProps {
  coin: number;
  dimmed?: boolean;
}

function CoinBox({ coin, dimmed = false }: CoinBoxProps) {
  return (
    <View style={styles.container}>
      <CoinIcon width={32} height={32} />
      <Text style={styles.coinText}>{coin}</Text>
      {dimmed ? <View pointerEvents="none" style={styles.dimOverlay} /> : null}
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
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 4,
  },
  coinText: {
    fontFamily: fonts.BASIC,
    fontSize: 24,
    alignItems: "center",
  },
});

export default CoinBox;
