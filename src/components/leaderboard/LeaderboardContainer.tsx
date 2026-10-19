import { RefreshCw, Trophy } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import LeaderboardRow, { leaderboardColumns } from "./LeaderboardRow";
import LeaderboardSkeleton from "./LeaderboardSkeleton";
import LeaderboardEmptyState from "./LeaderboardEmptyState";

const LeaderboardContainer = () => {
  const {
    quizId,
    setQuizId,
    quizzes,
    leaderboard,
    selectedUser,
    isLoading,
    isFetching,
    error,
    refresh,
  } = useLeaderboard();
  const overall = quizId === null;
  const isAdmin = selectedUser?.role === "admin";
  const currentUser = leaderboard?.currentUser ?? null;
  const outsideTopList =
    currentUser &&
    !leaderboard?.entries.some((entry) => entry.userId === currentUser.userId);
  const choices = [
    { value: "", label: "Overall" },
    ...quizzes.map((quiz) => ({ value: quiz.id, label: quiz.title })),
  ];

  return (
    <section
      aria-labelledby="leaderboard-title"
      className="text-foreground tracking-normal p-4"
    >
      <header className="mb-4 flex flex-col">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <Trophy aria-hidden="true" className="size-8" strokeWidth={1.7} />
          </div>
          <div className="flex flex-col justify-center">
            <h1
              id="leaderboard-title"
              className="text-2xl font-medium leading-tight"
            >
              Leaderboard
            </h1>
            <p className="text-sm text-muted-foreground">
              {overall ? "All quizzes" : "Quiz standings"}
            </p>
          </div>
        </div>
      </header>

      <div className="mb-4 flex items-end gap-3">
        <div className="min-w-0 flex-1 sm:max-w-sm">
          <label
            id="leaderboard-quiz-label"
            className="mb-2 block text-sm font-medium"
          >
            Standings
          </label>
          <Select
            items={choices}
            value={quizId ?? ""}
            onValueChange={(value) => {
              if (value !== null) setQuizId(value === "" ? null : value);
            }}
            disabled={isLoading && quizzes.length === 0}
          >
            <SelectTrigger
              aria-labelledby="leaderboard-quiz-label"
              className="w-full rounded-md bg-muted h-8.5!"
            >
              <SelectValue className="min-w-0 truncate" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Choose Quiz</SelectLabel>
                {choices.map((choice) => (
                  <SelectItem
                    key={choice.value}
                    value={choice.value}
                    className="text-sm"
                  >
                    <span className="whitespace-normal wrap-break-word">
                      {choice.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? (
        <div role="alert" className="rounded-lg bg-muted p-6">
          <p className="font-medium">Couldn't load the leaderboard.</p>
          <p className="mt-1 wrap-break-word text-sm text-muted-foreground">
            {error}
          </p>
          <button
            type="button"
            onClick={refresh}
            className="mt-4 flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            <RefreshCw aria-hidden="true" className="size-4" />
            Try again
          </button>
        </div>
      ) : isLoading ? (
        <LeaderboardSkeleton overall={overall} />
      ) : !leaderboard?.entries.length ? (
        <LeaderboardEmptyState overall={overall} isAdmin={isAdmin} />
      ) : (
        <div aria-busy={isFetching}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Top 10</h2>
            <p className="text-sm text-muted-foreground">
              {leaderboard.totalParticipants}{" "}
              {leaderboard.totalParticipants === 1
                ? "participant"
                : "participants"}
            </p>
          </div>
          <div
            role="table"
            aria-label={overall ? "Overall standings" : "Quiz standings"}
            aria-colcount={4}
            className="bg-background border-2 border-b-6 rounded-xl px-2 py-4"
          >
            <div role="rowgroup" className="sr-only sm:not-sr-only">
              <div
                role="row"
                className={`${leaderboardColumns} pb-3 text-sm text-muted-foreground`}
              >
                <div role="columnheader" className="text-center">
                  Rank
                </div>
                <div role="columnheader">Name</div>
                <div role="columnheader" className="text-right">
                  {overall ? "Total score" : "Score"}
                </div>
                <div role="columnheader" className="text-right">
                  {overall ? "Total time" : "Time"}
                </div>
              </div>
            </div>
            <div role="rowgroup" className="space-y-1">
              {leaderboard.entries.map((entry) => (
                <LeaderboardRow
                  key={entry.userId}
                  entry={entry}
                  isCurrentUser={entry.userId === selectedUser?.id}
                  overall={overall}
                />
              ))}
            </div>
          </div>
          {outsideTopList && (
            <section aria-labelledby="your-position-title" className="mt-7">
              <h2
                id="your-position-title"
                className="mb-3 text-base font-semibold"
              >
                Your position
              </h2>
              <div role="table" aria-label="Your position">
                <div role="rowgroup">
                  <LeaderboardRow
                    entry={currentUser}
                    isCurrentUser
                    overall={overall}
                  />
                </div>
              </div>
            </section>
          )}
          {!currentUser && selectedUser && !isAdmin && (
            <p className="mt-6 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
              {overall
                ? "You haven't completed a quiz yet."
                : "You haven't completed this quiz yet."}
            </p>
          )}
        </div>
      )}
    </section>
  );
};

export default LeaderboardContainer;
