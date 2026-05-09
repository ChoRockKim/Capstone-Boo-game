import CrossIcon from "@/assets/icons/cross.svg";
import UserAdd from "@/assets/icons/user-add.svg";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { useGameStore } from "@/stores/useGameStore";
import { playSoundEffect } from "@/utils/soundEffects";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { FriendListItem } from "../FriendList/FriendListDummyData";
import FriendAddModal from "./FriendAddModal";
import FriendPanelButton from "./FriendPanelButton";

interface FriendPanelProps {
  setIsFriendOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const INITIAL_VISIBLE_COUNT = 5;
const PAGE_SIZE = 5;

const FriendPanel = ({ setIsFriendOpen }: FriendPanelProps) => {
  const friendList = useGameStore((state) => state.friendList);
  const [isFriendAddOpen, setIsFriendAddOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  const visibleFriends = useMemo(
    () => friendList.slice(0, visibleCount),
    [friendList, visibleCount],
  );
  const hasMoreFriends = visibleCount < friendList.length;

  useEffect(() => {
    if (friendList.length === 0) {
      return;
    }

    setVisibleCount((prev) => Math.min(prev, friendList.length));
  }, [friendList.length]);

  const handleClosePress = () => {
    playSoundEffect("basicClick");
    setIsFriendOpen(false);
  };

  const handleFriendAddPress = () => {
    playSoundEffect("basicClick");
    setIsFriendAddOpen(true);
  };

  const handleLoadMorePress = () => {
    playSoundEffect("basicClick");
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, friendList.length));
  };

  const renderFriendItem = ({
    index,
    item,
  }: {
    index: number;
    item: FriendListItem;
  }) => <FriendPanelButton friendName={item.name} order={index + 1} />;

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>친구</Text>
          <View style={styles.headerButtonGroup}>
            <Pressable
              onPress={handleFriendAddPress}
              style={styles.headerButton}
            >
              <UserAdd width={24} height={24} color={colors.BLACK_NORMAL} />
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
      {isFriendAddOpen ? (
        <FriendAddModal onClose={() => setIsFriendAddOpen(false)} />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
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
    borderWidth: 2,
    borderRadius: 6,
    borderColor: colors.BLACK_NORMAL,
    backgroundColor: colors.WHITE_NORMAL,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
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
