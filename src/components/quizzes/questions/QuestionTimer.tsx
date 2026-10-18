import { Clock3 } from "lucide-react";
import type { getDeadlines } from "@/helpers/quizHelpers";
import { formatCountdown } from "@/hooks/useCountdown";

interface QuestionTimerProps {
  deadlines: ReturnType<typeof getDeadlines>;
  now: number;
}

export default function QuestionTimer({ deadlines, now }: QuestionTimerProps) {
  const nearestDeadline = Math.min(
    deadlines.overall ?? Infinity,
    deadlines.question ?? Infinity,
  );
  const urgent = nearestDeadline - now <= 10000;
  const timers = [
    { label: "Time Remaining", deadline: deadlines.overall },
    { label: "Time Remaining for Question", deadline: deadlines.question },
  ];

  return (
    <div
      role="timer"
      aria-label="Time remaining"
      aria-live="off"
      className={`flex flex-wrap gap-x-5 gap-y-2 ${urgent ? "text-destructive" : "text-foreground"}`}
    >
      {timers.map(({ label, deadline }) => {
        if (deadline === null) return null;

        return (
          <div key={label} className="space-y-1">
            <p className="text-xs">{label}</p>
            <p className="flex items-center gap-1.5 text-lg font-semibold tabular-nums">
              <Clock3 className="size-4" aria-hidden="true" />
              {formatCountdown(deadline, now)}
            </p>
          </div>
        );
      })}
      {nearestDeadline === Infinity && (
        <span className="text-sm text-muted-foreground">No time limit</span>
      )}
    </div>
  );
}
