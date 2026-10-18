import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  const [quizSelection, setQuizSelection] = useState<{
    userId: string | undefined;
    quizId: Quiz["id"] | null;
  }>({ userId: user?.id, quizId: null });
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
    quizSelection.userId === user?.id ? quizSelection.quizId : null;
  const quizzes = quizzesQuery.data ?? [];
  const quizId =
    requestedQuizId !== null &&
    quizzesQuery.isSuccess &&
    !quizzes.some((quiz) => quiz.id === requestedQuizId)
      ? null
      : requestedQuizId;
  const standingsQuery = useQuery({
    queryKey: [
      ...QUERY_KEYS.LEADERBOARD,
      quizId,
      user?.id ?? null,
      user?.country,
      user?.role,
    ],
    queryFn: () => getLeaderboard(quizId, 10, user?.id),
    enabled: hasUser && quizzesQuery.isSuccess,
  });

  return {
    quizId,
    setQuizId: (quizId: Quiz["id"] | null) => {
      setQuizSelection({ userId: user?.id, quizId });
    },
    quizzes,
    leaderboard: standingsQuery.data,
    selectedUser: selection.selectedUser,
    isLoading:
      selection.isLoading || quizzesQuery.isLoading || standingsQuery.isLoading,
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
