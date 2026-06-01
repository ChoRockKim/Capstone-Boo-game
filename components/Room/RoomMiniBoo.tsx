/**
 * @description  마이룸 내부의 미니 부 이동/잡기 애니메이션과 방 전용 말풍선을 표시합니다.
 * @depends      components/BooChat/BooChat.tsx, components/BooChat/BooChatList.ts, components/Character/Character.tsx, components/Room/RoomData.ts, constants/character.ts
 * @used-by      app/room/index.tsx
 * @side-effects Animated loop/timing, PanResponder long press/drag, room chat timeout 관리
 */
/* eslint-disable react-hooks/refs, react-hooks/set-state-in-effect, react-hooks/purity, react-hooks/exhaustive-deps -- PanResponder and React Native Animated values require imperative refs/styles here. */
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
import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, PanResponder, StyleSheet } from "react-native";

interface RoomMiniBooProps {
  grade: CharacterGrade;
  grabbable?: boolean;
  roomHeight: number;
  roomWidth: number;
  state: CharacterState;
}

export type RoomMiniBooDropZonePoint = {
  x: number;
  y: number;
};

const DEFAULT_WALK_DURATION_MS = 5200;
const DEFAULT_IDLE_DURATION_MS = 2200;
const ROOM_CHAT_FIRST_DELAY_MS = 1400;
const ROOM_CHAT_INTERVAL_MS = 8500;
const ROOM_CHAT_VISIBLE_MS = 2600;
const GRAB_LONG_PRESS_MS = 200;
const GRAB_RETURN_DURATION_MS = 260;
const GRAB_FINGER_VISIBILITY_OFFSET_Y = -46;
const GRAB_CHAT_MESSAGES = ["앗!", "살살 잡아줘!", "부우?"] as const;
const GRAB_DIZZY_HOLD_MS = 2600;
const GRAB_DIZZY_SHAKE_DISTANCE = 230;
const GRAB_DIZZY_SHAKE_VELOCITY = 1.65;
const GRAB_DIZZY_MESSAGES = ["어지러워...", "부우... 빙글빙글...", "천천히 흔들어줘!"] as const;
const ROOM_MINI_BOO_DROP_ZONE_POINTS: RoomMiniBooDropZonePoint[] = [
  { x: 650, y: 580 },
  { x: 1240, y: 915 },
  { x: 650, y: 1250 },
  { x: 50, y: 915 },
];

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

const getRenderedDropZonePoints = (roomWidth: number, roomHeight: number) =>
  ROOM_MINI_BOO_DROP_ZONE_POINTS.map((point) => ({
    x: (point.x / ROOM_CANVAS_WIDTH) * roomWidth,
    y: (point.y / ROOM_CANVAS_HEIGHT) * roomHeight,
  }));

const isPointInPolygon = (
  point: RoomMiniBooDropZonePoint,
  polygon: RoomMiniBooDropZonePoint[],
) => {
  let isInside = false;

  for (
    let currentIndex = 0, previousIndex = polygon.length - 1;
    currentIndex < polygon.length;
    previousIndex = currentIndex, currentIndex += 1
  ) {
    const currentPoint = polygon[currentIndex];
    const previousPoint = polygon[previousIndex];
    const doesRayCrossEdge =
      currentPoint.y > point.y !== previousPoint.y > point.y &&
      point.x <
        ((previousPoint.x - currentPoint.x) * (point.y - currentPoint.y)) /
          (previousPoint.y - currentPoint.y) +
          currentPoint.x;

    if (doesRayCrossEdge) {
      isInside = !isInside;
    }
  }

  return isInside;
};

