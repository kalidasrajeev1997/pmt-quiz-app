import { initializeDatabase } from "../database";
import type { IDBPTransaction } from "idb";
import type { QuizDatabase } from "../../../types/database";
import type { Answer, Attempt, Country, Quiz, User } from "@/types/quiz";
import { simulateDelay } from "../../../lib/utils";

type QuizStatus = "not-started" | "in_progress" | "completed";

export type QuizQueryResult = Omit<Quiz, "questions"> & {
  questions: Omit<Quiz["questions"][number], "correctOptionIds">[];
  status: QuizStatus;
  answeredQuestions: number;
  correctQuestions: number;
  incorrectQuestions: number;
  unansweredQuestions: number;
  score: number | null;
  scorePercentage: number | null;
  deadline?: number | null;
  remainingSeconds?: number | null;
  totalTimeSeconds?: number | null;
};

export type QuizPageResult = {
  quizzes: QuizQueryResult[];
  total: number;
};

export interface QuizAttemptRecords {
  quiz: Quiz | undefined;
  user: User | undefined;
  attempt: Attempt | null;
}

export type QuizAttemptTransaction = IDBPTransaction<
  QuizDatabase,
  ["quizzes", "users", "attempts"],
  "readwrite"
>;

const getQuizProgress = (quiz: Quiz, attempts: Attempt[], now: number) => {
  let latestAttempt: Attempt | undefined;
  let activeAttempt: Attempt | undefined;
  let latestStartedAt = -Infinity;
  let activeStartedAt = -Infinity;

  for (const attempt of attempts) {
    if (attempt.supersededByAttemptId) {
      continue;
    }
    const startedAt = Date.parse(attempt.startedAt);
    if (startedAt > latestStartedAt) {
      latestAttempt = attempt;
      latestStartedAt = startedAt;
    }

    const timeLimitSeconds = Math.min(
      quiz.timeLimitSeconds ?? Infinity,
      quiz.perQuestionSeconds === null
        ? Infinity
        : quiz.perQuestionSeconds * attempt.totalQuestions,
    );
    const isActive =
      attempt.status !== "completed" &&
      now < startedAt + timeLimitSeconds * 1000;

    if (isActive && startedAt > activeStartedAt) {
      activeAttempt = attempt;
      activeStartedAt = startedAt;
    }
  }

  const status: QuizStatus = activeAttempt
    ? "in_progress"
    : latestAttempt
      ? "completed"
      : "not-started";
  const attemptForProgress = activeAttempt ?? latestAttempt;
  const questionIds = new Set(quiz.questions.map((question) => question.id));
  const latestAnswers = new Map<Answer["questionId"], Answer>();

  for (const answer of attemptForProgress?.answers ?? []) {
    if (!questionIds.has(answer.questionId)) {
      continue;
    }

    const previousAnswer = latestAnswers.get(answer.questionId);
    if (
      !previousAnswer ||
      Date.parse(answer.answeredAt) >= Date.parse(previousAnswer.answeredAt)
    ) {
      latestAnswers.set(answer.questionId, answer);
    }
  }

  const answered = [...latestAnswers.values()].filter(
    (answer) => answer.selectedOptionIds.length > 0,
  );
  const answeredQuestions = answered.length;
  const correctQuestions = answered.filter((answer) => answer.isCorrect).length;
  const score = status === "completed" ? correctQuestions : null;

  const activeTimeLimitSeconds = activeAttempt
    ? Math.min(
        quiz.timeLimitSeconds ?? Infinity,
        quiz.perQuestionSeconds === null
          ? Infinity
          : quiz.perQuestionSeconds * activeAttempt.totalQuestions,
      )
    : null;
  const deadline =
    activeAttempt &&
    activeTimeLimitSeconds !== null &&
    Number.isFinite(activeTimeLimitSeconds)
      ? Date.parse(activeAttempt.startedAt) + activeTimeLimitSeconds * 1000
      : null;
  const remainingSeconds =
    deadline !== null ? Math.max(0, Math.ceil((deadline - now) / 1000)) : null;
  const totalTimeSeconds =
    activeTimeLimitSeconds !== null && Number.isFinite(activeTimeLimitSeconds)
      ? activeTimeLimitSeconds
      : null;

  return {
    status,
    answeredQuestions,
    correctQuestions,
    incorrectQuestions: answeredQuestions - correctQuestions,
    unansweredQuestions: quiz.questions.length - answeredQuestions,
    score,
    scorePercentage:
      score === null
        ? null
        : quiz.questions.length > 0
          ? Math.round((score / quiz.questions.length) * 100)
          : 0,
    deadline,
    remainingSeconds,
    totalTimeSeconds,
  };
};

