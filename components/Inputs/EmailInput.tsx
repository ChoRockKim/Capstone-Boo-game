import React from "react";
import { Controller, RegisterOptions, useFormContext } from "react-hook-form";
import { TextInputProps } from "react-native";
import InputField from "./InputField";

interface EmailInputProps {
  onValidSubmit?: () => void | Promise<void>;
  returnKeyType?: TextInputProps["returnKeyType"];
  rules?: RegisterOptions;
}

const EmailInput = ({
  onValidSubmit,
  returnKeyType = "done",
  rules,
}: EmailInputProps) => {
  const { control, handleSubmit } = useFormContext();

  const onSubmit = () => {
    onValidSubmit?.();
  };

  return (
    <Controller
      name="email"
      control={control}
      rules={rules}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <InputField
          placeholder="ex) boo@hufs.ac.kr"
          returnKeyType={returnKeyType}
          value={value}
          inputMode="email"
          onChangeText={onChange}
          onSubmitEditing={() => handleSubmit(onSubmit)()}
          error={error?.message}
        />
      )}
    />
  );
};

export default EmailInput;
