import React, { useContext } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { StepContext } from "../Register/RegisterContainer";
import InputField from "./InputField";

const EmailConfirmInput = () => {
  const { control, handleSubmit } = useFormContext();
  const { setStep } = useContext(StepContext);

  const onSubmit = () => {
    //인증번호 제대로 확인하는 로직
    setStep(2);
  };

  return (
    <Controller
      name="emailConfirm"
      control={control}
      rules={{
        required: "인증번호를 입력해주세요.",
        // DB에 저장된 인증번호 === 유저가 입력한 인증번호 확인하는 로직
        validate: (v) => true || "잘못된 인증번호입니다.",
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