export const getQuizzesQuery = async (
  page: number,
  pageSize: number,
  userId: User["id"],
  country: Country["code"],
  status: "all" | QuizStatus = "all",
  search: string,
): Promise<QuizPageResult> => {
  if (!Number.isSafeInteger(page) || page < 1) {
    throw new RangeError("page must be a positive integer");
  }
  if (!Number.isSafeInteger(pageSize) || pageSize < 1) {
    throw new RangeError("pageSize must be a positive integer");
  }

  const database = await initializeDatabase();
  const transaction = database.transaction(["quizzes", "attempts"], "readonly");
  const [quizzes, attempts] = await Promise.all([
    transaction.objectStore("quizzes").getAll(),
    transaction.objectStore("attempts").getAll(),
  ]);
  await transaction.done;

  const attemptsByQuiz = new Map<Quiz["id"], Attempt[]>();
  for (const attempt of attempts) {
    if (attempt.userId !== userId) {
      continue;
    }
    const quizAttempts = attemptsByQuiz.get(attempt.quizId) ?? [];
    quizAttempts.push(attempt);
    attemptsByQuiz.set(attempt.quizId, quizAttempts);
  }

  const now = Date.now();
  const matchingQuizzes = quizzes
    .filter((quiz) => {
      if (country === "All") {
        return quiz;
      }
      return quiz.countries.includes(country);
    })
    .map((quiz) => {
      return {
        ...quiz,
        ...getQuizProgress(quiz, attemptsByQuiz.get(quiz.id) ?? [], now),
      };
    })
    .filter(
      (quiz) =>
        (status === "all" || quiz.status === status) &&
        quiz.title.toLowerCase().includes(search),
    );

  const offset = (page - 1) * pageSize;
  await simulateDelay(1500); // Simulate a 1.5s delay before returning the results

  return {
    total: matchingQuizzes.length,
    quizzes: matchingQuizzes.slice(offset, offset + pageSize).map((quiz) => ({
      ...quiz,
      questions: quiz.questions.map(({ id, text, type, options }) => ({
        id,
        text,
        type,
        options,
      })),
    })),
  };
};

export const getQuizAttemptQuery = async (
  quizId: Quiz["id"],
  userId: User["id"],
  existingTransaction?: QuizAttemptTransaction,
): Promise<QuizAttemptRecords> => {
  const transaction =
    existingTransaction ??
    (await initializeDatabase()).transaction(
      ["quizzes", "users", "attempts"],
      "readonly",
    );
  const [quiz, user, allAttempts] = await Promise.all([
    transaction.objectStore("quizzes").get(quizId),
    transaction.objectStore("users").get(userId),
    transaction.objectStore("attempts").getAll(),
  ]);
  const attempts = allAttempts
    .filter((att) => att.quizId === quizId && att.userId === userId)
    .filter((att) => !att.supersededByAttemptId)
    .sort(
      (att1, att2) =>
        Date.parse(att2.startedAt) - Date.parse(att1.startedAt) ||
        att2.id.localeCompare(att1.id),
    );
  if (!existingTransaction) {
    await transaction.done;
  }
  return {
    quiz,
    user,
    attempt:
      attempts.find((attempt) => attempt.status === "in_progress") ??
      attempts[0] ??
      null,
  };
};

export const getAttemptQuery = async (
  attemptId: Attempt["id"],
  transaction: QuizAttemptTransaction,
): Promise<QuizAttemptRecords> => {
  const attempt = await transaction.objectStore("attempts").get(attemptId);
  if (!attempt) {
    return { quiz: undefined, user: undefined, attempt: null };
  }
  const [quiz, user] = await Promise.all([
    transaction.objectStore("quizzes").get(attempt.quizId),
    transaction.objectStore("users").get(attempt.userId),
  ]);
  return { quiz, user, attempt };
};
