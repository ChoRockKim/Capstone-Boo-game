import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import InputField from "./InputField";

const HANGUL_JAMO_REGEX = /[ㄱ-ㅎㅏ-ㅣ]/;

const NameInput = () => {
  const { clearErrors, control, setFocus, trigger } = useFormContext();

  const focusBooNameIfValid = async () => {
    const isValid = await trigger("name", { shouldFocus: true });
    if (!isValid) return;

    clearErrors("nickName");
    setFocus("nickName");
  };

  return (
    <Controller
      name="name"
      control={control}
      rules={{
        required: "이름을 입력해주세요.",
        validate: (v) => {
          const name = String(v).trim();

          if (name.length < 2) return "이름은 2자 이상 입력해주세요";
          if (HANGUL_JAMO_REGEX.test(name)) {
            return "자음이나 모음만 입력할 수 없어요";
          }

          return true;
        },
      }}
      render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
        <InputField
          ref={ref}
          placeholder="이름(실명)"
          returnKeyType="next"
          value={value}
          onChangeText={onChange}
          onSubmitEditing={focusBooNameIfValid}
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

export default NameInput;
