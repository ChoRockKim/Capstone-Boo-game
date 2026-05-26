/**
 * @description  마이룸/친구방 공통 방 배경, 가구, 미니 부 렌더링을 담당합니다.
 * @depends      components/Room/RoomData.ts, components/Room/RoomMiniBoo.tsx, constants/character.ts
 * @used-by      app/room/index.tsx, app/room/[friendId].tsx
 * @side-effects 없음
 */
import {
  DEFAULT_EQUIPPED_ROOM_ITEMS,
  DEFAULT_EQUIPPED_ROOM_WALLPAPER,
  DEFAULT_ROOM_LAYOUT,
  EquippedRoomItems,
  PURCHASED_BED_OFFSET,
  PURCHASED_BED_SIZE_SCALE,
  PURCHASED_CLOSET_OFFSET,
  PURCHASED_CLOSET_SIZE_SCALE,
  PURCHASED_TABLE_OFFSET,
  PURCHASED_TABLE_SIZE_SCALE,
  ROOM_CANVAS_HEIGHT,
  ROOM_CANVAS_WIDTH,
  ROOM_ITEM_ASSETS,
  ROOM_SLOT_ORDER,
  ROOM_WALLPAPER_ASSETS,
  RoomWallpaperId,
} from "@/components/Room/RoomData";
import RoomMiniBoo from "@/components/Room/RoomMiniBoo";
import { CharacterGrade, CharacterState } from "@/constants/character";
import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";

interface RoomSceneProps {
  characterState: CharacterState;
  equippedRoomItems: EquippedRoomItems;
  grade: CharacterGrade;
  onFurniturePress?: Partial<Record<keyof EquippedRoomItems, () => void>>;
  roomHeight: number;
  roomWidth: number;
  showMiniBoo?: boolean;
  wallpaperId: RoomWallpaperId;
}

const toPercent = (value: number): `${number}%` => `${value}%` as `${number}%`;

const RoomScene = ({
  characterState,
  equippedRoomItems,
  grade,
  onFurniturePress,
  roomHeight,
  roomWidth,
  showMiniBoo = true,
  wallpaperId,
}: RoomSceneProps) => {
  const wallpaper =
    ROOM_WALLPAPER_ASSETS[wallpaperId] ??
    ROOM_WALLPAPER_ASSETS[DEFAULT_EQUIPPED_ROOM_WALLPAPER];

  return (
    <View style={[styles.roomCanvas, { height: roomHeight, width: roomWidth }]}>
      <Image
        cachePolicy="memory-disk"
        contentFit="contain"
        source={wallpaper.image}
        style={styles.roomBackground}
      />
      {ROOM_SLOT_ORDER.map((slotId) => {
        const itemId =
          equippedRoomItems[slotId] ?? DEFAULT_EQUIPPED_ROOM_ITEMS[slotId];
        const item =
          ROOM_ITEM_ASSETS[itemId] ??
          ROOM_ITEM_ASSETS[DEFAULT_EQUIPPED_ROOM_ITEMS[slotId]];
        const layout = DEFAULT_ROOM_LAYOUT[slotId];
        const handleFurniturePress = onFurniturePress?.[slotId];
        const isPurchasedBed = slotId === "bed" && item.price > 0;
        const isPurchasedCloset = slotId === "closet" && item.price > 0;
        const isPurchasedTable = slotId === "table" && item.price > 0;
        const itemWidth =
          layout.width *
          (item.widthScale ?? 1) *
          (isPurchasedTable ? PURCHASED_TABLE_SIZE_SCALE : 1) *
          (isPurchasedCloset ? PURCHASED_CLOSET_SIZE_SCALE : 1) *
          (isPurchasedBed ? PURCHASED_BED_SIZE_SCALE : 1);
        const itemOffset = isPurchasedTable
          ? PURCHASED_TABLE_OFFSET
          : isPurchasedCloset
            ? PURCHASED_CLOSET_OFFSET
            : isPurchasedBed
              ? PURCHASED_BED_OFFSET
              : { x: 0, y: 0 };
        const itemX = layout.x + (layout.width - itemWidth) / 2 + itemOffset.x;
        const itemY = layout.y + itemOffset.y;
        const itemPositionStyle = {
          aspectRatio: item.aspectRatio,
          left: toPercent((itemX / ROOM_CANVAS_WIDTH) * 100),
          top: toPercent((itemY / ROOM_CANVAS_HEIGHT) * 100),
          width: toPercent((itemWidth / ROOM_CANVAS_WIDTH) * 100),
          zIndex: layout.zIndex,
        };

        if (handleFurniturePress) {
          return (
            <Pressable
              key={slotId}
              onPress={handleFurniturePress}
              style={({ pressed }) => [
                styles.roomItem,
                itemPositionStyle,
                pressed ? styles.pressedRoomItem : null,
              ]}
            >
              <Image
                cachePolicy="memory-disk"
                contentFit="contain"
                source={item.image}
                style={styles.roomItemImage}
              />
            </Pressable>
          );
        }

        return (
          <Image
            cachePolicy="memory-disk"
            contentFit="contain"
            key={slotId}
            pointerEvents="none"
            source={item.image}
            style={[styles.roomItem, itemPositionStyle]}
          />
        );
      })}
      {showMiniBoo ? (
        <RoomMiniBoo
          grade={grade}
          roomHeight={roomHeight}
          roomWidth={roomWidth}
          state={characterState}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  roomCanvas: {
    position: "relative",
  },
  roomBackground: {
    ...StyleSheet.absoluteFill,
  },
  roomItem: {
    position: "absolute",
  },
  roomItemImage: {
    height: "100%",
    width: "100%",
  },
  pressedRoomItem: {
    opacity: 0.78,
  },
});

export default RoomScene;
