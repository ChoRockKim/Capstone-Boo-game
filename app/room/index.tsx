/**
 * @description  마이룸 화면에서 방/가구/미니 부와 커스텀 가구 선택 UI를 렌더링합니다.
 * @depends      stores/useGameStore.ts, components/Room/RoomData.ts, components/Room/RoomMiniBoo.tsx, utils/backgroundMusic.ts, utils/soundEffects.ts, utils/xpProgress.ts
 * @used-by      expo-router/entry
 * @side-effects myRoom BGM 세션 시작, 가구 장착 Zustand 상태 변경, router 이동, 클릭 SFX 재생
 */
import ArrowBackIcon from "@/assets/icons/arrow-back-return.svg";
import CheckBoxIcon from "@/assets/icons/check-box.svg";
import CoinIcon from "@/assets/icons/coin.svg";
import MarketIcon from "@/assets/icons/market.svg";
import CoinBox from "@/components/CoinBox/CoinBox";
import MainButton from "@/components/MainButton/MainButton";
import ProgressBar from "@/components/ProgressBar/ProgressBar";
import GuestbookListModal from "@/components/Room/GuestbookListModal";
import {
  ROOM_CANVAS_ASPECT_RATIO,
  ROOM_ITEM_ASSETS,
  ROOM_WALLPAPER_ASSETS,
  RoomItemId,
  RoomSlotId,
  RoomWallpaperId,
} from "@/components/Room/RoomData";
import RoomScene from "@/components/Room/RoomScene";
import SquareButton from "@/components/SquareButton/SquareButton";
import TopAlert from "@/components/TopAlert/TopAlert";
import {
  CHARACTER_COSTUMES,
  getCharacterImage,
  isCharacterCostumeKey,
  type CharacterCostumeKey,
} from "@/constants/character";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { useGameStore } from "@/stores/useGameStore";
import { useRequirePlayableSession } from "@/useHook/useRequirePlayableSession";
import { useSyncServerUserStatsOnFocus } from "@/useHook/useSyncServerUserStatsOnFocus";
import { startBackgroundMusicSession } from "@/utils/backgroundMusic";
import {
  deleteRoomGuestbook,
  equipRoomItem,
  getMyRoom,
  getServerApiErrorMessage,
  listRoomGuestbook,
  listShopItemTypes,
  listShopItems,
  purchaseShopItem,
  ShopItemOut,
  updateMyCharacter,
  updateRoomGuestbook,
} from "@/utils/serverApi";
import { RoomGuestbookListEntry } from "@/components/Room/RoomGuestbookDummyData";
import { mapGuestbookOutToListEntry } from "@/utils/serverGuestbookAdapter";
import {
  getServerShopItemForLocalRoomOption,
  mapServerRoomAndShopItemsToLocalRoomState,
  normalizeServerRoomItemType,
} from "@/utils/serverRoomAdapter";
import { playSoundEffect } from "@/utils/soundEffects";
import { getXpProgressInfo } from "@/utils/xpProgress";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const ROOM_MAX_WIDTH = 600;
const PROGRESS_BOTTOM_OFFSET = 38;
const ROOM_VERTICAL_RESERVED_SPACE = 220;

type RoomCustomizeCategoryId = "wallpaper" | RoomSlotId;
type RoomCustomizeOption = {
  id: RoomWallpaperId | RoomItemId;
  label: string;
};
type RoomCustomizeCategory = {
  id: RoomCustomizeCategoryId;
  label: string;
  options: RoomCustomizeOption[];
};
type RoomTopAlertState = {
  id: number;
  message: string;
  title: string;
  visible: boolean;
};
type RoomItemEntry = [RoomItemId, (typeof ROOM_ITEM_ASSETS)[RoomItemId]];
type RoomWallpaperEntry = [
  RoomWallpaperId,
  (typeof ROOM_WALLPAPER_ASSETS)[RoomWallpaperId],
];

const getRoomWallpaperCustomizeOptions = (): RoomCustomizeOption[] => {
  return (Object.entries(ROOM_WALLPAPER_ASSETS) as RoomWallpaperEntry[]).map(
    ([id, wallpaper]) => ({
      id,
      label: wallpaper.label,
    }),
  );
};

const getRoomItemCustomizeOptions = (
  slotId: RoomSlotId,
): RoomCustomizeOption[] => {
  return (Object.entries(ROOM_ITEM_ASSETS) as RoomItemEntry[])
    .filter(([, item]) => item.slotId === slotId)
    .map(([id, item]) => ({
      id,
      label: item.label,
    }));
};

const DEFAULT_ROOM_CUSTOMIZE_CATEGORIES: RoomCustomizeCategory[] = [
  {
    id: "wallpaper",
    label: "벽지",
    options: getRoomWallpaperCustomizeOptions(),
  },
  {
    id: "bed",
    label: "침대",
    options: getRoomItemCustomizeOptions("bed"),
  },
  {
    id: "closet",
    label: "장롱",
    options: getRoomItemCustomizeOptions("closet"),
  },
  {
    id: "table",
    label: "책상",
    options: getRoomItemCustomizeOptions("table"),
  },
];

const getNextIndex = (
  currentIndex: number,
  direction: -1 | 1,
  length: number,
) => (currentIndex + direction + length) % length;

const getCustomizeOptionIndexInOptions = (
  options: RoomCustomizeOption[],
  optionId: RoomCustomizeOption["id"],
) => {
  const optionIndex = options.findIndex((option) => option.id === optionId);

  return optionIndex >= 0 ? optionIndex : 0;
};

const getServerShopItemForCustomizeOption = ({
  option,
  serverShopItems,
  type,
}: {
  option: RoomCustomizeOption;
  serverShopItems: ShopItemOut[] | undefined;
  type: RoomCustomizeCategoryId;
}) => {
  const serverItemType = normalizeServerRoomItemType(
    type === "wallpaper" ? "wallpaper" : type,
  );

  if (
    serverItemType !== "wallpaper" &&
    serverItemType !== "bed" &&
    serverItemType !== "closet" &&
    serverItemType !== "table"
  ) {
    return null;
  }

  return getServerShopItemForLocalRoomOption({
    optionId: String(option.id),
    optionLabel: option.label,
    serverShopItems,
    type: serverItemType,
  });
};

