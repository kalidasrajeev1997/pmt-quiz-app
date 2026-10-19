import { type ReactNode, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User["id"] | null>(() => getUser());
  const [country, setCountry] = useState<Country["code"] | null>(() =>
    getCountry(),
  );
  const countriesQuery = useQuery({
    queryKey: QUERY_KEYS.COUNTRIES,
    queryFn: () => getAllRecords("countries"),
  });
  const usersQuery = useQuery({
    queryKey: QUERY_KEYS.USERS,
    queryFn: () => getAllRecords("users"),
    enabled: !!countriesQuery.data,
  });

  const countries = countriesQuery.data ?? [];
  const selectedCountry =
    countries.find((countryIdx) => countryIdx.code === country) ??
    countries[0] ??
    null;
  const activeCountry = selectedCountry?.code;
  const users =
    usersQuery.data?.filter((user) => user.country === activeCountry) ?? [];
  const selectedUser =
    users.find((userIdx) => userIdx.id === user) ?? users[0] ?? null;
  const isLoading =
    countriesQuery.isLoading ||
    (countriesQuery.isSuccess && usersQuery.isLoading);
  const error =
    usersQuery.isError || countriesQuery.isError
      ? "Users and countries could not be loaded"
      : null;

  function selectUser(userId: User["id"]) {
    userFilterService(userId);
    setUser(userId);
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LEADERBOARD });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LEADERBOARD_QUIZZES });
  }

  function selectCountry(countryCode: Country["code"]) {
    countryFilterService(countryCode);
    setCountry(countryCode);
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LEADERBOARD });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LEADERBOARD_QUIZZES });
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
