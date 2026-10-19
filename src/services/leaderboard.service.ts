import {
  getLeaderboardQuizzesQuery,
  getLeaderboardRecordsQuery,
} from "./db/queries";
import type {
  Answer,
  Attempt,
  CompletedAttempt,
  Quiz,
  User,
} from "@/types/quiz";
import type {
  LeaderboardEntry,
  LeaderboardQuiz,
  LeaderboardResult,
} from "@/types/leaderboard";
import { simulateDelay } from "@/lib/utils";

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

  await simulateDelay(500);

  const { users, quizzes, attempts } =
    await getLeaderboardRecordsQuery(currentUserId);

  const quizIds = new Set(quizzes.map((quiz) => quiz.id));
  if (quizId !== null && !quizIds.has(quizId)) {
    throw new Error("Quiz not found.");
  }

  const usersById = new Map(users.map((user) => [user.id, user]));
  const quizzesById = new Map(quizzes.map((quiz) => [quiz.id, quiz]));
  const bestByUser = new Map<User["id"], Map<Quiz["id"], CompletedAttempt>>();

  for (const rawAttempt of attempts) {
    let attempt: Attempt = rawAttempt;

    // If an attempt is in-progress, check if its quiz time limit has expired
    if (attempt.status !== "completed") {
      const quiz = quizzesById.get(attempt.quizId);
      if (quiz) {
        const timeLimitSeconds = Math.min(
          quiz.timeLimitSeconds ?? Infinity,
          quiz.perQuestionSeconds === null
            ? Infinity
            : quiz.perQuestionSeconds * attempt.totalQuestions,
        );
        const startedAt = Date.parse(attempt.startedAt);
        const isExpired =
          Number.isFinite(timeLimitSeconds) &&
          Date.now() >= startedAt + timeLimitSeconds * 1000;

        if (isExpired) {
          const correctQuestions = attempt.answers.filter(
            (answer: Answer) => answer.isCorrect,
          ).length;
          const score = attempt.score ?? correctQuestions;
          const timeTakenSeconds =
            attempt.timeTakenSeconds ??
            (Number.isFinite(timeLimitSeconds)
              ? timeLimitSeconds
              : Math.max(0, Math.ceil((Date.now() - startedAt) / 1000)));

          attempt = {
            ...attempt,
            status: "completed",
            score,
            timeTakenSeconds,
            completedAt:
              attempt.completedAt ??
              new Date(startedAt + timeLimitSeconds * 1000).toISOString(),
            percentage:
              attempt.totalQuestions > 0
                ? Math.round((score / attempt.totalQuestions) * 100)
                : 0,
            currentQuestionIndex: attempt.totalQuestions,
          };
        }
      }
    }

    if (
      attempt.status !== "completed" ||
      !usersById.has(attempt.userId) ||
      !quizIds.has(attempt.quizId) ||
      (quizId !== null && attempt.quizId !== quizId)
    ) {
      continue;
    }

    const completedAttempt = attempt as CompletedAttempt;
    const bestByQuiz = bestByUser.get(completedAttempt.userId) ?? new Map();
    const previous = bestByQuiz.get(completedAttempt.quizId);
    if (
      !previous ||
      completedAttempt.score > previous.score ||
      (completedAttempt.score === previous.score &&
        completedAttempt.timeTakenSeconds < previous.timeTakenSeconds)
    ) {
      bestByQuiz.set(completedAttempt.quizId, completedAttempt);
    }
    bestByUser.set(completedAttempt.userId, bestByQuiz);
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
