import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface LoadingOverlayProps {
  label?: string;
}

const LoadingOverlay = ({
  label = "불러오는 중...",
}: LoadingOverlayProps) => {
  return (
    <View pointerEvents="auto" style={styles.overlay}>
      <View style={styles.panel}>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(18, 18, 49, 0.22)",
    zIndex: 2000,
    elevation: 2000,
  },
  panel: {
    minWidth: 180,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: colors.BLACK_NORMAL,
    backgroundColor: colors.WHITE_NORMAL,
  },
  label: {
    fontFamily: fonts.BASIC,
    fontSize: 22,
    lineHeight: 28,
    color: colors.BLACK_NORMAL,
    textAlign: "center",
    includeFontPadding: false,
  },
});

export default LoadingOverlay;
