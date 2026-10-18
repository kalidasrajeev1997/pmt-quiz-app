import { ChartColumn, ClipboardList, ListChecks } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Stepper } from "@/components/ui/stepper";
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
    refetchSession,
  } = useQuizAttempt(quizId);

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

    if (isSessionError && sessionError) {
      return <QuizUnavailable error={sessionError} onRetry={refetchSession} />;
    }

    if (!session) return null;

    return (
      <div className="min-h-full px-6 space-y-2 sm:space-y-9 pt-8 bg-[#efefef45]">
        <Stepper steps={steps} currentStep={currentStep} />
        {renderAttempt(session)}
        {error && <QuizSaveError error={error} />}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden tracking-normal">
      <div className="z-10 shrink-0 border-b bg-background">
        <QuizHomeLink />
      </div>
      <ScrollArea className="min-h-0 flex-1">{renderContent()}</ScrollArea>
    </div>
  );
}
