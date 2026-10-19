import { useQueryClient } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { quizStatuses } from "@/helpers/constants";
import { useCountdown } from "@/hooks/useCountdown";
import { QUERY_KEYS } from "@/lib/queryKeys";
import type { QuizQueryResult } from "@/services/db/queries/quiz";
import { cn } from "cn";

interface QuizCardProgressProps {
  quiz: QuizQueryResult;
}

export default function QuizCardProgress({ quiz }: QuizCardProgressProps) {
  const queryClient = useQueryClient();
  const isInProgress = quiz.status === quizStatuses.IN_PROGRESS;
  const isCompleted = quiz.status === quizStatuses.COMPLETED;
  const totalQuestions = quiz.questions.length;

  const percentage =
    totalQuestions > 0
      ? Math.round((quiz.answeredQuestions / totalQuestions) * 100)
      : 0;

  const {
    formatted: countdownFormatted,
    remainingSeconds: countdownRemaining,
    isUrgent,
    isExpired,
  } = useCountdown(isInProgress ? quiz.deadline : null, {
    onExpire: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.QUIZZES });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LEADERBOARD });
    },
  });

  const hasTimeRemaining =
    isInProgress && quiz.deadline !== null && Boolean(countdownFormatted);

  const progressValue =
    hasTimeRemaining && quiz.totalTimeSeconds && countdownRemaining !== null
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round((countdownRemaining / quiz.totalTimeSeconds) * 100),
          ),
        )
      : (quiz.scorePercentage ?? percentage);

  const segments = isCompleted
    ? [
        {
          value:
            totalQuestions > 0
              ? (quiz.correctQuestions / totalQuestions) * 100
              : 0,
          className: "stroke-green-700 dark:stroke-green-400",
        },
        {
          value:
            totalQuestions > 0
              ? (quiz.incorrectQuestions / totalQuestions) * 100
              : 0,
          className: "stroke-red-600 dark:stroke-red-400",
        },
      ]
    : undefined;

  const resultSummary = `${quiz.correctQuestions} correct, ${quiz.incorrectQuestions} incorrect, ${quiz.unansweredQuestions} unanswered`;

  const ariaLabel = `${quiz.title}: ${
    isCompleted
      ? "prior score"
      : hasTimeRemaining
        ? "time remaining"
        : "answer progress"
  }`;

  const ariaValueText = hasTimeRemaining
    ? `Time remaining: ${countdownFormatted}. ${quiz.answeredQuestions} of ${totalQuestions} answered.`
    : `${quiz.score !== null ? `Prior score: ${quiz.score} of ${totalQuestions}. ` : ""}${quiz.answeredQuestions} of ${totalQuestions} answered. ${resultSummary}.`;

  return (
    <Progress
      variant="circular"
      value={progressValue}
      segments={segments}
      aria-label={ariaLabel}
      aria-valuetext={ariaValueText}
      className={cn(
        "size-14",
        hasTimeRemaining &&
          (isUrgent || isExpired
            ? "text-destructive"
            : "text-amber-600 dark:text-amber-400"),
      )}
    >
      <span
        aria-hidden="true"
        className="relative flex flex-col items-center gap-0.5 text-foreground tabular-nums"
      >
        {hasTimeRemaining ? (
          <>
            <span
              className={cn(
                "text-xs font-semibold leading-tight",
                (isUrgent || isExpired) && "text-destructive",
              )}
            >
              {countdownFormatted}
            </span>
          </>
        ) : (
          <span className="text-md leading-none font-semibold">
            {quiz.score ?? quiz.answeredQuestions}/{totalQuestions}
          </span>
        )}
      </span>
    </Progress>
  );
}
