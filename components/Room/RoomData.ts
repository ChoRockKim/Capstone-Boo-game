/**
 * @description  마이룸 방/가구 이미지 registry와 room 이미지 기준 좌표 레이아웃을 정의합니다.
 * @depends      assets/Rooms/*
 * @used-by      stores/useGameStore.ts, app/game/index.tsx, app/room/index.tsx, components/Room/RoomMiniBoo.tsx
 * @side-effects 정적 이미지 require
 */
export type RoomSlotId = "bed" | "closet" | "table";

export type RoomItemId =
  | "bed-basic"
  | "bed-maple-blue"
  | "bed-maple-green"
  | "bed-maple-pink"
  | "bed-maple-purple"
  | "bed-maple-red"
  | "bed-maple-teal"
  | "bed-maple-yellow"
  | "bed-merbau-blue"
  | "bed-merbau-green"
  | "bed-merbau-pink"
  | "bed-merbau-purple"
  | "bed-merbau-red"
  | "bed-merbau-teal"
  | "bed-merbau-yellow"
  | "bed-oak-blue"
  | "bed-oak-green"
  | "bed-oak-pink"
  | "bed-oak-purple"
  | "bed-oak-red"
  | "bed-oak-teal"
  | "bed-oak-yellow"
  | "bed-walnut-blue"
  | "bed-walnut-green"
  | "bed-walnut-pink"
  | "bed-walnut-purple"
  | "bed-walnut-red"
  | "bed-walnut-teal"
  | "bed-walnut-yellow"
  | "bed-white-oak-blue"
  | "bed-white-oak-green"
  | "bed-white-oak-pink"
  | "bed-white-oak-purple"
  | "bed-white-oak-red"
  | "bed-white-oak-teal"
  | "bed-white-oak-yellow"
  | "closet-basic"
  | "closet-maple"
  | "closet-merbau"
  | "closet-oak"
  | "closet-walnut"
  | "closet-white-oak"
  | "table-basic"
  | "table-maple-blue"
  | "table-maple-green"
  | "table-maple-pink"
  | "table-maple-purple"
  | "table-maple-red"
  | "table-maple-teal"
  | "table-maple-yellow"
  | "table-merbau-blue"
  | "table-merbau-green"
  | "table-merbau-pink"
  | "table-merbau-purple"
  | "table-merbau-red"
  | "table-merbau-teal"
  | "table-merbau-yellow"
  | "table-oak-blue"
  | "table-oak-green"
  | "table-oak-pink"
  | "table-oak-purple"
  | "table-oak-red"
  | "table-oak-teal"
  | "table-oak-yellow"
  | "table-walnut-blue"
  | "table-walnut-green"
  | "table-walnut-pink"
  | "table-walnut-purple"
  | "table-walnut-red"
  | "table-walnut-teal"
  | "table-walnut-yellow"
  | "table-white-oak-blue"
  | "table-white-oak-green"
  | "table-white-oak-pink"
  | "table-white-oak-purple"
  | "table-white-oak-red"
  | "table-white-oak-teal"
  | "table-white-oak-yellow";

export type EquippedRoomItems = Record<RoomSlotId, RoomItemId>;

export type RoomWallpaperId =
  | "wallpaper-basic"
  | "wallpaper-blue"
  | "wallpaper-gray"
  | "wallpaper-green"
  | "wallpaper-meolbow"
  | "wallpaper-pink"
  | "wallpaper-purple"
  | "wallpaper-red"
  | "wallpaper-teak"
  | "wallpaper-whiteoak"
  | "wallpaper-yellow";

type RoomItemAsset = {
  aspectRatio: number;
  image: number;
  label: string;
  price: number;
  slotId: RoomSlotId;
  widthScale?: number;
};

type RoomLayoutItem = {
  height?: number;
  slotId: RoomSlotId;
  width: number;
  x: number;
  y: number;
  zIndex: number;
};

type RoomMiniBooLayout = {
  height: number;
  width: number;
  zIndex: number;
};

type RoomWallpaperAsset = {
  image: number;
  label: string;
  price: number;
};

export type RoomMiniBooWalkPoint = {
  durationMs?: number;
  pauseMs?: number;
  x: number;
  y: number;
};

