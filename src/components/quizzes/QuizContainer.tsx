import { ChartColumn, ClipboardList, ListChecks } from "lucide-react";
import { Stepper } from "@/components/ui/stepper";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuizAttempt } from "@/hooks/useQuizAttempt";
import type { QuizSession } from "@/types/quiz";
import QuestionForm from "./questions/QuestionForm";
import {
  QuizLoading,
  QuizSaveError,
  QuizSelectionRequired,
  QuizUnavailable,
} from "./QuizFeedback";
import QuizHomeLink from "./QuizHomeLink";
import QuizOverview from "./overview/QuizOverview";
import QuizResults from "./result/QuizResults";
import { quizStatuses } from "@/helpers/constants";

const steps = [
  { label: "Overview", icon: ClipboardList },
  { label: "Questions", icon: ListChecks },
  { label: "Results", icon: ChartColumn },
];

export default function QuizAttend({ quizId }: { quizId: string }) {
  const {
    session,
    currentStep,
    showOverview,
    isLoading,
    isPending,
    selectionLoading,
    selectionError,
    hasUser,
    isSessionError,
    sessionError,
    saveFailed,
    error,
    startQuiz,
    handleCommand,
    retakeQuiz,
    restartEditedAttempt,
    refetchSession,
  } = useQuizAttempt(quizId);

  const scrollResetKey = [
    quizId,
    showOverview ? "overview" : currentStep,
    session?.attempt?.id,
    session?.attempt?.currentQuestionIndex,
  ].join(":");

  function renderAttempt(activeSession: QuizSession) {
    const { quiz, attempt } = activeSession;

    if (showOverview) {
      return (
        <QuizOverview
          quiz={quiz}
          retake={!!attempt}
          pending={isPending}
          onStart={() => startQuiz(!!attempt)}
        />
      );
    }

    if (attempt?.status === quizStatuses.IN_PROGRESS) {
      return (
        <QuestionForm
          key={`${attempt.id}-${attempt.currentQuestionIndex}`}
          quiz={quiz}
          attempt={attempt}
          pending={isPending}
          saveFailed={saveFailed}
          onCommand={handleCommand}
        />
      );
    }

    if (attempt?.status === quizStatuses.COMPLETED) {
      return (
        <QuizResults quiz={quiz} attempt={attempt} onRetake={retakeQuiz} />
      );
    }

    return null;
  }

  function renderContent() {
    if (isLoading || selectionLoading) {
      return <QuizLoading />;
    }

    if (selectionError || !hasUser) {
      return <QuizSelectionRequired error={selectionError} />;
    }

    if (!session && isSessionError && sessionError) {
      return (
        <div className="p-4">
          <QuizUnavailable
            error={sessionError}
            onRetry={refetchSession}
            onRestartEditedAttempt={restartEditedAttempt}
            isRestarting={isPending}
            restartError={error}
          />
        </div>
      );
    }

    if (!session) return null;

    return (
      <div className="flex-1 space-y-4 px-3 pt-4 bg-[#efefef45] dark:bg-background sm:space-y-9 sm:px-6 sm:pt-8">
        <Stepper steps={steps} currentStep={currentStep} />
        {renderAttempt(session)}
        {error && (
          <QuizSaveError
            error={error}
            onRestartEditedAttempt={restartEditedAttempt}
            isRestarting={isPending}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden tracking-normal">
      <div className="shrink-0 border-b bg-background">
        <QuizHomeLink />
      </div>
      <ScrollArea resetKey={scrollResetKey} className="min-h-0 flex-1">
        <div className="flex min-h-full flex-col pb-4">{renderContent()}</div>
      </ScrollArea>
    </div>
  );
}
