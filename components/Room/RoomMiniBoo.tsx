/**
 * @description  마이룸 내부의 미니 부 이동 애니메이션과 방 전용 말풍선을 표시합니다.
 * @depends      components/BooChat/BooChat.tsx, components/BooChat/BooChatList.ts, components/Character/Character.tsx, components/Room/RoomData.ts, constants/character.ts
 * @used-by      app/room/index.tsx
 * @side-effects Animated loop/timing, room chat timeout 관리
 */
import BooChat from "@/components/BooChat/BooChat";
import { getRandomRoomBooChat } from "@/components/BooChat/BooChatList";
import Character from "@/components/Character/Character";
import {
  DEFAULT_ROOM_LAYOUT,
  ROOM_CANVAS_HEIGHT,
  ROOM_CANVAS_WIDTH,
  ROOM_MINI_BOO_LAYOUT,
  ROOM_MINI_BOO_WALK_POINTS,
  ROOM_SENIOR_MINI_BOO_ON_BED_LAYOUT,
  type RoomMiniBooWalkPoint,
} from "@/components/Room/RoomData";
import { CharacterGrade, CharacterState } from "@/constants/character";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet } from "react-native";

interface RoomMiniBooProps {
  grade: CharacterGrade;
  roomHeight: number;
  roomWidth: number;
  state: CharacterState;
}

const DEFAULT_WALK_DURATION_MS = 5200;
const DEFAULT_IDLE_DURATION_MS = 2200;
const ROOM_CHAT_FIRST_DELAY_MS = 1400;
const ROOM_CHAT_INTERVAL_MS = 8500;
const ROOM_CHAT_VISIBLE_MS = 2600;

const getRenderedPoint = (
  point: RoomMiniBooWalkPoint,
  roomWidth: number,
  roomHeight: number,
) => ({
  x: (point.x / ROOM_CANVAS_WIDTH) * roomWidth,
  y: (point.y / ROOM_CANVAS_HEIGHT) * roomHeight,
});

const getRenderedSize = (
  roomWidth: number,
  roomHeight: number,
  layout = ROOM_MINI_BOO_LAYOUT,
) => ({
  height: (layout.height / ROOM_CANVAS_HEIGHT) * roomHeight,
  width: (layout.width / ROOM_CANVAS_WIDTH) * roomWidth,
});

const getRenderedSeniorOnBedPoint = (
  roomWidth: number,
  roomHeight: number,
) => ({
  x:
    ((DEFAULT_ROOM_LAYOUT.bed.x +
      ROOM_SENIOR_MINI_BOO_ON_BED_LAYOUT.bedOffsetX) /
      ROOM_CANVAS_WIDTH) *
    roomWidth,
  y:
    ((DEFAULT_ROOM_LAYOUT.bed.y +
      ROOM_SENIOR_MINI_BOO_ON_BED_LAYOUT.bedOffsetY) /
      ROOM_CANVAS_HEIGHT) *
    roomHeight,
});

