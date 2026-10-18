import { initializeDatabase } from "../database";
import type { Attempt, Quiz, User } from "@/types/quiz";

export type LeaderboardRecords = {
  users: User[];
  quizzes: Quiz[];
  attempts: Attempt[];
};

function scopeQuizzes(
  quizzes: Quiz[],
  currentUserId: User["id"] | undefined,
  user: User | undefined,
): Quiz[] {
  if (currentUserId === undefined) return quizzes;
  if (!user) throw new Error("User not found.");
  return user.role === "admin"
    ? quizzes
    : quizzes.filter((quiz) => quiz.countries.includes(user.country));
}

export async function getLeaderboardQuizzesQuery(
  currentUserId?: User["id"],
): Promise<Quiz[]> {
  const database = await initializeDatabase();
  const transaction = database.transaction(["quizzes", "users"], "readonly");
  const [quizzes, user] = await Promise.all([
    transaction.objectStore("quizzes").getAll(),
    currentUserId === undefined
      ? undefined
      : transaction.objectStore("users").get(currentUserId),
  ]);
  await transaction.done;

  return scopeQuizzes(quizzes, currentUserId, user);
}

export async function getLeaderboardRecordsQuery(
  currentUserId?: User["id"],
): Promise<LeaderboardRecords> {
  const database = await initializeDatabase();
  const transaction = database.transaction(
    ["users", "quizzes", "attempts"],
    "readonly",
  );
  const [users, quizzes, attempts] = await Promise.all([
    transaction.objectStore("users").getAll(),
    transaction.objectStore("quizzes").getAll(),
    transaction.objectStore("attempts").getAll(),
  ]);
  await transaction.done;

  return {
    users,
    quizzes: scopeQuizzes(
      quizzes,
      currentUserId,
      users.find((user) => user.id === currentUserId),
    ),
    attempts,
  };
}
