import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { playSoundEffect } from "@/utils/soundEffects";
import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface QuizAnswerButtonProps {
  label: string;
  onPress: () => void;
  selected: boolean;
  symbol?: "check" | "x";
  variant?: "choice" | "ox";
}

function QuizAnswerButton({
  label,
  onPress,
  selected,
  symbol,
  variant = "choice",
}: QuizAnswerButtonProps) {
  const choiceLabelStyle =
    variant !== "choice"
      ? null
      : label.length >= 38
        ? styles.choiceLabelCompact
        : label.length >= 22
          ? styles.choiceLabelMedium
          : styles.choiceLabel;

  const handlePress = () => {
    playSoundEffect("basicClick");
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        variant === "ox" ? styles.oxCard : styles.choiceCard,
        selected && styles.selectedCard,
        pressed && styles.pressedCard,
      ]}
    >
      <View
        style={[
          styles.content,
          variant === "ox" ? styles.oxContent : styles.choiceContent,
        ]}
      >
        {symbol ? (
          <Feather
            name={symbol}
            size={variant === "ox" ? 54 : 20}
            color={colors.BLACK_NORMAL}
          />
        ) : null}
        <Text
          style={[
            styles.label,
            variant === "ox" ? styles.oxLabel : choiceLabelStyle,
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.GOLD_NORMAL,
    backgroundColor: colors.WHITE_NORMAL,
  },
  selectedCard: {
    borderColor: colors.BLACK_NORMAL,
    backgroundColor: colors.GOLD_LIGHT_ACTIVE,
  },
  pressedCard: {
    backgroundColor: colors.SILVER_LIGHT_HOVER,
  },
  choiceCard: {
    minHeight: 68,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  oxCard: {
    flex: 1,
    minHeight: 160,
    paddingVertical: 24,
    paddingHorizontal: 12,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  choiceContent: {
    minHeight: 38,
  },
  oxContent: {
    flex: 1,
    gap: 18,
  },
  label: {
    fontFamily: fonts.BASIC,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  choiceLabel: {
    fontSize: 20,
    lineHeight: 28,
    textAlign: "center",
  },
  choiceLabelMedium: {
    fontSize: 18,
    lineHeight: 24,
    textAlign: "center",
  },
  choiceLabelCompact: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
  },
  oxLabel: {
    fontSize: 22,
    lineHeight: 30,
    textAlign: "center",
  },
});

export default QuizAnswerButton;
