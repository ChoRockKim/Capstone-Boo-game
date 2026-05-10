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
  maxTextWidth?: number;
  message: string;
  scale?: number;
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

function pixelBubblePath(
  width: number,
  height: number,
  scale: number,
): string {
  const cornerInset = CORNER_INSET * scale;
  const cornerOutset = CORNER_OUTSET * scale;
  const tailBaseWidth = TAIL_BASE_WIDTH * scale;
  const tailMidWidth = TAIL_MID_WIDTH * scale;
  const tailTipWidth = TAIL_TIP_WIDTH * scale;
  const tailStepHeight = TAIL_STEP_HEIGHT * scale;
  const centerX = width / 2;
  const tailBaseHalf = tailBaseWidth / 2;
  const tailMidHalf = tailMidWidth / 2;
  const tailTipHalf = tailTipWidth / 2;
  const tailMidY = height + tailStepHeight;
  const tailBottomY = height + tailStepHeight * 2;

  return [
    `M ${cornerOutset} 0`,
    `L ${width - cornerOutset} 0`,
    `L ${width - cornerOutset} ${cornerInset}`,
    `L ${width - cornerInset} ${cornerInset}`,
    `L ${width - cornerInset} ${cornerOutset}`,
    `L ${width} ${cornerOutset}`,
    `L ${width} ${height - cornerOutset}`,
    `L ${width - cornerInset} ${height - cornerOutset}`,
    `L ${width - cornerInset} ${height - cornerInset}`,
    `L ${width - cornerOutset} ${height - cornerInset}`,
    `L ${width - cornerOutset} ${height}`,
    `L ${centerX + tailBaseHalf} ${height}`,
    `L ${centerX + tailBaseHalf} ${tailMidY}`,
    `L ${centerX + tailMidHalf} ${tailMidY}`,
    `L ${centerX + tailMidHalf} ${tailBottomY}`,
    `L ${centerX + tailTipHalf} ${tailBottomY}`,
    `L ${centerX + tailTipHalf} ${tailBottomY + tailStepHeight}`,
    `L ${centerX - tailTipHalf} ${tailBottomY + tailStepHeight}`,
    `L ${centerX - tailTipHalf} ${tailBottomY}`,
    `L ${centerX - tailMidHalf} ${tailBottomY}`,
    `L ${centerX - tailMidHalf} ${tailMidY}`,
    `L ${centerX - tailBaseHalf} ${tailMidY}`,
    `L ${centerX - tailBaseHalf} ${height}`,
    `L ${cornerOutset} ${height}`,
    `L ${cornerOutset} ${height - cornerInset}`,
    `L ${cornerInset} ${height - cornerInset}`,
    `L ${cornerInset} ${height - cornerOutset}`,
    `L 0 ${height - cornerOutset}`,
    `L 0 ${cornerOutset}`,
    `L ${cornerInset} ${cornerOutset}`,
    `L ${cornerInset} ${cornerInset}`,
    `L ${cornerOutset} ${cornerInset}`,
    "Z",
  ].join(" ");
}

const BooChat = ({
  maxTextWidth: maxTextWidthProp = MAX_TEXT_WIDTH,
  message,
  scale = 1,
  style,
  visible = true,
}: BooChatProps) => {
  const [textSizeCache, setTextSizeCache] = useState<
    Record<string, { height: number; width: number }>
  >({});

  if (!visible || !message) {
    return null;
  }

  const textSizeKey = `${scale}:${maxTextWidthProp}:${message}`;
  const textSize = textSizeCache[textSizeKey];
  const strokeWidth = STROKE_WIDTH * scale;
  const horizontalPadding = HORIZONTAL_PADDING * scale;
  const maxTextWidth = maxTextWidthProp * scale;
  const minBubbleWidth = MIN_BUBBLE_WIDTH * scale;
  const minBubbleHeight = MIN_BUBBLE_HEIGHT * scale;
  const tailStepHeight = TAIL_STEP_HEIGHT * scale;
  const textExtraHeight = 18 * scale;
  const textStyle = [
    styles.message,
    {
      fontSize: 16 * scale,
      lineHeight: 20 * scale,
      maxWidth: maxTextWidth,
    },
  ];

  const handleMeasure = (event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout;

    if (!width || !height) {
      return;
    }

    setTextSizeCache((prev) => {
      const currentSize = prev[textSizeKey];

      if (
        currentSize &&
        currentSize.width === width &&
        currentSize.height === height
      ) {
        return prev;
      }

      return {
        ...prev,
        [textSizeKey]: { height, width },
      };
    });
  };

  if (!textSize) {
    return (
      <View pointerEvents="none" style={[styles.measureOnly, style]}>
        <Text onLayout={handleMeasure} style={textStyle}>
          {message}
        </Text>
      </View>
    );
  }

  const bubbleWidth = Math.max(
    minBubbleWidth,
    Math.min(
      maxTextWidth + horizontalPadding * 2,
      textSize.width + horizontalPadding * 2,
    ),
  );
  const bubbleHeight = Math.max(
    minBubbleHeight,
    textSize.height + textExtraHeight,
  );
  const totalHeight = bubbleHeight + tailStepHeight * 3 + strokeWidth;
  const svgOffset = strokeWidth / 2;
  const shapeWidth = bubbleWidth - strokeWidth;
  const shapeHeight = bubbleHeight - strokeWidth;

  return (
    <View
      style={[
        styles.wrapper,
        style,
        { height: totalHeight, width: bubbleWidth },
      ]}
    >
      <Svg
        width={bubbleWidth}
        height={totalHeight}
        style={StyleSheet.absoluteFill}
      >
        <G transform={`translate(${svgOffset}, ${svgOffset})`}>
          <Path
            d={pixelBubblePath(shapeWidth, shapeHeight, scale)}
            fill={colors.WHITE_NORMAL}
            stroke={colors.BLACK_NORMAL}
            strokeWidth={strokeWidth}
          />
        </G>
      </Svg>

      <View
        pointerEvents="none"
        style={[
          styles.textContainer,
          {
            height: bubbleHeight,
            paddingHorizontal: horizontalPadding,
            width: bubbleWidth,
          },
        ]}
      >
        <Text style={textStyle}>{message}</Text>
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
  },
  message: {
    fontFamily: fonts.BASIC,
    color: colors.BLACK_NORMAL,
    textAlign: "center",
    includeFontPadding: false,
  },
});

export default BooChat;
