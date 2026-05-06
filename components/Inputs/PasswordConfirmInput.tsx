import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Keyboard, TextInputProps } from "react-native";
import InputField from "./InputField";

interface InputTextProps extends TextInputProps {}

const PasswordConfirmInput = ({ placeholder }: InputTextProps) => {
  const { clearErrors, control, getValues, setFocus, trigger } =
    useFormContext();

  const submitIfValid = async () => {
    const isValid = await trigger("passwordConfirm", { shouldFocus: true });
    if (!isValid) return;

    clearErrors("name");
    setFocus("name");
  };

  return (
    <Controller
      name="passwordConfirm"
      control={control}
      rules={{
        required: "비밀번호를 다시 입력해주세요.",
        validate: (v) =>
          v === getValues("password") || "비밀번호가 일치하지 않습니다",
      }}
      render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
        <InputField
          ref={ref}
          placeholder="비밀번호 확인"
          returnKeyType="next"
          value={value}
          onChangeText={onChange}
          onSubmitEditing={submitIfValid}
          submitBehavior="submit"
          autoComplete="off"
          importantForAutofill="no"
          secureTextEntry
          textContentType="none"
          error={error?.message}
        />
      )}
    />
  );
};

export default PasswordConfirmInput;
