import React, { createContext } from "react";

export type StepContextValue = {
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
};

export const StepContext = createContext<StepContextValue>({
  step: 0,
  setStep: () => {},
});
