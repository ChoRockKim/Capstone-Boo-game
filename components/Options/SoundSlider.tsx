import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface SoundSliderProps {
  label: string;
  onChange: (value: number) => void;
  value: number;
}

const SLIDER_THUMB_SIZE = 20;

const clampVolume = (value: number) => Math.max(0, Math.min(value, 1));

const SoundSlider = ({ label, onChange, value }: SoundSliderProps) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackRef = useRef<View | null>(null);
  const trackPageXRef = useRef(0);

  const updateValueFromPageX = useCallback(
    (pageX: number) => {
      if (trackWidth <= 0) {
        return;
      }

      const usableTrackWidth = Math.max(trackWidth - SLIDER_THUMB_SIZE, 1);
      const nextValue = clampVolume(
        (pageX - trackPageXRef.current - SLIDER_THUMB_SIZE / 2) /
          usableTrackWidth,
      );
      onChange(Number(nextValue.toFixed(3)));
    },
    [onChange, trackWidth],
  );

  const syncTrackMetrics = useCallback(() => {
    trackRef.current?.measureInWindow((pageX, _pageY, width) => {
      trackPageXRef.current = pageX;
      if (width > 0 && width !== trackWidth) {
        setTrackWidth(width);
      }
    });
  }, [trackWidth]);

  const handleTrackLayout = useCallback((event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
    requestAnimationFrame(syncTrackMetrics);
  }, [syncTrackMetrics]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) =>
          updateValueFromPageX(event.nativeEvent.pageX),
        onPanResponderMove: (event) =>
          updateValueFromPageX(event.nativeEvent.pageX),
        onStartShouldSetPanResponder: () => true,
      }),
    [updateValueFromPageX],
  );

  const filledTrackWidth = useMemo(
    () =>
      Math.max(
        (trackWidth - SLIDER_THUMB_SIZE) * clampVolume(value) +
          SLIDER_THUMB_SIZE / 2,
        0,
      ),
    [trackWidth, value],
  );
  const thumbLeft = useMemo(
    () =>
      trackWidth > 0
        ? (trackWidth - SLIDER_THUMB_SIZE) * clampVolume(value)
        : 0,
    [trackWidth, value],
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.valueText}>
          {Math.round(clampVolume(value) * 100)}%
        </Text>
      </View>
      <View
        style={styles.trackShell}
        {...panResponder.panHandlers}
      >
        <View
          ref={trackRef}
          onLayout={handleTrackLayout}
          style={styles.track}
          pointerEvents="none"
        >
          <View style={[styles.filledTrack, { width: filledTrackWidth }]} />
          <View
            style={[
              styles.thumb,
              {
                left: thumbLeft,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  label: {
    flex: 1,
    fontFamily: fonts.BASIC,
    fontSize: 16,
    lineHeight: 22,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  valueText: {
    minWidth: 44,
    textAlign: "right",
    fontFamily: fonts.BASIC,
    fontSize: 14,
    lineHeight: 18,
    color: colors.NAVY_NORMAL,
    includeFontPadding: false,
  },
  trackShell: {
    height: 28,
    justifyContent: "center",
  },
  track: {
    position: "relative",
    height: 12,
    borderWidth: 1.5,
    borderRadius: 2,
    borderColor: colors.SILVER_NORMAL_ACTIVE,
    backgroundColor: colors.WHITE_NORMAL,
    justifyContent: "center",
  },
  filledTrack: {
    height: "100%",
    backgroundColor: colors.GREEN_LIGHT_ACTIVE,
    borderWidth: 1,
    borderColor: colors.GREEN_NORMAL,
  },
  thumb: {
    position: "absolute",
    width: SLIDER_THUMB_SIZE,
    height: SLIDER_THUMB_SIZE,
    borderWidth: 2,
    borderColor: colors.BLACK_NORMAL,
    backgroundColor: colors.WHITE_NORMAL,
    top: -5,
  },
});

export default SoundSlider;