const RoomMiniBoo = ({
  grade,
  roomHeight,
  roomWidth,
  state,
}: RoomMiniBooProps) => {
  const initialPoint = getRenderedPoint(
    ROOM_MINI_BOO_WALK_POINTS[0],
    roomWidth,
    roomHeight,
  );
  const position = useRef(new Animated.ValueXY(initialPoint)).current;
  const bobAnimation = useRef(new Animated.Value(0)).current;
  const walkIndexRef = useRef(0);
  const chatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [facingDirection, setFacingDirection] = useState(1);
  const [isWalking, setIsWalking] = useState(false);
  const [roomChatMessage, setRoomChatMessage] = useState("");
  const [isRoomChatVisible, setIsRoomChatVisible] = useState(false);
  const isSeniorGrade = grade === 4;
  const seniorPoint = useMemo(
    () => getRenderedSeniorOnBedPoint(roomWidth, roomHeight),
    [roomHeight, roomWidth],
  );
  const renderedSize = useMemo(
    () =>
      getRenderedSize(
        roomWidth,
        roomHeight,
        isSeniorGrade
          ? ROOM_SENIOR_MINI_BOO_ON_BED_LAYOUT
          : ROOM_MINI_BOO_LAYOUT,
      ),
    [isSeniorGrade, roomHeight, roomWidth],
  );

  useEffect(() => {
    if (isSeniorGrade) {
      bobAnimation.setValue(0);

      return undefined;
    }

    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnimation, {
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(bobAnimation, {
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    bobLoop.start();

    return () => {
      bobLoop.stop();
      bobAnimation.setValue(0);
    };
  }, [bobAnimation, isSeniorGrade]);

  useEffect(() => {
    const clearChatTimers = () => {
      if (chatTimerRef.current) {
        clearTimeout(chatTimerRef.current);
        chatTimerRef.current = null;
      }

      if (chatHideTimerRef.current) {
        clearTimeout(chatHideTimerRef.current);
        chatHideTimerRef.current = null;
      }
    };
    const showRoomChat = () => {
      setRoomChatMessage(getRandomRoomBooChat());
      setIsRoomChatVisible(true);

      if (chatHideTimerRef.current) {
        clearTimeout(chatHideTimerRef.current);
      }

      chatHideTimerRef.current = setTimeout(() => {
        chatHideTimerRef.current = null;
        setIsRoomChatVisible(false);
      }, ROOM_CHAT_VISIBLE_MS);
    };
    const scheduleRoomChat = (delay: number) => {
      chatTimerRef.current = setTimeout(() => {
        chatTimerRef.current = null;
        showRoomChat();
        scheduleRoomChat(ROOM_CHAT_INTERVAL_MS);
      }, delay);
    };

    scheduleRoomChat(ROOM_CHAT_FIRST_DELAY_MS);

    return () => {
      clearChatTimers();
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    const firstPoint = isSeniorGrade
      ? seniorPoint
      : getRenderedPoint(
          ROOM_MINI_BOO_WALK_POINTS[0],
          roomWidth,
          roomHeight,
        );

    position.stopAnimation();
    position.setValue(firstPoint);
    walkIndexRef.current = 0;
    setIsWalking(false);
    setFacingDirection(1);

    if (isSeniorGrade) {
      return () => {
        isActive = false;
        position.stopAnimation();
      };
    }

    const walkToNextPoint = () => {
      const currentIndex = walkIndexRef.current;
      const nextIndex = (currentIndex + 1) % ROOM_MINI_BOO_WALK_POINTS.length;
      const currentPoint = ROOM_MINI_BOO_WALK_POINTS[currentIndex];
      const nextPoint = ROOM_MINI_BOO_WALK_POINTS[nextIndex];
      const renderedNextPoint = getRenderedPoint(
        nextPoint,
        roomWidth,
        roomHeight,
      );

      idleTimer = setTimeout(() => {
        if (!isActive) {
          return;
        }

        setFacingDirection(nextPoint.x >= currentPoint.x ? 1 : -1);
        setIsWalking(true);

        Animated.timing(position, {
          duration: nextPoint.durationMs ?? DEFAULT_WALK_DURATION_MS,
          easing: Easing.inOut(Easing.quad),
          toValue: renderedNextPoint,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (!isActive || !finished) {
            return;
          }

          walkIndexRef.current = nextIndex;
          setIsWalking(false);
          walkToNextPoint();
        });
      }, currentPoint.pauseMs ?? DEFAULT_IDLE_DURATION_MS);
    };

    walkToNextPoint();

    return () => {
      isActive = false;

      if (idleTimer) {
        clearTimeout(idleTimer);
      }

      position.stopAnimation();
    };
  }, [isSeniorGrade, position, roomHeight, roomWidth, seniorPoint]);

  const bobTranslateY = bobAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          height: renderedSize.height,
          transform: [
            { translateX: position.x },
            { translateY: position.y },
            { translateY: bobTranslateY },
          ],
          width: renderedSize.width,
          zIndex: isSeniorGrade
            ? ROOM_SENIOR_MINI_BOO_ON_BED_LAYOUT.zIndex
            : ROOM_MINI_BOO_LAYOUT.zIndex,
        },
      ]}
    >
      <BooChat
        maxTextWidth={220}
        message={roomChatMessage}
        scale={0.62}
        style={[
          styles.chatBubble,
          {
            bottom: renderedSize.height - 3,
          },
        ]}
        visible={isRoomChatVisible}
      />
      <Animated.View
        style={[
          styles.characterLayer,
          { transform: [{ scaleX: facingDirection }] },
        ]}
      >
        <Character
          animationIntervalMs={isSeniorGrade ? 1200 : isWalking ? 480 : 900}
          grade={grade}
          state={state}
        />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    overflow: "visible",
    top: 0,
  },
  characterLayer: {
    flex: 1,
  },
  chatBubble: {
    position: "absolute",
    left: -10,
    zIndex: 2,
  },
});

export default RoomMiniBoo;
