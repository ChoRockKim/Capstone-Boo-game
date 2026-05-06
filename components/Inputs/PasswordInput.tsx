import React from "react";
import { Controller, RegisterOptions, useFormContext } from "react-hook-form";
import { TextInputProps } from "react-native";
import InputField from "./InputField";

interface PasswordInputProps {
  onValidSubmit?: () => void | Promise<void>;
  returnKeyType?: TextInputProps["returnKeyType"];
  rules?: RegisterOptions;
}

const PasswordInput = ({
  onValidSubmit,
  returnKeyType = "next",
  rules,
}: PasswordInputProps) => {
  const { control, handleSubmit } = useFormContext();

  const onSubmit = () => {
    onValidSubmit?.();
  };

  return (
    <Controller
      name="password"
      control={control}
      rules={rules}
      render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
        <InputField
          ref={ref}
          placeholder="비밀번호"
          returnKeyType={returnKeyType}
          value={value}
          onChangeText={onChange}
          onSubmitEditing={() => handleSubmit(onSubmit)()}
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

export default PasswordInput;
