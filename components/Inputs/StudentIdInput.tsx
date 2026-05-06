import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import InputField from "./InputField";

const StudentIdInput = () => {
  const { clearErrors, control, setFocus, trigger } = useFormContext();

  const focusPasswordIfValid = async () => {
    const isValid = await trigger("studentId", { shouldFocus: true });
    if (!isValid) return;

    clearErrors("password");
    setFocus("password");
  };

  return (
    <Controller
      name="studentId"
      control={control}
      rules={{
        required: "학번을 입력해주세요",
        validate: (v) => /^\d{9}$/.test(String(v)) || "잘못된 학번입니다",
      }}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <InputField
          placeholder="학번 입력"
          returnKeyType="next"
          value={value}
          inputMode="decimal"
          maxLength={9}
          onChangeText={onChange}
          onSubmitEditing={() => {
            focusPasswordIfValid();
          }}
          submitBehavior="submit"
          error={error?.message}
        />
      )}
    />
  );
};

export default StudentIdInput;
