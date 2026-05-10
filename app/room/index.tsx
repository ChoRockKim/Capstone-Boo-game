import ArrowBackIcon from "@/assets/icons/arrow-back-return.svg";
import CustomizationIcon from "@/assets/icons/Customization.svg";
import CoinBox from "@/components/CoinBox/CoinBox";
import ProgressBar from "@/components/ProgressBar/ProgressBar";
import {
  DEFAULT_EQUIPPED_ROOM_ITEMS,
  DEFAULT_ROOM_LAYOUT,
  ROOM_BACKGROUND_ASSET,
  ROOM_CANVAS_ASPECT_RATIO,
  ROOM_CANVAS_HEIGHT,
  ROOM_CANVAS_WIDTH,
  ROOM_ITEM_ASSETS,
  ROOM_SLOT_ORDER,
} from "@/components/Room/RoomData";
import RoomMiniBoo from "@/components/Room/RoomMiniBoo";
import SquareButton from "@/components/SquareButton/SquareButton";
import { useGameStore } from "@/stores/useGameStore";
import { startBackgroundMusicSession } from "@/utils/backgroundMusic";
import { getXpProgressInfo } from "@/utils/xpProgress";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const ROOM_MAX_WIDTH = 600;
const PROGRESS_BOTTOM_OFFSET = 38;
const ROOM_VERTICAL_RESERVED_SPACE = 220;

export default function RoomIndex() {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const booName = useGameStore((state) => state.booName);
  const characterState = useGameStore((state) => state.characterState);
  const coin = useGameStore((state) => state.coin);
  const equippedRoomItems = useGameStore((state) => state.equippedRoomItems);
  const totalXp = useGameStore((state) => state.totalXp);
  const xpProgress = useMemo(() => getXpProgressInfo(totalXp), [totalXp]);
  const availableRoomHeight = Math.max(
    260,
    height - insets.top - insets.bottom - ROOM_VERTICAL_RESERVED_SPACE,
  );
  const roomWidth = Math.min(
    width - 56,
    availableRoomHeight * ROOM_CANVAS_ASPECT_RATIO,
    ROOM_MAX_WIDTH,
  );
  const roomHeight = roomWidth / ROOM_CANVAS_ASPECT_RATIO;
  const progressBarBottomOffset = Math.max(
    insets.bottom + 24,
    PROGRESS_BOTTOM_OFFSET,
  );

  useFocusEffect(
    useCallback(() => {
      return startBackgroundMusicSession("myRoom");
    }, []),
  );

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <View style={styles.leftControls}>
            <SquareButton
              Icon={ArrowBackIcon}
              onPress={() => router.replace("/game")}
            />
            <CoinBox coin={coin} />
          </View>
          <SquareButton Icon={CustomizationIcon} />
        </View>

        <View style={styles.roomStage}>
          <View
            style={[
              styles.roomCanvas,
              {
                height: roomHeight,
                width: roomWidth,
              },
            ]}
          >
            <Image
              cachePolicy="memory-disk"
              contentFit="contain"
              source={ROOM_BACKGROUND_ASSET}
              style={styles.roomBackground}
            />
            {ROOM_SLOT_ORDER.map((slotId) => {
              const itemId =
                equippedRoomItems[slotId] ??
                DEFAULT_EQUIPPED_ROOM_ITEMS[slotId];
              const item =
                ROOM_ITEM_ASSETS[itemId] ??
                ROOM_ITEM_ASSETS[DEFAULT_EQUIPPED_ROOM_ITEMS[slotId]];
              const layout = DEFAULT_ROOM_LAYOUT[slotId];

              return (
                <Image
                  cachePolicy="memory-disk"
                  contentFit="contain"
                  key={slotId}
                  pointerEvents="none"
                  source={item.image}
                  style={[
                    styles.roomItem,
                    {
                      aspectRatio: item.aspectRatio,
                      left: `${(layout.x / ROOM_CANVAS_WIDTH) * 100}%`,
                      top: `${(layout.y / ROOM_CANVAS_HEIGHT) * 100}%`,
                      width: `${(layout.width / ROOM_CANVAS_WIDTH) * 100}%`,
                      zIndex: layout.zIndex,
                    },
                  ]}
                />
              );
            })}
            <RoomMiniBoo
              grade={xpProgress.grade}
              roomHeight={roomHeight}
              roomWidth={roomWidth}
              state={characterState}
            />
          </View>
        </View>

        <ProgressBar
          booName={booName}
          bottomOffset={progressBarBottomOffset}
          grade={xpProgress.grade}
          maxXp={xpProgress.progressMaxXp}
          xp={xpProgress.currentXpInGrade}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F4EFE3",
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingVertical: 24,
  },
  topBar: {
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  roomStage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 104,
    paddingTop: 16,
  },
  roomCanvas: {
    position: "relative",
  },
  roomBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  roomItem: {
    position: "absolute",
  },
});
