import { initializeDatabase } from "../database";
import type { Answer, Attempt, Country, Quiz, User } from "@/types/quiz";
import { simulateDelay } from "../../../lib/utils";

type QuizStatus = "not-started" | "in-progress" | "completed";

export type QuizQueryResult = Omit<Quiz, "questions"> & {
  questions: Omit<Quiz["questions"][number], "correctOptionIds">[];
  status: QuizStatus;
  answeredQuestions: number;
  correctQuestions: number;
  incorrectQuestions: number;
  unansweredQuestions: number;
  score: number | null;
  scorePercentage: number | null;
};

export const getQuizzesQuery = async (
  page: number,
  pageSize: number,
  userId: User["id"],
  country: Country["code"],
  status: "all" | QuizStatus = "all",
): Promise<QuizQueryResult[]> => {
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
    .filter((quiz) => quiz.countries.includes(country))
    .map((quiz) => {
      const quizAttempts = [...(attemptsByQuiz.get(quiz.id) ?? [])].sort(
        (first, second) =>
          Date.parse(second.startedAt) - Date.parse(first.startedAt),
      );
      const activeAttempt = quizAttempts.find((attempt) => {
        if (attempt.status === "completed") {
          return false;
        }

        const timeLimitSeconds = Math.min(
          quiz.timeLimitSeconds ?? Infinity,
          quiz.perQuestionSeconds === null
            ? Infinity
            : quiz.perQuestionSeconds * attempt.totalQuestions,
        );
        return now < Date.parse(attempt.startedAt) + timeLimitSeconds * 1000;
      });
      const quizStatus: QuizStatus = activeAttempt
        ? "in-progress"
        : quizAttempts.length > 0
          ? "completed"
          : "not-started";

      const latestAttempt = activeAttempt ?? quizAttempts[0];
      const questionIds = new Set(
        quiz.questions.map((question) => question.id),
      );
      const latestAnswers = new Map<Answer["questionId"], Answer>();
      for (const answer of latestAttempt?.answers ?? []) {
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
      const correctQuestions = answered.filter(
        (answer) => answer.isCorrect,
      ).length;
      const incorrectQuestions = answeredQuestions - correctQuestions;
      const unansweredQuestions = quiz.questions.length - answeredQuestions;
      const score = quizStatus === "completed" ? correctQuestions : null;
      const scorePercentage =
        score === null
          ? null
          : quiz.questions.length > 0
            ? Math.round((score / quiz.questions.length) * 100)
            : 0;

      return {
        ...quiz,
        status: quizStatus,
        answeredQuestions,
        correctQuestions,
        incorrectQuestions,
        unansweredQuestions,
        score,
        scorePercentage,
      };
    })
    .filter((quiz) => status === "all" || quiz.status === status);

  const offset = (page - 1) * pageSize;
  await simulateDelay(1500); // Simulate a 1.5s delay before returning the results

  return matchingQuizzes.slice(offset, offset + pageSize).map((quiz) => ({
    ...quiz,
    questions: quiz.questions.map(({ id, text, type, options }) => ({
      id,
      text,
      type,
      options,
    })),
  }));
};
