import { describe, expect, it } from "vitest";
import {
  createQuizAttempt,
  finishQuizAttempt,
  getDeadlines,
  reconcileQuizAttempt,
  recordAnswer,
  toCurrentQuestion,
  toPublicQuestion,
  toPublicQuiz,
  toQuizAttempt,
  toQuizResult,
  validateOptionIds,
  validateQuizAccess,
} from "@/helpers/quizHelpers";
import { QuizAttemptError } from "@/types/quiz";
import type {
  CompletedAttempt,
  InProgressAttempt,
  Quiz,
  User,
} from "@/types/quiz";

function makeQuiz(overrides: Partial<Quiz> = {}): Quiz {
  return {
    id: "quiz-1",
    title: "Sample Quiz",
    description: "Sample Description",
    countries: ["IN", "US"],
    retakesAllowed: true,
    timeLimitSeconds: 120,
    perQuestionSeconds: 30,
    questions: [
      {
        id: "q1",
        text: "Single choice question",
        type: "single",
        options: [
          { id: "opt1", text: "Option A" },
          { id: "opt2", text: "Option B" },
        ],
        correctOptionIds: ["opt1"],
      },
      {
        id: "q2",
        text: "Multiple choice question",
        type: "multiple",
        options: [
          { id: "m1", text: "Choice 1" },
          { id: "m2", text: "Choice 2" },
          { id: "m3", text: "Choice 3" },
        ],
        correctOptionIds: ["m1", "m3"],
      },
    ],
    ...overrides,
  };
}

