import { useLocation, useNavigate } from "@tanstack/react-router";
import {
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useSelection } from "@/hooks/useSelection";
import { QUERY_KEYS } from "@/lib/queryKeys";
import {
  getQuiz,
  restartEditedAttempt as restartEditedAttemptService,
  saveDraft as saveDraftService,
  startOrResumeAttempt,
  submitAnswer as submitAnswerService,
} from "@/services/quiz.service";
import type { QuizSession, PublicQuiz, QuizAttempt } from "@/types/quiz";
import type { AnswerAction } from "@/components/quizzes/questions/QuestionForm";
import { quizStatuses, attemptSteps } from "@/helpers/constants";

type QuizAttemptAction =
  | { type: "start"; retake: boolean }
  | { type: "restart-edited" }
  | AnswerAction;

export interface UseQuizAttemptReturn {
  session: QuizSession | undefined;
  quiz: PublicQuiz | undefined;
  attempt: QuizAttempt | null | undefined;
  currentStep: number;
  showOverview: boolean;
  isAllowedRetake: boolean;
  isLoading: boolean;
  isPending: boolean;
  selectionLoading: boolean;
  selectionError: string | null;
  hasUser: boolean;
  isSessionError: boolean;
  sessionError: Error | null;
  saveFailed: boolean;
  error: Error | null;
  startQuiz: (retake?: boolean) => void;
  handleCommand: (command: AnswerAction) => void;
  retakeQuiz: () => void;
  restartEditedAttempt: () => void;
  refetchSession: () => void;
}

/**
 * Custom hook managing the complete lifecycle of a quiz attempt.
 *
 * Encapsulates:
 * - Session data fetching and in-progress polling
 * - State mutations (starting attempt, saving drafts, submitting answers)
 * - Cache invalidation and optimistic synchronization with React Query
 * - Route hash navigation for retakes
 * - Stepper progress computation
 */
export function useQuizAttempt(quizId: string): UseQuizAttemptReturn {
  const {
    selectedUser,
    isLoading: selectionLoading,
    error: selectionError,
  } = useSelection();

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const hash = useLocation({ select: (location) => location.hash });

  const userId = selectedUser?.id ?? "";
  const hasUser = !!userId;

  const mutationKey = [...QUERY_KEYS.SESSION_ACTION, quizId, userId];
  const pendingActions = useIsMutating({ mutationKey });

  const sessionQuery = useQuery({
    queryKey: [...QUERY_KEYS.SESSION, quizId, userId],
    queryFn: async () => await getQuiz(quizId, userId),
    enabled: hasUser,
    retry: false,
    refetchOnWindowFocus: "always",
    refetchInterval: (query) => {
      const attemptStatus = query.state.data?.attempt?.status;
      return attemptStatus === quizStatuses.IN_PROGRESS && !query.state.error
        ? 1000
        : false;
    },
    refetchIntervalInBackground: true,
  });

  const mutation = useMutation({
    mutationKey,
    scope: { id: `session-${quizId}-${userId}` },
    mutationFn: async (action: QuizAttemptAction) => {
      if (action.type === "start") {
        await startOrResumeAttempt(quizId, userId);
      } else if (action.type === "restart-edited") {
        await restartEditedAttemptService(quizId, userId);
      } else if (action.type === "draft") {
        await saveDraftService(
          action.attemptId,
          action.questionId,
          action.selectedOptionIds,
        );
      } else {
        await submitAnswerService(
          action.attemptId,
          action.questionId,
          action.selectedOptionIds,
        );
      }
      return await getQuiz(quizId, userId);
    },
    onSuccess: (data: QuizSession, action) => {
      // Synchronously update session query cache
      queryClient.setQueryData([...QUERY_KEYS.SESSION, quizId, userId], data);

      // Invalidate quiz list cards and leaderboard if quiz state progressed
      if (action.type !== "draft") {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.QUIZZES });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LEADERBOARD });
      }

      // Clear #retake hash upon start
      if (action.type === "start" || action.type === "restart-edited") {
        navigate({
          to: "/quiz/$id",
          params: { id: quizId },
          hash: "",
          replace: true,
        });
      }
    },
  });

  // Derived state calculations
  const session = sessionQuery.data;
  const quiz = session?.quiz;
  const attempt = session?.attempt;

  const isAllowedRetake =
    attempt?.status === quizStatuses.COMPLETED &&
    hash === "retake" &&
    quiz?.retakesAllowed === true;

  const showOverview = !attempt || isAllowedRetake;

  const currentStep = showOverview
    ? attemptSteps.OVERVIEW
    : attempt?.status === quizStatuses.COMPLETED
      ? attemptSteps.COMPLETED
      : attemptSteps.IN_PROGRESS;

  const isPending = pendingActions > 0;
  const isLoading = selectionLoading || (hasUser && sessionQuery.isPending);
  const error =
    (sessionQuery.error as Error | null) ?? (mutation.error as Error | null);

  // Action dispatches
  function startQuiz(retake = false) {
    mutation.mutate({ type: "start", retake: retake || !!attempt });
  }

  function handleCommand(command: AnswerAction) {
    mutation.mutate(command);
  }

  function retakeQuiz() {
    navigate({
      to: "/quiz/$id",
      params: { id: quizId },
      hash: "retake",
    });
  }

  function restartEditedAttempt() {
    mutation.mutate({ type: "restart-edited" });
  }

  function refetchSession() {
    sessionQuery.refetch();
  }

  return {
    session,
    quiz,
    attempt,
    currentStep,
    showOverview,
    isAllowedRetake,
    isLoading,
    isPending,
    selectionLoading,
    selectionError,
    hasUser,
    isSessionError: sessionQuery.isError,
    sessionError: (sessionQuery.error as Error | null) ?? null,
    saveFailed: mutation.isError,
    error,
    startQuiz,
    handleCommand,
    retakeQuiz,
    restartEditedAttempt,
    refetchSession,
  };
}
