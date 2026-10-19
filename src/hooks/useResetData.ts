import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resetDataToSeed } from "@/services/quiz.service";

export function useResetData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resetDataToSeed,
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
  });
}