describe("quizHelpers - Scoring Logic", () => {
  it("scores single-choice answers accurately", () => {
    const quiz = makeQuiz();
    const attempt = createQuizAttempt(quiz, "user-1", 1000);

    // Correct choice
    const afterCorrect = recordAnswer(
      quiz,
      attempt,
      ["opt1"],
      2000,
    ) as InProgressAttempt;
    expect(afterCorrect.answers[0].isCorrect).toBe(true);
    expect(afterCorrect.answers[0].selectedOptionIds).toEqual(["opt1"]);

    // Incorrect choice
    const afterWrong = recordAnswer(
      quiz,
      attempt,
      ["opt2"],
      2000,
    ) as InProgressAttempt;
    expect(afterWrong.answers[0].isCorrect).toBe(false);
  });

  it("scores multiple-choice answers only on exact set matches", () => {
    const quiz = makeQuiz();
    const attempt: InProgressAttempt = {
      ...createQuizAttempt(quiz, "user-1", 1000),
      currentQuestionIndex: 1, // question q2 (correct: m1, m3)
    };

    // Exact match -> correct
    const exact = recordAnswer(
      quiz,
      attempt,
      ["m1", "m3"],
      2000,
    ) as CompletedAttempt;
    expect(exact.answers[0].isCorrect).toBe(true);

    // Reversed order exact match -> correct
    const reversed = recordAnswer(
      quiz,
      attempt,
      ["m3", "m1"],
      2000,
    ) as CompletedAttempt;
    expect(reversed.answers[0].isCorrect).toBe(true);

    // Partial selection -> incorrect
    const partial = recordAnswer(
      quiz,
      attempt,
      ["m1"],
      2000,
    ) as CompletedAttempt;
    expect(partial.answers[0].isCorrect).toBe(false);

    // Extra selection -> incorrect
    const extra = recordAnswer(
      quiz,
      attempt,
      ["m1", "m2", "m3"],
      2000,
    ) as CompletedAttempt;
    expect(extra.answers[0].isCorrect).toBe(false);

    // Completely wrong -> incorrect
    const wrong = recordAnswer(quiz, attempt, ["m2"], 2000) as CompletedAttempt;
    expect(wrong.answers[0].isCorrect).toBe(false);
  });

  it("validates option IDs and rejects invalid submissions", () => {
    const singleQ = makeQuiz().questions[0];
    const multiQ = makeQuiz().questions[1];

    // Deduplicates repeated IDs
    expect(validateOptionIds(singleQ, ["opt1", "opt1"])).toEqual(["opt1"]);

    // Disallows multiple options for single-choice question
    expect(() => validateOptionIds(singleQ, ["opt1", "opt2"])).toThrow(
      QuizAttemptError,
    );

    // Rejects non-existent option IDs
    expect(() => validateOptionIds(singleQ, ["invalid-id"])).toThrow(
      QuizAttemptError,
    );
    expect(() => validateOptionIds(multiQ, ["m1", "non-existent"])).toThrow(
      QuizAttemptError,
    );
  });

  it("finishQuizAttempt computes score, rounded percentage, and time taken", () => {
    const quiz = makeQuiz();
    const startTime = Date.parse("2026-10-18T10:00:00Z");
    const finishTime = startTime + 45_000; // 45 seconds later

    const attempt: InProgressAttempt = {
      ...createQuizAttempt(quiz, "user-1", startTime),
      answers: [
        {
          questionId: "q1",
          selectedOptionIds: ["opt1"],
          isCorrect: true,
          answeredAt: new Date(startTime + 20_000).toISOString(),
        },
        {
          questionId: "q2",
          selectedOptionIds: ["m1"], // wrong (needed m1, m3)
          isCorrect: false,
          answeredAt: new Date(finishTime).toISOString(),
        },
      ],
    };

    const completed = finishQuizAttempt(attempt, finishTime);
    expect(completed.status).toBe("completed");
    expect(completed.score).toBe(1);
    expect(completed.percentage).toBe(50); // 1 out of 2 = 50%
    expect(completed.timeTakenSeconds).toBe(45);
    expect(completed.currentQuestionIndex).toBe(2);
    expect(completed.draftOptionIds).toEqual([]);
  });

  it("toQuizResult separates correct, incorrect, and unanswered questions", () => {
    const completedAttempt: CompletedAttempt = {
      id: "att-1",
      quizId: "quiz-1",
      userId: "user-1",
      startedAt: "2026-10-18T10:00:00Z",
      questionStartedAt: "2026-10-18T10:00:30Z",
      currentQuestionIndex: 3,
      totalQuestions: 3,
      status: "completed",
      completedAt: "2026-10-18T10:01:00Z",
      score: 1,
      percentage: 33,
      timeTakenSeconds: 60,
      draftOptionIds: [],
      quizSnapshot: "{}",
      answers: [
        {
          questionId: "q1",
          selectedOptionIds: ["opt1"],
          isCorrect: true,
          answeredAt: "...",
        },
        {
          questionId: "q2",
          selectedOptionIds: ["opt2"],
          isCorrect: false,
          answeredAt: "...",
        },
        {
          questionId: "q3",
          selectedOptionIds: [],
          isCorrect: false,
          answeredAt: "...",
        }, // unanswered
      ],
    };

    const result = toQuizResult(completedAttempt);
    expect(result.correctQuestions).toBe(1);
    expect(result.incorrectQuestions).toBe(1);
    expect(result.unansweredQuestions).toBe(1);
    expect((result as Record<string, unknown>).quizSnapshot).toBeUndefined();
  });

  it("toQuizAttempt hides answer keys and snapshots from in-progress attempts", () => {
    const quiz = makeQuiz();
    const inProgress = createQuizAttempt(quiz, "u1", 1000);
    const publicAttempt = toQuizAttempt(inProgress);

    expect(publicAttempt.status).toBe("in_progress");
    expect(
      (publicAttempt as Record<string, unknown>).quizSnapshot,
    ).toBeUndefined();
    expect(publicAttempt.score).toBeNull();
  });

  it("toPublicQuestion and toPublicQuiz strip correctOptionIds", () => {
    const quiz = makeQuiz();
    const publicQuiz = toPublicQuiz(quiz);

    for (const q of publicQuiz.questions) {
      expect("correctOptionIds" in q).toBe(false);
      expect(toPublicQuestion(quiz.questions[0])).not.toHaveProperty(
        "correctOptionIds",
      );
    }
  });
});

