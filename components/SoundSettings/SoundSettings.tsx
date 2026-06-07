import ArrowReturn from "@/assets/icons/arrow-back-return.svg";
import CrossIcon from "@/assets/icons/cross.svg";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { useGameStore } from "@/stores/useGameStore";
import { updateCurrentUserPreferences } from "@/utils/serverApi";
import React, { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import SoundSlider from "../Options/SoundSlider";

interface SoundSettingsProps {
  setIsOptionOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSoundSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const SoundSettings = ({
  setIsOptionOpen,
  setIsSoundSettingsOpen,
}: SoundSettingsProps) => {
  const masterVolume = useGameStore((state) => state.masterVolume);
  const accessToken = useGameStore((state) => state.accessToken);
  const bgmVolume = useGameStore((state) => state.bgmVolume);
  const sfxVolume = useGameStore((state) => state.sfxVolume);
  const setMasterVolume = useGameStore((state) => state.setMasterVolume);
  const setBgmVolume = useGameStore((state) => state.setBgmVolume);
  const setSfxVolume = useGameStore((state) => state.setSfxVolume);
  const didMountRef = useRef(false);

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    if (!didMountRef.current) {
      didMountRef.current = true;
      return undefined;
    }

    const saveTimer = setTimeout(() => {
      void updateCurrentUserPreferences(
        {
          bgm_volume: bgmVolume,
          master_volume: masterVolume,
          sfx_volume: sfxVolume,
        },
        accessToken,
      ).catch((error) => {
        console.warn("서버 사운드 설정 저장 실패", error);
      });
    }, 600);

    return () => {
      clearTimeout(saveTimer);
    };
  }, [accessToken, bgmVolume, masterVolume, sfxVolume]);

  const handleBackPress = () => {
    setIsSoundSettingsOpen(false);
    setIsOptionOpen(true);
  };

  const handleClosePress = () => {
    setIsSoundSettingsOpen(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>사운드 설정</Text>
        <View style={styles.headerButtonGroup}>
          <Pressable onPress={handleBackPress} style={styles.headerButton}>
            <ArrowReturn width={24} height={24} color={colors.BLACK_NORMAL} />
          </Pressable>
          <Pressable onPress={handleClosePress} style={styles.headerButton}>
            <CrossIcon width={24} height={24} fill={colors.BLACK_NORMAL} />
          </Pressable>
        </View>
      </View>
      <Text style={styles.helperText}>드래그해서 바로 조절할 수 있어요.</Text>
      <View style={styles.soundCard}>
        <SoundSlider
          label="전체 소리"
          onChange={setMasterVolume}
          value={masterVolume}
        />
        <View style={styles.divider} />
        <SoundSlider label="BGM" onChange={setBgmVolume} value={bgmVolume} />
        <View style={styles.divider} />
        <SoundSlider label="효과음" onChange={setSfxVolume} value={sfxVolume} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  helperText: {
    marginBottom: 12,
    fontFamily: fonts.BASIC,
    fontSize: 14,
    lineHeight: 18,
    color: colors.SILVER_NORMAL_ACTIVE,
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
  soundCard: {
    gap: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: colors.GRAY_NORMAL_ACTIVE,
    backgroundColor: colors.SILVER_LIGHT_HOVER,
  },
  divider: {
    height: 1,
    backgroundColor: colors.GRAY_NORMAL_ACTIVE,
  },
});

export default SoundSettings;
