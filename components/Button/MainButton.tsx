import { colors } from "@/constants/colors";
import { StyleSheet, Text, View } from "react-native";

interface MainButtonProps {
  color: "blue" | "gray";
  size: "S" | "M";
  width?: number;
  height?: number;
}

const MainButton = ({
  color = "blue",
  size = "M",
  width,
  height,
}: MainButtonProps) => {
  return (
    <View
      style={[
        styles.container,
        color === "blue" ? styles.blue : styles.gray,
        (!width && !height && size) === "M" ? styles.sizeM : styles.sizeS,
      ]}
    >
      <Text
        style={[
          color === "blue" ? styles.blueText : styles.grayText,
          (!width && !height && size) === "M"
            ? styles.sizeMText
            : styles.sizeSText,
        ]}
      >
        하이하이
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  sizeMText: {
    fontSize: 32,
  },
  sizeSText: {
    fontSize: 24,
  },
  blue: {
    backgroundColor: colors.GREEN_NORMAL,
  },
  blueText: {
    color: colors.WHITE_NORMAL,
  },
  gray: {
    backgroundColor: colors.GRAY_NORMAL,
  },
  grayText: {
    color: colors.BLACK_NORMAL,
  },
  sizeM: {
    width: 284,
    height: 76,
  },
  sizeS: {
    width: 284,
    height: 60,
  },
});

export default MainButton;
