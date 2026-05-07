import { colors } from "@/constants/colors";
import React from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  TextStyle,
  View,
} from "react-native";

interface OutlinedTextProps extends Omit<TextProps, "style"> {
  children: React.ReactNode;
  color?: string;
  outlineColor?: string;
  outlineWidth?: number;
  style?: StyleProp<TextStyle>;
}

const OUTLINE_OFFSETS = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
];

const OutlinedText = ({
  children,
  color = colors.WHITE_NORMAL,
  outlineColor = colors.BLACK_NORMAL,
  outlineWidth = 1,
  style,
  ...props
}: OutlinedTextProps) => {
  return (
    <View style={styles.container}>
      {OUTLINE_OFFSETS.map(([x, y]) => (
        <Text
          key={`${x}-${y}`}
          {...props}
          accessible={false}
          style={[
            styles.outlineText,
            style,
            {
              color: outlineColor,
              transform: [
                { translateX: x * outlineWidth },
                { translateY: y * outlineWidth },
              ],
            },
          ]}
        >
          {children}
        </Text>
      ))}
      <Text {...props} style={[style, { color, includeFontPadding: false }]}>
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  outlineText: {
    position: "absolute",
    includeFontPadding: false,
  },
});

export default OutlinedText;
