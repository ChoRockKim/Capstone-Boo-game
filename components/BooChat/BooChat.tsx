import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import React, { useState } from "react";
import {
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import Svg, { G, Path } from "react-native-svg";

interface BooChatProps {
  message: string;
  style?: StyleProp<ViewStyle>;
  visible?: boolean;
}

const STROKE_WIDTH = 2;
const CORNER_INSET = 3;
const CORNER_OUTSET = 6;
const HORIZONTAL_PADDING = 16;
const MAX_TEXT_WIDTH = 180;
const MIN_BUBBLE_HEIGHT = 44;
const MIN_BUBBLE_WIDTH = 72;
const TAIL_BASE_WIDTH = 20;
const TAIL_MID_WIDTH = 12;
const TAIL_TIP_WIDTH = 4;
const TAIL_STEP_HEIGHT = 4;

function pixelBubblePath(width: number, height: number): string {
  const centerX = width / 2;
  const tailBaseHalf = TAIL_BASE_WIDTH / 2;
  const tailMidHalf = TAIL_MID_WIDTH / 2;
  const tailTipHalf = TAIL_TIP_WIDTH / 2;
  const tailMidY = height + TAIL_STEP_HEIGHT;
  const tailBottomY = height + TAIL_STEP_HEIGHT * 2;

  return [
    `M ${CORNER_OUTSET} 0`,
    `L ${width - CORNER_OUTSET} 0`,
    `L ${width - CORNER_OUTSET} ${CORNER_INSET}`,
    `L ${width - CORNER_INSET} ${CORNER_INSET}`,
    `L ${width - CORNER_INSET} ${CORNER_OUTSET}`,
    `L ${width} ${CORNER_OUTSET}`,
    `L ${width} ${height - CORNER_OUTSET}`,
    `L ${width - CORNER_INSET} ${height - CORNER_OUTSET}`,
    `L ${width - CORNER_INSET} ${height - CORNER_INSET}`,
    `L ${width - CORNER_OUTSET} ${height - CORNER_INSET}`,
    `L ${width - CORNER_OUTSET} ${height}`,
    `L ${centerX + tailBaseHalf} ${height}`,
    `L ${centerX + tailBaseHalf} ${tailMidY}`,
    `L ${centerX + tailMidHalf} ${tailMidY}`,
    `L ${centerX + tailMidHalf} ${tailBottomY}`,
    `L ${centerX + tailTipHalf} ${tailBottomY}`,
    `L ${centerX + tailTipHalf} ${tailBottomY + TAIL_STEP_HEIGHT}`,
    `L ${centerX - tailTipHalf} ${tailBottomY + TAIL_STEP_HEIGHT}`,
    `L ${centerX - tailTipHalf} ${tailBottomY}`,
    `L ${centerX - tailMidHalf} ${tailBottomY}`,
    `L ${centerX - tailMidHalf} ${tailMidY}`,
    `L ${centerX - tailBaseHalf} ${tailMidY}`,
    `L ${centerX - tailBaseHalf} ${height}`,
    `L ${CORNER_OUTSET} ${height}`,
    `L ${CORNER_OUTSET} ${height - CORNER_INSET}`,
    `L ${CORNER_INSET} ${height - CORNER_INSET}`,
    `L ${CORNER_INSET} ${height - CORNER_OUTSET}`,
    `L 0 ${height - CORNER_OUTSET}`,
    `L 0 ${CORNER_OUTSET}`,
    `L ${CORNER_INSET} ${CORNER_OUTSET}`,
    `L ${CORNER_INSET} ${CORNER_INSET}`,
    `L ${CORNER_OUTSET} ${CORNER_INSET}`,
    "Z",
  ].join(" ");
}

const BooChat = ({ message, style, visible = true }: BooChatProps) => {
  const [textSizeCache, setTextSizeCache] = useState<
    Record<string, { height: number; width: number }>
  >({});

  if (!visible || !message) {
    return null;
  }

  const textSize = textSizeCache[message];

  const handleMeasure = (event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout;

    if (!width || !height) {
      return;
    }

    setTextSizeCache((prev) => {
      const currentSize = prev[message];

      if (
        currentSize &&
        currentSize.width === width &&
        currentSize.height === height
      ) {
        return prev;
      }

      return {
        ...prev,
        [message]: { height, width },
      };
    });
  };

  if (!textSize) {
    return (
      <View pointerEvents="none" style={[styles.measureOnly, style]}>
        <Text onLayout={handleMeasure} style={styles.measureText}>
          {message}
        </Text>
      </View>
    );
  }

  const bubbleWidth = Math.max(
    MIN_BUBBLE_WIDTH,
    Math.min(
      MAX_TEXT_WIDTH + HORIZONTAL_PADDING * 2,
      textSize.width + HORIZONTAL_PADDING * 2,
    ),
  );
  const bubbleHeight = Math.max(MIN_BUBBLE_HEIGHT, textSize.height + 18);
  const totalHeight = bubbleHeight + TAIL_STEP_HEIGHT * 3 + STROKE_WIDTH;
  const svgOffset = STROKE_WIDTH / 2;
  const shapeWidth = bubbleWidth - STROKE_WIDTH;
  const shapeHeight = bubbleHeight - STROKE_WIDTH;

  return (
    <View
      style={[styles.wrapper, style, { height: totalHeight, width: bubbleWidth }]}
    >
      <Svg width={bubbleWidth} height={totalHeight} style={StyleSheet.absoluteFill}>
        <G transform={`translate(${svgOffset}, ${svgOffset})`}>
          <Path
            d={pixelBubblePath(shapeWidth, shapeHeight)}
            fill={colors.WHITE_NORMAL}
            stroke={colors.BLACK_NORMAL}
            strokeWidth={STROKE_WIDTH}
          />
        </G>
      </Svg>

      <View pointerEvents="none" style={[styles.textContainer, { height: bubbleHeight, width: bubbleWidth }]}>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "flex-start",
  },
  measureOnly: {
    alignItems: "center",
    justifyContent: "center",
    opacity: 0,
  },
  textContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  message: {
    fontFamily: fonts.BASIC,
    fontSize: 16,
    lineHeight: 20,
    color: colors.BLACK_NORMAL,
    textAlign: "center",
    includeFontPadding: false,
    maxWidth: MAX_TEXT_WIDTH,
  },
  measureText: {
    fontFamily: fonts.BASIC,
    fontSize: 16,
    lineHeight: 20,
    color: colors.BLACK_NORMAL,
    textAlign: "center",
    includeFontPadding: false,
    maxWidth: MAX_TEXT_WIDTH,
  },
});

export default BooChat;