describe("quizHelpers - Timing Logic", () => {
  it("calculates deadlines for all combinations of overall and perQuestion limits", () => {
    const startedAt = "2026-10-18T10:00:00.000Z";
    const startedMs = Date.parse(startedAt);
    const questionStartedAt = "2026-10-18T10:00:10.000Z";
    const questionStartedMs = Date.parse(questionStartedAt);

    const attempt = {
      startedAt,
      questionStartedAt,
      answers: [],
    };

    // Both limits present
    const both = getDeadlines(
      { timeLimitSeconds: 100, perQuestionSeconds: 20 },
      attempt,
    );
    expect(both.overall).toBe(startedMs + 100_000);
    expect(both.question).toBe(questionStartedMs + 20_000);

    // Overall only
    const overallOnly = getDeadlines(
      { timeLimitSeconds: 60, perQuestionSeconds: null },
      attempt,
    );
    expect(overallOnly.overall).toBe(startedMs + 60_000);
    expect(overallOnly.question).toBeNull();

    // Per-question only
    const questionOnly = getDeadlines(
      { timeLimitSeconds: null, perQuestionSeconds: 15 },
      attempt,
    );
    expect(questionOnly.overall).toBeNull();
    expect(questionOnly.question).toBe(questionStartedMs + 15_000);

    // Neither limit
    const neither = getDeadlines(
      { timeLimitSeconds: null, perQuestionSeconds: null },
      attempt,
    );
    expect(neither.overall).toBeNull();
    expect(neither.question).toBeNull();
  });

  it("resolves questionStartedAt fallback in priority order", () => {
    const startedAt = "2026-10-18T10:00:00.000Z";
    const answeredAt = "2026-10-18T10:00:15.000Z";

    // Fallback to last answer answeredAt when questionStartedAt is undefined
    const withAnswer = getDeadlines(
      { timeLimitSeconds: null, perQuestionSeconds: 30 },
      { startedAt, questionStartedAt: undefined, answers: [{ answeredAt }] },
    );
    expect(withAnswer.question).toBe(Date.parse(answeredAt) + 30_000);

    // Fallback to startedAt when no answers and no questionStartedAt
    const withStarted = getDeadlines(
      { timeLimitSeconds: null, perQuestionSeconds: 30 },
      { startedAt, questionStartedAt: undefined, answers: [] },
    );
    expect(withStarted.question).toBe(Date.parse(startedAt) + 30_000);
  });

  it("toCurrentQuestion computes remaining seconds and clamps to 0", () => {
    const quiz = makeQuiz({ timeLimitSeconds: 60, perQuestionSeconds: 20 });
    const startTime = Date.parse("2026-10-18T10:00:00.000Z");
    const attempt = createQuizAttempt(quiz, "u1", startTime);

    // 5 seconds in
    const current = toCurrentQuestion(quiz, attempt, startTime + 5_000);
    expect(current.overallRemainingSeconds).toBe(55);
    expect(current.questionRemainingSeconds).toBe(15);
    expect(current.remainingSeconds).toBe(15); // min(55, 15)

    // After question expired (e.g. 25s elapsed)
    const expiredQ = toCurrentQuestion(quiz, attempt, startTime + 25_000);
    expect(expiredQ.questionRemainingSeconds).toBe(0);
    expect(expiredQ.remainingSeconds).toBe(0);

    // Completed attempt returns 0 remaining seconds
    const completed = finishQuizAttempt(attempt, startTime + 10_000);
    const currentCompleted = toCurrentQuestion(
      quiz,
      completed,
      startTime + 10_000,
    );
    expect(currentCompleted.remainingSeconds).toBe(0);
    expect(currentCompleted.question).toBeNull();
  });

  it("reconcileQuizAttempt auto-submits drafts and advances when question deadline passes", () => {
    const quiz = makeQuiz({ timeLimitSeconds: 300, perQuestionSeconds: 20 });
    const startTime = Date.parse("2026-10-18T10:00:00.000Z");
    const attempt: InProgressAttempt = {
      ...createQuizAttempt(quiz, "u1", startTime),
      draftOptionIds: ["opt1"],
    };

    // Time is 25s after start (deadline was 20s)
    const reconciled = reconcileQuizAttempt(quiz, attempt, startTime + 25_000);

    // Should have auto-recorded question 1 with draftOptionIds and moved to index 1
    expect(reconciled.currentQuestionIndex).toBe(1);
    expect(reconciled.answers).toHaveLength(1);
    expect(reconciled.answers[0].questionId).toBe("q1");
    expect(reconciled.answers[0].selectedOptionIds).toEqual(["opt1"]);
    expect(reconciled.answers[0].isCorrect).toBe(true);
  });

  it("reconcileQuizAttempt catches up multiple expired questions sequentially", () => {
    const quiz = makeQuiz({ timeLimitSeconds: 300, perQuestionSeconds: 10 });
    const startTime = Date.parse("2026-10-18T10:00:00.000Z");
    const attempt = createQuizAttempt(quiz, "u1", startTime);

    // Time is 25s after start (both q1 at 10s and q2 at 20s have expired)
    const reconciled = reconcileQuizAttempt(quiz, attempt, startTime + 25_000);

    // Both questions caught up, attempt finishes
    expect(reconciled.status).toBe("completed");
    expect(reconciled.answers).toHaveLength(2);
    expect(reconciled.answers[0].selectedOptionIds).toEqual([]);
    expect(reconciled.answers[1].selectedOptionIds).toEqual([]);
  });

  it("reconcileQuizAttempt auto-completes when overall deadline expires", () => {
    const quiz = makeQuiz({ timeLimitSeconds: 30, perQuestionSeconds: null });
    const startTime = Date.parse("2026-10-18T10:00:00.000Z");
    const attempt = createQuizAttempt(quiz, "u1", startTime);

    // Time is 40s after start (overall deadline was 30s)
    const reconciled = reconcileQuizAttempt(quiz, attempt, startTime + 40_000);

    expect(reconciled.status).toBe("completed");
    expect(reconciled.currentQuestionIndex).toBe(2);
    expect(reconciled.answers).toHaveLength(2);
  });

  it("reconcileQuizAttempt detects modified quiz and throws error", () => {
    const quiz = makeQuiz();
    const attempt = createQuizAttempt(quiz, "u1", 1000);

    // Modified quiz (different title/questions)
    const modifiedQuiz = { ...quiz, title: "Altered Quiz Title" };
    expect(() => reconcileQuizAttempt(modifiedQuiz, attempt, 2000)).toThrow(
      QuizAttemptError,
    );
  });
});

