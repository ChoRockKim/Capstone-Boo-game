/**
 * @description  코인 아이콘과 현재 코인 수를 표시하는 공통 UI입니다.
 * @depends      assets/icons/coin.svg, constants/colors.ts, constants/fonts.ts
 * @used-by      app/game/index.tsx, app/room/index.tsx
 * @side-effects 없음
 */
import CoinIcon from "@/assets/icons/coin.svg";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface CoinBoxProps {
  borderWidth?: number;
  coin: number;
  dimmed?: boolean;
  shadow?: boolean;
}

function CoinBox({
  borderWidth = 1,
  coin,
  dimmed = false,
  shadow = false,
}: CoinBoxProps) {
  return (
    <View style={[styles.container, { borderWidth }, shadow && styles.shadow]}>
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
    borderColor: colors.BLACK_NORMAL,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dimOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 4,
  },
  coinText: {
    fontFamily: fonts.BASIC,
    fontSize: 24,
    alignItems: "center",
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
});

export default CoinBox;