const RoomMiniBoo = ({
  grade,
  grabbable = false,
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
  const grabLiftAnimation = useRef(new Animated.Value(0)).current;
  const grabWiggleAnimation = useRef(new Animated.Value(0)).current;
  const grabDragOffset = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const grabStartPositionRef = useRef(initialPoint);
  const currentGrabOffsetRef = useRef({ x: 0, y: 0 });
  const grabStartedAtMsRef = useRef(0);
  const grabShakeDistanceRef = useRef(0);
  const hasShownGrabDizzyRef = useRef(false);
  const lastGrabMoveRef = useRef({ timestamp: 0, x: 0, y: 0 });
  const isGrabbedRef = useRef(false);
  const isManuallyPlacedRef = useRef(false);
  const walkIndexRef = useRef(0);
  const chatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const grabTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const grabWiggleLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const [facingDirection, setFacingDirection] = useState(1);
  const [isWalking, setIsWalking] = useState(false);
  const [isGrabbed, setIsGrabbed] = useState(false);
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
  const renderedDropZonePoints = useMemo(
    () => getRenderedDropZonePoints(roomWidth, roomHeight),
    [roomHeight, roomWidth],
  );

  useEffect(() => {
    isGrabbedRef.current = isGrabbed;
  }, [isGrabbed]);

  useEffect(() => {
    if (isSeniorGrade || isGrabbed) {
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
  }, [bobAnimation, isGrabbed, isSeniorGrade]);

  useEffect(() => {
    if (!isGrabbed) {
      grabWiggleLoopRef.current?.stop();
      grabWiggleLoopRef.current = null;
      grabWiggleAnimation.setValue(0);

      return undefined;
    }

    grabWiggleLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(grabWiggleAnimation, {
          duration: 120,
          easing: Easing.inOut(Easing.quad),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(grabWiggleAnimation, {
          duration: 120,
          easing: Easing.inOut(Easing.quad),
          toValue: -1,
          useNativeDriver: true,
        }),
        Animated.timing(grabWiggleAnimation, {
          duration: 120,
          easing: Easing.inOut(Easing.quad),
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    grabWiggleLoopRef.current.start();

    return () => {
      grabWiggleLoopRef.current?.stop();
      grabWiggleLoopRef.current = null;
      grabWiggleAnimation.setValue(0);
    };
  }, [grabWiggleAnimation, isGrabbed]);

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
      : getRenderedPoint(ROOM_MINI_BOO_WALK_POINTS[0], roomWidth, roomHeight);

    position.stopAnimation();
    position.setValue(firstPoint);
    walkIndexRef.current = 0;
    isManuallyPlacedRef.current = false;
    setIsWalking(false);
    setFacingDirection(1);

    if (isSeniorGrade) {
      return () => {
        isActive = false;
        position.stopAnimation();
      };
    }

    const walkToNextPoint = () => {
      if (isManuallyPlacedRef.current) {
        setIsWalking(false);
        return;
      }

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

        if (isGrabbedRef.current || isManuallyPlacedRef.current) {
          walkToNextPoint();
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
          if (!isActive || !finished || isManuallyPlacedRef.current) {
            if (
              isActive &&
              (isGrabbedRef.current || isManuallyPlacedRef.current)
            ) {
              walkToNextPoint();
            }

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

  useEffect(() => {
    if (!grabbable && isGrabbed) {
      setIsGrabbed(false);
    }
  }, [grabbable, isGrabbed]);

  useEffect(() => {
    return () => {
      if (grabTimerRef.current) {
        clearTimeout(grabTimerRef.current);
      }

      grabWiggleLoopRef.current?.stop();
    };
  }, []);

  const showGrabChat = () => {
    const randomIndex = Math.floor(Math.random() * GRAB_CHAT_MESSAGES.length);

    setRoomChatMessage(GRAB_CHAT_MESSAGES[randomIndex]);
    setIsRoomChatVisible(true);

    if (chatHideTimerRef.current) {
      clearTimeout(chatHideTimerRef.current);
    }

    chatHideTimerRef.current = setTimeout(() => {
      chatHideTimerRef.current = null;
      setIsRoomChatVisible(false);
    }, ROOM_CHAT_VISIBLE_MS);
  };

  const showGrabDizzyChat = () => {
    const randomIndex = Math.floor(Math.random() * GRAB_DIZZY_MESSAGES.length);

    setRoomChatMessage(GRAB_DIZZY_MESSAGES[randomIndex]);
    setIsRoomChatVisible(true);

    if (chatHideTimerRef.current) {
      clearTimeout(chatHideTimerRef.current);
    }

    chatHideTimerRef.current = setTimeout(() => {
      chatHideTimerRef.current = null;
      setIsRoomChatVisible(false);
    }, ROOM_CHAT_VISIBLE_MS);
  };

  const startGrab = () => {
    if (!grabbable || isSeniorGrade) {
      return;
    }

    position.stopAnimation((value: { x: number; y: number }) => {
      grabStartPositionRef.current = value;
    });
    currentGrabOffsetRef.current = {
      x: 0,
      y: GRAB_FINGER_VISIBILITY_OFFSET_Y,
    };
    grabStartedAtMsRef.current = Date.now();
    grabShakeDistanceRef.current = 0;
    hasShownGrabDizzyRef.current = false;
    lastGrabMoveRef.current = {
      timestamp: grabStartedAtMsRef.current,
      x: 0,
      y: GRAB_FINGER_VISIBILITY_OFFSET_Y,
    };
    grabDragOffset.setValue({ x: 0, y: GRAB_FINGER_VISIBILITY_OFFSET_Y });
    setIsWalking(false);
    setIsGrabbed(true);
    isGrabbedRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
      () => undefined,
    );
    Animated.spring(grabLiftAnimation, {
      damping: 10,
      mass: 0.6,
      stiffness: 180,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const finishGrab = () => {
    if (grabTimerRef.current) {
      clearTimeout(grabTimerRef.current);
      grabTimerRef.current = null;
    }

    if (!isGrabbedRef.current) {
      return;
    }

    const proposedPoint = {
      x: grabStartPositionRef.current.x + currentGrabOffsetRef.current.x,
      y: grabStartPositionRef.current.y + currentGrabOffsetRef.current.y,
    };
    const grabHeldMs = Math.max(0, Date.now() - grabStartedAtMsRef.current);
    const shouldShowDizzyChat =
      hasShownGrabDizzyRef.current ||
      grabHeldMs >= GRAB_DIZZY_HOLD_MS ||
      grabShakeDistanceRef.current >= GRAB_DIZZY_SHAKE_DISTANCE;
    const proposedFootPoint = {
      x: proposedPoint.x + renderedSize.width / 2,
      y: proposedPoint.y + renderedSize.height * 0.92,
    };
    const isInsideDropZone = isPointInPolygon(
      proposedFootPoint,
      renderedDropZonePoints,
    );
    const nextPoint = !isInsideDropZone
        ? grabStartPositionRef.current
        : proposedPoint;

    if (isInsideDropZone) {
      isManuallyPlacedRef.current = true;
      setIsWalking(false);
    }

    setIsGrabbed(false);
    isGrabbedRef.current = false;
    currentGrabOffsetRef.current = { x: 0, y: 0 };
    position.setValue(proposedPoint);
    grabDragOffset.setValue({ x: 0, y: 0 });
    if (shouldShowDizzyChat) {
      showGrabDizzyChat();
    } else {
      showGrabChat();
    }
    Animated.parallel([
      Animated.timing(grabLiftAnimation, {
        duration: GRAB_RETURN_DURATION_MS,
        easing: Easing.out(Easing.quad),
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(position, {
        duration: GRAB_RETURN_DURATION_MS,
        easing: Easing.out(Easing.quad),
        toValue: nextPoint,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => isGrabbedRef.current,
        onPanResponderGrant: () => {
          if (!grabbable || isSeniorGrade) {
            return;
          }

          grabTimerRef.current = setTimeout(() => {
            grabTimerRef.current = null;
            startGrab();
          }, GRAB_LONG_PRESS_MS);
        },
        onPanResponderMove: (_event, gestureState) => {
          if (!isGrabbedRef.current) {
            return;
          }

          const minX = -grabStartPositionRef.current.x;
          const maxX =
            roomWidth - renderedSize.width - grabStartPositionRef.current.x;
          const minY = -grabStartPositionRef.current.y;
          const maxY =
            roomHeight - renderedSize.height - grabStartPositionRef.current.y;

          const nextOffset = {
            x: Math.min(maxX, Math.max(minX, gestureState.dx)),
            y: Math.min(
              maxY,
              Math.max(minY, gestureState.dy + GRAB_FINGER_VISIBILITY_OFFSET_Y),
            ),
          };
          const nowMs = Date.now();
          const lastMove = lastGrabMoveRef.current;
          const moveDistance = Math.hypot(
            nextOffset.x - lastMove.x,
            nextOffset.y - lastMove.y,
          );
          const elapsedMoveMs = Math.max(1, nowMs - lastMove.timestamp);
          const moveVelocity = moveDistance / elapsedMoveMs;

          grabShakeDistanceRef.current += moveDistance;
          lastGrabMoveRef.current = {
            timestamp: nowMs,
            x: nextOffset.x,
            y: nextOffset.y,
          };

          if (
            !hasShownGrabDizzyRef.current &&
            (moveVelocity >= GRAB_DIZZY_SHAKE_VELOCITY ||
              grabShakeDistanceRef.current >= GRAB_DIZZY_SHAKE_DISTANCE)
          ) {
            hasShownGrabDizzyRef.current = true;
            showGrabDizzyChat();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
              () => undefined,
            );
          }

          currentGrabOffsetRef.current = nextOffset;
          grabDragOffset.setValue(nextOffset);
        },
        onPanResponderRelease: finishGrab,
        onPanResponderTerminate: finishGrab,
        onShouldBlockNativeResponder: () => isGrabbedRef.current,
        onStartShouldSetPanResponder: () => grabbable && !isSeniorGrade,
      }),
    [
      finishGrab,
      grabbable,
      grabDragOffset,
      isSeniorGrade,
      renderedSize.height,
      renderedSize.width,
      roomHeight,
      roomWidth,
      startGrab,
    ],
  );

  const bobTranslateY = bobAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4],
  });
  const grabTranslateY = grabLiftAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });
  const grabScale = grabLiftAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });
  const grabRotate = grabWiggleAnimation.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-4deg", "0deg", "4deg"],
  });

  return (
    <Animated.View
      pointerEvents={grabbable && !isSeniorGrade ? "auto" : "none"}
      {...(grabbable && !isSeniorGrade ? panResponder.panHandlers : {})}
      style={[
        styles.container,
        {
          height: renderedSize.height,
          transform: [
            { translateX: position.x },
            { translateX: grabDragOffset.x },
            { translateY: position.y },
            { translateY: grabDragOffset.y },
            { translateY: bobTranslateY },
          ],
          width: renderedSize.width,
          zIndex: isSeniorGrade
            ? ROOM_SENIOR_MINI_BOO_ON_BED_LAYOUT.zIndex
            : ROOM_MINI_BOO_LAYOUT.zIndex,
        },
        isGrabbed ? styles.grabbedContainer : null,
      ]}
    >
      <BooChat
        maxTextWidth={220}
        message={roomChatMessage}
        scale={0.62}
        style={[
          styles.chatBubble,
          {
            bottom: renderedSize.height + (isGrabbed ? 18 : -3),
          },
        ]}
        visible={isRoomChatVisible}
      />
      <Animated.View
        style={[
          styles.characterLayer,
          {
            transform: [
              { translateY: grabTranslateY },
              { scale: grabScale },
              { rotate: grabRotate },
              { scaleX: facingDirection },
            ],
          },
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
  grabbedContainer: {
    zIndex: 20,
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
