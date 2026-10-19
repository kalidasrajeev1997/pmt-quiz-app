import { getQuizzesQuery } from "./db/queries";
import type { TabStatus } from "../types/quiz";
import {
  loadQuizSessionMutation,
  startOrResumeAttemptMutation,
  updateAttemptMutation,
} from "./db/mutations/quiz";
import type { QuizPageResult } from "./db/queries/quiz";
import type {
  Attempt,
  Country,
  Question,
  Quiz,
  User,
  CurrentQuestion,
  QuizAttempt,
  QuizResult,
  QuizSession,
} from "../types/quiz";
import {
  toCurrentQuestion,
  toPublicQuiz,
  toQuizAttempt,
  toQuizResult,
} from "@/helpers/quizHelpers";
import { simulateDelay } from "@/lib/utils";
import {
  getAllRecords,
  getRecord,
  initializeDatabase,
  resetDatabase,
} from "./db/database";
import { quizSchema, type QuizFormValues } from "@/helpers/quizSchema";

async function validateQuizData(data: QuizFormValues): Promise<QuizFormValues> {
  const values = quizSchema.parse(data);
  const countries = await getAllRecords("countries");
  if (
    values.countries.some(
      (code) => !countries.some((country) => country.code === code),
    )
  ) {
    throw new Error("Choose a valid assigned country.");
  }
  return values;
}

export async function getAdminQuizzes(): Promise<Quiz[]> {
  await simulateDelay(1000);
  return getAllRecords("quizzes");
}

export async function getAdminQuiz(id: Quiz["id"]): Promise<Quiz> {
  await simulateDelay(1000);
  const quiz = await getRecord("quizzes", id);
  if (!quiz)
    throw new Error("This quiz was not found. It may have been deleted.");
  return quiz;
}

export async function createQuiz(data: QuizFormValues): Promise<Quiz> {
  const values = await validateQuizData(data);
  const quiz = { ...values, id: crypto.randomUUID() };
  const database = await initializeDatabase();
  await database.add("quizzes", quiz);
  return quiz;
}

export async function updateQuiz(
  id: Quiz["id"],
  data: QuizFormValues,
): Promise<Quiz> {
  const values = await validateQuizData(data);
  const database = await initializeDatabase();
  const transaction = database.transaction("quizzes", "readwrite");
  const existing = await transaction.store.get(id);
  if (!existing) {
    await transaction.done;
    throw new Error("This quiz was not found. It may have been deleted.");
  }
  const quiz = { ...values, id };
  await transaction.store.put(quiz);
  await transaction.done;
  return quiz;
}

export async function deleteQuiz(id: Quiz["id"]): Promise<void> {
  const database = await initializeDatabase();
  const transaction = database.transaction(
    ["quizzes", "attempts"],
    "readwrite",
  );
  const attempts = await transaction.objectStore("attempts").getAll();
  await Promise.all([
    transaction.objectStore("quizzes").delete(id),
    ...attempts
      .filter((attempt) => attempt.quizId === id)
      .map((attempt) => transaction.objectStore("attempts").delete(attempt.id)),
  ]);
  await transaction.done;
}

export const getQuizzes = async (
  page: number,
  pageSize: number,
  userId: User["id"],
  country: Country["code"],
  status: TabStatus = "all",
): Promise<QuizPageResult> => {
  return await getQuizzesQuery(page, pageSize, userId, country, status);
};

export const loadQuizSession = async (
  quizId: Quiz["id"],
  userId: User["id"],
  now = Date.now(),
): Promise<QuizSession> => {
  const { quiz, attempt } = await loadQuizSessionMutation(quizId, userId, now);
  return {
    quiz: toPublicQuiz(quiz),
    attempt: attempt ? toQuizAttempt(attempt) : null,
  };
};

export const getQuiz = async (
  quizId: Quiz["id"],
  userId: User["id"],
  now = Date.now(),
): Promise<QuizSession> => {
  await simulateDelay(500);
  return await loadQuizSession(quizId, userId, now);
};

export async function startOrResumeAttempt(
  quizId: Quiz["id"],
  userId: User["id"],
  now = Date.now(),
): Promise<QuizAttempt> {
  const attempt = await startOrResumeAttemptMutation(quizId, userId, now);
  return toQuizAttempt(attempt);
}

export async function getCurrentQuestion(
  attemptId: Attempt["id"],
  now = Date.now(),
): Promise<CurrentQuestion> {
  const { quiz, attempt } = await updateAttemptMutation(
    attemptId,
    { type: "resume" },
    now,
  );
  return toCurrentQuestion(quiz, attempt, now);
}

export async function submitAnswer(
  attemptId: Attempt["id"],
  questionId: Question["id"],
  optionIds: string[],
  now = Date.now(),
): Promise<CurrentQuestion> {
  const { quiz, attempt } = await updateAttemptMutation(
    attemptId,
    { type: "submit", questionId, optionIds },
    now,
  );
  return toCurrentQuestion(quiz, attempt, now);
}

export async function completeAttempt(
  attemptId: Attempt["id"],
  now = Date.now(),
): Promise<QuizResult> {
  const { attempt } = await updateAttemptMutation(
    attemptId,
    { type: "complete" },
    now,
  );
  if (attempt.status !== "completed") {
    throw new Error("The quiz attempt could not be completed.");
  }
  return toQuizResult(attempt);
}

export async function saveDraft(
  attemptId: Attempt["id"],
  questionId: Question["id"],
  optionIds: string[],
  now = Date.now(),
): Promise<CurrentQuestion> {
  const { quiz, attempt } = await updateAttemptMutation(
    attemptId,
    { type: "draft", questionId, optionIds },
    now,
  );
  return toCurrentQuestion(quiz, attempt, now);
}

export async function resetDataToSeed(): Promise<void> {
  await resetDatabase();
}
