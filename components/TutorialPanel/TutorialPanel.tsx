/**
 * @description  최초 게임 진입 튜토리얼 확인창과 튜토리얼 이미지 뷰어를 표시합니다.
 * @depends      components/TutorialPanel/TutorialData.ts, utils/soundEffects.ts
 * @used-by      app/game/index.tsx
 * @side-effects basicClick SFX 재생, 튜토리얼 완료 콜백 호출
 */
import CrossIcon from "@/assets/icons/cross.svg";
import { TUTORIAL_IMAGE_ASSETS } from "@/components/TutorialPanel/TutorialData";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { playSoundEffect } from "@/utils/soundEffects";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface TutorialPanelProps {
  onComplete: () => void;
}

type TutorialMode = "confirm" | "viewer";

const TutorialPanel = ({ onComplete }: TutorialPanelProps) => {
  const [mode, setMode] = useState<TutorialMode>("confirm");
  const [currentIndex, setCurrentIndex] = useState(0);
  const isFirstTutorial = currentIndex === 0;
  const isLastTutorial = currentIndex === TUTORIAL_IMAGE_ASSETS.length - 1;

  const completeTutorial = () => {
    playSoundEffect("basicClick");
    onComplete();
  };

  const startTutorial = () => {
    playSoundEffect("basicClick");
    setMode("viewer");
  };

  const goPrevious = () => {
    if (isFirstTutorial) {
      return;
    }

    playSoundEffect("basicClick");
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const goNext = () => {
    playSoundEffect("basicClick");

    if (isLastTutorial) {
      onComplete();
      return;
    }

    setCurrentIndex((prev) =>
      Math.min(prev + 1, TUTORIAL_IMAGE_ASSETS.length - 1),
    );
  };

  if (mode === "viewer") {
    return (
      <View style={styles.viewerOverlay}>
        <Image
          cachePolicy="memory-disk"
          contentFit="contain"
          source={TUTORIAL_IMAGE_ASSETS[currentIndex]}
          style={styles.tutorialImage}
        />
        <Pressable
          disabled={isFirstTutorial}
          onPress={goPrevious}
          style={[styles.viewerHitArea, styles.previousHitArea]}
        />
        <Pressable
          onPress={goNext}
          style={[styles.viewerHitArea, styles.nextHitArea]}
        />
      </View>
    );
  }

  return (
    <View style={styles.confirmOverlay}>
      <View style={styles.confirmCard}>
        <View style={styles.headerRow}>
          <Text style={styles.headerText}>튜토리얼</Text>
          <Pressable onPress={completeTutorial} style={styles.headerButton}>
            <CrossIcon width={24} height={24} fill={colors.BLACK_NORMAL} />
          </Pressable>
        </View>
        <Text style={styles.messageText}>튜토리얼을 진행하시겠습니까?</Text>
        <View style={styles.choiceList}>
          <Pressable onPress={startTutorial} style={styles.choiceButton}>
            {({ pressed }) => (
              <>
                <Feather
                  color={pressed ? colors.GREEN_NORMAL : colors.BLACK_NORMAL}
                  name="chevron-right"
                  size={18}
                />
                <Text
                  style={[
                    styles.choiceText,
                    pressed && styles.choiceTextPressed,
                  ]}
                >
                  예
                </Text>
              </>
            )}
          </Pressable>
          <Pressable onPress={completeTutorial} style={styles.choiceButton}>
            {({ pressed }) => (
              <>
                <Feather
                  color={pressed ? colors.GREEN_NORMAL : colors.BLACK_NORMAL}
                  name="chevron-right"
                  size={18}
                />
                <Text
                  style={[
                    styles.choiceText,
                    pressed && styles.choiceTextPressed,
                  ]}
                >
                  아니요
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  confirmOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "flex-end",
    backgroundColor: "rgba(18, 18, 49, 0.28)",
    zIndex: 1100,
    elevation: 1100,
  },
  confirmCard: {
    width: "100%",
    paddingHorizontal: 28,
    paddingVertical: 28,
    borderWidth: 2,
    borderColor: colors.BLACK_NORMAL,
    backgroundColor: colors.WHITE_NORMAL,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  headerText: {
    flex: 1,
    fontFamily: fonts.BASIC,
    fontSize: 24,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  headerButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  messageText: {
    fontFamily: fonts.BASIC,
    fontSize: 20,
    lineHeight: 28,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
    textAlign: "center",
  },
  choiceList: {
    gap: 20,
    marginTop: 28,
  },
  choiceButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 2,
  },
  choiceText: {
    fontFamily: fonts.BASIC,
    fontSize: 20,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  choiceTextPressed: {
    color: colors.GREEN_NORMAL,
  },
  viewerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(18, 18, 49, 0.72)",
    zIndex: 1100,
    elevation: 1100,
  },
  tutorialImage: {
    ...StyleSheet.absoluteFill,
  },
  viewerHitArea: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "42%",
  },
  previousHitArea: {
    left: 0,
  },
  nextHitArea: {
    right: 0,
  },
});

export default TutorialPanel;
