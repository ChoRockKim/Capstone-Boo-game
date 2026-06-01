/**
 * @description  미니게임별 시작 화면의 공통 UI, 하트 상태, 랭킹 모달을 렌더링합니다.
 * @depends      assets/icons/arrow-back-return.svg, assets/icons/trophy.svg, components/CoinBox/CoinBox.tsx, components/FriendList/FriendListDummyData.ts, components/MainButton/MainButton.tsx, components/MiniGame/HeartCountBadge.tsx, components/MiniGame/MiniGameData.ts, components/MiniGame/MiniGameRankingModal.tsx, components/OutlinedText/OutlinedText.tsx, components/SquareButton/SquareButton.tsx, components/TopAlert/TopAlert.tsx, stores/useGameStore.ts, utils/backgroundMusic.ts
 * @used-by      app/miniGame/catchTheMajor.tsx, app/miniGame/catchBoo.tsx, app/miniGame/freeThrow.tsx
 * @side-effects miniGameMain BGM 세션 시작, router 이동, TopAlert/랭킹 모달 상태 변경
 */
import ArrowBackIcon from "@/assets/icons/arrow-back-return.svg";
import TrophyIcon from "@/assets/icons/trophy.svg";
import { CHARACTER_IMAGES } from "@/constants/character";
import CoinBox from "@/components/CoinBox/CoinBox";
import BookCatchRuleModal from "@/components/MiniGame/BookCatchRuleModal";
import BooCatchRuleModal from "@/components/MiniGame/BooCatchRuleModal";
import { getFriendMiniGameScore } from "@/components/FriendList/FriendListDummyData";
import MainButton from "@/components/MainButton/MainButton";
import HeartCountBadge from "@/components/MiniGame/HeartCountBadge";
import {
  formatMiniGameHeartCountdown,
  getMiniGameHeartStatus,
  MINI_GAME_START_SCREEN_REGISTRY,
  preloadMiniGameBooCatchRuleImageAssets,
  preloadMiniGameBookCatchImageAssets,
} from "@/components/MiniGame/MiniGameData";
import type { MiniGameId } from "@/components/MiniGame/MiniGameData";
import MiniGameRankingModal, {
  MiniGameRankingEntry,
} from "@/components/MiniGame/MiniGameRankingModal";
import OutlinedText from "@/components/OutlinedText/OutlinedText";
import SquareButton from "@/components/SquareButton/SquareButton";
import TopAlert from "@/components/TopAlert/TopAlert";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { useGameStore } from "@/stores/useGameStore";
import { useSyncServerUserStatsOnFocus } from "@/useHook/useSyncServerUserStatsOnFocus";
import { startBackgroundMusicSession } from "@/utils/backgroundMusic";
import { getXpProgressInfo } from "@/utils/xpProgress";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type MiniGameStartScreenProps = {
  miniGameId: MiniGameId;
};

type TopAlertState = {
  autoHideDuration: number;
  id: number;
  message: string;
  textSize: "compact" | "default";
  title: string;
  visible: boolean;
};

