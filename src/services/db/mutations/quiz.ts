import { initializeDatabase } from "../database";
import {
  type Attempt,
  type Quiz,
  type User,
  QuizAttemptError,
} from "../../../types/quiz";
import type { QuizAttemptTransaction } from "../queries/quiz";
import { getAttemptQuery, getQuizAttemptQuery } from "../queries/quiz";
import {
  createQuizAttempt,
  finishQuizAttempt,
  reconcileQuizAttempt,
  recordAnswer,
  validateOptionIds,
  validateQuizAccess,
} from "@/helpers/quizHelpers";

interface QuizAttemptState {
  quiz: Quiz;
  attempt: Attempt | null;
}

async function openAttemptTransaction(): Promise<QuizAttemptTransaction> {
  const database = await initializeDatabase();
  return database.transaction(["quizzes", "users", "attempts"], "readwrite");
}

async function abortTransaction(
  transaction: QuizAttemptTransaction,
): Promise<void> {
  try {
    transaction.abort();
  } catch {
    await transaction.done.catch(() => undefined);
  }
  await transaction.done.catch(() => undefined);
}

async function saveAttempt(
  transaction: QuizAttemptTransaction,
  state: QuizAttemptState,
): Promise<QuizAttemptState> {
  if (state.attempt) {
    await transaction.objectStore("attempts").put(state.attempt);
  }
  await transaction.done;
  return state;
}

export async function loadQuizSessionMutation(
  quizId: Quiz["id"],
  userId: User["id"],
  now: number,
): Promise<QuizAttemptState> {
  const transaction = await openAttemptTransaction();
  try {
    const records = await getQuizAttemptQuery(quizId, userId, transaction);
    const quiz = validateQuizAccess(records.quiz, records.user);
    const attempt = records.attempt
      ? reconcileQuizAttempt(quiz, records.attempt, now)
      : null;
    return await saveAttempt(transaction, { quiz, attempt });
  } catch (error) {
    await abortTransaction(transaction);
    throw error;
  }
}

export async function startOrResumeAttemptMutation(
  quizId: Quiz["id"],
  userId: User["id"],
  now: number,
): Promise<Attempt> {
  const transaction = await openAttemptTransaction();
  try {
    const records = await getQuizAttemptQuery(quizId, userId, transaction);
    const quiz = validateQuizAccess(records.quiz, records.user);
    let attempt: Attempt;
    if (records.attempt?.status === "in_progress") {
      attempt = reconcileQuizAttempt(quiz, records.attempt, now);
    } else {
      if (records.attempt && !quiz.retakesAllowed) {
        throw new QuizAttemptError("This quiz allows only one attempt.");
      }
      attempt = reconcileQuizAttempt(
        quiz,
        createQuizAttempt(quiz, userId, now),
        now,
      );
    }
    await saveAttempt(transaction, { quiz, attempt });
    return attempt;
  } catch (error) {
    await abortTransaction(transaction);
    throw error;
  }
}

type AttemptCommand =
  | { type: "resume" }
  | { type: "complete" }
  | { type: "draft" | "submit"; questionId: string; optionIds: string[] };

export async function updateAttemptMutation(
  attemptId: Attempt["id"],
  command: AttemptCommand,
  now: number,
): Promise<{ quiz: Quiz; attempt: Attempt }> {
  const transaction = await openAttemptTransaction();
  try {
    const records = await getAttemptQuery(attemptId, transaction);
    if (!records.attempt) {
      throw new QuizAttemptError("This quiz attempt was not found.");
    }
    const quiz = validateQuizAccess(records.quiz, records.user);
    let attempt = reconcileQuizAttempt(quiz, records.attempt, now);

    switch (command.type) {
      case "complete":
        attempt = finishQuizAttempt(attempt, now);
        break;
      case "draft":
      case "submit": {
        const question = quiz.questions[attempt.currentQuestionIndex];
        if (
          attempt.status === "completed" ||
          question?.id !== command.questionId
        ) {
          break;
        }
        if (command.type === "submit") {
          if (command.optionIds.length === 0) {
            throw new QuizAttemptError("Select at least one answer.");
          }
          attempt = recordAnswer(quiz, attempt, command.optionIds, now);
        } else {
          attempt = {
            ...attempt,
            draftOptionIds: validateOptionIds(question, command.optionIds),
          };
        }
        break;
      }
      case "resume":
        break;
    }

    await saveAttempt(transaction, { quiz, attempt });
    return { quiz, attempt };
  } catch (error) {
    await abortTransaction(transaction);
    throw error;
  }
}