const getRoomShopItemLogPayload = (item: ShopItemOut | null | undefined) =>
  item
    ? {
        equipped: item.equipped,
        item_id: item.item_id,
        item_key: item.item_key,
        item_type: item.item_type,
        name: item.name,
        owned: item.owned,
        price: item.price,
      }
    : null;

const getRoomShopItemsLogSummary = (
  serverShopItems: ShopItemOut[] | undefined,
  type: RoomCustomizeCategoryId,
) => {
  const serverItemType = normalizeServerRoomItemType(
    type === "wallpaper" ? "wallpaper" : type,
  );

  return {
    count: serverShopItems?.length ?? 0,
    matchingTypeItems:
      serverShopItems
        ?.filter(
          (item) => normalizeServerRoomItemType(item.item_type) === serverItemType,
        )
        .map(getRoomShopItemLogPayload) ?? [],
  };
};

export default function RoomIndex() {
  const insets = useSafeAreaInsets();
  useRequirePlayableSession();
  useSyncServerUserStatsOnFocus();
  const queryClient = useQueryClient();
  const { height, width } = useWindowDimensions();
  const [isCustomizeMode, setIsCustomizeMode] = useState(false);
  const [isClosetOpen, setIsClosetOpen] = useState(false);
  const [showOwnedCustomizeOptionsOnly, setShowOwnedCustomizeOptionsOnly] =
    useState(false);
  const [isGuestbookListOpen, setIsGuestbookListOpen] = useState(false);
  const [topAlert, setTopAlert] = useState<RoomTopAlertState>({
    id: 0,
    message: "",
    title: "",
    visible: false,
  });
  const [customizeCategoryIndex, setCustomizeCategoryIndex] = useState(0);
  const [customizeOptionIndexes, setCustomizeOptionIndexes] = useState<
    Record<RoomCustomizeCategoryId, number>
  >({
    wallpaper: 0,
    bed: 0,
    closet: 0,
    table: 0,
  });
  const lastRoomEnterAccessTokenRef = useRef<string | null>(null);
  const [purchaseTarget, setPurchaseTarget] =
    useState<RoomCustomizeOption | null>(null);
  const [purchaseErrorMessage, setPurchaseErrorMessage] = useState("");
  const [selectedClosetCostumeKey, setSelectedClosetCostumeKey] =
    useState<CharacterCostumeKey>("default");
  const accessToken = useGameStore((state) => state.accessToken);
  const booName = useGameStore((state) => state.booName);
  const characterCostumeKey = useGameStore(
    (state) => state.characterCostumeKey,
  );
  const characterState = useGameStore((state) => state.characterState);
  const coin = useGameStore((state) => state.coin);
  const equippedRoomItems = useGameStore((state) => state.equippedRoomItems);
  const equippedRoomWallpaper = useGameStore(
    (state) => state.equippedRoomWallpaper,
  );
  const ownedRoomItems = useGameStore((state) => state.ownedRoomItems);
  const ownedRoomWallpapers = useGameStore(
    (state) => state.ownedRoomWallpapers,
  );
  const ownedAchievementSkins = useGameStore(
    (state) => state.ownedAchievementSkins,
  );
  const purchaseRoomItem = useGameStore((state) => state.purchaseRoomItem);
  const purchaseRoomWallpaper = useGameStore(
    (state) => state.purchaseRoomWallpaper,
  );
  const recordRoomEnter = useGameStore((state) => state.recordRoomEnter);
  const recordRoomItemEquip = useGameStore(
    (state) => state.recordRoomItemEquip,
  );
  const setEquippedRoomItem = useGameStore(
    (state) => state.setEquippedRoomItem,
  );
  const setEquippedRoomWallpaper = useGameStore(
    (state) => state.setEquippedRoomWallpaper,
  );
  const setCharacterCostumeKey = useGameStore(
    (state) => state.setCharacterCostumeKey,
  );
  const setGameState = useGameStore((state) => state.setGameState);
  const totalXp = useGameStore((state) => state.totalXp);
  const userId = useGameStore((state) => state.userId);
  const { data: serverRoom } = useQuery({
    queryKey: ["rooms", "me", accessToken],
    queryFn: () => getMyRoom(accessToken ?? undefined),
    enabled: !!accessToken,
    staleTime: 1000 * 30,
    retry: 1,
  });
  const { data: serverGuestbookPage } = useQuery({
    queryKey: ["rooms", userId, "guestbook"],
    queryFn: () => listRoomGuestbook(userId ?? 0, accessToken ?? undefined),
    enabled: !!accessToken && userId !== null,
    staleTime: 1000 * 30,
    retry: 1,
  });
  const { data: serverShopItems, refetch: refetchServerShopItems } = useQuery({
    queryKey: ["shop", "items", accessToken],
    queryFn: async () => {
      const items = await listShopItems(accessToken ?? undefined);

      console.warn("[RoomShop] shop items loaded", {
        count: items.length,
        items: items.slice(0, 8).map(getRoomShopItemLogPayload),
      });

      return items;
    },
    enabled: !!accessToken,
    staleTime: 1000 * 30,
    retry: 1,
  });
  const { data: serverShopItemTypes } = useQuery({
    queryKey: ["shop", "item-types"],
    queryFn: listShopItemTypes,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
  const roomCustomizeCategories = useMemo(() => {
    if (!serverShopItemTypes?.length) {
      return DEFAULT_ROOM_CUSTOMIZE_CATEGORIES;
    }

    const serverLabelByType = new Map(
      serverShopItemTypes.map((itemType) => [
        normalizeServerRoomItemType(itemType.item_type) ?? itemType.item_type,
        itemType.label,
      ]),
    );

    return DEFAULT_ROOM_CUSTOMIZE_CATEGORIES.map((category) => ({
      ...category,
      label: serverLabelByType.get(category.id) ?? category.label,
    }));
  }, [serverShopItemTypes]);
  useEffect(() => {
    if (!accessToken || (!serverRoom && !serverShopItems)) {
      return;
    }

    const nextRoomState = mapServerRoomAndShopItemsToLocalRoomState({
      roomView: serverRoom,
      shopItems: serverShopItems,
    });

    setGameState(
      serverShopItems
        ? nextRoomState
        : {
            equippedRoomItems: nextRoomState.equippedRoomItems,
            equippedRoomWallpaper: nextRoomState.equippedRoomWallpaper,
          },
    );
  }, [accessToken, serverRoom, serverShopItems, setGameState]);
  const guestbookEntries = useMemo(
    () => serverGuestbookPage?.items.map(mapGuestbookOutToListEntry),
    [serverGuestbookPage],
  );
  const showTopAlert = useCallback((title: string, message: string) => {
    setTopAlert((currentAlert) => ({
      id: currentAlert.id + 1,
      message,
      title,
      visible: true,
    }));
  }, []);
  const hideTopAlert = useCallback(() => {
    setTopAlert((currentAlert) => ({
      ...currentAlert,
      visible: false,
    }));
  }, []);
  const handleGuestbookDelete = useCallback(
    async (entry: RoomGuestbookListEntry) => {
      if (!accessToken || entry.serverEntryId === undefined) {
        return;
      }

      try {
        await deleteRoomGuestbook(entry.serverEntryId, accessToken);
        await queryClient.invalidateQueries({
          queryKey: ["rooms", userId, "guestbook"],
        });
      } catch (error) {
        throw new Error(
          getServerApiErrorMessage(error, "방명록을 삭제하지 못했어요."),
        );
      }
    },
    [accessToken, queryClient, userId],
  );
  const handleGuestbookUpdate = useCallback(
    async (entry: RoomGuestbookListEntry, message: string) => {
      if (!accessToken || entry.serverEntryId === undefined) {
        return;
      }

      try {
        await updateRoomGuestbook(entry.serverEntryId, message, accessToken);
        await queryClient.invalidateQueries({
          queryKey: ["rooms", userId, "guestbook"],
        });
      } catch (error) {
        throw new Error(
          getServerApiErrorMessage(error, "방명록을 수정하지 못했어요."),
        );
      }
    },
    [accessToken, queryClient, userId],
  );
  const getVisibleCustomizeOptions = useCallback(
    (
      category: RoomCustomizeCategory,
      ownedOnly = showOwnedCustomizeOptionsOnly,
    ) => {
      if (!ownedOnly) {
        return category.options;
      }

      const ownedOptions = category.options.filter((option) =>
        category.id === "wallpaper"
          ? ownedRoomWallpapers.includes(option.id as RoomWallpaperId)
          : ownedRoomItems.includes(option.id as RoomItemId),
      );

      return ownedOptions.length > 0 ? ownedOptions : category.options;
    },
    [ownedRoomItems, ownedRoomWallpapers, showOwnedCustomizeOptionsOnly],
  );
  const getCustomizeOptionIndexesFromEquippedForMode = useCallback(
    (ownedOnly = showOwnedCustomizeOptionsOnly) => ({
      wallpaper: getCustomizeOptionIndexInOptions(
        getVisibleCustomizeOptions(roomCustomizeCategories[0], ownedOnly),
        equippedRoomWallpaper,
      ),
      bed: getCustomizeOptionIndexInOptions(
        getVisibleCustomizeOptions(roomCustomizeCategories[1], ownedOnly),
        equippedRoomItems.bed,
      ),
      closet: getCustomizeOptionIndexInOptions(
        getVisibleCustomizeOptions(roomCustomizeCategories[2], ownedOnly),
        equippedRoomItems.closet,
      ),
      table: getCustomizeOptionIndexInOptions(
        getVisibleCustomizeOptions(roomCustomizeCategories[3], ownedOnly),
        equippedRoomItems.table,
      ),
    }),
    [
      equippedRoomItems,
      equippedRoomWallpaper,
      getVisibleCustomizeOptions,
      roomCustomizeCategories,
      showOwnedCustomizeOptionsOnly,
    ],
  );
  const selectedCustomizeCategory =
    roomCustomizeCategories[customizeCategoryIndex];
  const selectedCustomizeOptions = getVisibleCustomizeOptions(
    selectedCustomizeCategory,
  );
  const selectedCustomizeOptionIndex = Math.min(
    customizeOptionIndexes[selectedCustomizeCategory.id] ?? 0,
    Math.max(selectedCustomizeOptions.length - 1, 0),
  );
  const selectedCustomizeOption =
    selectedCustomizeOptions[selectedCustomizeOptionIndex] ??
    selectedCustomizeCategory.options[0];
  const isWallpaperCategory = selectedCustomizeCategory.id === "wallpaper";
  const selectedServerShopItem = getServerShopItemForCustomizeOption({
    option: selectedCustomizeOption,
    serverShopItems,
    type: selectedCustomizeCategory.id,
  });
  const selectedRoomSlotId = isWallpaperCategory
    ? null
    : (selectedCustomizeCategory.id as RoomSlotId);
  const selectedWallpaperId = isWallpaperCategory
    ? (selectedCustomizeOption.id as RoomWallpaperId)
    : null;
  const selectedWallpaper = selectedWallpaperId
    ? ROOM_WALLPAPER_ASSETS[selectedWallpaperId]
    : null;
  const selectedRoomItemId = selectedRoomSlotId
    ? (selectedCustomizeOption.id as RoomItemId)
    : null;
  const selectedRoomItem = selectedRoomItemId
    ? ROOM_ITEM_ASSETS[selectedRoomItemId]
    : null;
  const selectedOptionPrice =
    selectedWallpaper?.price ?? selectedRoomItem?.price ?? 0;
  const isSelectedCustomizeOptionOwned = isWallpaperCategory
    ? !!selectedWallpaperId && ownedRoomWallpapers.includes(selectedWallpaperId)
    : !!selectedRoomItemId && ownedRoomItems.includes(selectedRoomItemId);
  const isSelectedCustomizeOptionEquipped = isWallpaperCategory
    ? equippedRoomWallpaper === selectedCustomizeOption.id
    : !!selectedRoomSlotId &&
      equippedRoomItems[selectedRoomSlotId] === selectedCustomizeOption.id;
  const previewWallpaperId =
    isCustomizeMode && selectedWallpaperId
      ? selectedWallpaperId
      : equippedRoomWallpaper;
  const previewEquippedRoomItems = useMemo(() => {
    if (!isCustomizeMode || !selectedRoomSlotId || !selectedRoomItemId) {
      return equippedRoomItems;
    }

    if (ROOM_ITEM_ASSETS[selectedRoomItemId]?.slotId !== selectedRoomSlotId) {
      return equippedRoomItems;
    }

    return {
      ...equippedRoomItems,
      [selectedRoomSlotId]: selectedRoomItemId,
    };
  }, [
    equippedRoomItems,
    isCustomizeMode,
    selectedRoomItemId,
    selectedRoomSlotId,
  ]);
  const purchaseWallpaper =
    purchaseTarget &&
    ROOM_WALLPAPER_ASSETS[purchaseTarget.id as RoomWallpaperId]
      ? ROOM_WALLPAPER_ASSETS[purchaseTarget.id as RoomWallpaperId]
      : null;
  const purchaseRoomItemAsset =
    purchaseTarget && ROOM_ITEM_ASSETS[purchaseTarget.id as RoomItemId]
      ? ROOM_ITEM_ASSETS[purchaseTarget.id as RoomItemId]
      : null;
  const purchaseAsset = purchaseWallpaper ?? purchaseRoomItemAsset;
  const xpProgress = useMemo(() => getXpProgressInfo(totalXp), [totalXp]);
  const canApplyAchievementCostume = xpProgress.grade >= 2;
  const previewCharacterCostumeKey = isClosetOpen
    ? canApplyAchievementCostume
      ? selectedClosetCostumeKey
      : "default"
    : canApplyAchievementCostume
      ? characterCostumeKey
      : "default";
  const closetCostumeOptions = useMemo(
    () =>
      CHARACTER_COSTUMES.map((costume) => {
        const isDefaultCostume = costume.key === "default";
        const isOwned =
          isDefaultCostume ||
          (!!costume.skinKey && ownedAchievementSkins.includes(costume.skinKey));
        const isLockedByGrade = !isDefaultCostume && !canApplyAchievementCostume;
        const previewGrade =
          isLockedByGrade && isOwned ? 2 : xpProgress.grade;

        return {
          ...costume,
          image: getCharacterImage(previewGrade, characterState, costume.key),
          isEquipped: characterCostumeKey === costume.key,
          isOwned,
          isSelectable: isOwned && !isLockedByGrade,
          isSelected: selectedClosetCostumeKey === costume.key,
          statusText: isLockedByGrade ? "2학년부터" : "",
        };
      }),
    [
      canApplyAchievementCostume,
      characterState,
      characterCostumeKey,
      ownedAchievementSkins,
      selectedClosetCostumeKey,
      xpProgress.grade,
    ],
  );
  const closetCostumeRows = useMemo(
    () =>
      Array.from(
        { length: Math.ceil(closetCostumeOptions.length / 2) },
        (_, rowIndex) =>
          closetCostumeOptions.slice(rowIndex * 2, rowIndex * 2 + 2),
      ),
    [closetCostumeOptions],
  );
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
  const closetConfirmButtonWidth = Math.min(width - 112, 374);
  const progressBarBottomOffset = Math.max(
    insets.bottom + 24,
    PROGRESS_BOTTOM_OFFSET,
  );

  const changeCustomizeCategory = (direction: -1 | 1) => {
    playSoundEffect("basicClick");
    setCustomizeCategoryIndex((currentIndex) =>
      getNextIndex(currentIndex, direction, roomCustomizeCategories.length),
    );
  };

  const changeCustomizeOption = (direction: -1 | 1) => {
    playSoundEffect("basicClick");

    if (selectedCustomizeOptions.length <= 1) {
      return;
    }

    setCustomizeOptionIndexes((currentIndexes) => ({
      ...currentIndexes,
      [selectedCustomizeCategory.id]: getNextIndex(
        selectedCustomizeOptionIndex,
        direction,
        selectedCustomizeOptions.length,
      ),
    }));
  };

  const applySelectedCustomizeOption = async () => {
    if (isSelectedCustomizeOptionEquipped) {
      return;
    }

    playSoundEffect("basicClick");

    if (isWallpaperCategory) {
      if (!selectedWallpaperId) {
        return;
      }

      if (!isSelectedCustomizeOptionOwned) {
        setPurchaseErrorMessage("");
        setPurchaseTarget(selectedCustomizeOption);
        return;
      }

      if (accessToken && !selectedServerShopItem) {
        const message = "서버 상점 정보를 불러온 뒤 다시 시도해주세요.";
        console.warn("[RoomShop] equip wallpaper item mapping failed", {
          option: selectedCustomizeOption,
          selectedCategory: selectedCustomizeCategory.id,
          serverShopItems: getRoomShopItemsLogSummary(
            serverShopItems,
            selectedCustomizeCategory.id,
          ),
        });
        setPurchaseErrorMessage(message);
        showTopAlert("상점 정보 오류", message);
        return;
      }

      if (accessToken && selectedServerShopItem) {
        try {
          await equipRoomItem(selectedServerShopItem.item_id, accessToken);
          void queryClient.invalidateQueries({
            queryKey: ["rooms", "me"],
          });
          void queryClient.invalidateQueries({
            queryKey: ["shop", "items"],
          });
        } catch (error) {
          console.warn("[RoomShop] equip wallpaper request failed", {
            error,
            option: selectedCustomizeOption,
            selectedCategory: selectedCustomizeCategory.id,
            serverItem: getRoomShopItemLogPayload(selectedServerShopItem),
          });
          setPurchaseErrorMessage(
            getServerApiErrorMessage(error, "장착에 실패했어요."),
          );
          return;
        }
      }

      setEquippedRoomWallpaper(selectedWallpaperId);
      return;
    }

    if (!selectedRoomSlotId || !selectedRoomItemId) {
      return;
    }

    if (!isSelectedCustomizeOptionOwned) {
      setPurchaseErrorMessage("");
      setPurchaseTarget(selectedCustomizeOption);
      return;
    }

    if (accessToken && !selectedServerShopItem) {
      const message = "서버 상점 정보를 불러온 뒤 다시 시도해주세요.";
      console.warn("[RoomShop] equip room item mapping failed", {
        option: selectedCustomizeOption,
        selectedCategory: selectedCustomizeCategory.id,
        serverShopItems: getRoomShopItemsLogSummary(
          serverShopItems,
          selectedCustomizeCategory.id,
        ),
      });
      setPurchaseErrorMessage(message);
      showTopAlert("상점 정보 오류", message);
      return;
    }

    if (accessToken && selectedServerShopItem) {
      try {
        await equipRoomItem(selectedServerShopItem.item_id, accessToken);
        void queryClient.invalidateQueries({
          queryKey: ["rooms", "me"],
        });
        void queryClient.invalidateQueries({
          queryKey: ["shop", "items"],
        });
      } catch (error) {
        console.warn("[RoomShop] equip room item request failed", {
          error,
          option: selectedCustomizeOption,
          selectedCategory: selectedCustomizeCategory.id,
          serverItem: getRoomShopItemLogPayload(selectedServerShopItem),
        });
        setPurchaseErrorMessage(
          getServerApiErrorMessage(error, "장착에 실패했어요."),
        );
        return;
      }
    }

    setEquippedRoomItem(selectedRoomSlotId, selectedRoomItemId);
  };

  const closePurchaseModal = () => {
    playSoundEffect("basicClick");
    setPurchaseTarget(null);
    setPurchaseErrorMessage("");
  };

  const handleTablePress = () => {
    if (isCustomizeMode) {
      return;
    }

    playSoundEffect("basicClick");
    setIsGuestbookListOpen(true);
  };

  const handleClosetPress = () => {
    if (isCustomizeMode) {
      return;
    }

    playSoundEffect("basicClick");
    setSelectedClosetCostumeKey(
      canApplyAchievementCostume ? characterCostumeKey : "default",
    );
    setIsClosetOpen(true);
  };

  const closeClosetModal = () => {
    playSoundEffect("basicClick");
    setIsClosetOpen(false);
    setSelectedClosetCostumeKey(
      canApplyAchievementCostume ? characterCostumeKey : "default",
    );
  };

  const selectClosetCostume = (
    costumeKey: CharacterCostumeKey,
    isOwned: boolean,
  ) => {
    if (!isOwned) {
      return;
    }

    playSoundEffect("basicClick");
    setSelectedClosetCostumeKey(costumeKey);
  };

  const confirmClosetCostume = async () => {
    const selectedCostume = closetCostumeOptions.find(
      (costume) => costume.key === selectedClosetCostumeKey,
    );

    if (!selectedCostume?.isSelectable) {
      showTopAlert(
        "코스튬 변경 불가",
        selectedCostume?.statusText || "선택할 수 없는 코스튬이에요.",
      );
      return;
    }

    playSoundEffect("basicClick");
    const previousCostumeKey = characterCostumeKey;
    setCharacterCostumeKey(selectedClosetCostumeKey);

    if (accessToken) {
      showTopAlert(
        "코스튬 변경 중",
        `${selectedCostume.label} 코스튬을 저장하고 있어요.`,
      );

      try {
        const updatedCharacter = await updateMyCharacter(
          { equipped_skin_key: selectedClosetCostumeKey },
          accessToken,
        );
        const serverCostumeKey = isCharacterCostumeKey(
          updatedCharacter.equipped_skin_key,
        )
          ? updatedCharacter.equipped_skin_key
          : selectedClosetCostumeKey;

        setCharacterCostumeKey(serverCostumeKey);
        showTopAlert(
          "코스튬 변경 완료",
          `${selectedCostume.label} 코스튬을 적용했어요.`,
        );
      } catch (error) {
        setCharacterCostumeKey(previousCostumeKey);
        showTopAlert(
          "코스튬 저장 실패",
          getServerApiErrorMessage(error, "코스튬을 저장하지 못했어요."),
        );
        return;
      }
    } else {
      showTopAlert(
        "코스튬 변경 완료",
        `${selectedCostume.label} 코스튬을 적용했어요.`,
      );
    }

    setIsClosetOpen(false);
  };

  const confirmPurchase = async () => {
    if (!purchaseTarget) {
      return;
    }

    playSoundEffect("basicClick");

    const purchaseCategory = purchaseWallpaper
      ? "wallpaper"
      : selectedCustomizeCategory.id;
    let latestServerShopItems = serverShopItems;

    if (
      accessToken &&
      (!latestServerShopItems || latestServerShopItems.length === 0)
    ) {
      console.warn("[RoomShop] shop items empty before purchase, refetching", {
        target: purchaseTarget,
        selectedCategory: selectedCustomizeCategory.id,
      });

      const refetchResult = await refetchServerShopItems();
      console.warn("[RoomShop] shop items refetch result", {
        count: refetchResult.data?.length ?? 0,
        error: refetchResult.error,
        items: refetchResult.data?.slice(0, 8).map(getRoomShopItemLogPayload),
        status: refetchResult.status,
      });
      latestServerShopItems = refetchResult.data;
    }

    const serverPurchaseItem = getServerShopItemForCustomizeOption({
      option: purchaseTarget,
      serverShopItems: latestServerShopItems,
      type: purchaseCategory,
    });

    if (accessToken && !serverPurchaseItem) {
      const message = "서버 상점 정보를 불러온 뒤 다시 시도해주세요.";
      console.warn("[RoomShop] purchase item mapping failed", {
        option: purchaseTarget,
        selectedCategory: selectedCustomizeCategory.id,
        serverShopItems: getRoomShopItemsLogSummary(
          latestServerShopItems,
          purchaseCategory,
        ),
      });
      setPurchaseErrorMessage(message);
      showTopAlert("상점 정보 오류", message);
      return;
    }

    if (accessToken && serverPurchaseItem) {
      try {
        const purchaseResult = await purchaseShopItem(
          serverPurchaseItem.item_id,
          accessToken,
        );
        let didEquipPurchasedItem = false;

        try {
          await equipRoomItem(purchaseResult.item.item_id, accessToken);
          didEquipPurchasedItem = true;
          void queryClient.invalidateQueries({
            queryKey: ["rooms", "me"],
          });
        } catch (error) {
          console.warn("[RoomShop] equip after purchase request failed", {
            error,
            purchaseResultItem: getRoomShopItemLogPayload(purchaseResult.item),
            target: purchaseTarget,
          });
        }

        const currentGameState = useGameStore.getState();

        if (purchaseWallpaper) {
          useGameStore.getState().setGameState({
            coin: purchaseResult.coin,
            ...(didEquipPurchasedItem
              ? {
                  equippedRoomWallpaper: purchaseTarget.id as RoomWallpaperId,
                }
              : {}),
            ownedRoomWallpapers: Array.from(
              new Set([
                ...currentGameState.ownedRoomWallpapers,
                purchaseTarget.id as RoomWallpaperId,
              ]),
            ),
          });
          if (didEquipPurchasedItem) {
            recordRoomItemEquip();
          }
        } else if (purchaseRoomItemAsset) {
          useGameStore.getState().setGameState({
            coin: purchaseResult.coin,
            ...(didEquipPurchasedItem
              ? {
                  equippedRoomItems: {
                    ...currentGameState.equippedRoomItems,
                    [purchaseRoomItemAsset.slotId]:
                      purchaseTarget.id as RoomItemId,
                  },
                }
              : {}),
            ownedRoomItems: Array.from(
              new Set([
                ...currentGameState.ownedRoomItems,
                purchaseTarget.id as RoomItemId,
              ]),
            ),
          });
          if (didEquipPurchasedItem) {
            recordRoomItemEquip();
          }
        } else {
          useGameStore.getState().setGameState({
            coin: purchaseResult.coin,
          });
        }

        void refetchServerShopItems();
        void queryClient.invalidateQueries({
          queryKey: ["shop", "items"],
        });
        setPurchaseTarget(null);
        setPurchaseErrorMessage("");
        return;
      } catch (error) {
        console.warn("[RoomShop] purchase request failed", {
          error,
          serverItem: getRoomShopItemLogPayload(serverPurchaseItem),
          target: purchaseTarget,
        });
        setPurchaseErrorMessage(
          getServerApiErrorMessage(error, "구매에 실패했어요."),
        );
        return;
      }
    }

    const result = purchaseWallpaper
      ? purchaseRoomWallpaper(purchaseTarget.id as RoomWallpaperId)
      : purchaseRoomItemAsset
        ? purchaseRoomItem(purchaseTarget.id as RoomItemId)
        : { ok: false as const, reason: "not_found" as const };

    if (result.ok) {
      setPurchaseTarget(null);
      setPurchaseErrorMessage("");
      return;
    }

    if (result.reason === "insufficient_coin") {
      setPurchaseErrorMessage("코인이 부족해요.");
      return;
    }

    setPurchaseErrorMessage("구매할 수 없는 아이템이에요.");
  };

  const toggleOwnedCustomizeOptionsOnly = () => {
    playSoundEffect("basicClick");
    setShowOwnedCustomizeOptionsOnly((currentValue) => {
      const nextValue = !currentValue;

      setCustomizeOptionIndexes(
        getCustomizeOptionIndexesFromEquippedForMode(nextValue),
      );

      return nextValue;
    });
  };

  const toggleCustomizeMode = () => {
    setIsCustomizeMode((currentValue) => {
      const nextValue = !currentValue;

      if (nextValue) {
        setIsClosetOpen(false);
        setCustomizeOptionIndexes(
          getCustomizeOptionIndexesFromEquippedForMode(
            showOwnedCustomizeOptionsOnly,
          ),
        );
      } else {
        setPurchaseTarget(null);
        setPurchaseErrorMessage("");
      }

      return nextValue;
    });
  };

  useFocusEffect(
    useCallback(() => {
      lastRoomEnterAccessTokenRef.current = accessToken;
      recordRoomEnter();
      return startBackgroundMusicSession("myRoom");
    }, [accessToken, recordRoomEnter]),
  );

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <TopAlert
        message={topAlert.message}
        onClose={hideTopAlert}
        title={topAlert.title}
        visibilityKey={topAlert.id}
        visible={topAlert.visible}
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <View style={styles.leftControls}>
            <SquareButton
              Icon={ArrowBackIcon}
              onPress={() => router.replace("/game")}
              shadow
            />
            <CoinBox coin={coin} shadow />
          </View>
          <SquareButton
            Icon={MarketIcon}
            active={isCustomizeMode}
            onPress={toggleCustomizeMode}
            shadow
          />
        </View>

        {isCustomizeMode ? (
          <View style={styles.categorySelector}>
            <RoomCustomizeArrowButton
              direction="left"
              onPress={() => changeCustomizeCategory(-1)}
            />
            <View style={styles.categoryLabelBox}>
              <Text style={styles.categoryLabelText}>
                {selectedCustomizeCategory.label}
              </Text>
            </View>
            <RoomCustomizeArrowButton
              direction="right"
              onPress={() => changeCustomizeCategory(1)}
            />
          </View>
        ) : null}

        <View style={styles.roomStage}>
          <RoomScene
            characterCostumeKey={previewCharacterCostumeKey}
            characterState={characterState}
            equippedRoomItems={previewEquippedRoomItems}
            grade={xpProgress.grade}
            miniBooGrabbable={!isCustomizeMode}
            onFurniturePress={
              isCustomizeMode
                ? undefined
                : {
                    closet: handleClosetPress,
                    table: handleTablePress,
                  }
            }
            roomHeight={roomHeight}
            roomWidth={roomWidth}
            showMiniBoo={!isCustomizeMode}
            wallpaperId={previewWallpaperId}
          />
        </View>

        {isCustomizeMode ? (
          <View style={styles.customizeBottomArea}>
            <Pressable
              onPress={toggleOwnedCustomizeOptionsOnly}
              style={({ pressed }) => [
                styles.ownedFilterButton,
                showOwnedCustomizeOptionsOnly && styles.ownedFilterButtonActive,
                pressed && styles.ownedFilterButtonPressed,
              ]}
            >
              {showOwnedCustomizeOptionsOnly ? (
                <CheckBoxIcon width={20} height={20} />
              ) : (
                <View style={styles.ownedFilterEmptyCheckBox} />
              )}
              <Text style={styles.ownedFilterText}>보유한 가구만 보기</Text>
            </Pressable>
            <View style={styles.optionSelector}>
              <RoomCustomizeArrowButton
                direction="left"
                onPress={() => changeCustomizeOption(-1)}
              />
              <Pressable
                onPress={applySelectedCustomizeOption}
                style={({ pressed }) => [
                  styles.optionCard,
                  pressed &&
                    !isSelectedCustomizeOptionEquipped &&
                    styles.optionCardPressed,
                ]}
              >
                <Text style={styles.optionTitleText}>
                  {selectedCustomizeOption.label}
                </Text>
                <View style={styles.optionStatusRow}>
                  {isSelectedCustomizeOptionEquipped ? (
                    <CheckBoxIcon width={24} height={24} />
                  ) : !isSelectedCustomizeOptionOwned ? (
                    <CoinIcon width={30} height={30} />
                  ) : null}
                  <Text style={styles.optionStatusText}>
                    {isSelectedCustomizeOptionEquipped
                      ? "적용중"
                      : isSelectedCustomizeOptionOwned
                        ? "소유중"
                        : selectedOptionPrice}
                  </Text>
                </View>
              </Pressable>
              <RoomCustomizeArrowButton
                direction="right"
                onPress={() => changeCustomizeOption(1)}
              />
            </View>
          </View>
        ) : (
          <ProgressBar
            booName={booName}
            bottomOffset={progressBarBottomOffset}
            grade={xpProgress.grade}
            maxXp={xpProgress.progressMaxXp}
            shadow
            xp={xpProgress.currentXpInGrade}
          />
        )}
        {isGuestbookListOpen ? (
          <GuestbookListModal
            entries={guestbookEntries}
            onActionError={showTopAlert}
            onDeleteEntry={handleGuestbookDelete}
            onUpdateEntry={handleGuestbookUpdate}
            onClose={() => setIsGuestbookListOpen(false)}
          />
        ) : null}
        {isClosetOpen ? (
          <View style={styles.closetOverlay}>
            <View style={styles.closetCard}>
              <View style={styles.closetHeader}>
                <Text style={styles.closetTitleText}>옷장</Text>
                <Pressable
                  onPress={closeClosetModal}
                  style={({ pressed }) => [
                    styles.closetCloseButton,
                    pressed && styles.closetCloseButtonPressed,
                  ]}
                >
                  <Text style={styles.closetCloseText}>×</Text>
                </Pressable>
              </View>
              <View style={styles.closetGrid}>
                {closetCostumeRows.map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.closetGridRow}>
                    {row.map((costume) => (
                      <Pressable
                        disabled={!costume.isSelectable}
                        key={costume.key}
                        onPress={() =>
                          selectClosetCostume(costume.key, costume.isSelectable)
                        }
                        style={({ pressed }) => [
                          styles.closetCostumeCard,
                          costume.isSelected &&
                            styles.closetCostumeCardSelected,
                          !costume.isSelectable &&
                            styles.closetCostumeCardLocked,
                          pressed &&
                            costume.isSelectable &&
                            styles.closetCostumeCardPressed,
                        ]}
                      >
                        {costume.isOwned ? (
                          <Image
                            cachePolicy="memory-disk"
                            contentFit="contain"
                            source={costume.image}
                            style={styles.closetCostumeImage}
                          />
                        ) : (
                          <Text style={styles.closetQuestionText}>?</Text>
                        )}
                        <Text
                          style={[
                            styles.closetCostumeLabelText,
                            !costume.isOwned &&
                              styles.closetCostumeLabelTextLocked,
                          ]}
                        >
                          {costume.label}
                        </Text>
                        {costume.statusText ? (
                          <Text style={styles.closetCostumeStatusText}>
                            {costume.statusText}
                          </Text>
                        ) : null}
                      </Pressable>
                    ))}
                  </View>
                ))}
              </View>
              <MainButton
                height={60}
                label="확인"
                onPress={confirmClosetCostume}
                size="M"
                width={closetConfirmButtonWidth}
              />
            </View>
          </View>
        ) : null}
        {purchaseTarget && purchaseAsset ? (
          <View style={styles.purchaseOverlay}>
            <View style={styles.purchaseCard}>
              <Text style={styles.purchaseTitleText}>구매하시겠습니까?</Text>
              <Text style={styles.purchaseDescriptionText}>
                {purchaseTarget.label}
              </Text>
              <View style={styles.purchasePriceRow}>
                <CoinIcon width={32} height={32} />
                <Text style={styles.purchasePriceText}>
                  {purchaseAsset.price}
                </Text>
              </View>
              {purchaseErrorMessage ? (
                <Text style={styles.purchaseErrorText}>
                  {purchaseErrorMessage}
                </Text>
              ) : null}
              <View style={styles.purchaseActionRow}>
                <Pressable
                  onPress={confirmPurchase}
                  style={({ pressed }) => [
                    styles.purchaseActionButton,
                    styles.purchaseConfirmButton,
                    pressed && styles.purchaseActionButtonPressed,
                  ]}
                >
                  <Text style={styles.purchaseConfirmText}>예</Text>
                </Pressable>
                <Pressable
                  onPress={closePurchaseModal}
                  style={({ pressed }) => [
                    styles.purchaseActionButton,
                    pressed && styles.purchaseActionButtonPressed,
                  ]}
                >
                  <Text style={styles.purchaseCancelText}>아니오</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

type RoomCustomizeArrowButtonProps = {
  direction: "left" | "right";
  disabled?: boolean;
  onPress: () => void;
};

const RoomCustomizeArrowButton = ({
  direction,
  disabled = false,
  onPress,
}: RoomCustomizeArrowButtonProps) => {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.arrowButton,
        disabled && styles.arrowButtonDisabled,
        pressed && !disabled && styles.arrowButtonPressed,
      ]}
    >
      <Text style={[styles.arrowButtonText, disabled && styles.disabledText]}>
        {direction === "left" ? "<" : ">"}
      </Text>
    </Pressable>
  );
};

