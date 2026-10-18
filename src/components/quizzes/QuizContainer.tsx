import { useLocation, useNavigate } from "@tanstack/react-router";
import {
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ChartColumn, ClipboardList, ListChecks } from "lucide-react";
import { Stepper } from "@/components/ui/stepper";
import { useSelection } from "@/hooks/useSelection";
import { QUERY_KEYS } from "@/lib/queryKeys";
import {
  getQuiz,
  saveDraft,
  startOrResumeAttempt,
  submitAnswer,
} from "@/services/quiz.service";
import type { QuizSession } from "@/types/quiz";
import QuestionForm, { type AnswerAction } from "./questions/QuestionForm";
import {
  QuizLoading,
  QuizSaveError,
  QuizSelectionRequired,
  QuizUnavailable,
} from "./QuizFeedback";
import QuizHomeLink from "./QuizHomeLink";
import QuizOverview from "./overview/QuizOverview";
import QuizResults from "./result/QuizResults";
import { attemptSteps } from "@/helpers/constants";

const steps = [
  { label: "Overview", icon: ClipboardList },
  { label: "Questions", icon: ListChecks },
  { label: "Results", icon: ChartColumn },
];

type Action = { type: "start"; retake: boolean } | AnswerAction;

export default function QuizAttend({ quizId }: { quizId: string }) {
  const {
    selectedUser,
    isLoading: selectionLoading,
    error: selectionError,
  } = useSelection();

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const hash = useLocation({ select: (location) => location.hash });
  const userId = selectedUser?.id ?? "";
  const mutationKey = [...QUERY_KEYS.SESSION_ACTION, quizId, userId];
  const pendingActions = useIsMutating({ mutationKey });

  const session = useQuery({
    queryKey: [...QUERY_KEYS.SESSION, quizId, userId],
    queryFn: async () => await getQuiz(quizId, userId),
    enabled: !!userId,
    retry: false,
    refetchOnWindowFocus: "always",
    refetchInterval: (query) => {
      const attemptStatus = query.state.data?.attempt?.status;
      return attemptStatus === "in_progress" && !query.state.error
        ? 1000
        : false;
    },
    refetchIntervalInBackground: true,
  });

  const mutation = useMutation({
    mutationKey,
    scope: { id: `session-${quizId}-${userId}` },
    mutationFn: async (action: Action) => {
      if (action.type === "start") {
        await startOrResumeAttempt(quizId, userId);
      } else if (action.type === "draft") {
        await saveDraft(
          action.attemptId,
          action.questionId,
          action.selectedOptionIds,
        );
      } else {
        await submitAnswer(
          action.attemptId,
          action.questionId,
          action.selectedOptionIds,
        );
      }
      return await getQuiz(quizId, userId);
    },
    onSuccess: (data: QuizSession, action) => {
      queryClient.setQueryData([...QUERY_KEYS.SESSION, quizId, userId], data);
      if (action.type !== "draft")
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.QUIZZES });
      if (action.type === "start")
        navigate({
          to: "/quiz/$id",
          params: { id: quizId },
          hash: "",
          replace: true,
        });
    },
  });

  const data = session.data;
  const attempt = data?.attempt;
  const isAllowedRetake =
    attempt?.status === "completed" &&
    hash === "retake" &&
    data?.quiz.retakesAllowed === true;
  const showOverview = !attempt || isAllowedRetake;

  const currentStep = showOverview
    ? attemptSteps.Overview
    : attempt?.status === "completed"
      ? attemptSteps.Completed
      : attemptSteps.InProgress;

  const error = session.error ?? mutation.error;
  const pending = pendingActions > 0;

  function renderAttempt(session: QuizSession) {
    const { quiz, attempt } = session;

    if (showOverview) {
      return (
        <QuizOverview
          quiz={quiz}
          retake={!!attempt}
          pending={pending}
          onStart={() => mutation.mutate({ type: "start", retake: !!attempt })}
        />
      );
    }

    if (attempt?.status === "in_progress") {
      return (
        <QuestionForm
          key={`${attempt.id}-${attempt.currentQuestionIndex}`}
          quiz={quiz}
          attempt={attempt}
          pending={pending}
          saveFailed={mutation.isError}
          onCommand={(command) => mutation.mutate(command)}
        />
      );
    }

    if (attempt?.status === "completed") {
      return (
        <QuizResults
          quiz={quiz}
          attempt={attempt}
          onRetake={() =>
            navigate({
              to: "/quiz/$id",
              params: { id: quizId },
              hash: "retake",
            })
          }
        />
      );
    }

    return null;
  }

  function renderContent() {
    if (selectionLoading || (userId && session.isPending)) {
      return <QuizLoading />;
    }

    if (selectionError || !userId) {
      return <QuizSelectionRequired error={selectionError} />;
    }

    if (session.isError) {
      return (
        <QuizUnavailable
          error={session.error}
          onRetry={() => session.refetch()}
        />
      );
    }

    if (!data) return null;

    return (
      <div className="min-h-full px-6 space-y-2 sm:space-y-9 pt-8 bg-[#efefef45]">
        <Stepper steps={steps} currentStep={currentStep} />
        {renderAttempt(data)}
        {error && <QuizSaveError error={error} />}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 w-full flex-col overflow-hidden tracking-normal">
      <div className="sticky top-0 z-10 shrink-0 border-b bg-background">
        <QuizHomeLink />
      </div>
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
}
