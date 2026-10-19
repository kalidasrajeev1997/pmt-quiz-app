import { BookOpenCheck, Clock3, RotateCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AchievementCard } from "@/components/ui/achievement-card";
import { Button } from "@/components/ui/button";
import type { PublicQuiz, QuizResult } from "@/types/quiz";

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
  const timedOut =
    quiz.timeLimitSeconds !== null &&
    attempt.timeTakenSeconds >= quiz.timeLimitSeconds;

  return (
    <section
      className="quiz-scene relative space-y-4 sm:space-y-4 rounded-xl border-2 border-b-6 border-gray-300 dark:border-border p-4 bg-white dark:bg-card text-foreground"
      aria-labelledby="results-title"
    >
      <div className="space-y-3">
        <span className="flex items-center gap-2">
          <h1
            id="results-title"
            tabIndex={-1}
            ref={(element) => element?.focus({ preventScroll: true })}
            className="text-xl font-medium outline-none sm:text-2xl"
          >
            Quiz completed
          </h1>
          <BookOpenCheck className="text-[#2f8646] size-6" />
        </span>
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
      <AchievementCard attempt={attempt} />
      <div className="flex flex-wrap gap-3">
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
