import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

interface InputFieldProps extends TextInputProps {
  error?: string;
}

const InputField = React.forwardRef<TextInput, InputFieldProps>(
  ({ error, ...props }, ref) => {
  return (
    <>
      <TextInput
        ref={ref}
        style={[styles.inputText, error && styles.errorInput]}
        placeholderTextColor={colors.WHITE_DARK}
        autoCapitalize="none"
        spellCheck={false}
        autoCorrect={false}
        multiline={false}
        {...props}
      />
      {error && (
        <View style={{ marginTop: 2 }}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </>
  );
  },
);

InputField.displayName = "InputField";

const styles = StyleSheet.create({
  inputText: {
    backgroundColor: colors.SILVER_LIGHT_HOVER,
    height: 40,
    borderRadius: 12,
    marginTop: 10,
    fontFamily: fonts.BASIC,
    paddingVertical: 6,
    paddingHorizontal: 12,
    fontSize: 20,
  },
  errorInput: {
    borderStyle: "dotted",
    borderWidth: 2,
    borderColor: colors.DANGER,
    backgroundColor: colors.WHITE_NORMAL,
  },
  errorText: {
    fontSize: 12,
    fontFamily: fonts.BASIC,
    color: colors.DANGER,
  },
});

export default InputField;
