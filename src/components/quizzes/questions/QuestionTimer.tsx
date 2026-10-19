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
      className={`grid grid-cols-2 gap-x-4 gap-y-2 @min-[36rem]:flex @min-[36rem]:shrink-0 @min-[36rem]:gap-x-5 ${urgent ? "text-destructive" : "text-foreground"}`}
    >
      {timers.map(({ label, deadline }) => {
        if (deadline === null) return null;

        return (
          <div key={label} className="grid min-w-0 grid-rows-[1fr_auto] gap-1">
            <p className="text-xs">{label}</p>
            <p className="flex items-center gap-1.5 text-lg font-semibold whitespace-nowrap tabular-nums">
              <Clock3 className="size-4 shrink-0" aria-hidden="true" />
              {formatCountdown(deadline, now)}
            </p>
          </div>
        );
      })}
      {nearestDeadline === Infinity && (
        <span className="col-span-full text-sm text-muted-foreground">
          No time limit
        </span>
      )}
    </div>
  );
}
