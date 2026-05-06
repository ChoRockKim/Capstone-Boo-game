import { User } from "@/types";
import React, { createContext, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import RegisterComplete from "./RegisterComplete";
import RegisterDetail from "./RegisterDetail";
import RegisterEmail from "./RegisterEmail";
import RegisterEmailConfirm from "./RegisterEmailConfirm";

interface RegisterContainerProps {
  isRegisterOpen: boolean;
  setIsRegisterOpen: (value: boolean) => void;
  isLoginOpen: boolean;
  setIsLoginOpen: (value: boolean) => void;
}

type StepContextValue = {
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
};

export const StepContext = createContext<StepContextValue>({
  step: 0,
  setStep: () => {},
});

const RegisterContainer = ({
  setIsRegisterOpen,
  isRegisterOpen,
  isLoginOpen,
  setIsLoginOpen,
}: RegisterContainerProps) => {
  const [step, setStep] = useState(0);
  const registerForm = useForm<User>({
    defaultValues: {
      email: "",
      emailConfirm: "",
      password: "",
      passwordConfirm: "",
      studentId: "",
      name: "",
      nickName: "",
      department: "",
    },
    reValidateMode: "onChange",
    shouldFocusError: false,
  });
  // const email = registerForm.watch("email");
  // console.log(email);
  return (
    <FormProvider {...registerForm}>
      <StepContext.Provider value={{ step, setStep }}>
        {step === 0 && (
          <RegisterEmail
            setStep={setStep}
            setIsRegisterOpen={setIsRegisterOpen}
          />
        )}
        {step === 1 && (
          <RegisterEmailConfirm setIsRegisterOpen={setIsRegisterOpen} />
        )}
        {step === 2 && <RegisterDetail setIsRegisterOpen={setIsRegisterOpen} />}
        {step === 3 && (
          <RegisterComplete
            setIsRegisterOpen={setIsRegisterOpen}
            setIsLoginOpen={setIsLoginOpen}
          />
        )}
      </StepContext.Provider>
    </FormProvider>
  );
};

export default RegisterContainer;
