import ArrowReturn from "@/assets/icons/arrow-back-return.svg";
import CrossIcon from "@/assets/icons/cross.svg";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { useGameStore } from "@/stores/useGameStore";
import {
  deleteServerFriend,
  FriendOut,
  getServerApiErrorMessage,
  listFriends,
} from "@/utils/serverApi";
import { mapFriendOutToFriendListItem } from "@/utils/serverFriendAdapter";
import { playSoundEffect } from "@/utils/soundEffects";
import { Feather } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import FriendDeleteModal from "./FriendDeleteModal";
import FriendListButton from "./FriendListButton";
import { FriendListItem } from "./FriendListDummyData";

interface FriendListProps {
  setIsFriendListOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsOptionOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const INITIAL_VISIBLE_COUNT = 5;
const PAGE_SIZE = 5;

type DeleteModalState =
  | { friendId: string; friendName: string; mode: "confirm" | "success" }
  | null;

const FriendList = ({
  setIsFriendListOpen,
  setIsOptionOpen,
}: FriendListProps) => {
  const accessToken = useGameStore((state) => state.accessToken);
  const friendList = useGameStore((state) => state.friendList);
  const removeFriend = useGameStore((state) => state.removeFriend);
  const queryClient = useQueryClient();
  const [deleteErrorMessage, setDeleteErrorMessage] = useState("");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [deleteModalState, setDeleteModalState] = useState<DeleteModalState>(
    null,
  );
  const { data: serverFriends, refetch: refetchServerFriends } = useQuery({
    queryKey: ["friends", accessToken],
    queryFn: () => listFriends(accessToken ?? undefined),
    enabled: !!accessToken,
    staleTime: 1000 * 30,
    retry: 1,
  });
  const displayFriendList = useMemo(
    () =>
      accessToken
        ? (serverFriends?.map(mapFriendOutToFriendListItem) ?? [])
        : friendList,
    [accessToken, friendList, serverFriends],
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

  const handleClosePress = () => {
    playSoundEffect("basicClick");
    setIsFriendListOpen(false);
  };

  const handleBackPress = () => {
    playSoundEffect("basicClick");
    setIsFriendListOpen(false);
    setIsOptionOpen(true);
  };

  const handleLoadMorePress = () => {
    playSoundEffect("basicClick");
    setVisibleCount((prev) =>
      Math.min(prev + PAGE_SIZE, displayFriendList.length),
    );
  };

  const handleDeletePress = (friend: FriendListItem) => {
    setDeleteErrorMessage("");
    setDeleteModalState({
      friendId: friend.id,
      friendName: friend.name,
      mode: "confirm",
    });
  };

  const handleDeleteModalClose = () => {
    setDeleteModalState(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalState) {
      return;
    }

    const targetFriend = displayFriendList.find(
      (friend) => friend.id === deleteModalState.friendId,
    );

    if (accessToken && targetFriend?.serverFriendId !== undefined) {
      const friendsQueryKey = ["friends", accessToken] as const;
      const previousServerFriends =
        queryClient.getQueryData<FriendOut[]>(friendsQueryKey);

      setDeleteErrorMessage("");
      await queryClient.cancelQueries({ queryKey: friendsQueryKey });
      queryClient.setQueryData<FriendOut[]>(friendsQueryKey, (currentFriends) =>
        currentFriends?.filter(
          (friend) => friend.friend_id !== targetFriend.serverFriendId,
        ),
      );
      setDeleteModalState({
        friendId: deleteModalState.friendId,
        friendName: deleteModalState.friendName,
        mode: "success",
      });

      try {
        await deleteServerFriend(targetFriend.serverFriendId, accessToken);
        void refetchServerFriends();
      } catch (error) {
        queryClient.setQueryData(friendsQueryKey, previousServerFriends);
        setDeleteErrorMessage(
          getServerApiErrorMessage(error, "친구 삭제에 실패했어요."),
        );
        setDeleteModalState({
          friendId: deleteModalState.friendId,
          friendName: deleteModalState.friendName,
          mode: "confirm",
        });
        return;
      }

      return;
    }

    removeFriend(deleteModalState.friendId);
    setDeleteModalState({
      friendId: deleteModalState.friendId,
      friendName: deleteModalState.friendName,
      mode: "success",
    });
  };

  const renderFriendItem = ({
    index,
    item,
  }: {
    index: number;
    item: FriendListItem;
  }) => (
    <FriendListButton
      friendName={item.name}
      onDeletePress={() => handleDeletePress(item)}
      order={index + 1}
    />
  );

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>친구 관리</Text>
          <View style={styles.headerButtonGroup}>
            <Pressable onPress={handleBackPress} style={styles.headerButton}>
              <ArrowReturn width={24} height={24} color={colors.BLACK_NORMAL} />
            </Pressable>
            <Pressable onPress={handleClosePress} style={styles.headerButton}>
              <CrossIcon width={24} height={24} fill={colors.BLACK_NORMAL} />
            </Pressable>
          </View>
        </View>
        <FlatList
          data={visibleFriends}
          keyExtractor={(item) => item.id}
          renderItem={renderFriendItem}
          ListEmptyComponent={
            <Text style={styles.emptyText}>등록된 친구가 아직 없어요.</Text>
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
      {deleteModalState ? (
        <FriendDeleteModal
          errorMessage={deleteErrorMessage}
          friendName={deleteModalState.friendName}
          mode={deleteModalState.mode}
          onClose={handleDeleteModalClose}
          onConfirmDelete={handleConfirmDelete}
        />
      ) : null}
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
  },
  headerButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  headerButtonGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  listContent: {
    gap: 10,
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

export default FriendList;
