/**
 * @description  서버 방/상점 아이템 응답을 로컬 마이룸 asset id로 변환합니다.
 * @depends      components/Room/RoomData.ts, utils/serverApi.ts
 * @used-by      app/room/index.tsx, app/room/[friendId].tsx
 * @side-effects 없음
 */
import {
  DEFAULT_EQUIPPED_ROOM_ITEMS,
  DEFAULT_EQUIPPED_ROOM_WALLPAPER,
  DEFAULT_OWNED_ROOM_ITEMS,
  DEFAULT_OWNED_ROOM_WALLPAPERS,
  EquippedRoomItems,
  ROOM_ITEM_ASSETS,
  ROOM_WALLPAPER_ASSETS,
  RoomItemId,
  RoomSlotId,
  RoomWallpaperId,
} from "@/components/Room/RoomData";
import { RoomView, ShopItemOut } from "@/utils/serverApi";

export type LocalRoomStateFromServer = {
  equippedRoomItems: EquippedRoomItems;
  equippedRoomWallpaper: RoomWallpaperId;
  ownedRoomItems: RoomItemId[];
  ownedRoomWallpapers: RoomWallpaperId[];
};

const ROOM_SLOT_IDS: RoomSlotId[] = ["bed", "closet", "table"];
const SERVER_ROOM_ITEM_TYPE_ALIASES: Record<string, RoomSlotId | "wallpaper"> = {
  desk: "table",
  room: "wallpaper",
  table: "table",
  wallpaper: "wallpaper",
};

export const normalizeServerRoomItemKey = (value: string) =>
  value.toLowerCase().replace(/[\s_-]/g, "");

export const normalizeServerRoomItemType = (
  itemType: string | null | undefined,
) => {
  if (!itemType) {
    return null;
  }

  const normalizedItemType = itemType.toLowerCase().trim();
  const aliasedItemType = SERVER_ROOM_ITEM_TYPE_ALIASES[normalizedItemType];

  if (aliasedItemType) {
    return aliasedItemType;
  }

  return ROOM_SLOT_IDS.includes(normalizedItemType as RoomSlotId)
    ? (normalizedItemType as RoomSlotId)
    : null;
};

const getServerItemType = (serverItem: Pick<ShopItemOut, "item_type">) =>
  normalizeServerRoomItemType(serverItem.item_type);

export const getLocalRoomItemIdFromServerItem = (
  serverItem: Pick<ShopItemOut, "image" | "item_key" | "name">,
  slotId: RoomSlotId,
): RoomItemId | null => {
  const serverItemKey = serverItem.item_key
    ? normalizeServerRoomItemKey(serverItem.item_key)
    : "";
  const serverNameKey = normalizeServerRoomItemKey(serverItem.name);
  const serverImageKey = serverItem.image
    ? normalizeServerRoomItemKey(serverItem.image)
    : "";

  const matchedEntry = Object.entries(ROOM_ITEM_ASSETS).find(
    ([itemId, item]) => {
      if (item.slotId !== slotId) {
        return false;
      }

      const itemIdKey = normalizeServerRoomItemKey(itemId);
      const labelKey = normalizeServerRoomItemKey(item.label);

      return (
        serverItemKey === itemIdKey ||
        serverItemKey === labelKey ||
        serverNameKey === itemIdKey ||
        serverNameKey === labelKey ||
        serverImageKey.includes(itemIdKey)
      );
    },
  );

  return matchedEntry ? (matchedEntry[0] as RoomItemId) : null;
};

export const getLocalWallpaperIdFromServerItem = (
  serverItem: Pick<ShopItemOut, "image" | "item_key" | "name">,
): RoomWallpaperId | null => {
  const serverItemKey = serverItem.item_key
    ? normalizeServerRoomItemKey(serverItem.item_key)
    : "";
  const serverNameKey = normalizeServerRoomItemKey(serverItem.name);
  const serverImageKey = serverItem.image
    ? normalizeServerRoomItemKey(serverItem.image)
    : "";

  const matchedEntry = Object.entries(ROOM_WALLPAPER_ASSETS).find(
    ([wallpaperId, wallpaper]) => {
      const wallpaperIdKey = normalizeServerRoomItemKey(wallpaperId);
      const labelKey = normalizeServerRoomItemKey(wallpaper.label);

      return (
        serverItemKey === wallpaperIdKey ||
        serverItemKey === labelKey ||
        serverNameKey === wallpaperIdKey ||
        serverNameKey === labelKey ||
        serverImageKey.includes(wallpaperIdKey)
      );
    },
  );

  return matchedEntry ? (matchedEntry[0] as RoomWallpaperId) : null;
};

