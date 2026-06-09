/**
 * @description  친구 ID로 친구 방 snapshot을 찾아 친구의 마이룸을 렌더링합니다.
 * @depends      components/FriendList/FriendListDummyData.ts, components/Room/RoomScene.tsx, stores/useGameStore.ts, utils/backgroundMusic.ts, utils/xpProgress.ts
 * @used-by      expo-router/entry
 * @side-effects myRoom BGM 세션 시작, router 이동
 */
import ArrowBackIcon from "@/assets/icons/arrow-back-return.svg";
import {
  FRIEND_DIRECTORY_DUMMY_DATA,
  getFriendRoomSnapshot,
} from "@/components/FriendList/FriendListDummyData";
import ProgressBar from "@/components/ProgressBar/ProgressBar";
import GuestbookModal from "@/components/Room/GuestbookModal";
import {
  ROOM_CANVAS_ASPECT_RATIO,
} from "@/components/Room/RoomData";
import RoomScene from "@/components/Room/RoomScene";
import SquareButton from "@/components/SquareButton/SquareButton";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import {
  isCharacterCostumeKey,
  type CharacterCostumeKey,
  type CharacterState,
} from "@/constants/character";
import { useGameStore } from "@/stores/useGameStore";
import { useRequirePlayableSession } from "@/useHook/useRequirePlayableSession";
import { startBackgroundMusicSession } from "@/utils/backgroundMusic";
import {
  createRoomGuestbook,
  getServerApiErrorMessage,
  getUserRoom,
  type GuestbookPage,
} from "@/utils/serverApi";
import { mapServerRoomViewToLocalRoomState } from "@/utils/serverRoomAdapter";
import { playSoundEffect } from "@/utils/soundEffects";
import { getXpProgressInfo } from "@/utils/xpProgress";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const ROOM_MAX_WIDTH = 600;
const PROGRESS_BOTTOM_OFFSET = 38;
const ROOM_VERTICAL_RESERVED_SPACE = 220;
const CHARACTER_STATES: CharacterState[] = [
  "basic1",
  "basic2",
  "happy1",
  "happy2",
  "hungry",
  "eating",
  "talking",
];

const getServerCharacterState = (
  state: string | null | undefined,
): CharacterState => {
  return CHARACTER_STATES.includes(state as CharacterState)
    ? (state as CharacterState)
    : "basic1";
};

const getServerCharacterCostumeKey = (
  costumeKey: string | null | undefined,
): CharacterCostumeKey =>
  isCharacterCostumeKey(costumeKey) ? costumeKey : "default";

