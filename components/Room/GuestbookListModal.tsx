/**
 * @description  내 방 책상에서 친구들이 남긴 방명록 목록과 상세 보기 모달을 표시합니다.
 * @depends      @expo/vector-icons, assets/icons/cross.svg, assets/icons/edit-square.svg, components/Room/RoomGuestbookDummyData.ts, constants/colors.ts, constants/fonts.ts, expo-router, utils/soundEffects.ts
 * @used-by      app/room/index.tsx
 * @side-effects basicClick SFX 재생, 내부 목록/상세/더보기 상태 변경, router 이동, onClose 콜백 호출
 */
import CrossIcon from "@/assets/icons/cross.svg";
import EditSquareIcon from "@/assets/icons/edit-square.svg";
import {
  ROOM_GUESTBOOK_DUMMY_ENTRIES,
  RoomGuestbookListEntry,
} from "@/components/Room/RoomGuestbookDummyData";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { playSoundEffect } from "@/utils/soundEffects";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

interface GuestbookListModalProps {
  entries?: RoomGuestbookListEntry[];
  onClose: () => void;
}

const INITIAL_VISIBLE_ENTRY_COUNT = 4;

const GuestbookListModal = ({
  entries = ROOM_GUESTBOOK_DUMMY_ENTRIES,
  onClose,
}: GuestbookListModalProps) => {
  const [guestbookEntries, setGuestbookEntries] = useState(entries);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedEntry, setSelectedEntry] =
    useState<RoomGuestbookListEntry | null>(null);
  const visibleEntries = useMemo(
    () =>
      isExpanded
        ? guestbookEntries
        : guestbookEntries.slice(0, INITIAL_VISIBLE_ENTRY_COUNT),
    [guestbookEntries, isExpanded],
  );
  const shouldShowMoreButton =
    guestbookEntries.length > INITIAL_VISIBLE_ENTRY_COUNT;

  const handleClose = () => {
    playSoundEffect("basicClick");
    onClose();
  };

  const handleEntryPress = (entry: RoomGuestbookListEntry) => {
    playSoundEffect("basicClick");
    setSelectedEntry(entry);
  };

  const handleDetailClose = () => {
    playSoundEffect("basicClick");
    setSelectedEntry(null);
  };

  const handleDeletePress = () => {
    if (!selectedEntry) {
      return;
    }

    playSoundEffect("basicClick");
    setGuestbookEntries((currentEntries) =>
      currentEntries.filter((entry) => entry.id !== selectedEntry.id),
    );
    setSelectedEntry(null);
  };

  const handleVisitPress = () => {
    if (!selectedEntry) {
      return;
    }

    playSoundEffect("basicClick");
    const targetFriendId = selectedEntry.authorFriendId;
    setSelectedEntry(null);
    router.push({
      pathname: "/room/[friendId]",
      params: { friendId: targetFriendId },
    });
  };

  const handleMorePress = () => {
    playSoundEffect("basicClick");
    setIsExpanded((currentValue) => !currentValue);
  };

  return (
    <View pointerEvents="auto" style={styles.overlay}>
      <View style={styles.modalCard}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>방명록</Text>
          <View style={styles.headerActions}>
            <View pointerEvents="none" style={styles.writeIconBox}>
              <EditSquareIcon width={24} height={24} />
            </View>
            <Pressable onPress={handleClose} style={styles.headerButton}>
              <CrossIcon width={28} height={28} fill={colors.BLACK_NORMAL} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          bounces={false}
          contentContainerStyle={styles.entryListContent}
          showsVerticalScrollIndicator={false}
          style={styles.entryList}
        >
          {visibleEntries.map((entry) => (
            <Pressable
              key={entry.id}
              onPress={() => handleEntryPress(entry)}
              style={({ pressed }) => [
                styles.entryRow,
                pressed && styles.entryRowPressed,
              ]}
            >
              <Text numberOfLines={1} style={styles.entryMessageText}>
                {entry.message}
              </Text>
              <Text numberOfLines={1} style={styles.entryAuthorText}>
                {entry.authorName}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {shouldShowMoreButton ? (
          <Pressable
            onPress={handleMorePress}
            style={({ pressed }) => [
              styles.moreButton,
              pressed && styles.moreButtonPressed,
            ]}
          >
            {({ pressed }) => (
              <>
                <Feather
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={pressed ? colors.WHITE_NORMAL : colors.BLACK_NORMAL}
                />
                <Text
                  style={[
                    styles.moreButtonText,
                    pressed && styles.moreButtonTextPressed,
                  ]}
                >
                  {isExpanded ? "접기" : "더보기"}
                </Text>
              </>
            )}
          </Pressable>
        ) : null}
      </View>

      {selectedEntry ? (
        <View style={styles.detailOverlay}>
          <View style={styles.detailCard}>
            <View style={styles.detailHeaderContainer}>
              <Text style={styles.detailTitleText}>방명록</Text>
              <Pressable onPress={handleDetailClose} style={styles.headerButton}>
                <CrossIcon width={24} height={24} fill={colors.BLACK_NORMAL} />
              </Pressable>
            </View>
            <Text style={styles.detailMessageText}>{selectedEntry.message}</Text>
            <Text style={styles.detailAuthorText}>{selectedEntry.authorName}</Text>
            <View style={styles.detailActionRow}>
              <Pressable
                onPress={handleDeletePress}
                style={({ pressed }) => [
                  styles.detailActionButton,
                  styles.deleteButton,
                  pressed && styles.detailActionButtonPressed,
                ]}
              >
                <Text style={styles.deleteButtonText}>삭제</Text>
              </Pressable>
              <Pressable
                onPress={handleVisitPress}
                style={({ pressed }) => [
                  styles.detailActionButton,
                  styles.visitButton,
                  pressed && styles.detailActionButtonPressed,
                ]}
              >
                <Text style={styles.visitButtonText}>방문</Text>
              </Pressable>
            </View>
          </View>
        </View>
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
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    elevation: 1000,
    justifyContent: "flex-end",
  },
  modalCard: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    elevation: 1000,
    minHeight: 360,
    maxHeight: "64%",
    paddingVertical: 24,
    paddingHorizontal: 28,
    backgroundColor: colors.WHITE_NORMAL,
    borderTopColor: colors.BLACK_NORMAL,
    borderTopWidth: 2,
  },
  headerContainer: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 24,
    includeFontPadding: false,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  headerButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  writeIconBox: {
    alignItems: "center",
    justifyContent: "center",
  },
  entryList: {
    flexGrow: 0,
    minHeight: 220,
  },
  entryListContent: {
    gap: 10,
  },
  entryRow: {
    width: "100%",
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.WHITE_NORMAL,
    borderColor: colors.GOLD_NORMAL,
    borderRadius: 16,
    borderStyle: "dotted",
    borderWidth: 1.5,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  entryRowPressed: {
    backgroundColor: colors.GOLD_LIGHT_ACTIVE,
  },
  entryMessageText: {
    flex: 1,
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 20,
    includeFontPadding: false,
  },
  entryAuthorText: {
    maxWidth: 128,
    marginLeft: 12,
    color: colors.GREEN_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 20,
    includeFontPadding: false,
    textAlign: "right",
  },
  moreButton: {
    marginTop: 16,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    backgroundColor: colors.WHITE_NORMAL,
    borderColor: colors.BLACK_NORMAL,
    borderRadius: 4,
    borderWidth: 1,
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
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 20,
    includeFontPadding: false,
  },
  moreButtonTextPressed: {
    color: colors.WHITE_NORMAL,
  },
  detailOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(18, 18, 49, 0.18)",
    paddingHorizontal: 28,
    zIndex: 1001,
    elevation: 1001,
  },
  detailCard: {
    width: "100%",
    maxWidth: 360,
    gap: 16,
    backgroundColor: colors.WHITE_NORMAL,
    borderColor: colors.BLACK_NORMAL,
    borderRadius: 6,
    borderWidth: 2,
    paddingHorizontal: 22,
    paddingVertical: 22,
    ...roomUiShadow,
    zIndex: 1002,
    elevation: 1002,
  },
  detailHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailTitleText: {
    flex: 1,
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 24,
    includeFontPadding: false,
    lineHeight: 30,
  },
  detailMessageText: {
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 22,
    includeFontPadding: false,
    lineHeight: 30,
  },
  detailAuthorText: {
    color: colors.GREEN_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 18,
    includeFontPadding: false,
    lineHeight: 24,
    textAlign: "right",
  },
  detailActionRow: {
    flexDirection: "row",
    gap: 8,
  },
  detailActionButton: {
    flex: 1,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderColor: colors.BLACK_NORMAL,
    borderRadius: 5,
    borderWidth: 1,
  },
  detailActionButtonPressed: {
    opacity: 0.78,
  },
  deleteButton: {
    backgroundColor: colors.WHITE_NORMAL,
  },
  visitButton: {
    backgroundColor: colors.GREEN_NORMAL,
  },
  deleteButtonText: {
    color: colors.DANGER,
    fontFamily: fonts.BASIC,
    fontSize: 20,
    includeFontPadding: false,
    lineHeight: 28,
  },
  visitButtonText: {
    color: colors.WHITE_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 20,
    includeFontPadding: false,
    lineHeight: 28,
  },
});

export default GuestbookListModal;
