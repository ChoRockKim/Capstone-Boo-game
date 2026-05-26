/**
 * @description  픽셀 하트 SVG 안에 숫자를 겹쳐 표시하는 미니게임용 하트 카운트 UI입니다.
 * @depends      assets/icons/heart.svg, constants/colors.ts, constants/fonts.ts
 * @used-by      app/miniGame/catchTheMajor.tsx
 * @side-effects 없음
 */
import HeartIcon from "@/assets/icons/heart.svg";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { StyleSheet, Text, View } from "react-native";

type HeartCountBadgeProps = {
  count: number;
  size?: number;
};

const COUNT_OFFSET_X = 0;
const COUNT_OFFSET_Y = 0;
const COUNT_SIZE_RATIO = 0.58;
const HEART_OFFSET_X = 0;
const HEART_OFFSET_Y = 0;

const HeartCountBadge = ({ count, size = 96 }: HeartCountBadgeProps) => {
  const fontSize = Math.round(size * COUNT_SIZE_RATIO);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.heartLayer,
          {
            transform: [
              { translateX: HEART_OFFSET_X },
              { translateY: HEART_OFFSET_Y },
            ],
          },
        ]}
      >
        <HeartIcon width={size} height={size} />
      </View>
      <View
        pointerEvents="none"
        style={[
          styles.countLayer,
          {
            transform: [
              { translateX: COUNT_OFFSET_X },
              { translateY: COUNT_OFFSET_Y },
            ],
          },
        ]}
      >
        <Text
          style={[
            styles.countText,
            {
              fontSize,
              lineHeight: Math.round(fontSize * 1.04),
            },
          ]}
        >
          {count}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  heartLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  countLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: {
    color: colors.BLACK_NORMAL,
    fontFamily: fonts.BASIC,
    includeFontPadding: false,
    textAlign: "center",
  },
});

export default HeartCountBadge;
