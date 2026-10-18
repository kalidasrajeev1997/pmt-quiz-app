import { Clock3, RotateCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatDuration } from "@/helpers/quizFormatters";
import type { PublicQuiz, QuizResult } from "@/types/quiz";
import QuizHomeLink from "../QuizHomeLink";

interface QuizResultsProps {
  quiz: PublicQuiz;
  attempt: QuizResult;
  onRetake: () => void;
}

export default function QuizResults({
  quiz,
  attempt,
  onRetake,
}: QuizResultsProps) {
  const answeredCount = attempt.answers.filter(
    (answer) => answer.selectedOptionIds.length > 0,
  ).length;
  const timedOut =
    quiz.timeLimitSeconds !== null &&
    attempt.timeTakenSeconds >= quiz.timeLimitSeconds;

  return (
    <section className="quiz-scene space-y-8" aria-labelledby="results-title">
      <div className="space-y-3">
        <h1
          id="results-title"
          tabIndex={-1}
          ref={(element) => element?.focus({ preventScroll: true })}
          className="text-2xl font-semibold outline-none sm:text-3xl"
        >
          Quiz completed
        </h1>
        <p className="text-base wrap-anywhere">{quiz.title}</p>
      </div>
      {timedOut && (
        <Alert className="border-0 bg-muted p-4">
          <Clock3 />
          <AlertTitle>Time limit reached</AlertTitle>
          <AlertDescription>
            Your saved answers were submitted automatically.
          </AlertDescription>
        </Alert>
      )}
      <div className="flex flex-wrap items-center gap-6 bg-muted px-5 py-6 sm:px-6">
        <Progress
          variant="circular"
          value={attempt.percentage}
          aria-label="Quiz score"
          className="size-24 text-primary"
        >
          <span className="text-xl font-semibold text-foreground tabular-nums">
            {attempt.percentage}%
          </span>
        </Progress>
        <dl className="grid flex-1 grid-cols-2 gap-6 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-foreground/80">Correct</dt>
            <dd className="mt-2 text-xl font-semibold tabular-nums">
              {attempt.score} / {attempt.totalQuestions}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-foreground/80">Unanswered</dt>
            <dd className="mt-2 text-xl font-semibold tabular-nums">
              {attempt.totalQuestions - answeredCount}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-foreground/80">Time taken</dt>
            <dd className="mt-2 text-base font-semibold">
              {formatDuration(attempt.timeTakenSeconds)}
            </dd>
          </div>
        </dl>
      </div>
      <div className="flex flex-wrap gap-3">
        <QuizHomeLink />
        {quiz.retakesAllowed && (
          <Button
            size="lg"
            variant="secondary"
            onClick={onRetake}
            className="min-h-11 rounded-md px-4"
          >
            <RotateCcw />
            Retake quiz
          </Button>
        )}
      </div>
    </section>
  );
}
