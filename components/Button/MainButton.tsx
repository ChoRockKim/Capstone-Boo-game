import { colors } from "@/constants/colors";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { G, Path } from "react-native-svg";

interface MainButtonProps {
  color?: "blue" | "gray";
  size?: "S" | "M";
  width?: number;
  height?: number;
  label?: string;
  onPress?: () => void;
}

const palette = {
  blue: {
    normal: {
      outer: colors.BLACK_NORMAL,
      gap: colors.GREEN_NORMAL_ACTIVE,
      inner: colors.GREEN_LIGHT_HOVER,
      bg: colors.GREEN_NORMAL,
      text: colors.WHITE_NORMAL,
    },
    active: {
      outer: colors.BLACK_NORMAL,
      gap: colors.NAVY_NORMAL_ACTIVE,
      inner: colors.GREEN_LIGHT_HOVER,
      bg: colors.NAVY_NORMAL,
      text: colors.WHITE_NORMAL,
    },
  },
  gray: {
    normal: {
      outer: colors.BLACK_NORMAL,
      gap: colors.GRAY_NORMAL_ACTIVE,
      inner: colors.GREEN_LIGHT_HOVER,
      bg: colors.GRAY_NORMAL,
      text: colors.BLACK_NORMAL,
    },
    active: {
      outer: colors.BLACK_NORMAL,
      gap: colors.SILVER_LIGHT_ACTIVE,
      inner: colors.SILVER_NORMAL_ACTIVE,
      bg: colors.GRAY_NORMAL_ACTIVE,
      text: colors.WHITE_NORMAL,
    },
  },
};

// border widths & gap
const OUTER_W = 3;
const GAP = 4;
const INNER_W = 2;

// pixel corner step sizes
const S1 = 4; // inner step
const S2 = 8; // outer step

const SIZES = {
  M: { width: 284, height: 76, fontSize: 28, lineHeight: 34 },
  S: { width: 284, height: 60, fontSize: 20, lineHeight: 26 },
};

// draws a rectangle with 2-step pixel corners
function pixelPath(w: number, h: number): string {
  return [
    `M ${S2} 0`,
    `L ${w - S2} 0`,
    `L ${w - S2} ${S1}`,
    `L ${w - S1} ${S1}`,
    `L ${w - S1} ${S2}`,
    `L ${w} ${S2}`,
    `L ${w} ${h - S2}`,
    `L ${w - S1} ${h - S2}`,
    `L ${w - S1} ${h - S1}`,
    `L ${w - S2} ${h - S1}`,
    `L ${w - S2} ${h}`,
    `L ${S2} ${h}`,
    `L ${S2} ${h - S1}`,
    `L ${S1} ${h - S1}`,
    `L ${S1} ${h - S2}`,
    `L 0 ${h - S2}`,
    `L 0 ${S2}`,
    `L ${S1} ${S2}`,
    `L ${S1} ${S1}`,
    `L ${S2} ${S1}`,
    "Z",
  ].join(" ");
}

const MainButton = ({
  color = "blue",
  size = "M",
  width,
  height,
  label = "입력하세요",
  onPress,
}: MainButtonProps) => {
  const defaults = SIZES[size];
  const W = width ?? defaults.width;
  const H = height ?? defaults.height;
  const { fontSize, lineHeight } = defaults;

  // outer path: centered stroke sits flush at the SVG canvas edge
  const outerOff = OUTER_W / 2;
  const outerW = W - OUTER_W;
  const outerH = H - OUTER_W;

  // inner path: inset past outer stroke + gap + half inner stroke
  const innerOff = OUTER_W + GAP + INNER_W / 2;
  const innerW = W - 2 * innerOff;
  const innerH = H - 2 * innerOff;

  return (
    <Pressable onPress={onPress} style={{ width: W, height: H }}>
      {({ pressed }) => {
        const p = pressed ? palette[color].active : palette[color].normal;
        return (
          <View style={{ width: W, height: H }}>
            <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
              {/* outer border + gap fill */}
              <G transform={`translate(${outerOff}, ${outerOff})`}>
                <Path
                  d={pixelPath(outerW, outerH)}
                  fill={p.gap}
                  stroke={p.outer}
                  strokeWidth={OUTER_W}
                />
              </G>
              {/* inner border + content fill */}
              <G transform={`translate(${innerOff}, ${innerOff})`}>
                <Path
                  d={pixelPath(innerW, innerH)}
                  fill={p.bg}
                  stroke={p.inner}
                  strokeWidth={INNER_W}
                />
              </G>
            </Svg>
            <View style={[StyleSheet.absoluteFill, styles.textContainer]}>
              <Text
                style={[styles.label, { color: p.text, fontSize, lineHeight }]}
              >
                {label}
              </Text>
            </View>
          </View>
        );
      }}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  textContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: "NeoDunggeunmo",
    includeFontPadding: false,
  },
});

export default MainButton;
