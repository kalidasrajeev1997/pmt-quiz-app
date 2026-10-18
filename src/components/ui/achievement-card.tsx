import { useEffect, useState, type HTMLAttributes } from "react";
import { CircleCheck, CircleHelp, CircleStar, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/helpers/quizFormatters";
import type { QuizResult } from "@/types/quiz";

interface AchievementCardProps extends HTMLAttributes<HTMLDivElement> {
  attempt: QuizResult;
}

function AchievementCard({
  attempt,
  className,
  ...props
}: AchievementCardProps) {
  const answeredCount = attempt.answers.filter(
    (answer) => answer.selectedOptionIds.length > 0,
  ).length;
  const unansweredCount = attempt.totalQuestions - answeredCount;
  const [values, setValues] = useState({
    percentage: 0,
    score: 0,
    unanswered: 0,
    timeTaken: 0,
  });

  useEffect(() => {
    const target = {
      percentage: attempt.percentage,
      score: attempt.score,
      unanswered: unansweredCount,
      timeTaken: attempt.timeTakenSeconds,
    };
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) {
      const frame = requestAnimationFrame(() => setValues(target));
      return () => cancelAnimationFrame(frame);
    }

    const duration = 850;
    const startTime = performance.now();
    let frame = 0;
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const easedProgress = 1 - (1 - progress) ** 3;

      setValues({
        percentage: target.percentage * easedProgress,
        score: target.score * easedProgress,
        unanswered: target.unanswered * easedProgress,
        timeTaken: target.timeTaken * easedProgress,
      });

      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [
    attempt.percentage,
    attempt.score,
    attempt.timeTakenSeconds,
    unansweredCount,
  ]);

  return (
    <div
      className={cn(
        "rounded-xl bg-muted p-4 sm:p-6 border-2 border-b-6",
        className,
      )}
      {...props}
    >
      <dl className="achievement-metrics">
        <div>
          <dt className="flex items-center gap-1 text-xs text-muted-foreground">
            <CircleStar
              aria-hidden="true"
              className="size-4 stroke-[#00a5df] fill-white"
              strokeWidth={2}
            />
            Score
          </dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums text-foreground">
            {Math.round(values.percentage)}%
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-1 text-xs text-muted-foreground">
            <CircleCheck
              aria-hidden="true"
              className="size-4 stroke-[#00a5df] fill-white"
              strokeWidth={2}
            />
            Correct
          </dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums text-foreground">
            {Math.round(values.score)}/{attempt.totalQuestions}
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-1 text-xs text-muted-foreground">
            <CircleHelp
              aria-hidden="true"
              className="size-3.5 stroke-[#00a5df] fill-white"
              strokeWidth={2}
            />
            Unanswered
          </dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums text-foreground">
            {Math.round(values.unanswered)}
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock3
              aria-hidden="true"
              className="size-3.5 stroke-[#00a5df] fill-white"
              strokeWidth={2}
            />
            Time taken
          </dt>
          <dd className="mt-1 text-base font-semibold tabular-nums text-foreground">
            {formatDuration(Math.round(values.timeTaken))}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export { AchievementCard };