const FriendRoomIndex = () => {
  const insets = useSafeAreaInsets();
  useRequirePlayableSession();
  const { height, width } = useWindowDimensions();
  const params = useLocalSearchParams<{
    friendId?: string | string[];
    friendName?: string | string[];
    friendUserId?: string | string[];
  }>();
  const friendId = Array.isArray(params.friendId)
    ? params.friendId[0]
    : params.friendId;
  const friendNameParam = Array.isArray(params.friendName)
    ? params.friendName[0]
    : params.friendName;
  const friendUserIdParam = Array.isArray(params.friendUserId)
    ? params.friendUserId[0]
    : params.friendUserId;
  const accessToken = useGameStore((state) => state.accessToken);
  const addGuestbookEntry = useGameStore((state) => state.addGuestbookEntry);
  const friendList = useGameStore((state) => state.friendList);
  const isGuestMode = useGameStore((state) => state.isGuestMode);
  const currentUserId = useGameStore((state) => state.userId);
  const currentUserNickname = useGameStore((state) => state.userNickname);
  const queryClient = useQueryClient();
  const [isGuestbookOpen, setIsGuestbookOpen] = useState(false);

  const friend = useMemo(
    () =>
      isGuestMode
        ? null
        : friendList.find((item) => item.id === friendId) ??
          FRIEND_DIRECTORY_DUMMY_DATA.find((item) => item.id === friendId) ??
          null,
    [friendId, friendList, isGuestMode],
  );
  const parsedFriendUserId = Number(friendUserIdParam);
  const serverUserIdFromFriendId =
    friendId?.startsWith("server-user-") ? Number(friendId.slice(12)) : NaN;
  const serverUserId =
    friend?.serverUserId ??
    (Number.isFinite(parsedFriendUserId) ? parsedFriendUserId : null) ??
    (Number.isFinite(serverUserIdFromFriendId) ? serverUserIdFromFriendId : null);
  const guestbookQueryKey = ["rooms", serverUserId, "guestbook"] as const;
  const { data: serverRoom } = useQuery({
    queryKey: ["rooms", serverUserId, accessToken],
    queryFn: () => getUserRoom(serverUserId ?? 0, accessToken ?? undefined),
    enabled: !!accessToken && serverUserId !== null,
    staleTime: 1000 * 30,
    retry: 1,
  });
  const fallbackFriendName = friend?.name ?? friendNameParam ?? "친구";
  const displayFriendName = serverRoom?.owner.nickname ?? fallbackFriendName;
  const roomSnapshot = serverRoom
    ? {
        ...mapServerRoomViewToLocalRoomState(serverRoom),
        booName:
          serverRoom.character?.character_name?.trim() ||
          `${displayFriendName}의 부`,
        characterState: getServerCharacterState(serverRoom.character?.state),
        characterCostumeKey: getServerCharacterCostumeKey(
          serverRoom.character?.equipped_skin_key,
        ),
        totalXp:
          serverRoom.character?.xp_point ?? serverRoom.owner.xp_point ?? 0,
      }
    : friend && !accessToken && !isGuestMode
      ? getFriendRoomSnapshot(friend)
      : null;
  const xpProgress = useMemo(
    () => getXpProgressInfo(roomSnapshot?.totalXp ?? 0),
    [roomSnapshot?.totalXp],
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
  const progressBarBottomOffset = Math.max(
    insets.bottom + 24,
    PROGRESS_BOTTOM_OFFSET,
  );

  useFocusEffect(
    useCallback(() => {
      return startBackgroundMusicSession("myRoom");
    }, []),
  );

  const handleTablePress = () => {
    playSoundEffect("basicClick");
    setIsGuestbookOpen(true);
  };

  const handleGuestbookSubmit = async (message: string) => {
    if (!friendId || isGuestMode) {
      return;
    }

    if (accessToken && serverUserId !== null) {
      await queryClient.cancelQueries({ queryKey: guestbookQueryKey });
      const previousGuestbookPage =
        queryClient.getQueryData<GuestbookPage>(guestbookQueryKey);
      const optimisticEntryId = -Date.now();

      queryClient.setQueryData<GuestbookPage>(
        guestbookQueryKey,
        (currentPage) => ({
          items: [
            {
              content: message,
              created_at: new Date().toISOString(),
              entry_id: optimisticEntryId,
              room_owner_id: serverUserId,
              writer_id: currentUserId ?? 0,
              writer_nickname: currentUserNickname || "나",
            },
            ...(currentPage?.items ?? []),
          ],
          next_cursor: currentPage?.next_cursor ?? null,
        }),
      );

      try {
        const createdEntry = await createRoomGuestbook(
          serverUserId,
          message,
          accessToken,
        );

        queryClient.setQueryData<GuestbookPage>(
          guestbookQueryKey,
          (currentPage) =>
            currentPage
              ? {
                  ...currentPage,
                  items: currentPage.items.map((entry) =>
                    entry.entry_id === optimisticEntryId
                      ? createdEntry
                      : entry,
                  ),
                }
              : currentPage,
        );
        void queryClient.invalidateQueries({
          queryKey: guestbookQueryKey,
        });
      } catch (error) {
        queryClient.setQueryData(guestbookQueryKey, previousGuestbookPage);
        const message = getServerApiErrorMessage(error, "방명록 작성 실패");

        console.warn("서버 방명록 작성 실패", message);
        throw new Error(message);
      }

      return;
    }

    addGuestbookEntry(friendId, message);
  };

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <SquareButton
            Icon={ArrowBackIcon}
            onPress={() => router.back()}
            shadow
          />
          <View style={styles.friendNameBox}>
            <Text style={styles.friendNameText}>
              {`${displayFriendName}의 방`}
            </Text>
          </View>
        </View>

        {roomSnapshot ? (
          <>
            <View style={styles.roomStage}>
              <RoomScene
                characterCostumeKey={
                  "characterCostumeKey" in roomSnapshot
                    ? roomSnapshot.characterCostumeKey
                    : "default"
                }
                characterState={roomSnapshot.characterState}
                equippedRoomItems={roomSnapshot.equippedRoomItems}
                grade={xpProgress.grade}
                miniBooGrabbable
                onFurniturePress={{
                  table: handleTablePress,
                }}
                roomHeight={roomHeight}
                roomWidth={roomWidth}
                wallpaperId={roomSnapshot.equippedRoomWallpaper}
              />
            </View>
            <ProgressBar
              booName={roomSnapshot.booName}
              bottomOffset={progressBarBottomOffset}
              grade={xpProgress.grade}
              maxXp={xpProgress.progressMaxXp}
              shadow
              xp={xpProgress.currentXpInGrade}
            />
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {accessToken && serverUserId !== null
                ? "친구 방 정보를 불러오고 있어요."
                : isGuestMode
                  ? "게스트 모드에서는 친구 방을 사용할 수 없어요."
                : "친구 방 정보를 찾을 수 없어요."}
            </Text>
          </View>
        )}
      </SafeAreaView>
      {isGuestbookOpen ? (
        <GuestbookModal
          onClose={() => setIsGuestbookOpen(false)}
          onSubmit={handleGuestbookSubmit}
        />
      ) : null}
    </View>
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
    gap: 8,
  },
  friendNameBox: {
    flex: 1,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.WHITE_NORMAL,
    borderColor: colors.BLACK_NORMAL,
    borderRadius: 6,
    borderWidth: 1,
    ...roomUiShadow,
  },
  friendNameText: {
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 22,
    includeFontPadding: false,
    lineHeight: 30,
  },
  roomStage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 104,
    paddingTop: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: colors.SILVER_NORMAL_ACTIVE,
    fontFamily: fonts.BASIC,
    fontSize: 20,
    includeFontPadding: false,
  },
});

export default FriendRoomIndex;
