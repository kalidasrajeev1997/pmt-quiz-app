import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { deleteDB } from "idb";
import {
  completeAttempt,
  getCurrentQuestion,
  getQuizzes,
  loadQuizSession,
  saveDraft,
  startOrResumeAttempt,
  submitAnswer,
} from "@/services/quiz.service";
import {
  closeDatabase,
  DATABASE_NAME,
  getRecord,
  initializeDatabase,
  saveRecord,
} from "@/services/db/database";
import {
  countryFilterService,
  getCountry,
  getUser,
  userFilterService,
} from "@/services/filters.service";
import type { Quiz } from "@/types/quiz";

describe("Data Service - Scoring, Timing & Country Filtering", () => {
  const BASE_TIME = Date.parse("2026-10-18T10:00:00.000Z");

  beforeEach(async () => {
    localStorage.clear();
    await initializeDatabase();
  });

  afterEach(async () => {
    await closeDatabase();
    await deleteDB(DATABASE_NAME);
  });

  async function createCustomQuiz(overrides: Partial<Quiz> = {}): Promise<Quiz> {
    const base = await getRecord("quizzes", "q1");
    if (!base) throw new Error("Seed quiz q1 missing");

    const quiz: Quiz = {
      ...base,
      id: "service-test-quiz",
      title: "Service Test Quiz",
      countries: ["IN"],
      retakesAllowed: false,
      timeLimitSeconds: 120,
      perQuestionSeconds: 20,
      questions: [
        {
          id: "sq1",
          text: "Question 1",
          type: "single",
          options: [
            { id: "o1", text: "Answer 1" },
            { id: "o2", text: "Answer 2" },
          ],
          correctOptionIds: ["o1"],
        },
        {
          id: "sq2",
          text: "Question 2",
          type: "multiple",
          options: [
            { id: "m1", text: "Multi 1" },
            { id: "m2", text: "Multi 2" },
            { id: "m3", text: "Multi 3" },
          ],
          correctOptionIds: ["m1", "m2"],
        },
      ],
      ...overrides,
    };
    await saveRecord("quizzes", quiz);
    return quiz;
  }

  it("filters quizzes by user country and handles country filter service", async () => {
    // Test filter service storage
    countryFilterService("IN");
    userFilterService("u1");
    expect(getCountry()).toBe("IN");
    expect(getUser()).toBe("u1");

    // Create a quiz only for "IN" and another only for "AE"
    await createCustomQuiz({ id: "quiz-india", countries: ["IN"] });
    await createCustomQuiz({ id: "quiz-uae", countries: ["AE"] });

    // Query with country "IN"
    const inResults = await getQuizzes(1, 10, "u1", "IN", "all");
    expect(inResults.quizzes.some((q) => q.id === "quiz-india")).toBe(true);
    expect(inResults.quizzes.some((q) => q.id === "quiz-uae")).toBe(false);

    // Query with country "AE"
    const aeResults = await getQuizzes(1, 10, "u1", "AE", "all");
    expect(aeResults.quizzes.some((q) => q.id === "quiz-india")).toBe(false);
    expect(aeResults.quizzes.some((q) => q.id === "quiz-uae")).toBe(true);
  });

  it("handles start, draft saving, submission, and scoring calculation", async () => {
    const quiz = await createCustomQuiz();
    const userId = "u1";

    // 1. Start attempt
    const attempt = await startOrResumeAttempt(quiz.id, userId, BASE_TIME);
    expect(attempt.status).toBe("in_progress");
    expect(attempt.currentQuestionIndex).toBe(0);

    // 2. Save draft
    const draftState = await saveDraft(attempt.id, "sq1", ["o1"], BASE_TIME + 2_000);
    expect(draftState.selectedOptionIds).toEqual(["o1"]);
    expect(draftState.index).toBe(0);

    // 3. Submit first answer (correct: o1)
    const afterQ1 = await submitAnswer(attempt.id, "sq1", ["o1"], BASE_TIME + 5_000);
    expect(afterQ1.index).toBe(1);
    expect(afterQ1.question?.id).toBe("sq2");

    // 4. Submit second answer (incorrect: m1 only, needs m1 & m2)
    const afterQ2 = await submitAnswer(attempt.id, "sq2", ["m1"], BASE_TIME + 15_000);
    // All questions submitted -> status is completed
    expect(afterQ2.status).toBe("completed");

    // 5. Complete attempt verification
    const result = await completeAttempt(attempt.id, BASE_TIME + 20_000);
    expect(result.status).toBe("completed");
    expect(result.score).toBe(1); // 1 out of 2 correct
    expect(result.percentage).toBe(50);
    expect(result.correctQuestions).toBe(1);
    expect(result.incorrectQuestions).toBe(1);
    expect(result.unansweredQuestions).toBe(0);
  });

  it("timing: reconciles expired question timer on getCurrentQuestion and loadQuizSession", async () => {
    const quiz = await createCustomQuiz({ perQuestionSeconds: 10, timeLimitSeconds: 100 });
    const userId = "u1";

    const attempt = await startOrResumeAttempt(quiz.id, userId, BASE_TIME);

    // Save a draft for question 1
    await saveDraft(attempt.id, "sq1", ["o1"], BASE_TIME + 2_000);

    // Check session at BASE_TIME + 15s (question 1 timer of 10s has expired)
    const session = await loadQuizSession(quiz.id, userId, BASE_TIME + 15_000);
    expect(session.attempt?.currentQuestionIndex).toBe(1);
    expect(session.attempt?.answers).toHaveLength(1);
    // Draft was automatically recorded and isCorrect is withheld while in progress
    expect(session.attempt?.answers[0].selectedOptionIds).toEqual(["o1"]);
    expect(
      (session.attempt?.answers[0] as Record<string, unknown>).isCorrect
    ).toBeUndefined();

    // Check current question
    const current = await getCurrentQuestion(attempt.id, BASE_TIME + 15_000);
    expect(current.index).toBe(1);
    expect(current.question?.id).toBe("sq2");
  });

  it("enforces single attempt policy when retakesAllowed is false", async () => {
    const quiz = await createCustomQuiz({ retakesAllowed: false });
    const userId = "u1";

    const attempt = await startOrResumeAttempt(quiz.id, userId, BASE_TIME);
    await completeAttempt(attempt.id, BASE_TIME + 5_000);

    // Attempting to start another attempt must fail
    await expect(
      startOrResumeAttempt(quiz.id, userId, BASE_TIME + 10_000)
    ).rejects.toThrow("This quiz allows only one attempt.");
  });
});
