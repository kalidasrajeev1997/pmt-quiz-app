import { Trophy } from "lucide-react";

interface LeaderboardEmptyStateProps {
  overall: boolean;
  isAdmin: boolean;
}

const LeaderboardEmptyState = ({
  overall,
  isAdmin,
}: LeaderboardEmptyStateProps) => (
  <div
    role="status"
    aria-labelledby="leaderboard-empty-title"
    className="flex min-h-64 flex-col items-center justify-center rounded-lg bg-muted px-6 py-10 text-center"
  >
    <Trophy
      aria-hidden="true"
      className="mb-4 size-10 text-muted-foreground"
      strokeWidth={1.5}
    />
    <h2 id="leaderboard-empty-title" className="text-lg font-semibold">
      No finishers yet
    </h2>
    <p className="mt-2 max-w-sm text-sm text-muted-foreground">
      {isAdmin
        ? "No completed attempts yet."
        : overall
          ? "Complete a quiz to join the leaderboard."
          : "Be the first to finish this quiz."}
    </p>
  </div>
);

export default LeaderboardEmptyState;
