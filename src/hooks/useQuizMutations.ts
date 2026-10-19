import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createQuiz, updateQuiz, deleteQuiz } from "@/services/quiz.service";
import { QUERY_KEYS } from "@/lib/queryKeys";
import type { QuizFormValues } from "@/helpers/quizSchema";

export function useQuizMutations() {
  const queryClient = useQueryClient();
  async function invalidateQuizzes() {
    await Promise.all(
      [
        QUERY_KEYS.ADMIN_QUIZZES,
        QUERY_KEYS.QUIZZES,
        QUERY_KEYS.SESSION,
        QUERY_KEYS.LEADERBOARD,
        QUERY_KEYS.LEADERBOARD_QUIZZES,
      ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    );
  }

  const save = useMutation({
    mutationFn: ({ id, data }: { id?: string; data: QuizFormValues }) =>
      id ? updateQuiz(id, data) : createQuiz(data),
    onSuccess: invalidateQuizzes,
  });
  const remove = useMutation({
    mutationFn: deleteQuiz,
    onSuccess: invalidateQuizzes,
  });
  return { save, remove };
}
