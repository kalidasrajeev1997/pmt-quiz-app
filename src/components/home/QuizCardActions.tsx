import { ChartColumn } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { quizLinkHashes, quizStatuses } from "@/helpers/constants";
import { QuizButtonLabel } from "@/helpers/quizStatus";
import type { QuizQueryResult } from "@/services/db/queries/quiz";

interface QuizCardActionsProps {
  quiz: QuizQueryResult;
}

export default function QuizCardActions({ quiz }: QuizCardActionsProps) {
  const isCompleted = quiz.status === quizStatuses.COMPLETED;
  const canTakeQuiz = !isCompleted || quiz.retakesAllowed;
  const statusOptions = QuizButtonLabel({ status: quiz.status });

  const targetHash = isCompleted
    ? quizLinkHashes.RETAKE
    : quiz.status === quizStatuses.IN_PROGRESS
      ? quizLinkHashes.CONTINUE
      : quizLinkHashes.START;

  const actionAriaLabel = `${
    isCompleted
      ? "Retake quiz"
      : quiz.status === quizStatuses.IN_PROGRESS
        ? "Continue quiz"
        : "Start quiz"
  }: ${quiz.title}`;

  return (
    <div className="flex flex-wrap gap-2">
      {isCompleted && (
        <Button
          variant="secondary"
          nativeButton={false}
          className="min-h-10 min-w-0 flex-1 rounded-md bg-background px-3"
          render={
            <Link
              to="/quiz/$id"
              params={{ id: quiz.id }}
              hash="results"
              aria-label={`View results for ${quiz.title}`}
            />
          }
        >
          <ChartColumn aria-hidden="true" data-icon="inline-start" />
          View results
        </Button>
      )}

      {canTakeQuiz && (
        <Button
          nativeButton={false}
          className="min-h-10 min-w-0 flex-1 rounded-md px-3 text-white"
          render={
            <Link
              to="/quiz/$id"
              params={{ id: quiz.id }}
              hash={targetHash}
              aria-label={actionAriaLabel}
            />
          }
        >
          {statusOptions.icon}
          {statusOptions.label}
        </Button>
      )}
    </div>
  );
}
