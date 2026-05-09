import type { CharacterGrade } from "@/constants/character";
import { CHARACTER_IMAGES } from "@/constants/character";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

interface EvolutionOverlayProps {
  fromGrade: CharacterGrade;
  phase: "blink" | "smoke" | null;
  toGrade: CharacterGrade;
  visible: boolean;
}

export const EVOLUTION_BLINK_DURATIONS = [
  1000, 800, 700, 600, 550, 500, 450, 400, 350, 300, 250, 200, 100, 100, 100,
  100, 100, 100, 100, 100, 100, 100, 100, 50, 50, 50, 50, 50, 50, 50, 50, 50,
] as const;

export const EVOLUTION_BLINK_DURATION_MS = EVOLUTION_BLINK_DURATIONS.reduce(
  (sum, duration) => sum + duration,
  0,
);

function EvolutionOverlay({
  fromGrade,
  phase,
  toGrade,
  visible,
}: EvolutionOverlayProps) {
  const bigSmokeOpacity = useRef(new Animated.Value(0)).current;
  const bigSmokeScale = useRef(new Animated.Value(0.9)).current;
  const blinkTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const smokeRevealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [showNextCharacter, setShowNextCharacter] = useState(false);

  useEffect(() => {
    bigSmokeOpacity.stopAnimation();
    bigSmokeScale.stopAnimation();
    blinkTimersRef.current.forEach((timer) => clearTimeout(timer));
    blinkTimersRef.current = [];
    if (smokeRevealTimerRef.current) {
      clearTimeout(smokeRevealTimerRef.current);
      smokeRevealTimerRef.current = null;
    }

    if (!visible || !phase) {
      setShowNextCharacter(false);
      bigSmokeOpacity.setValue(0);
      bigSmokeScale.setValue(0.9);
      return;
    }

    if (phase === "blink") {
      setShowNextCharacter(false);

      let elapsedMs = 0;
      let nextVisible = false;

      EVOLUTION_BLINK_DURATIONS.forEach((duration) => {
        elapsedMs += duration;
        nextVisible = !nextVisible;
        const visibleAtStep = nextVisible;

        const timer = setTimeout(() => {
          setShowNextCharacter(visibleAtStep);
        }, elapsedMs);

        blinkTimersRef.current.push(timer);
      });

      return;
    }

    setShowNextCharacter(false);
    bigSmokeOpacity.setValue(0);
    bigSmokeScale.setValue(0.9);

    smokeRevealTimerRef.current = setTimeout(() => {
      setShowNextCharacter(true);
      smokeRevealTimerRef.current = null;
    }, 180);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(bigSmokeOpacity, {
          duration: 280,
          easing: Easing.out(Easing.quad),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.delay(260),
        Animated.timing(bigSmokeOpacity, {
          duration: 460,
          easing: Easing.in(Easing.quad),
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(bigSmokeScale, {
        duration: 920,
        easing: Easing.out(Easing.quad),
        toValue: 1.18,
        useNativeDriver: true,
      }),
    ]).start();
  }, [bigSmokeOpacity, bigSmokeScale, phase, visible]);

  if (!visible || !phase) {
    return null;
  }

  const fromCharacterImage = CHARACTER_IMAGES.grades[fromGrade].happy1;
  const toCharacterImage = CHARACTER_IMAGES.grades[toGrade].happy1;
  const shouldShowNextSilhouette = phase === "blink" && showNextCharacter;

  return (
    <View pointerEvents="none" style={styles.root}>
      {showNextCharacter ? (
        <Image
          cachePolicy="memory-disk"
          contentFit="contain"
          source={toCharacterImage}
          style={[
            styles.characterImage,
            shouldShowNextSilhouette && styles.characterSilhouette,
          ]}
        />
      ) : (
        <Image
          cachePolicy="memory-disk"
          contentFit="contain"
          source={fromCharacterImage}
          style={styles.characterImage}
        />
      )}
      {phase === "smoke" ? (
        <View pointerEvents="none" style={styles.overlayLayer}>
          <Animated.View
            style={[
              styles.smokeWrapper,
              {
                opacity: bigSmokeOpacity,
                transform: [{ scale: bigSmokeScale }],
              },
            ]}
          >
            <Image
              cachePolicy="memory-disk"
              contentFit="contain"
              source={require("@/assets/images/big-smoke.png")}
              style={styles.bigSmoke}
            />
          </Animated.View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  overlayLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  characterImage: {
    width: "100%",
    height: "100%",
  },
  characterSilhouette: {
    tintColor: "#FFFFFF",
  },
  smokeWrapper: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  bigSmoke: {
    width: "124%",
    height: "124%",
  },
});

export default EvolutionOverlay;