export const getServerShopItemForLocalRoomOption = ({
  optionId,
  optionLabel,
  serverShopItems,
  type,
}: {
  optionId: string;
  optionLabel: string;
  serverShopItems: ShopItemOut[] | undefined;
  type: RoomSlotId | "wallpaper";
}) => {
  if (!serverShopItems) {
    return null;
  }

  const optionKeys = new Set([
    normalizeServerRoomItemKey(optionId),
    normalizeServerRoomItemKey(optionLabel),
  ]);

  return (
    serverShopItems.find((item) => {
      if (normalizeServerRoomItemType(item.item_type) !== type) {
        return false;
      }

      const itemKey = item.item_key
        ? normalizeServerRoomItemKey(item.item_key)
        : "";
      const itemNameKey = normalizeServerRoomItemKey(item.name);
      const itemImageKey = item.image
        ? normalizeServerRoomItemKey(item.image)
        : "";

      return (
        optionKeys.has(itemKey) ||
        optionKeys.has(itemNameKey) ||
        Array.from(optionKeys).some((key) => itemImageKey.includes(key))
      );
    }) ?? null
  );
};

export const mapServerRoomViewToLocalRoomState = (
  roomView: RoomView,
): Pick<
  LocalRoomStateFromServer,
  "equippedRoomItems" | "equippedRoomWallpaper"
> => {
  const equippedRoomItems = { ...DEFAULT_EQUIPPED_ROOM_ITEMS };
  let equippedRoomWallpaper = roomView.wallpaper
    ? (getLocalWallpaperIdFromServerItem(roomView.wallpaper) ??
      DEFAULT_EQUIPPED_ROOM_WALLPAPER)
    : DEFAULT_EQUIPPED_ROOM_WALLPAPER;

  roomView.equipped_items.forEach((equippedItem) => {
    const itemType = getServerItemType(equippedItem);

    if (itemType === "wallpaper") {
      equippedRoomWallpaper =
        getLocalWallpaperIdFromServerItem(equippedItem.item) ??
        equippedRoomWallpaper;
      return;
    }

    if (itemType) {
      equippedRoomItems[itemType] =
        getLocalRoomItemIdFromServerItem(equippedItem.item, itemType) ??
        equippedRoomItems[itemType];
    }
  });

  return {
    equippedRoomItems,
    equippedRoomWallpaper,
  };
};

export const mapServerRoomAndShopItemsToLocalRoomState = ({
  roomView,
  shopItems,
}: {
  roomView?: RoomView;
  shopItems?: ShopItemOut[];
}): LocalRoomStateFromServer => {
  const equippedState = roomView
    ? mapServerRoomViewToLocalRoomState(roomView)
    : {
        equippedRoomItems: { ...DEFAULT_EQUIPPED_ROOM_ITEMS },
        equippedRoomWallpaper: DEFAULT_EQUIPPED_ROOM_WALLPAPER,
      };
  const ownedRoomItems = new Set<RoomItemId>(DEFAULT_OWNED_ROOM_ITEMS);
  const ownedRoomWallpapers = new Set<RoomWallpaperId>(
    DEFAULT_OWNED_ROOM_WALLPAPERS,
  );

  Object.values(equippedState.equippedRoomItems).forEach((itemId) => {
    ownedRoomItems.add(itemId);
  });
  ownedRoomWallpapers.add(equippedState.equippedRoomWallpaper);

  shopItems?.forEach((shopItem) => {
    if (!shopItem.owned && !shopItem.equipped) {
      return;
    }

    const itemType = getServerItemType(shopItem);

    if (itemType === "wallpaper") {
      const wallpaperId = getLocalWallpaperIdFromServerItem(shopItem);

      if (wallpaperId) {
        ownedRoomWallpapers.add(wallpaperId);
      }

      return;
    }

    if (itemType) {
      const itemId = getLocalRoomItemIdFromServerItem(shopItem, itemType);

      if (itemId) {
        ownedRoomItems.add(itemId);
      }
    }
  });

  return {
    ...equippedState,
    ownedRoomItems: [...ownedRoomItems],
    ownedRoomWallpapers: [...ownedRoomWallpapers],
  };
};
