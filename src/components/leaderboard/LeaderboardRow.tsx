import { Award } from "lucide-react";
import { formatDuration } from "@/helpers/quizFormatters";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/types/leaderboard";

const medalColors = [
  "text-[#F0CC5E] fill-amber-200",
  "text-[#B2BFCF] fill-slate-200",
  "text-[#D6B288] fill-orange-200",
];

const rankColors = ["text-[#9A6200]", "text-[#40566D]", "text-[#814719]"];

export const leaderboardColumns =
  "grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-x-3 px-2 sm:grid-cols-[3rem_minmax(0,1fr)_6rem_8rem] sm:px-4";

export default function LeaderboardRow({
  entry,
  isCurrentUser,
  overall,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  overall: boolean;
}) {
  return (
    <div
      role="row"
      aria-current={isCurrentUser ? "true" : undefined}
      className={cn(
        leaderboardColumns,
        "min-h-22 rounded-lg py-3 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 sm:min-h-20",
        isCurrentUser
          ? "bg-primary/10 border-2 border-primary border-b-6"
          : "hover:bg-muted/60",
      )}
    >
      <div role="cell" className="row-span-2 text-center sm:row-span-1">
        {entry.rank <= 3 ? (
          <span className="relative mx-auto flex size-9 items-center justify-center">
            <Award
              aria-hidden="true"
              className={cn("absolute size-9", medalColors[entry.rank - 1])}
              strokeWidth={1.5}
            />
            <span
              className={cn(
                "absolute inset-x-0 top-0 flex h-6 items-center justify-center text-xs font-semibold tabular-nums ",
                rankColors[entry.rank - 1],
              )}
            >
              <span className="sr-only">Rank </span>
              {entry.rank}
            </span>
          </span>
        ) : (
          <span className="font-semibold tabular-nums text-muted-foreground">
            <span className="sr-only">Rank </span>
            {entry.rank}
          </span>
        )}
      </div>
      <div role="cell" className="flex min-w-0 items-center gap-2">
        <div className="min-w-0">
          <span className="block wrap-anywhere text-sm font-medium">
            {entry.name}
            {isCurrentUser && (
              <span className="ml-2 text-sm font-medium text-primary">You</span>
            )}
          </span>
          {overall && (
            <span
              className={cn("hidden text-sm sm:block", "text-muted-foreground")}
            >
              {entry.quizzesCompleted}{" "}
              {entry.quizzesCompleted === 1 ? "quiz" : "quizzes"}
            </span>
          )}
        </div>
      </div>
      <div role="cell" className="text-right font-medium tabular-nums">
        <span className="sr-only">Score </span>
        {entry.score.toLocaleString()}
        <span className="ml-1 text-sm font-normal text-muted-foreground sm:hidden">
          pts
        </span>
      </div>
      <div
        role="cell"
        className={cn(
          "col-span-2 col-start-2 text-sm tabular-nums sm:col-span-1 sm:col-start-auto sm:text-right",
          isCurrentUser ? "text-primary" : "text-muted-foreground",
        )}
      >
        <span className="sm:sr-only">Time </span>
        {formatDuration(entry.timeTakenSeconds)}
      </div>
    </div>
  );
}
