/**
 * @description  화면 최상단에서 내려오는 공통 알림 UI와 자동 닫힘 애니메이션을 처리합니다.
 * @depends      assets/icons/cross.svg, constants/colors.ts, constants/fonts.ts, utils/soundEffects.ts
 * @used-by      app/game/index.tsx
 * @side-effects Animated timing/spring, auto-hide timeout, close SFX 재생
 */
/* eslint-disable react-hooks/refs -- React Native Animated.Value instances are rendered directly into Animated styles. */
import CrossIcon from "@/assets/icons/cross.svg";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { playSoundEffect } from "@/utils/soundEffects";
import { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface TopAlertProps {
  autoHideDuration?: number;
  closable?: boolean;
  message?: string;
  onClose: () => void;
  textSize?: "compact" | "default";
  title: string;
  visible: boolean;
  visibilityKey?: number;
}

const HIDDEN_TRANSLATE_Y = -220;
const TOP_ALERT_OVERSCAN = 24;
const topAlertShadow = {
  elevation: 3,
  shadowColor: colors.NAVY_NORMAL,
  shadowOffset: {
    width: 2,
    height: 2,
  },
  shadowOpacity: 0.25,
  shadowRadius: 2,
};

function TopAlert({
  autoHideDuration = 2500,
  closable = true,
  message,
  onClose,
  textSize = "default",
  title,
  visible,
  visibilityKey = 0,
}: TopAlertProps) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(HIDDEN_TRANSLATE_Y)).current;

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    if (visible) {
      opacity.setValue(0);
      translateY.setValue(HIDDEN_TRANSLATE_Y);

      Animated.parallel([
        Animated.timing(opacity, {
          duration: 170,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          damping: 18,
          mass: 0.9,
          stiffness: 180,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]).start();

      if (autoHideDuration > 0) {
        hideTimer = setTimeout(() => {
          onClose();
        }, autoHideDuration);
      }
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          duration: 140,
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          duration: 160,
          toValue: HIDDEN_TRANSLATE_Y,
          useNativeDriver: true,
        }),
      ]).start();
    }

    return () => {
      if (hideTimer) {
        clearTimeout(hideTimer);
      }
    };
  }, [autoHideDuration, onClose, opacity, translateY, visibilityKey, visible]);

  const handleClosePress = () => {
    playSoundEffect("basicClick");
    onClose();
  };

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <Animated.View
        pointerEvents={visible ? "auto" : "none"}
        style={[
          styles.card,
          {
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        <View
          style={[
            styles.content,
            !closable && styles.contentWithoutCloseButton,
            {
              paddingTop: insets.top + 18 + TOP_ALERT_OVERSCAN,
            },
          ]}
        >
          <View style={styles.textGroup}>
            <Text
              style={[
                styles.title,
                textSize === "compact" && styles.titleCompact,
              ]}
            >
              {title}
            </Text>
            {!!message && (
              <Text
                style={[
                  styles.message,
                  textSize === "compact" && styles.messageCompact,
                ]}
              >
                {message}
              </Text>
            )}
          </View>
          {closable ? (
            <Pressable onPress={handleClosePress} style={styles.closeButton}>
              <CrossIcon width={26} height={26} fill={colors.BLACK_NORMAL} />
            </Pressable>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 2000,
    elevation: 2000,
    justifyContent: "flex-start",
    pointerEvents: "box-none",
  },
  card: {
    width: "100%",
    marginTop: -TOP_ALERT_OVERSCAN,
  },
  content: {
    minHeight: 136,
    paddingBottom: 20,
    paddingHorizontal: 26,
    backgroundColor: colors.WHITE_NORMAL,
    borderWidth: 2,
    borderColor: colors.BLACK_NORMAL,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    ...topAlertShadow,
  },
  contentWithoutCloseButton: {
    justifyContent: "center",
  },
  textGroup: {
    flex: 1,
    gap: 10,
  },
  title: {
    fontFamily: fonts.BASIC,
    fontSize: 22,
    lineHeight: 30,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  titleCompact: {
    fontSize: 20,
    lineHeight: 28,
  },
  message: {
    fontFamily: fonts.BASIC,
    fontSize: 22,
    lineHeight: 30,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  messageCompact: {
    fontSize: 20,
    lineHeight: 28,
  },
  closeButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 2,
    paddingHorizontal: 4,
  },
});

export default TopAlert;
