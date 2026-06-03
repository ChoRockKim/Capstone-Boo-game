/**
 * @description  미니게임 화면의 장소 배경과 상단 공통 UI, XP 진행도, 설정/친구 패널을 렌더링합니다.
 * @depends      components/MiniGame/MiniGameData.ts, assets/icons/cross.svg, components/CoinBox/CoinBox.tsx, components/FriendPanel/FriendPanel.tsx, components/MainButton/MainButton.tsx, components/Options/Options.tsx, components/ProgressBar/ProgressBar.tsx, components/SquareButton/SquareButton.tsx, stores/useGameStore.ts, utils/backgroundMusic.ts, utils/xpProgress.ts
 * @used-by      expo-router/entry
 * @side-effects miniGameMain BGM 세션 시작, router 이동, 패널 상태 변경
 */
import ArrowBackIcon from "@/assets/icons/arrow-back-return.svg";
import CrossIcon from "@/assets/icons/cross.svg";
import setting from "@/assets/icons/setting.svg";
import user from "@/assets/icons/users-multiple.svg";
import CoinBox from "@/components/CoinBox/CoinBox";
import FriendList from "@/components/FriendList/FriendList";
import FriendPanel from "@/components/FriendPanel/FriendPanel";
import LoadingOverlay from "@/components/LoadingOverlay/LoadingOverlay";
import MainButton from "@/components/MainButton/MainButton";
import {
  MINI_GAME_DEFAULT_PLACE_ID,
  MINI_GAME_DEFAULT_PLACE_INDEX,
  MINI_GAME_PLACE_OPTIONS,
  preloadMiniGamePlaceImageAssets,
} from "@/components/MiniGame/MiniGameData";
import MyProfile from "@/components/MyProfile/MyProfile";
import Options from "@/components/Options/Options";
import ProgressBar from "@/components/ProgressBar/ProgressBar";
import SoundSettings from "@/components/SoundSettings/SoundSettings";
import SquareButton from "@/components/SquareButton/SquareButton";
import TopAlert from "@/components/TopAlert/TopAlert";
import {
  MINI_GAME_TUTORIAL_IMAGE_ASSETS,
  preloadMiniGameTutorialImageAssets,
} from "@/components/TutorialPanel/TutorialData";
import TutorialPanel from "@/components/TutorialPanel/TutorialPanel";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { useGameStore } from "@/stores/useGameStore";
import { useRequirePlayableSession } from "@/useHook/useRequirePlayableSession";
import { useSyncServerUserStatsOnFocus } from "@/useHook/useSyncServerUserStatsOnFocus";
import { startBackgroundMusicSession } from "@/utils/backgroundMusic";
import { playSoundEffect } from "@/utils/soundEffects";
import { getXpProgressInfo } from "@/utils/xpProgress";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const getNextPlaceIndex = (currentIndex: number, direction: -1 | 1) => {
  return (
    (currentIndex + direction + MINI_GAME_PLACE_OPTIONS.length) %
    MINI_GAME_PLACE_OPTIONS.length
  );
};

type TopAlertState = {
  autoHideDuration: number;
  id: number;
  message: string;
  textSize: "compact" | "default";
  title: string;
  visible: boolean;
};

