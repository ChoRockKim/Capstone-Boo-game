import CrossIcon from "@/assets/icons/cross.svg";
import UserAdd from "@/assets/icons/user-add.svg";
import TopAlert from "@/components/TopAlert/TopAlert";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { useGameStore } from "@/stores/useGameStore";
import {
  acceptFriendRequest,
  deleteFriendRequest,
  listFriendRequests,
  listFriends,
  type FriendOut,
  type FriendRequestOut,
} from "@/utils/serverApi";
import { mapFriendOutToFriendListItem } from "@/utils/serverFriendAdapter";
import { playSoundEffect } from "@/utils/soundEffects";
import { Feather } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { FriendListItem } from "../FriendList/FriendListDummyData";
import FriendAddModal from "./FriendAddModal";
import FriendPanelButton from "./FriendPanelButton";

interface FriendPanelProps {
  setIsFriendOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

type FriendPanelAlertState = {
  id: number;
  message: string;
  title: string;
  visible: boolean;
};

const INITIAL_VISIBLE_COUNT = 5;
const PAGE_SIZE = 5;

const FriendPanel = ({ setIsFriendOpen }: FriendPanelProps) => {
  const accessToken = useGameStore((state) => state.accessToken);
  const applyServerUnlockedAchievements = useGameStore(
    (state) => state.applyServerUnlockedAchievements,
  );
  const friendList = useGameStore((state) => state.friendList);
  const isGuestMode = useGameStore((state) => state.isGuestMode);
  const userId = useGameStore((state) => state.userId);
  const queryClient = useQueryClient();
  const [friendPanelAlert, setFriendPanelAlert] =
    useState<FriendPanelAlertState>({
      id: 0,
      message: "",
      title: "",
      visible: false,
    });
  const [isFriendAddOpen, setIsFriendAddOpen] = useState(false);
  const [processingRequestIds, setProcessingRequestIds] = useState<number[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const friendListQueryKey = ["friends", accessToken] as const;
  const friendRequestsQueryKey = ["friends", "requests", accessToken] as const;
  const {
    data: serverFriends,
    isFetching: isServerFriendsFetching,
    isLoading: isServerFriendsLoading,
    refetch: refetchServerFriends,
  } = useQuery({
    queryKey: friendListQueryKey,
    queryFn: () => listFriends(accessToken ?? undefined),
    enabled: !!accessToken,
    staleTime: 1000 * 30,
    retry: 1,
  });
  const {
    data: friendRequests,
  } = useQuery({
    queryKey: friendRequestsQueryKey,
    queryFn: () => listFriendRequests(accessToken ?? undefined),
    enabled: !!accessToken,
    staleTime: 1000 * 30,
    retry: 1,
  });
  const incomingFriendRequests = useMemo(
    () =>
      accessToken
        ? (friendRequests ?? []).filter(
            (request) =>
              request.receiver.user_id === userId &&
              request.status.toLowerCase() === "pending",
          )
        : [],
    [accessToken, friendRequests, userId],
  );
  const displayFriendList = useMemo(
    () =>
      accessToken
        ? (serverFriends?.map(mapFriendOutToFriendListItem) ?? [])
        : isGuestMode
          ? []
          : friendList,
    [accessToken, friendList, isGuestMode, serverFriends],
  );
  const clampedVisibleCount = Math.min(
    visibleCount,
    Math.max(displayFriendList.length, INITIAL_VISIBLE_COUNT),
  );

  const visibleFriends = useMemo(
    () => displayFriendList.slice(0, clampedVisibleCount),
    [clampedVisibleCount, displayFriendList],
  );
  const hasMoreFriends = clampedVisibleCount < displayFriendList.length;
  const isFriendListLoading =
    !!accessToken &&
    !serverFriends?.length &&
    (isServerFriendsLoading || isServerFriendsFetching);
  const showFriendPanelAlert = useCallback((title: string, message: string) => {
    setFriendPanelAlert((currentAlert) => ({
      id: currentAlert.id + 1,
      message,
      title,
      visible: true,
    }));
  }, []);

  const hideFriendPanelAlert = useCallback(() => {
    setFriendPanelAlert((currentAlert) => ({
      ...currentAlert,
      visible: false,
    }));
  }, []);

  const handleClosePress = () => {
    playSoundEffect("basicClick");
    setIsFriendOpen(false);
  };

  const handleFriendAddPress = () => {
    if (isGuestMode) {
      return;
    }

    playSoundEffect("basicClick");
    setIsFriendAddOpen(true);
  };

  const handleLoadMorePress = () => {
    playSoundEffect("basicClick");
    setVisibleCount((prev) =>
      Math.min(prev + PAGE_SIZE, displayFriendList.length),
    );
  };

  const handleVisitRoomPress = (friend: FriendListItem) => {
    setIsFriendOpen(false);
    router.push({
      pathname: "/room/[friendId]",
      params: {
        friendId: friend.id,
        friendName: friend.name,
        friendUserId: friend.serverUserId?.toString(),
      },
    });
  };

  const refetchFriendData = () => {
    void refetchServerFriends();
    void queryClient.invalidateQueries({
      queryKey: friendRequestsQueryKey,
    });
  };

  const applyOptimisticRequestChange = async (
    request: FriendRequestOut,
    options?: {
      addFriend?: boolean;
    },
  ) => {
    await queryClient.cancelQueries({ queryKey: friendRequestsQueryKey });
    await queryClient.cancelQueries({ queryKey: friendListQueryKey });

    const previousRequests =
      queryClient.getQueryData<FriendRequestOut[]>(friendRequestsQueryKey);
    const previousFriends =
      queryClient.getQueryData<FriendOut[]>(friendListQueryKey);

    queryClient.setQueryData<FriendRequestOut[]>(
      friendRequestsQueryKey,
      (currentRequests) =>
        currentRequests?.filter(
          (currentRequest) =>
            currentRequest.request_id !== request.request_id,
        ) ?? currentRequests,
    );

    if (options?.addFriend) {
      const optimisticFriend: FriendOut = {
        created_at: new Date().toISOString(),
        friend: request.requester,
        friend_id: -request.request_id,
      };

      queryClient.setQueryData<FriendOut[]>(
        friendListQueryKey,
        (currentFriends) => {
          const friends = currentFriends ?? [];

          if (
            friends.some(
              (friend) =>
                friend.friend.user_id === optimisticFriend.friend.user_id,
            )
          ) {
            return friends;
          }

          return [optimisticFriend, ...friends];
        },
      );
    }

    return () => {
      queryClient.setQueryData(friendRequestsQueryKey, previousRequests);
      queryClient.setQueryData(friendListQueryKey, previousFriends);
    };
  };

  const handleAcceptRequest = async (request: FriendRequestOut) => {
    if (!accessToken || processingRequestIds.includes(request.request_id)) {
      return;
    }

    playSoundEffect("basicClick");
    setProcessingRequestIds((currentIds) => [
      ...currentIds,
      request.request_id,
    ]);

    const rollbackOptimisticChange = await applyOptimisticRequestChange(
      request,
      {
        addFriend: true,
      },
    );

    try {
      const result = await acceptFriendRequest(request.request_id, accessToken);

      applyServerUnlockedAchievements(result.unlocked_achievements);
      showFriendPanelAlert(
        "친구 요청 수락",
        `${request.requester.nickname}님과 친구가 되었어요.`,
      );
      refetchFriendData();
    } catch (error) {
      rollbackOptimisticChange();
      showFriendPanelAlert(
        "수락 실패",
        "친구 요청을 수락하지 못했어요.",
      );
      console.warn("친구 요청 수락 실패", error);
    } finally {
      setProcessingRequestIds((currentIds) =>
        currentIds.filter((requestId) => requestId !== request.request_id),
      );
    }
  };

  const handleRejectRequest = async (request: FriendRequestOut) => {
    if (!accessToken || processingRequestIds.includes(request.request_id)) {
      return;
    }

    playSoundEffect("basicClick");
    setProcessingRequestIds((currentIds) => [
      ...currentIds,
      request.request_id,
    ]);

    const rollbackOptimisticChange =
      await applyOptimisticRequestChange(request);

    try {
      await deleteFriendRequest(request.request_id, accessToken);
      showFriendPanelAlert(
        "친구 요청 거절",
        `${request.requester.nickname}님의 요청을 거절했어요.`,
      );
      refetchFriendData();
    } catch (error) {
      rollbackOptimisticChange();
      showFriendPanelAlert(
        "거절 실패",
        "친구 요청을 거절하지 못했어요.",
      );
      console.warn("친구 요청 거절 실패", error);
    } finally {
      setProcessingRequestIds((currentIds) =>
        currentIds.filter((requestId) => requestId !== request.request_id),
      );
    }
  };

  const renderFriendItem = ({
    index,
    item,
  }: {
    index: number;
    item: FriendListItem;
  }) => (
    <FriendPanelButton
      friendName={item.name}
      onVisitPress={() => handleVisitRoomPress(item)}
      order={index + 1}
    />
  );

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>친구</Text>
          <View style={styles.headerButtonGroup}>
            <Pressable
              disabled={isGuestMode}
              onPress={handleFriendAddPress}
              style={[
                styles.headerButton,
                isGuestMode && styles.headerButtonDisabled,
              ]}
            >
              <UserAdd width={24} height={24} color={colors.BLACK_NORMAL} />
            </Pressable>
            <Pressable onPress={handleClosePress} style={styles.headerButton}>
              <CrossIcon width={24} height={24} fill={colors.BLACK_NORMAL} />
            </Pressable>
          </View>
        </View>
        {incomingFriendRequests.length > 0 ? (
          <View style={styles.requestList}>
            <Text style={styles.requestHeaderText}>받은 요청</Text>
            {incomingFriendRequests.map((request) => {
              const isProcessing = processingRequestIds.includes(
                request.request_id,
              );

              return (
                <View key={request.request_id} style={styles.requestRow}>
                  <Text numberOfLines={1} style={styles.requestNameText}>
                    {request.requester.nickname}
                  </Text>
                  <View style={styles.requestActionRow}>
                    <Pressable
                      disabled={isProcessing}
                      onPress={() => handleAcceptRequest(request)}
                      style={[
                        styles.requestActionButton,
                        styles.acceptButton,
                        isProcessing && styles.requestActionButtonDisabled,
                      ]}
                    >
                      <Text style={styles.requestActionText}>수락</Text>
                    </Pressable>
                    <Pressable
                      disabled={isProcessing}
                      onPress={() => handleRejectRequest(request)}
                      style={[
                        styles.requestActionButton,
                        styles.rejectButton,
                        isProcessing && styles.requestActionButtonDisabled,
                      ]}
                    >
                      <Text style={styles.requestActionText}>거절</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}
        <FlatList
          data={visibleFriends}
          keyExtractor={(item) => item.id}
          renderItem={renderFriendItem}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {isFriendListLoading
                ? "친구 목록을 불러오는 중이에요."
                : "등록된 친구가 아직 없어요."}
            </Text>
          }
          scrollEnabled={false}
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            visibleFriends.length === 0 && styles.emptyListContent,
          ]}
        />
        {hasMoreFriends ? (
          <Pressable
            onPress={handleLoadMorePress}
            style={({ pressed }) => [
              styles.moreButton,
              pressed && styles.moreButtonPressed,
            ]}
          >
            {({ pressed }) => (
              <>
                <Feather
                  name="chevron-down"
                  size={18}
                  color={pressed ? colors.WHITE_NORMAL : colors.BLACK_NORMAL}
                />
                <Text
                  style={[
                    styles.moreButtonText,
                    pressed && styles.moreButtonTextPressed,
                  ]}
                >
                  더보기
                </Text>
              </>
            )}
          </Pressable>
        ) : null}
      </View>
      {isFriendAddOpen ? (
        <FriendAddModal
          onClose={() => setIsFriendAddOpen(false)}
          onFriendChanged={() => {
            refetchFriendData();
          }}
        />
      ) : null}
      <TopAlert
        message={friendPanelAlert.message}
        onClose={hideFriendPanelAlert}
        textSize="compact"
        title={friendPanelAlert.title}
        visible={friendPanelAlert.visible}
        visibilityKey={friendPanelAlert.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 999,
    elevation: 999,
    justifyContent: "flex-end",
  },
  container: {
    paddingVertical: 24,
    paddingHorizontal: 28,
    position: "absolute",
    minHeight: 360,
    zIndex: 999,
    elevation: 999,
    backgroundColor: colors.WHITE_NORMAL,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopColor: colors.BLACK_NORMAL,
    borderTopWidth: 2,
  },
  headerContainer: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    fontFamily: fonts.BASIC,
    fontSize: 24,
    flex: 1,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  headerButtonGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  headerButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  headerButtonDisabled: {
    opacity: 0.35,
  },
  listContent: {
    gap: 10,
  },
  requestList: {
    marginBottom: 14,
    gap: 8,
  },
  requestHeaderText: {
    fontFamily: fonts.BASIC,
    fontSize: 16,
    lineHeight: 20,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  requestRow: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.GRAY_NORMAL_ACTIVE,
    backgroundColor: colors.SILVER_LIGHT_HOVER,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  requestNameText: {
    flex: 1,
    fontFamily: fonts.BASIC,
    fontSize: 16,
    lineHeight: 20,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  requestActionRow: {
    flexDirection: "row",
    gap: 6,
  },
  requestActionButton: {
    minWidth: 52,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.BLACK_NORMAL,
  },
  acceptButton: {
    backgroundColor: colors.GREEN_NORMAL,
  },
  rejectButton: {
    backgroundColor: colors.DANGER,
  },
  requestActionButtonDisabled: {
    opacity: 0.5,
  },
  requestActionText: {
    fontFamily: fonts.BASIC,
    fontSize: 14,
    lineHeight: 18,
    color: colors.WHITE_NORMAL,
    includeFontPadding: false,
  },
  list: {
    minHeight: 220,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  moreButton: {
    marginTop: 16,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 4,
    borderColor: colors.BLACK_NORMAL,
    backgroundColor: colors.WHITE_NORMAL,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    elevation: 3,
    shadowColor: colors.NAVY_NORMAL,
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 2,
  },
  moreButtonPressed: {
    backgroundColor: colors.GOLD_LIGHT_ACTIVE,
  },
  moreButtonText: {
    fontFamily: fonts.BASIC,
    fontSize: 20,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  moreButtonTextPressed: {
    color: colors.WHITE_NORMAL,
  },
  emptyText: {
    textAlign: "center",
    fontFamily: fonts.BASIC,
    fontSize: 18,
    color: colors.SILVER_NORMAL_ACTIVE,
    includeFontPadding: false,
  },
});

export default FriendPanel;
