import type { User, Country } from "@/types/quiz";
import { setLocalStorage, getLocalStorage } from "@/lib/utils";

export const userFilterService = (user: User["id"]) => {
  setLocalStorage("selectedUser", user);
};

export const countryFilterService = (countryCode: Country["code"]) => {
  setLocalStorage("selectedCountry", countryCode);
};

export const getUser = (): User["id"] | null => {
  const user = getLocalStorage("selectedUser");
  return user ? user : null;
};

export const getCountry = (): Country["code"] | null => {
  const country = getLocalStorage("selectedCountry");
  return country ? country : null;
};