export const ROOM_BACKGROUND_ASSET = require("@/assets/Rooms/room/room-basic.png");

export const ROOM_CANVAS_WIDTH = 1276;
export const ROOM_CANVAS_HEIGHT = 1444;
export const ROOM_CANVAS_ASPECT_RATIO = ROOM_CANVAS_WIDTH / ROOM_CANVAS_HEIGHT;

export const DEFAULT_EQUIPPED_ROOM_ITEMS: EquippedRoomItems = {
  bed: "bed-basic",
  closet: "closet-basic",
  table: "table-basic",
};

export const DEFAULT_EQUIPPED_ROOM_WALLPAPER: RoomWallpaperId =
  "wallpaper-basic";

export const DEFAULT_OWNED_ROOM_WALLPAPERS: RoomWallpaperId[] = [
  "wallpaper-basic",
];

export const DEFAULT_OWNED_ROOM_ITEMS: RoomItemId[] = Object.values(
  DEFAULT_EQUIPPED_ROOM_ITEMS,
);

export const PURCHASED_TABLE_OFFSET = {
  x: 0,
  y: 20,
};

export const PURCHASED_TABLE_SIZE_SCALE = 1.07;

export const PURCHASED_CLOSET_OFFSET = {
  x: 5,
  y: -10,
};

export const PURCHASED_CLOSET_SIZE_SCALE = 0.78;

export const PURCHASED_BED_OFFSET = {
  x: 0,
  y: 15,
};

export const PURCHASED_BED_SIZE_SCALE = 1;

export const ROOM_WALLPAPER_ASSETS: Record<
  RoomWallpaperId,
  RoomWallpaperAsset
> = {
  "wallpaper-basic": {
    image: ROOM_BACKGROUND_ASSET,
    label: "기본",
    price: 0,
  },
  "wallpaper-blue": {
    image: require("@/assets/Rooms/room/room-blue.png"),
    label: "파란 벽지",
    price: 200,
  },
  "wallpaper-gray": {
    image: require("@/assets/Rooms/room/room-gray.png"),
    label: "회색 벽지",
    price: 200,
  },
  "wallpaper-green": {
    image: require("@/assets/Rooms/room/room-green.png"),
    label: "초록 벽지",
    price: 200,
  },
  "wallpaper-meolbow": {
    image: require("@/assets/Rooms/room/room-meolbow.png"),
    label: "멀바우 벽지",
    price: 200,
  },
  "wallpaper-pink": {
    image: require("@/assets/Rooms/room/room-pink.png"),
    label: "분홍 벽지",
    price: 200,
  },
  "wallpaper-purple": {
    image: require("@/assets/Rooms/room/room-purple.png"),
    label: "보라 벽지",
    price: 200,
  },
  "wallpaper-red": {
    image: require("@/assets/Rooms/room/room-red.png"),
    label: "빨간 벽지",
    price: 200,
  },
  "wallpaper-teak": {
    image: require("@/assets/Rooms/room/room-teak.png"),
    label: "티크 벽지",
    price: 200,
  },
  "wallpaper-whiteoak": {
    image: require("@/assets/Rooms/room/room-whiteoak.png"),
    label: "화이트오크 벽지",
    price: 200,
  },
  "wallpaper-yellow": {
    image: require("@/assets/Rooms/room/room-yellow.png"),
    label: "노란 벽지",
    price: 200,
  },
};

