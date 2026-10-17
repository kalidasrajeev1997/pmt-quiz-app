import { createContext, useContext } from "react";
import type { Country, User } from "@/types/quiz";

export interface SelectionState {
  users: User[];
  countries: Country[];
  selectedUser: User | null;
  selectedCountry: Country | null;
  isLoading: boolean;
  error: string | null;
}

interface SelectionContextValue extends SelectionState {
  selectUser: (userId: User["id"]) => void;
  selectCountry: (countryCode: Country["code"]) => void;
}

export const SelectionContext = createContext<SelectionContextValue | null>(
  null,
);

export function useSelection() {
  const context = useContext(SelectionContext);

  if (!context) {
    throw new Error("useSelection must be used within a SelectionProvider.");
  }

  return context;
}
