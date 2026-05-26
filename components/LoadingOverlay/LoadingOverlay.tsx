/**
 * @description  게임 에셋 준비 중 배경/달걀/Loading 텍스트 애니메이션을 표시합니다.
 * @depends      components/LoadingOverlay/LoadingOverlayAssets.ts, constants/colors.ts, constants/fonts.ts
 * @used-by      app/game/index.tsx
 * @side-effects loading frame interval 관리
 */
import {
  LOADING_OVERLAY_BACKGROUND_IMAGE,
  LOADING_OVERLAY_EGG_CLOSED_IMAGE,
  LOADING_OVERLAY_EGG_OPENED_IMAGE,
  preloadLoadingOverlayAssets,
} from "@/components/LoadingOverlay/LoadingOverlayAssets";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

interface LoadingOverlayProps {
  label?: string;
}

const LOADING_SEQUENCE = [
  { openedEggCount: 0, textLength: 2 },
  { openedEggCount: 1, textLength: 5 },
  { openedEggCount: 2, textLength: 7 },
  { openedEggCount: 3, textLength: 10 },
  { openedEggCount: 3, textLength: 10 },
  { openedEggCount: 0, textLength: 0 },
];
const LOADING_FRAME_MS = 420;

const LoadingOverlay = ({
  label = "Loading...",
}: LoadingOverlayProps) => {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isBackgroundVisible, setIsBackgroundVisible] = useState(false);
  const currentFrame = LOADING_SEQUENCE[frameIndex];
  const visibleLabel = label.slice(0, currentFrame.textLength);

  useEffect(() => {
    void preloadLoadingOverlayAssets();

    const animationTimer = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % LOADING_SEQUENCE.length);
    }, LOADING_FRAME_MS);

    return () => clearInterval(animationTimer);
  }, []);

  return (
    <View pointerEvents="auto" style={styles.overlay}>
      <Image
        style={[
          StyleSheet.absoluteFill,
          !isBackgroundVisible && styles.hiddenImage,
        ]}
        source={LOADING_OVERLAY_BACKGROUND_IMAGE}
        contentFit="cover"
        cachePolicy="memory-disk"
        onDisplay={() => setIsBackgroundVisible(true)}
        onError={() => setIsBackgroundVisible(true)}
      />
      <View style={styles.content}>
        <View style={styles.eggRow}>
          {[0, 1, 2].map((eggIndex) => (
            <Image
              key={eggIndex}
              style={styles.eggImage}
              source={
                eggIndex < currentFrame.openedEggCount
                  ? LOADING_OVERLAY_EGG_OPENED_IMAGE
                  : LOADING_OVERLAY_EGG_CLOSED_IMAGE
              }
              contentFit="contain"
              cachePolicy="memory-disk"
            />
          ))}
        </View>
        <View style={styles.labelBox}>
          <Text style={[styles.label, styles.labelPlaceholder]}>{label}</Text>
          <Text style={[styles.label, styles.labelVisible]}>
            {visibleLabel}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.GRAY_NORMAL,
    zIndex: 2000,
    elevation: 2000,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  hiddenImage: {
    opacity: 0,
  },
  eggRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    minHeight: 52,
    marginBottom: 16,
  },
  eggImage: {
    width: 42,
    height: 52,
  },
  labelBox: {
    minWidth: 230,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: fonts.BASIC,
    fontSize: 34,
    lineHeight: 42,
    color: colors.WHITE_NORMAL,
    textAlign: "center",
    includeFontPadding: false,
    textShadowColor: colors.BLACK_NORMAL,
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },
  labelPlaceholder: {
    opacity: 0,
  },
  labelVisible: {
    position: "absolute",
  },
});

export default LoadingOverlay;
