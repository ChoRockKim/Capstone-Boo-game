export type RoomSlotId = "bed" | "closet" | "table";

export type RoomItemId = "bed-basic" | "closet-basic" | "table-basic";

export type EquippedRoomItems = Record<RoomSlotId, RoomItemId>;

type RoomItemAsset = {
  aspectRatio: number;
  image: number;
  slotId: RoomSlotId;
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

export const ROOM_ITEM_ASSETS: Record<RoomItemId, RoomItemAsset> = {
  "bed-basic": {
    aspectRatio: 81 / 94,
    image: require("@/assets/Rooms/bed/bed-basic.png"),
    slotId: "bed",
  },
  "closet-basic": {
    aspectRatio: 280 / 404,
    image: require("@/assets/Rooms/closet/closet-basic.png"),
    slotId: "closet",
  },
  "table-basic": {
    aspectRatio: 376 / 372,
    image: require("@/assets/Rooms/table/table-basic.png"),
    slotId: "table",
  },
};

export const ROOM_SLOT_ORDER: RoomSlotId[] = ["bed", "closet", "table"];

export const DEFAULT_ROOM_LAYOUT: Record<RoomSlotId, RoomLayoutItem> = {
  bed: {
    width: 376,
    x: 100,
    y: 570,
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
  ROOM_BACKGROUND_ASSET,
  ...Object.values(ROOM_ITEM_ASSETS).map((item) => item.image),
];
