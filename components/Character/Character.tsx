/**
 * @description  현재 학년과 상태에 맞는 부 캐릭터 이미지를 표시하고 basic/happy 상태 애니메이션을 처리합니다.
 * @depends      constants/character.ts
 * @used-by      app/game/index.tsx, components/Room/RoomMiniBoo.tsx
 * @side-effects interval timer 관리, 이미지 표시 완료 콜백 호출
 */
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
