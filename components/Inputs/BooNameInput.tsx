import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Keyboard } from "react-native";
import InputField from "./InputField";

const HANGUL_JAMO_REGEX = /[ㄱ-ㅎㅏ-ㅣ]/;

const BooNameInput = () => {
  const { control, handleSubmit } = useFormContext();
  const onSubmit = () => {
    Keyboard.dismiss();
  };

  return (
    <Controller
      name="nickName"
      control={control}
      rules={{
        required: "부 이름을 입력해주세요.",
        validate: (v) => {
          const booName = String(v).trim();

          if (booName.length < 1) return "1자 이상 입력해주세요";
          if (HANGUL_JAMO_REGEX.test(booName)) {
            return "자음이나 모음만 입력할 수 없어요";
          }

          return true;
        },
      }}
      render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
        <InputField
          ref={ref}
          placeholder="부 이름"
          returnKeyType="send"
          value={value}
          onChangeText={onChange}
          onSubmitEditing={() => handleSubmit(onSubmit)()}
          submitBehavior="submit"
          autoComplete="off"
          importantForAutofill="no"
          textContentType="none"
          error={error?.message}
        />
      )}
    />
  );
};

export default BooNameInput;