describe("quizHelpers - Country and Access Validation", () => {
  it("validateQuizAccess permits user when user's country is allowed", () => {
    const quiz = makeQuiz({ countries: ["IN", "US"] });
    const user: User = { id: "u1", name: "Alice", role: "user", country: "IN" };

    const validated = validateQuizAccess(quiz, user);
    expect(validated.id).toBe(quiz.id);
  });

  it("validateQuizAccess throws QuizAttemptError when user's country is not allowed", () => {
    const quiz = makeQuiz({ countries: ["IN"] });
    const user: User = { id: "u2", name: "Bob", role: "user", country: "US" };

    expect(() => validateQuizAccess(quiz, user)).toThrow(
      "This quiz is not available for the selected user.",
    );
  });

  it("validateQuizAccess throws QuizAttemptError when quiz was deleted", () => {
    const user: User = { id: "u1", name: "Alice", role: "user", country: "IN" };
    expect(() => validateQuizAccess(undefined, user)).toThrow(
      "This quiz was deleted. Your saved attempt cannot continue.",
    );
  });

  it("createQuizAttempt throws QuizAttemptError if quiz has no questions", () => {
    const emptyQuiz = makeQuiz({ questions: [] });
    expect(() => createQuizAttempt(emptyQuiz, "u1", 1000)).toThrow(
      "This quiz has no questions yet.",
    );
  });
});
