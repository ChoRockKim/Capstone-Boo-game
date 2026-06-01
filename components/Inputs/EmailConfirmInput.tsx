import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import InputField from "./InputField";

type EmailConfirmInputProps = {
  onValidSubmit?: () => void | Promise<void>;
};

const EmailConfirmInput = ({ onValidSubmit }: EmailConfirmInputProps) => {
  const { control, handleSubmit } = useFormContext();

  const onSubmit = () => {
    onValidSubmit?.();
  };

  return (
    <Controller
      name="emailConfirm"
      control={control}
      rules={{
        required: "인증번호를 입력해주세요.",
      }}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <InputField
          placeholder="인증번호 입력"
          returnKeyType="done"
          value={value}
          inputMode="decimal"
          onChangeText={onChange}
          onSubmitEditing={() => handleSubmit(onSubmit)()}
          error={error?.message}
        />
      )}
    />
  );
};

export default EmailConfirmInput;