export const ROOM_ITEM_ASSETS: Record<RoomItemId, RoomItemAsset> = {
  "bed-basic": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-basic.png"),
    label: "기본",
    price: 0,
    slotId: "bed",
  },
  "bed-maple-blue": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-maple-blue.png"),
    label: "메이플 파랑",
    price: 200,
    slotId: "bed",
  },
  "bed-maple-green": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-maple-green.png"),
    label: "메이플 초록",
    price: 200,
    slotId: "bed",
  },
  "bed-maple-pink": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-maple-pink.png"),
    label: "메이플 핑크",
    price: 200,
    slotId: "bed",
  },
  "bed-maple-purple": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-maple-purple.png"),
    label: "메이플 보라",
    price: 200,
    slotId: "bed",
  },
  "bed-maple-red": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-maple-red.png"),
    label: "메이플 빨강",
    price: 200,
    slotId: "bed",
  },
  "bed-maple-teal": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-maple-teal.png"),
    label: "메이플 청록",
    price: 200,
    slotId: "bed",
  },
  "bed-maple-yellow": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-maple-yellow.png"),
    label: "메이플 노랑",
    price: 200,
    slotId: "bed",
  },
  "bed-merbau-blue": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-merbau-blue.png"),
    label: "멀바우 파랑",
    price: 200,
    slotId: "bed",
  },
  "bed-merbau-green": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-merbau-green.png"),
    label: "멀바우 초록",
    price: 200,
    slotId: "bed",
  },
  "bed-merbau-pink": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-merbau-pink.png"),
    label: "멀바우 핑크",
    price: 200,
    slotId: "bed",
  },
  "bed-merbau-purple": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-merbau-purple.png"),
    label: "멀바우 보라",
    price: 200,
    slotId: "bed",
  },
  "bed-merbau-red": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-merbau-red.png"),
    label: "멀바우 빨강",
    price: 200,
    slotId: "bed",
  },
  "bed-merbau-teal": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-merbau-teal.png"),
    label: "멀바우 청록",
    price: 200,
    slotId: "bed",
  },
  "bed-merbau-yellow": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-merbau-yellow.png"),
    label: "멀바우 노랑",
    price: 200,
    slotId: "bed",
  },
  "bed-oak-blue": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-oak-blue.png"),
    label: "오크 파랑",
    price: 200,
    slotId: "bed",
  },
  "bed-oak-green": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-oak-green.png"),
    label: "오크 초록",
    price: 200,
    slotId: "bed",
  },
  "bed-oak-pink": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-oak-pink.png"),
    label: "오크 핑크",
    price: 200,
    slotId: "bed",
  },
  "bed-oak-purple": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-oak-purple.png"),
    label: "오크 보라",
    price: 200,
    slotId: "bed",
  },
  "bed-oak-red": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-oak-red.png"),
    label: "오크 빨강",
    price: 200,
    slotId: "bed",
  },
  "bed-oak-teal": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-oak-teal.png"),
    label: "오크 청록",
    price: 200,
    slotId: "bed",
  },
  "bed-oak-yellow": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-oak-yellow.png"),
    label: "오크 노랑",
    price: 200,
    slotId: "bed",
  },
  "bed-walnut-blue": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-walnut-blue.png"),
    label: "월넛 파랑",
    price: 200,
    slotId: "bed",
  },
  "bed-walnut-green": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-walnut-green.png"),
    label: "월넛 초록",
    price: 200,
    slotId: "bed",
  },
  "bed-walnut-pink": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-walnut-pink.png"),
    label: "월넛 핑크",
    price: 200,
    slotId: "bed",
  },
  "bed-walnut-purple": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-walnut-purple.png"),
    label: "월넛 보라",
    price: 200,
    slotId: "bed",
  },
  "bed-walnut-red": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-walnut-red.png"),
    label: "월넛 빨강",
    price: 200,
    slotId: "bed",
  },
  "bed-walnut-teal": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-walnut-teal.png"),
    label: "월넛 청록",
    price: 200,
    slotId: "bed",
  },
  "bed-walnut-yellow": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-walnut-yellow.png"),
    label: "월넛 노랑",
    price: 200,
    slotId: "bed",
  },
  "bed-white-oak-blue": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-white-oak-blue.png"),
    label: "화이트오크 파랑",
    price: 200,
    slotId: "bed",
  },
  "bed-white-oak-green": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-white-oak-green.png"),
    label: "화이트오크 초록",
    price: 200,
    slotId: "bed",
  },
  "bed-white-oak-pink": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-white-oak-pink.png"),
    label: "화이트오크 핑크",
    price: 200,
    slotId: "bed",
  },
  "bed-white-oak-purple": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-white-oak-purple.png"),
    label: "화이트오크 보라",
    price: 200,
    slotId: "bed",
  },
  "bed-white-oak-red": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-white-oak-red.png"),
    label: "화이트오크 빨강",
    price: 200,
    slotId: "bed",
  },
  "bed-white-oak-teal": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-white-oak-teal.png"),
    label: "화이트오크 청록",
    price: 200,
    slotId: "bed",
  },
  "bed-white-oak-yellow": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-white-oak-yellow.png"),
    label: "화이트오크 노랑",
    price: 200,
    slotId: "bed",
  },
  "closet-basic": {
    aspectRatio: 280 / 404,
    image: require("@/assets/Rooms/closet/closet-basic.png"),
    label: "기본",
    price: 0,
    slotId: "closet",
  },
  "closet-maple": {
    aspectRatio: 236 / 448,
    image: require("@/assets/Rooms/closet/closet-maple.png"),
    label: "메이플",
    price: 200,
    slotId: "closet",
  },
  "closet-merbau": {
    aspectRatio: 236 / 448,
    image: require("@/assets/Rooms/closet/closet-merbau.png"),
    label: "멀바우",
    price: 200,
    slotId: "closet",
  },
  "closet-oak": {
    aspectRatio: 236 / 448,
    image: require("@/assets/Rooms/closet/closet-oak.png"),
    label: "오크",
    price: 200,
    slotId: "closet",
  },
  "closet-walnut": {
    aspectRatio: 236 / 448,
    image: require("@/assets/Rooms/closet/closet-walnut.png"),
    label: "월넛",
    price: 200,
    slotId: "closet",
  },
  "closet-white-oak": {
    aspectRatio: 236 / 448,
    image: require("@/assets/Rooms/closet/closet-white-oak.png"),
    label: "화이트오크",
    price: 200,
    slotId: "closet",
  },
  "table-basic": {
    aspectRatio: 376 / 372,
    image: require("@/assets/Rooms/table/table-basic.png"),
    label: "기본",
    price: 0,
    slotId: "table",
  },
  "table-maple-blue": {
    aspectRatio: 316 / 304,
    image: require("@/assets/Rooms/table/table-maple-blue.png"),
    label: "메이플 파랑",
    price: 200,
    slotId: "table",
    widthScale: 316 / 376,
  },
  "table-maple-green": {
    aspectRatio: 316 / 304,
    image: require("@/assets/Rooms/table/table-maple-green.png"),
    label: "메이플 초록",
    price: 200,
    slotId: "table",
    widthScale: 316 / 376,
  },
  "table-maple-pink": {
    aspectRatio: 316 / 304,
    image: require("@/assets/Rooms/table/table-maple-pink.png"),
    label: "메이플 핑크",
    price: 200,
    slotId: "table",
    widthScale: 316 / 376,
  },
  "table-maple-purple": {
    aspectRatio: 316 / 304,
    image: require("@/assets/Rooms/table/table-maple-purple.png"),
    label: "메이플 보라",
    price: 200,
    slotId: "table",
    widthScale: 316 / 376,
  },
  "table-maple-red": {
    aspectRatio: 316 / 304,
    image: require("@/assets/Rooms/table/table-maple-red.png"),
    label: "메이플 빨강",
    price: 200,
    slotId: "table",
    widthScale: 316 / 376,
  },
  "table-maple-teal": {
    aspectRatio: 316 / 304,
    image: require("@/assets/Rooms/table/table-maple-teal.png"),
    label: "메이플 청록",
    price: 200,
    slotId: "table",
    widthScale: 316 / 376,
  },
  "table-maple-yellow": {
    aspectRatio: 316 / 304,
    image: require("@/assets/Rooms/table/table-maple-yellow.png"),
    label: "메이플 노랑",
    price: 200,
    slotId: "table",
    widthScale: 316 / 376,
  },
  "table-merbau-blue": {
    aspectRatio: 316 / 304,
    image: require("@/assets/Rooms/table/table-merbau-blue.png"),
    label: "멀바우 파랑",
    price: 200,
    slotId: "table",
    widthScale: 316 / 376,
  },
  "table-merbau-green": {
    aspectRatio: 316 / 304,
    image: require("@/assets/Rooms/table/table-merbau-green.png"),
    label: "멀바우 초록",
    price: 200,
    slotId: "table",
    widthScale: 316 / 376,
  },
  "table-merbau-pink": {
    aspectRatio: 316 / 304,
    image: require("@/assets/Rooms/table/table-merbau-pink.png"),
    label: "멀바우 핑크",
    price: 200,
    slotId: "table",
    widthScale: 316 / 376,
  },
  "table-merbau-purple": {
    aspectRatio: 316 / 304,
    image: require("@/assets/Rooms/table/table-merbau-purple.png"),
    label: "멀바우 보라",
    price: 200,
    slotId: "table",
    widthScale: 316 / 376,
  },
  "table-merbau-red": {
    aspectRatio: 316 / 304,
    image: require("@/assets/Rooms/table/table-merbau-red.png"),
    label: "멀바우 빨강",
    price: 200,
    slotId: "table",
    widthScale: 316 / 376,
  },
  "table-merbau-teal": {
    aspectRatio: 316 / 304,
    image: require("@/assets/Rooms/table/table-merbau-teal.png"),
    label: "멀바우 청록",
    price: 200,
    slotId: "table",
    widthScale: 316 / 376,
  },
  "table-merbau-yellow": {
    aspectRatio: 316 / 304,
    image: require("@/assets/Rooms/table/table-merbau-yellow.png"),
    label: "멀바우 노랑",
    price: 200,
    slotId: "table",
    widthScale: 316 / 376,
  },
  "table-oak-blue": {
    aspectRatio: 316 / 304,
    image: require("@/assets/Rooms/table/table-oak-blue.png"),
    label: "오크 파랑",
    price: 200,
    slotId: "table",
    widthScale: 316 / 376,
  },
  "table-oak-green": {
    aspectRatio: 316 / 304,
    image: require("@/assets/Rooms/table/table-oak-green.png"),
    label: "오크 초록",
    price: 200,
    slotId: "table",
    widthScale: 316 / 376,
  },
  "table-oak-pink": {
    aspectRatio: 316 / 304,
    image: require("@/assets/Rooms/table/table-oak-pink.png"),
    label: "오크 핑크",
    price: 200,
    slotId: "table",
    widthScale: 316 / 376,
  },
  "table-oak-purple": {
    aspectRatio: 316 / 304,
    image: require("@/assets/Rooms/table/table-oak-purple.png"),
    label: "오크 보라",
    price: 200,
    slotId: "table",
    widthScale: 316 / 376,
  },
  "table-oak-red": {
    aspectRatio: 316 / 304,
    image: require("@/assets/Rooms/table/table-oak-red.png"),
    label: "오크 빨강",
    price: 200,
    slotId: "table",
    widthScale: 316 / 376,
  },
  "table-oak-teal": {
    aspectRatio: 316 / 304,
    image: require("@/assets/Rooms/table/table-oak-teal.png"),
    label: "오크 청록",
    price: 200,
    slotId: "table",
    widthScale: 316 / 376,
  },
  "table-oak-yellow": {
    aspectRatio: 316 / 304,
    image: require("@/assets/Rooms/table/table-oak-yellow.png"),
    label: "오크 노랑",
    price: 200,
    slotId: "table",
    widthScale: 316 / 376,
  },
  "table-walnut-blue": {
    aspectRatio: 316 / 304,
    image: require("@/assets/Rooms/table/table-walnut-blue.png"),
    label: "월넛 파랑",
    price: 200,
    slotId: "table",
    widthScale: 316 / 376,
  },
  "table-walnut-green": {
    aspectRatio: 316 / 304,
    image: require("@/assets/Rooms/table/table-walnut-green.png"),
    label: "월넛 초록",
    price: 200,
    slotId: "table",
    widthScale: 316 / 376,
  },
  "table-walnut-pink": {
    aspectRatio: 316 / 304,
    image: require("@/assets/Rooms/table/table-walnut-pink.png"),
    label: "월넛 핑크",
    price: 200,
    slotId: "table",
    widthScale: 316 / 376,
  },
  "table-walnut-purple": {
    aspectRatio: 316 / 304,
    image: require("@/assets/Rooms/table/table-walnut-purple.png"),
    label: "월넛 보라",
    price: 200,
    slotId: "table",
    widthScale: 316 / 376,
  },
  "table-walnut-red": {
    aspectRatio: 316 / 304,
    image: require("@/assets/Rooms/table/table-walnut-red.png"),
    label: "월넛 빨강",
    price: 200,
    slotId: "table",
    widthScale: 316 / 376,
  },
  "table-walnut-teal": {
    aspectRatio: 316 / 304,
    image: require("@/assets/Rooms/table/table-walnut-teal.png"),
    label: "월넛 청록",
    price: 200,
    slotId: "table",
    widthScale: 316 / 376,
  },
  "table-walnut-yellow": {
    aspectRatio: 316 / 304,
    image: require("@/assets/Rooms/table/table-walnut-yellow.png"),
    label: "월넛 노랑",
    price: 200,
    slotId: "table",
    widthScale: 316 / 376,
  },
  "table-white-oak-blue": {
    aspectRatio: 316 / 304,
    image: require("@/assets/Rooms/table/table-white-oak-blue.png"),
    label: "화이트오크 파랑",
    price: 200,
    slotId: "table",
    widthScale: 316 / 376,
  },
  "table-white-oak-green": {
    aspectRatio: 316 / 304,
    image: require("@/assets/Rooms/table/table-white-oak-green.png"),
    label: "화이트오크 초록",
    price: 200,
    slotId: "table",
    widthScale: 316 / 376,
  },
  "table-white-oak-pink": {
    aspectRatio: 316 / 304,
    image: require("@/assets/Rooms/table/table-white-oak-pink.png"),
    label: "화이트오크 핑크",
    price: 200,
    slotId: "table",
    widthScale: 316 / 376,
  },
  "table-white-oak-purple": {
    aspectRatio: 316 / 304,
    image: require("@/assets/Rooms/table/table-white-oak-purple.png"),
    label: "화이트오크 보라",
    price: 200,
    slotId: "table",
    widthScale: 316 / 376,
  },
  "table-white-oak-red": {
    aspectRatio: 316 / 304,
    image: require("@/assets/Rooms/table/table-white-oak-red.png"),
    label: "화이트오크 빨강",
    price: 200,
    slotId: "table",
    widthScale: 316 / 376,
  },
  "table-white-oak-teal": {
    aspectRatio: 316 / 304,
    image: require("@/assets/Rooms/table/table-white-oak-teal.png"),
    label: "화이트오크 청록",
    price: 200,
    slotId: "table",
    widthScale: 316 / 376,
  },
  "table-white-oak-yellow": {
    aspectRatio: 316 / 304,
    image: require("@/assets/Rooms/table/table-white-oak-yellow.png"),
    label: "화이트오크 노랑",
    price: 200,
    slotId: "table",
    widthScale: 316 / 376,
  },
};

