import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useSelection } from "@/hooks/useSelection";
import { QUERY_KEYS } from "@/lib/queryKeys";
import {
  getLeaderboard,
  getLeaderboardQuizzes,
} from "@/services/leaderboard.service";
import type { Quiz } from "@/types/quiz";

export function useLeaderboard() {
  const selection = useSelection();
  const user = selection.selectedUser;

  const search = useSearch({ from: "/leaderboard" });
  const navigate = useNavigate({ from: "/leaderboard" });
  const searchQuizId = search?.quizId;

  const [localSelection, setLocalSelection] = useState<{
    userId: string | undefined;
    quizId: Quiz["id"] | null;
  }>({
    userId: user?.id,
    quizId: searchQuizId ?? null,
  });

  const prevSearchQuizIdRef = useRef(searchQuizId);
  useEffect(() => {
    if (prevSearchQuizIdRef.current !== searchQuizId) {
      prevSearchQuizIdRef.current = searchQuizId;
      setLocalSelection({
        userId: user?.id,
        quizId: searchQuizId ?? null,
      });
    }
  }, [searchQuizId, user?.id]);

  const hasUser = !selection.isLoading && !selection.error && !!user;

  const quizzesQuery = useQuery({
    queryKey: [
      ...QUERY_KEYS.LEADERBOARD_QUIZZES,
      user?.id,
      user?.country,
      user?.role,
    ],
    queryFn: () => getLeaderboardQuizzes(user?.id),
    enabled: hasUser,
  });

  const requestedQuizId =
    searchQuizId !== undefined
      ? searchQuizId
      : localSelection.userId === user?.id
        ? localSelection.quizId
        : null;

  const quizzes = quizzesQuery.data ?? [];
  const isInvalidQuiz =
    requestedQuizId !== null &&
    quizzesQuery.isSuccess &&
    !quizzes.some((quiz) => quiz.id === requestedQuizId);

  const quizId = isInvalidQuiz ? null : requestedQuizId;

  useEffect(() => {
    if (isInvalidQuiz && searchQuizId !== undefined) {
      navigate({
        search: { quizId: undefined },
        replace: true,
      });
    }
  }, [isInvalidQuiz, searchQuizId, navigate]);

  const standingsQuery = useQuery({
    queryKey: [
      ...QUERY_KEYS.LEADERBOARD,
      quizId,
      user?.id ?? null,
      user?.country,
      user?.role,
    ],
    queryFn: async () => {
      const data = await getLeaderboard(quizId, 10, user?.id);
      return {
        ...data,
        fetchedForUserId: user?.id,
        fetchedForCountry: user?.country,
      };
    },
    enabled: hasUser && quizzesQuery.isSuccess,
  });

  // Strict guard: ensure data is fresh and belongs to the currently active user and country.
  // Never show stale data from another user or country.
  const isDataForCurrentSelection =
    standingsQuery.isSuccess &&
    standingsQuery.data?.fetchedForUserId === user?.id &&
    standingsQuery.data?.fetchedForCountry === user?.country;

  const leaderboard = isDataForCurrentSelection
    ? standingsQuery.data
    : undefined;

  const isLoading =
    selection.isLoading ||
    quizzesQuery.isLoading ||
    standingsQuery.isLoading ||
    !isDataForCurrentSelection;

  return {
    quizId,
    setQuizId: (nextQuizId: Quiz["id"] | null) => {
      setLocalSelection({ userId: user?.id, quizId: nextQuizId });
      navigate({
        search: { quizId: nextQuizId ?? undefined },
      });
    },
    quizzes,
    leaderboard,
    selectedUser: selection.selectedUser,
    isLoading,
    isFetching: quizzesQuery.isFetching || standingsQuery.isFetching,
    error:
      selection.error ??
      quizzesQuery.error?.message ??
      standingsQuery.error?.message ??
      null,
    refresh: () => {
      if (!hasUser) return;
      quizzesQuery.refetch();
      standingsQuery.refetch();
    },
  };
}
