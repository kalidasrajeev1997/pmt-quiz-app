import {
  getLeaderboardQuizzesQuery,
  getLeaderboardRecordsQuery,
} from "./db/queries";
import type { CompletedAttempt, Quiz, User } from "@/types/quiz";
import type {
  LeaderboardEntry,
  LeaderboardQuiz,
  LeaderboardResult,
} from "@/types/leaderboard";

export async function getLeaderboardQuizzes(
  currentUserId?: User["id"],
): Promise<LeaderboardQuiz[]> {
  const quizzes = await getLeaderboardQuizzesQuery(currentUserId);
  return quizzes
    .map(({ id, title }) => ({ id, title }))
    .sort((first, second) => first.title.localeCompare(second.title));
}

export async function getLeaderboard(
  quizId: Quiz["id"] | null,
  limit = 10,
  currentUserId?: User["id"],
): Promise<LeaderboardResult> {
  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new RangeError("limit must be a positive integer");
  }

  const { users, quizzes, attempts } =
    await getLeaderboardRecordsQuery(currentUserId);

  const quizIds = new Set(quizzes.map((quiz) => quiz.id));
  if (quizId !== null && !quizIds.has(quizId)) {
    throw new Error("Quiz not found.");
  }

  const usersById = new Map(users.map((user) => [user.id, user]));
  const bestByUser = new Map<User["id"], Map<Quiz["id"], CompletedAttempt>>();

  for (const attempt of attempts) {
    if (
      attempt.status !== "completed" ||
      !usersById.has(attempt.userId) ||
      !quizIds.has(attempt.quizId) ||
      (quizId !== null && attempt.quizId !== quizId)
    ) {
      continue;
    }

    const bestByQuiz = bestByUser.get(attempt.userId) ?? new Map();
    const previous = bestByQuiz.get(attempt.quizId);
    if (
      !previous ||
      attempt.score > previous.score ||
      (attempt.score === previous.score &&
        attempt.timeTakenSeconds < previous.timeTakenSeconds)
    ) {
      bestByQuiz.set(attempt.quizId, attempt);
    }
    bestByUser.set(attempt.userId, bestByQuiz);
  }

  const standings: LeaderboardEntry[] = [];
  for (const [userId, bestByQuiz] of bestByUser) {
    const user = usersById.get(userId)!;
    let score = 0;
    let timeTakenSeconds = 0;
    for (const attempt of bestByQuiz.values()) {
      score += attempt.score;
      timeTakenSeconds += attempt.timeTakenSeconds;
    }
    standings.push({
      rank: 0,
      userId,
      name: user.name,
      score,
      timeTakenSeconds,
      quizzesCompleted: bestByQuiz.size,
    });
  }

  standings.sort(
    (first, second) =>
      second.score - first.score ||
      first.timeTakenSeconds - second.timeTakenSeconds ||
      first.name.localeCompare(second.name) ||
      first.userId.localeCompare(second.userId),
  );
  standings.forEach((entry, index) => {
    const previous = standings[index - 1];
    entry.rank =
      previous &&
      previous.score === entry.score &&
      previous.timeTakenSeconds === entry.timeTakenSeconds
        ? previous.rank
        : index + 1;
  });

  return {
    entries: standings.slice(0, limit),
    currentUser:
      standings.find((entry) => entry.userId === currentUserId) ?? null,
    totalParticipants: standings.length,
  };
}