export const ROOM_SLOT_ORDER: RoomSlotId[] = ["bed", "closet", "table"];

export const DEFAULT_ROOM_LAYOUT: Record<RoomSlotId, RoomLayoutItem> = {
  bed: {
    width: 376,
    x: 100,
    y: 580,
    slotId: "bed",
    zIndex: 2,
  },
  closet: {
    width: 280,
    x: 525,
    y: 340,
    slotId: "closet",
    zIndex: 3,
  },
  table: {
    width: 376,
    x: 800,
    y: 580,
    slotId: "table",
    zIndex: 4,
  },
};

export const ROOM_MINI_BOO_LAYOUT: RoomMiniBooLayout = {
  height: 180,
  width: 180,
  zIndex: 6,
};

export const ROOM_SENIOR_MINI_BOO_ON_BED_LAYOUT = {
  bedOffsetX: 60,
  bedOffsetY: 60,
  height: 180,
  width: 180,
  zIndex: 5,
};

export const ROOM_MINI_BOO_WALK_POINTS: RoomMiniBooWalkPoint[] = [
  {
    durationMs: 4600,
    pauseMs: 1800,
    x: 548,
    y: 745,
  },
  {
    durationMs: 5200,
    pauseMs: 2600,
    x: 490,
    y: 840,
  },
  {
    durationMs: 4800,
    pauseMs: 2200,
    x: 650,
    y: 805,
  },
  {
    durationMs: 5600,
    pauseMs: 3000,
    x: 570,
    y: 930,
  },
  {
    durationMs: 5000,
    pauseMs: 2000,
    x: 610,
    y: 750,
  },
];

export const ROOM_IMAGE_ASSETS = [
  ...Object.values(ROOM_WALLPAPER_ASSETS).map((wallpaper) => wallpaper.image),
  ...Object.values(ROOM_ITEM_ASSETS).map((item) => item.image),
];