const roomUiShadow = {
  elevation: 3,
  shadowColor: colors.NAVY_NORMAL,
  shadowOffset: {
    width: 2,
    height: 2,
  },
  shadowOpacity: 0.25,
  shadowRadius: 2,
};

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
  categorySelector: {
    position: "absolute",
    top: 144,
    left: 28,
    right: 28,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryLabelBox: {
    flex: 1,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.WHITE_NORMAL,
    borderColor: colors.BLACK_NORMAL,
    borderRadius: 6,
    borderWidth: 1,
    ...roomUiShadow,
  },
  categoryLabelText: {
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 24,
    includeFontPadding: false,
    lineHeight: 38,
  },
  arrowButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.WHITE_NORMAL,
    borderColor: colors.BLACK_NORMAL,
    borderRadius: 5,
    borderWidth: 1,
    ...roomUiShadow,
  },
  arrowButtonPressed: {
    backgroundColor: colors.GOLD_LIGHT_ACTIVE,
  },
  arrowButtonDisabled: {
    backgroundColor: colors.SILVER_LIGHT_HOVER,
    borderColor: colors.GRAY_NORMAL_ACTIVE,
  },
  arrowButtonText: {
    color: colors.GREEN_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 34,
    includeFontPadding: false,
    lineHeight: 40,
  },
  disabledText: {
    color: colors.SILVER_NORMAL,
  },
  customizeBottomArea: {
    position: "absolute",
    left: 28,
    right: 28,
    bottom: 18,
    zIndex: 2,
    alignItems: "center",
    gap: 10,
    paddingBottom: 18,
  },
  ownedFilterButton: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.WHITE_NORMAL,
    borderColor: colors.BLACK_NORMAL,
    borderRadius: 6,
    borderWidth: 1,
    ...roomUiShadow,
  },
  ownedFilterButtonActive: {
    backgroundColor: colors.GREEN_LIGHT_ACTIVE,
  },
  ownedFilterButtonPressed: {
    backgroundColor: colors.GOLD_LIGHT_ACTIVE,
    transform: [{ translateY: 1 }],
  },
  ownedFilterEmptyCheckBox: {
    width: 20,
    height: 20,
    backgroundColor: colors.WHITE_NORMAL,
    borderColor: colors.GREEN_NORMAL,
    borderWidth: 2,
  },
  ownedFilterText: {
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 16,
    includeFontPadding: false,
    lineHeight: 22,
  },
  optionSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    alignSelf: "center",
  },
  optionCard: {
    width: 207,
    height: 104,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    backgroundColor: colors.WHITE_NORMAL,
    borderColor: colors.BLACK_NORMAL,
    borderRadius: 6,
    borderWidth: 1,
    ...roomUiShadow,
  },
  optionCardPressed: {
    backgroundColor: colors.GOLD_LIGHT_ACTIVE,
  },
  optionTitleText: {
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 24,
    includeFontPadding: false,
    lineHeight: 38,
  },
  optionStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  optionStatusText: {
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 24,
    includeFontPadding: false,
    lineHeight: 32,
  },
  closetOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 18,
    alignItems: "center",
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.28)",
    paddingHorizontal: 28,
    paddingBottom: 18,
  },
  closetCard: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: colors.WHITE_NORMAL,
    borderColor: colors.BLACK_NORMAL,
    borderRadius: 0,
    borderWidth: 1,
    paddingHorizontal: 28,
    paddingBottom: 28,
    paddingTop: 26,
  },
  closetHeader: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  closetTitleText: {
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 30,
    includeFontPadding: false,
    lineHeight: 38,
  },
  closetCloseButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  closetCloseButtonPressed: {
    transform: [{ translateY: 1 }],
  },
  closetCloseText: {
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 44,
    includeFontPadding: false,
    lineHeight: 44,
  },
  closetGrid: {
    gap: 8,
    marginBottom: 14,
  },
  closetGridRow: {
    flexDirection: "row",
    gap: 8,
  },
  closetCostumeCard: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.WHITE_NORMAL,
    borderColor: "transparent",
    borderStyle: "dashed",
    borderWidth: 1,
  },
  closetCostumeCardSelected: {
    borderColor: colors.GOLD_NORMAL,
  },
  closetCostumeCardLocked: {
    backgroundColor: colors.SILVER_LIGHT_HOVER,
  },
  closetCostumeCardPressed: {
    backgroundColor: colors.GOLD_LIGHT_ACTIVE,
  },
  closetCostumeImage: {
    width: "56%",
    height: "46%",
  },
  closetQuestionText: {
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 46,
    includeFontPadding: false,
    lineHeight: 54,
  },
  closetCostumeLabelText: {
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 24,
    includeFontPadding: false,
    lineHeight: 30,
  },
  closetCostumeLabelTextLocked: {
    color: colors.BLACK_NORMAL,
  },
  closetCostumeStatusText: {
    color: colors.SILVER_NORMAL_ACTIVE,
    fontFamily: fonts.BASIC,
    fontSize: 12,
    includeFontPadding: false,
    lineHeight: 14,
  },
  purchaseOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    paddingHorizontal: 28,
  },
  purchaseCard: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.WHITE_NORMAL,
    borderColor: colors.BLACK_NORMAL,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 24,
    ...roomUiShadow,
  },
  purchaseTitleText: {
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 26,
    includeFontPadding: false,
    lineHeight: 34,
  },
  purchaseDescriptionText: {
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 22,
    includeFontPadding: false,
    lineHeight: 30,
  },
  purchasePriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  purchasePriceText: {
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 24,
    includeFontPadding: false,
    lineHeight: 32,
  },
  purchaseErrorText: {
    color: colors.DANGER,
    fontFamily: fonts.BASIC,
    fontSize: 18,
    includeFontPadding: false,
    lineHeight: 24,
  },
  purchaseActionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  purchaseActionButton: {
    minWidth: 104,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.WHITE_NORMAL,
    borderColor: colors.BLACK_NORMAL,
    borderRadius: 5,
    borderWidth: 1,
  },
  purchaseActionButtonPressed: {
    backgroundColor: colors.GOLD_LIGHT_ACTIVE,
  },
  purchaseConfirmButton: {
    backgroundColor: colors.GREEN_NORMAL,
  },
  purchaseConfirmText: {
    color: colors.WHITE_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 20,
    includeFontPadding: false,
    lineHeight: 28,
  },
  purchaseCancelText: {
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 20,
    includeFontPadding: false,
    lineHeight: 28,
  },
});
