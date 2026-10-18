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

export const getQuizzes = async (
  page: number,
  pageSize: number,
  userId: User["id"],
  country: Country["code"],
  status: TabStatus = "all",
): Promise<QuizPageResult> => {
  return await getQuizzesQuery(page, pageSize, userId, country, status);
};

export const getQuiz = async (
  quizId: Quiz["id"],
  userId: User["id"],
  now = Date.now(),
): Promise<QuizSession> => {
  await simulateDelay(1500);
  const { quiz, attempt } = await loadQuizSessionMutation(quizId, userId, now);
  return {
    quiz: toPublicQuiz(quiz),
    attempt: attempt ? toQuizAttempt(attempt) : null,
  };
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
