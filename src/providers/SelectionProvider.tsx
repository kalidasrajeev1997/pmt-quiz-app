import { type ReactNode, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SelectionContext } from "@/hooks/useSelection";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { getAllRecords } from "@/services/db/database";
import type { Country, User } from "@/types/quiz";
import {
  countryFilterService,
  getCountry,
  getUser,
  userFilterService,
} from "@/services/filters.service";

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User["id"] | null>(() => getUser());
  const [country, setCountry] = useState<Country["code"] | null>(() =>
    getCountry(),
  );
  const usersQuery = useQuery({
    queryKey: QUERY_KEYS.USERS,
    queryFn: () => getAllRecords("users"),
  });
  const countriesQuery = useQuery({
    queryKey: QUERY_KEYS.COUNTRIES,
    queryFn: () => getAllRecords("countries"),
  });

  const users = usersQuery.data ?? [];
  const countries = countriesQuery.data ?? [];
  const selectedUser =
    users.find((userIdx) => userIdx.id === user) ?? users[0] ?? null;
  const selectedCountry =
    countries.find((countryIdx) => countryIdx.code === country) ??
    countries[0] ??
    null;
  const isLoading = usersQuery.isPending || countriesQuery.isPending;
  const error =
    usersQuery.isError || countriesQuery.isError
      ? "Users and countries could not be loaded"
      : null;

  function selectUser(userId: User["id"]) {
    userFilterService(userId);
    setUser(userId);
  }

  function selectCountry(countryCode: Country["code"]) {
    countryFilterService(countryCode);
    setCountry(countryCode);
  }

  return (
    <SelectionContext
      value={{
        users,
        countries,
        selectedUser,
        selectedCountry,
        isLoading,
        error,
        selectUser,
        selectCountry,
      }}
    >
      {children}
    </SelectionContext>
  );
}
