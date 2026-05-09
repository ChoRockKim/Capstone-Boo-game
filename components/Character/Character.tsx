import {
  CHARACTER_IMAGES,
  CharacterGrade,
  CharacterState,
  getNextCharacterState,
} from "@/constants/character";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

interface CharacterProps {
  animationIntervalMs?: number;
  grade: CharacterGrade;
  onImageReady?: () => void;
  state: CharacterState;
}

const Character = ({
  animationIntervalMs = 800,
  grade,
  onImageReady,
  state,
}: CharacterProps) => {
  const [currentState, setCurrentState] = useState<CharacterState>(state);
  const characterImage = CHARACTER_IMAGES.grades[grade][currentState];

  useEffect(() => {
    setCurrentState(state);
  }, [state]);

  useEffect(() => {
    if (getNextCharacterState(state) === state) return;

    const timer = setInterval(() => {
      setCurrentState((prev) => getNextCharacterState(prev));
    }, animationIntervalMs);

    return () => clearInterval(timer);
  }, [animationIntervalMs, state]);

  return (
    <View style={styles.container}>
      <Image
        style={styles.image}
        source={characterImage}
        contentFit="contain"
        cachePolicy="memory-disk"
        onDisplay={onImageReady}
        onError={onImageReady}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});

export default Character;