export default function MiniGameIndex() {
  const insets = useSafeAreaInsets();
  useRequirePlayableSession();
  useSyncServerUserStatsOnFocus();
  const hasCheckedMiniGameTutorialPromptRef = useRef(false);
  const [isOptionOpen, setIsOptionOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isFriendOpen, setIsFriendOpen] = useState(false);
  const [isFriendListOpen, setIsFriendListOpen] = useState(false);
  const [isSoundSettingsOpen, setIsSoundSettingsOpen] = useState(false);
  const [isPlaceInfoOpen, setIsPlaceInfoOpen] = useState(false);
  const [isMiniGameTutorialOpen, setIsMiniGameTutorialOpen] = useState(false);
  const [selectedPlaceIndex, setSelectedPlaceIndex] = useState(
    MINI_GAME_DEFAULT_PLACE_INDEX,
  );
  const [hasInitialPlaceDisplayed, setHasInitialPlaceDisplayed] =
    useState(false);
  const [topAlert, setTopAlert] = useState<TopAlertState>({
    autoHideDuration: 1800,
    id: 0,
    message: "",
    textSize: "compact",
    title: "",
    visible: false,
  });
  const booName = useGameStore((state) => state.booName);
  const coin = useGameStore((state) => state.coin);
  const hasSeenMiniGameTutorial = useGameStore(
    (state) => state.hasSeenMiniGameTutorial,
  );
  const setHasSeenMiniGameTutorial = useGameStore(
    (state) => state.setHasSeenMiniGameTutorial,
  );
  const recordCampusVisit = useGameStore((state) => state.recordCampusVisit);
  const totalXp = useGameStore((state) => state.totalXp);
  const selectedPlace = MINI_GAME_PLACE_OPTIONS[selectedPlaceIndex];
  const xpProgress = useMemo(() => getXpProgressInfo(totalXp), [totalXp]);
  const progressBarTopOffset = insets.top + 86;

  useFocusEffect(
    useCallback(() => {
      recordCampusVisit();
      return startBackgroundMusicSession("miniGameMain");
    }, [recordCampusVisit]),
  );

  useEffect(() => {
    void preloadMiniGamePlaceImageAssets();
    void preloadMiniGameTutorialImageAssets().catch((error) => {
      console.warn("Failed to preload mini game tutorial images.", error);
    });
  }, []);

  useEffect(() => {
    let isCancelled = false;

    if (hasSeenMiniGameTutorial) {
      hasCheckedMiniGameTutorialPromptRef.current = false;
      return undefined;
    }

    if (
      hasCheckedMiniGameTutorialPromptRef.current ||
      !hasInitialPlaceDisplayed ||
      isOptionOpen ||
      isProfileOpen ||
      isFriendOpen ||
      isFriendListOpen ||
      isSoundSettingsOpen ||
      isPlaceInfoOpen
    ) {
      return undefined;
    }

    hasCheckedMiniGameTutorialPromptRef.current = true;
    void preloadMiniGameTutorialImageAssets()
      .catch(() => undefined)
      .then(() => {
        if (!isCancelled) {
          setIsMiniGameTutorialOpen(true);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [
    hasInitialPlaceDisplayed,
    hasSeenMiniGameTutorial,
    isFriendListOpen,
    isFriendOpen,
    isOptionOpen,
    isPlaceInfoOpen,
    isProfileOpen,
    isSoundSettingsOpen,
  ]);

  const markPlaceImageReady = useCallback((placeId: string) => {
    if (placeId === MINI_GAME_DEFAULT_PLACE_ID) {
      setHasInitialPlaceDisplayed(true);
    }
  }, []);

  const closeSubPanels = () => {
    setIsProfileOpen(false);
    setIsFriendListOpen(false);
    setIsSoundSettingsOpen(false);
  };

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

  const handleFriendButtonPress = () => {
    setIsOptionOpen(false);
    closeSubPanels();
    setIsFriendOpen((prev) => !prev);
  };

  const handleOptionButtonPress = () => {
    setIsFriendOpen(false);
    closeSubPanels();
    setIsOptionOpen((prev) => !prev);
  };

  const changePlace = (direction: -1 | 1) => {
    playSoundEffect("basicClick");
    setIsPlaceInfoOpen(false);
    setSelectedPlaceIndex((currentIndex) =>
      getNextPlaceIndex(currentIndex, direction),
    );
  };

  const handlePlaceLabelPress = () => {
    playSoundEffect("basicClick");
    setIsPlaceInfoOpen((prev) => !prev);
  };

  const handlePlaceInfoClose = () => {
    playSoundEffect("basicClick");
    setIsPlaceInfoOpen(false);
  };

  const handleGameStartPress = () => {
    if (selectedPlace.hasMiniGame) {
      router.push(selectedPlace.miniGameRoute);
      return;
    }

    showTopAlert("준비 중", "해당 미니게임은 아직 준비 중이에요.", {
      autoHideDuration: 1800,
      textSize: "compact",
    });
  };

  const completeMiniGameTutorial = () => {
    setHasSeenMiniGameTutorial(true);
    setIsMiniGameTutorialOpen(false);
  };

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <View pointerEvents="none" style={styles.backgroundImageLayer}>
        {MINI_GAME_PLACE_OPTIONS.map((place, index) => (
          <Image
            key={place.id}
            cachePolicy="memory-disk"
            contentFit="cover"
            onDisplay={() => markPlaceImageReady(place.id)}
            onError={() => markPlaceImageReady(place.id)}
            source={place.image}
            style={[
              styles.backgroundImage,
              index === selectedPlaceIndex
                ? styles.backgroundImageVisible
                : styles.backgroundImageHidden,
            ]}
          />
        ))}
      </View>
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
              onPress={() => router.replace("/game")}
              shadow
            />
            <CoinBox coin={coin} shadow />
          </View>
          <View style={styles.topRightButtonRow}>
            <SquareButton
              Icon={user}
              onPress={handleFriendButtonPress}
              shadow
            />
            <SquareButton
              Icon={setting}
              onPress={handleOptionButtonPress}
              shadow
            />
          </View>
        </View>
        <View style={[styles.progressArea, { top: progressBarTopOffset }]}>
          <View style={styles.progressBarAnchor}>
            <ProgressBar
              booName={booName}
              bottomOffset={0}
              grade={xpProgress.grade}
              maxXp={xpProgress.progressMaxXp}
              shadow
              xp={xpProgress.currentXpInGrade}
            />
          </View>
        </View>
        {isPlaceInfoOpen ? (
          <View pointerEvents="box-none" style={styles.placeInfoBubbleAnchor}>
            <View style={styles.placeInfoBubble}>
              <View style={styles.placeInfoHeader}>
                <View style={styles.placeInfoTitleRow}>
                  <Image
                    cachePolicy="memory-disk"
                    contentFit="cover"
                    source={selectedPlace.image}
                    style={styles.placeInfoIcon}
                  />
                  <Text style={styles.placeInfoTitleText}>
                    {selectedPlace.label}
                  </Text>
                </View>
                <Pressable
                  onPress={handlePlaceInfoClose}
                  style={({ pressed }) => [
                    styles.placeInfoCloseButton,
                    pressed && styles.placeInfoCloseButtonPressed,
                  ]}
                >
                  <CrossIcon
                    width={28}
                    height={28}
                    fill={colors.BLACK_NORMAL}
                  />
                </Pressable>
              </View>
              <ScrollView
                style={styles.placeInfoDescriptionScroll}
                contentContainerStyle={styles.placeInfoDescriptionContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.placeInfoDescriptionText}>
                  {selectedPlace.description}
                </Text>
              </ScrollView>
              {selectedPlace.hasMiniGame ? (
                <View style={styles.placeInfoActionButton}>
                  <MainButton
                    height={60}
                    label="> 게임하러가기"
                    onPress={handleGameStartPress}
                    size="S"
                    width={284}
                  />
                </View>
              ) : null}
              <View style={styles.placeInfoTailOuter} />
              <View style={styles.placeInfoTailInner} />
            </View>
          </View>
        ) : null}
        <View style={styles.placeSelector}>
          <MiniGamePlaceArrowButton
            direction="left"
            onPress={() => changePlace(-1)}
          />
          <Pressable
            onPress={handlePlaceLabelPress}
            style={({ pressed }) => [
              styles.placeLabelBox,
              pressed && styles.placeLabelBoxPressed,
            ]}
          >
            <Text style={styles.placeLabelText}>{selectedPlace.label}</Text>
          </Pressable>
          <MiniGamePlaceArrowButton
            direction="right"
            onPress={() => changePlace(1)}
          />
        </View>
      </SafeAreaView>
      {isOptionOpen ? (
        <Options
          setIsFriendListOpen={setIsFriendListOpen}
          setIsOptionOpen={setIsOptionOpen}
          setIsProfileOpen={setIsProfileOpen}
          setIsSoundSettingsOpen={setIsSoundSettingsOpen}
        />
      ) : null}
      {isProfileOpen ? (
        <MyProfile
          setIsOptionOpen={setIsOptionOpen}
          setIsProfileOpen={setIsProfileOpen}
        />
      ) : null}
      {isFriendOpen ? <FriendPanel setIsFriendOpen={setIsFriendOpen} /> : null}
      {isFriendListOpen ? (
        <FriendList
          setIsFriendListOpen={setIsFriendListOpen}
          setIsOptionOpen={setIsOptionOpen}
        />
      ) : null}
      {isSoundSettingsOpen ? (
        <SoundSettings
          setIsOptionOpen={setIsOptionOpen}
          setIsSoundSettingsOpen={setIsSoundSettingsOpen}
        />
      ) : null}
      {!hasInitialPlaceDisplayed ? <LoadingOverlay /> : null}
      {isMiniGameTutorialOpen ? (
        <TutorialPanel
          imageAssets={MINI_GAME_TUTORIAL_IMAGE_ASSETS}
          onComplete={completeMiniGameTutorial}
          title="캠퍼스 튜토리얼"
        />
      ) : null}
    </View>
  );
}

type MiniGamePlaceArrowButtonProps = {
  direction: "left" | "right";
  onPress: () => void;
};

const MiniGamePlaceArrowButton = ({
  direction,
  onPress,
}: MiniGamePlaceArrowButtonProps) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.placeArrowButton,
        pressed && styles.placeArrowButtonPressed,
      ]}
    >
      <Text style={styles.placeArrowButtonText}>
        {direction === "left" ? "<" : ">"}
      </Text>
    </Pressable>
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
  backgroundImageLayer: {
    ...StyleSheet.absoluteFill,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFill,
  },
  backgroundImageVisible: {
    opacity: 1,
  },
  backgroundImageHidden: {
    opacity: 0,
  },
  backgroundDim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.08)",
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
  topRightButtonRow: {
    flexDirection: "row",
    gap: 8,
  },
  progressArea: {
    position: "absolute",
    left: 28,
    right: 28,
    zIndex: 2,
    alignItems: "center",
    gap: 8,
  },
  progressBarAnchor: {
    position: "relative",
    width: "100%",
    height: 54,
  },
  placeInfoBubbleAnchor: {
    position: "absolute",
    left: 28,
    right: 28,
    bottom: 136,
    zIndex: 5,
    alignItems: "center",
  },
  placeInfoBubble: {
    width: "100%",
    maxWidth: 430,
    minHeight: 276,
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 28,
    backgroundColor: colors.WHITE_NORMAL,
    borderColor: colors.BLACK_NORMAL,
    borderRadius: 12,
    borderWidth: 2,
    ...miniGameUiShadow,
  },
  placeInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    marginBottom: 16,
  },
  placeInfoTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  placeInfoIcon: {
    width: 34,
    height: 34,
    borderColor: colors.BLACK_NORMAL,
    borderRadius: 5,
    borderWidth: 1,
  },
  placeInfoTitleText: {
    flex: 1,
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 26,
    includeFontPadding: false,
    lineHeight: 34,
  },
  placeInfoCloseButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  placeInfoCloseButtonPressed: {
    opacity: 0.55,
  },
  placeInfoDescriptionScroll: {
    maxHeight: 190,
  },
  placeInfoDescriptionContent: {
    paddingRight: 4,
  },
  placeInfoDescriptionText: {
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 16,
    includeFontPadding: false,
    lineHeight: 24,
  },
  placeInfoActionButton: {
    alignItems: "center",
    marginTop: 22,
  },
  placeInfoTailOuter: {
    position: "absolute",
    left: "50%",
    bottom: -34,
    width: 0,
    height: 0,
    borderLeftWidth: 30,
    borderRightWidth: 30,
    borderTopWidth: 34,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: colors.BLACK_NORMAL,
  },
  placeInfoTailInner: {
    position: "absolute",
    left: "51.3%",
    bottom: -30,
    width: 0,
    height: 0,
    borderLeftWidth: 26,
    borderRightWidth: 26,
    borderTopWidth: 30,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: colors.WHITE_NORMAL,
  },
  placeSelector: {
    position: "absolute",
    left: 28,
    right: 28,
    bottom: 36,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  placeLabelBox: {
    flex: 1,
    width: 207,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.WHITE_NORMAL,
    borderColor: colors.BLACK_NORMAL,
    borderRadius: 6,
    borderWidth: 1,
    ...miniGameUiShadow,
  },
  placeLabelBoxPressed: {
    backgroundColor: colors.GOLD_LIGHT_ACTIVE,
  },
  placeLabelText: {
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 24,
    includeFontPadding: false,
    lineHeight: 42,
  },
  placeArrowButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.WHITE_NORMAL,
    borderColor: colors.BLACK_NORMAL,
    borderRadius: 6,
    borderWidth: 1,
    ...miniGameUiShadow,
  },
  placeArrowButtonPressed: {
    backgroundColor: colors.GOLD_LIGHT_ACTIVE,
  },
  placeArrowButtonText: {
    color: colors.GREEN_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 44,
    includeFontPadding: false,
    lineHeight: 52,
  },
  miniGameUiShadow: miniGameUiShadow,
});
