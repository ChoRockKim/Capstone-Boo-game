/**
 * @description  서버 마이룸/상점 상태를 로컬 마이룸 상태에 반영합니다.
 * @depends      stores/useGameStore.ts, utils/serverApi.ts, utils/serverRoomAdapter.ts
 * @used-by      utils/syncServerUserStats.ts
 * @side-effects HTTP 요청, Zustand 상태 변경
 */
import { useGameStore } from "@/stores/useGameStore";
import { getMyRoom, listShopItems } from "@/utils/serverApi";
import { mapServerRoomAndShopItemsToLocalRoomState } from "@/utils/serverRoomAdapter";

export const syncServerRoomState = async (accessToken?: string) => {
  if (!accessToken) {
    return null;
  }

  const [roomView, shopItems] = await Promise.all([
    getMyRoom(accessToken).catch((error) => {
      console.warn("서버 마이룸 조회 실패", error);

      return null;
    }),
    listShopItems(accessToken).catch((error) => {
      console.warn("서버 상점 아이템 조회 실패", error);

      return null;
    }),
  ]);

  if (!roomView && !shopItems) {
    return null;
  }

  const nextRoomState = mapServerRoomAndShopItemsToLocalRoomState({
    roomView: roomView ?? undefined,
    shopItems: shopItems ?? undefined,
  });

  useGameStore.getState().setGameState(
    roomView && shopItems
      ? nextRoomState
      : roomView
        ? {
            equippedRoomItems: nextRoomState.equippedRoomItems,
            equippedRoomWallpaper: nextRoomState.equippedRoomWallpaper,
          }
        : {
            ownedRoomItems: nextRoomState.ownedRoomItems,
            ownedRoomWallpapers: nextRoomState.ownedRoomWallpapers,
          },
  );

  return {
    roomView,
    shopItems,
  };
};