const MiniGameStartScreen = ({ miniGameId }: MiniGameStartScreenProps) => {
  const { width } = useWindowDimensions();
  useSyncServerUserStatsOnFocus();
  const miniGame = MINI_GAME_START_SCREEN_REGISTRY[miniGameId];
  const coin = useGameStore((state) => state.coin);
  const friendList = useGameStore((state) => state.friendList);
  const heart = useGameStore((state) => state.heart);
  const heartUpdatedAt = useGameStore((state) => state.heartUpdatedAt);
  const maxHeart = useGameStore((state) => state.maxHeart);
  const totalXp = useGameStore((state) => state.totalXp);
  const xpProgress = useMemo(() => getXpProgressInfo(totalXp), [totalXp]);
  const bookCatchBooImage = CHARACTER_IMAGES.grades[xpProgress.grade].basic1;
  const [topAlert, setTopAlert] = useState<TopAlertState>({
    autoHideDuration: 1800,
    id: 0,
    message: "",
    textSize: "compact",
    title: "",
    visible: false,
  });
  const [isRankingOpen, setIsRankingOpen] = useState(false);
  const [isRuleOpen, setIsRuleOpen] = useState(false);
  const [isInfiniteMode, setIsInfiniteMode] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [fallbackRecoveryStartedAtMs] = useState(() => Date.now());
  const accessToken = useGameStore((state) => state.accessToken);

  const actionButtonWidth = useMemo(() => {
    return Math.min(170, Math.floor((width - 56 - 12) / 2));
  }, [width]);

  const rankingEntries = useMemo<MiniGameRankingEntry[]>(() => {
    if (accessToken) {
      return [];
    }

    return friendList.map((friend) => ({
      friendId: friend.id,
      name: friend.name,
      score: getFriendMiniGameScore(
        friend,
        miniGame.id,
        isInfiniteMode ? "infinite" : "normal",
      ),
    }));
  }, [accessToken, friendList, isInfiniteMode, miniGame.id]);

  const heartStatus = useMemo(
    () =>
      getMiniGameHeartStatus(
        {
          heartCount: heart,
          heartRecoveryStartedAt: heartUpdatedAt,
          maxHeartCount: maxHeart,
        },
        nowMs,
        fallbackRecoveryStartedAtMs,
      ),
    [fallbackRecoveryStartedAtMs, heart, heartUpdatedAt, maxHeart, nowMs],
  );

  const heartStatusLabel = heartStatus.isFull
    ? "가득 참"
    : formatMiniGameHeartCountdown(heartStatus.nextHeartRecoveryRemainingMs);
  const supportsInfiniteMode = miniGame.id === "catchTheMajor";

  useFocusEffect(
    useCallback(() => {
      return startBackgroundMusicSession("miniGameMain");
    }, []),
  );

  useEffect(() => {
    if (heartStatus.isFull) {
      return;
    }

    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [heartStatus.isFull]);

  useEffect(() => {
    if (miniGame.id === "catchTheMajor") {
      void Promise.all([
        preloadMiniGameBookCatchImageAssets(),
        Image.loadAsync(bookCatchBooImage),
      ]);
      return;
    }

    if (miniGame.id === "catchBoo") {
      void preloadMiniGameBooCatchRuleImageAssets();
    }
  }, [bookCatchBooImage, miniGame.id]);

  const showTopAlert = useCallback(
    (
      title: string,
      message = "",
      options?: {
        autoHideDuration?: number;
        textSize?: "compact" | "default";
      },
    ) => {
      setTopAlert((prev) => ({
        autoHideDuration: options?.autoHideDuration ?? 1800,
        id: prev.id + 1,
        message,
        textSize: options?.textSize ?? "compact",
        title,
        visible: true,
      }));
    },
    [],
  );

  const hideTopAlert = useCallback(() => {
    setTopAlert((prev) => ({
      ...prev,
      visible: false,
    }));
  }, []);

  const showReadyAlert = () => {
    showTopAlert("준비 중", miniGame.readyAlertMessage, {
      autoHideDuration: 1800,
      textSize: "compact",
    });
  };

  const handleRulePress = () => {
    if (miniGame.id !== "catchTheMajor" && miniGame.id !== "catchBoo") {
      showReadyAlert();
      return;
    }

    setIsRankingOpen(false);
    if (miniGame.id === "catchBoo") {
      void preloadMiniGameBooCatchRuleImageAssets();
    }
    setIsRuleOpen(true);
  };

  const handleInfiniteModePress = () => {
    setIsInfiniteMode((currentValue) => !currentValue);
  };

  const handleGameStartPress = () => {
    if (miniGame.id === "catchBoo") {
      setIsRankingOpen(false);
      setIsRuleOpen(false);
      router.push("/miniGame/catchBooPlay");
      return;
    }

    if (miniGame.id !== "catchTheMajor") {
      showReadyAlert();
      return;
    }

    setIsRankingOpen(false);
    setIsRuleOpen(false);
    router.push({
      pathname: "/miniGame/catchTheMajorPlay",
      params: { mode: isInfiniteMode ? "infinite" : "normal" },
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <Image
        cachePolicy="memory-disk"
        contentFit="cover"
        source={miniGame.backgroundImage}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.backgroundDim} />
      <TopAlert
        autoHideDuration={topAlert.autoHideDuration}
        message={topAlert.message}
        onClose={hideTopAlert}
        textSize={topAlert.textSize}
        title={topAlert.title}
        visibilityKey={topAlert.id}
        visible={topAlert.visible}
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <View style={styles.leftControls}>
            <SquareButton
              Icon={ArrowBackIcon}
              onPress={() => router.replace("/miniGame")}
              shadow
            />
            <CoinBox coin={coin} shadow />
          </View>
          <SquareButton
            Icon={TrophyIcon}
            onPress={() => setIsRankingOpen((currentValue) => !currentValue)}
            shadow
          />
        </View>

        <View style={styles.stage}>
          <Image
            cachePolicy="memory-disk"
            contentFit="contain"
            source={miniGame.iconImage}
            style={styles.gameLogo}
          />
          <View style={styles.lifeBox}>
            <HeartCountBadge count={heartStatus.heartCount} size={40} />
            <Text style={styles.heartStatusText}>{heartStatusLabel}</Text>
          </View>
        </View>

        <View style={styles.bottomActions}>
          <View style={styles.mainButtonShadow}>
            <MainButton
              color="gray"
              height={76}
              label="> 게임설명"
              onPress={handleRulePress}
              size="M"
              width={actionButtonWidth}
            />
          </View>
          <View style={styles.startActionColumn}>
            {supportsInfiniteMode ? (
              <Pressable
                onPress={handleInfiniteModePress}
                style={({ pressed }) => [
                  styles.infiniteModeToggle,
                  { width: actionButtonWidth },
                  pressed && styles.infiniteModeTogglePressed,
                ]}
              >
                <OutlinedText
                  color={colors.BLACK_NORMAL}
                  outlineColor={colors.WHITE_NORMAL}
                  outlineWidth={1}
                  style={styles.infiniteModeToggleText}
                >
                  무한모드
                </OutlinedText>
                <View
                  style={[
                    styles.infiniteModeCheckBox,
                    isInfiniteMode && styles.infiniteModeCheckBoxActive,
                  ]}
                >
                  {isInfiniteMode ? (
                    <>
                      <View style={styles.infiniteModeCheckMarkShort} />
                      <View style={styles.infiniteModeCheckMarkLong} />
                    </>
                  ) : null}
                </View>
              </Pressable>
            ) : null}
            <View style={styles.mainButtonShadow}>
              <MainButton
                height={76}
                label="> 게임시작"
                onPress={handleGameStartPress}
                size="M"
                width={actionButtonWidth}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
      {isRankingOpen ? (
        <MiniGameRankingModal
          entries={rankingEntries}
          onClose={() => setIsRankingOpen(false)}
          title={isInfiniteMode ? "무한 랭킹" : "랭킹"}
        />
      ) : null}
      {isRuleOpen && miniGame.id === "catchTheMajor" ? (
        <BookCatchRuleModal onClose={() => setIsRuleOpen(false)} />
      ) : null}
      {isRuleOpen && miniGame.id === "catchBoo" ? (
        <BooCatchRuleModal onClose={() => setIsRuleOpen(false)} />
      ) : null}
    </View>
  );
};

const miniGameUiShadow = {
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
    backgroundColor: colors.GRAY_NORMAL,
  },
  backgroundDim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingVertical: 24,
  },
  topBar: {
    zIndex: 2,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  leftControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 86,
  },
  gameLogo: {
    width: 210,
    height: 210,
    marginBottom: 26,
  },
  lifeBox: {
    width: 148,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.WHITE_NORMAL,
    borderColor: colors.BLACK_NORMAL,
    borderRadius: 6,
    borderWidth: 1,
    ...miniGameUiShadow,
  },
  heartStatusText: {
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 24,
    includeFontPadding: false,
    lineHeight: 30,
  },
  bottomActions: {
    position: "absolute",
    left: 28,
    right: 28,
    bottom: 38,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 12,
  },
  startActionColumn: {
    alignItems: "center",
    gap: 8,
  },
  infiniteModeToggle: {
    height: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  infiniteModeTogglePressed: {
    opacity: 0.65,
  },
  infiniteModeToggleText: {
    fontFamily: fonts.BASIC,
    fontSize: 18,
    includeFontPadding: false,
    lineHeight: 22,
  },
  infiniteModeCheckBox: {
    width: 20,
    height: 20,
    backgroundColor: colors.WHITE_NORMAL,
    borderColor: colors.BLACK_NORMAL,
    borderRadius: 2,
    borderWidth: 1,
  },
  infiniteModeCheckBoxActive: {
    backgroundColor: colors.WHITE_NORMAL,
    borderColor: colors.BLACK_NORMAL,
  },
  infiniteModeCheckMarkShort: {
    position: "absolute",
    left: 4,
    top: 9,
    width: 6,
    height: 3,
    backgroundColor: colors.BLACK_NORMAL,
    transform: [{ rotate: "45deg" }],
  },
  infiniteModeCheckMarkLong: {
    position: "absolute",
    left: 8,
    top: 7,
    width: 10,
    height: 3,
    backgroundColor: colors.BLACK_NORMAL,
    transform: [{ rotate: "-45deg" }],
  },
  mainButtonShadow: {
    borderRadius: 8,
    ...miniGameUiShadow,
  },
});

export default MiniGameStartScreen;
