import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import { afterEach, test, vi } from "vitest";
import { deleteDB } from "idb";
import seed from "@/data/seed.json";
import {
  completeAttempt,
  getCurrentQuestion,
  getQuizzes,
  loadQuizSession,
  restartEditedAttempt,
  saveDraft,
  startOrResumeAttempt,
  submitAnswer,
} from "@/services/quiz.service";
import { getQuizzesQuery } from "@/services/db/queries/quiz";
import type { CompletedAttempt, InProgressAttempt } from "@/types/quiz";
import {
  closeDatabase,
  DATABASE_NAME,
  deleteRecord,
  getAllRecords,
  getRecord,
  initializeDatabase,
  resetDatabase,
  saveRecord,
} from "@/services/db/database";

afterEach(async (): Promise<void> => {
  vi.useRealTimers();
  await closeDatabase();
  await deleteDB(DATABASE_NAME);
});

async function attendanceFixture(
  overall: number | null = 120,
  perQuestion: number | null = 10,
) {
  const quiz = await getRecord("quizzes", "q1");
  assert.ok(quiz);
  await saveRecord("quizzes", {
    ...quiz,
    id: "attendance",
    countries: ["IN"],
    questions: quiz.questions.slice(0, 3),
    timeLimitSeconds: overall,
    perQuestionSeconds: perQuestion,
  });
  return {
    quizId: "attendance",
    userId: "u1",
    now: Date.parse("2026-10-17T10:00:00Z"),
  };
}

test("quiz attempt API resumes, hides answers, advances questions and returns results", async () => {
  const { quizId, userId, now } = await attendanceFixture(null, null);
  const attempt = await startOrResumeAttempt(quizId, userId, now);
  const resumed = await startOrResumeAttempt(quizId, userId, now + 1000);
  assert.equal(resumed.id, attempt.id);

  const current = await getCurrentQuestion(attempt.id, now + 1000);
  assert.ok(current.question);
  assert.equal("correctOptionIds" in current.question, false);
  assert.equal("answers" in current, false);
  assert.equal(current.index, 0);
  assert.equal(current.total, 3);
  assert.equal(current.remainingSeconds, null);

  const next = await submitAnswer(
    attempt.id,
    current.question.id,
    [current.question.options[0].id],
    now + 2000,
  );
  assert.equal(next.index, 1);
  const quiz = await getRecord("quizzes", quizId);
  assert.equal(next.question?.id, quiz?.questions[1].id);

  const result = await completeAttempt(attempt.id, now + 3000);
  assert.equal(result.status, "completed");
  assert.equal(result.correctQuestions + result.incorrectQuestions, 1);
  assert.equal(result.unansweredQuestions, 2);
  assert.equal(result.timeTakenSeconds, 3);
  assert.equal(
    (await getCurrentQuestion(attempt.id, now + 4000)).question,
    null,
  );
  assert.deepEqual(await completeAttempt(attempt.id, now + 5000), result);
});

test("attendance persists drafts and catches up every expired question after reopening", async () => {
  const { quizId, userId, now } = await attendanceFixture();
  const started = await startOrResumeAttempt(quizId, userId, now);
  const { question } = await getCurrentQuestion(started.id, now);
  assert.ok(question);
  await saveDraft(
    started.id,
    question.id,
    [question.options[0].id],
    now + 1000,
  );
  await closeDatabase();
  const resumed = await loadQuizSession(quizId, userId, now + 25000);
  assert.equal(resumed.attempt?.currentQuestionIndex, 2);
  assert.equal(resumed.attempt?.answers.length, 2);
  assert.deepEqual(resumed.attempt?.answers[0].selectedOptionIds, [
    question.options[0].id,
  ]);
  assert.equal(
    resumed.attempt?.questionStartedAt,
    new Date(now + 20000).toISOString(),
  );
  assert.equal(resumed.attempt?.startedAt, new Date(now).toISOString());
});

test("attendance serializes repeated submissions and concurrent starts", async () => {
  const { quizId, userId, now } = await attendanceFixture(null, null);
  const starts = await Promise.all([
    startOrResumeAttempt(quizId, userId, now),
    startOrResumeAttempt(quizId, userId, now),
  ]);
  assert.equal(starts[0].id, starts[1].id);
  const attempt = starts[0];
  const { question } = await getCurrentQuestion(attempt.id, now);
  assert.ok(question);
  await Promise.all(
    Array.from({ length: 5 }, () =>
      submitAnswer(
        attempt.id,
        question.id,
        [question.options[0].id],
        now + 1000,
      ),
    ),
  );
  const resumed = await loadQuizSession(quizId, userId, now + 2000);
  assert.equal(resumed.attempt?.answers.length, 1);
  assert.equal(resumed.attempt?.currentQuestionIndex, 1);
});

test("attendance overall expiry submits the draft and completes at the deadline", async () => {
  const { quizId, userId, now } = await attendanceFixture(5, null);
  const started = await startOrResumeAttempt(quizId, userId, now);
  const { question } = await getCurrentQuestion(started.id, now);
  assert.ok(question);
  await saveDraft(
    started.id,
    question.id,
    [question.options[0].id],
    now + 1000,
  );
  const expired = await loadQuizSession(quizId, userId, now + 60000);
  assert.equal(expired.attempt?.status, "completed");
  assert.equal(expired.attempt?.timeTakenSeconds, 5);
  assert.equal(expired.attempt?.answers.length, 3);
  assert.deepEqual(expired.attempt?.answers[0].selectedOptionIds, [
    question.options[0].id,
  ]);
});

test("attendance reports edited and deleted quizzes without modifying the saved attempt", async () => {
  const { quizId, userId, now } = await attendanceFixture();
  const started = await startOrResumeAttempt(quizId, userId, now);
  const savedAttempt = await getRecord("attempts", started.id);
  const quiz = await getRecord("quizzes", quizId);
  assert.ok(quiz);
  await saveRecord("quizzes", { ...quiz, title: "Changed title" });
  await assert.rejects(loadQuizSession(quizId, userId, now + 1000), /edited/);
  assert.deepEqual(await getRecord("attempts", started.id), savedAttempt);
  await deleteRecord("quizzes", quizId);
  await assert.rejects(loadQuizSession(quizId, userId, now + 2000), /deleted/);
});

test("attendance can restart an edited in-progress attempt without losing saved answers", async () => {
  const { quizId, userId, now } = await attendanceFixture();
  const quiz = await getRecord("quizzes", quizId);
  assert.ok(quiz);
  await saveRecord("quizzes", { ...quiz, retakesAllowed: false });

  const started = await startOrResumeAttempt(quizId, userId, now);
  const { question } = await getCurrentQuestion(started.id, now);
  assert.ok(question);
  await saveDraft(
    started.id,
    question.id,
    [question.options[0].id],
    now + 1000,
  );
  const savedAttempt = await getRecord("attempts", started.id);
  assert.ok(savedAttempt);

  await assert.rejects(
    restartEditedAttempt(quizId, userId, now + 2000),
    /cannot be restarted/,
  );
  await saveRecord("quizzes", {
    ...quiz,
    retakesAllowed: false,
    title: "Edited",
  });

  const restarted = await restartEditedAttempt(quizId, userId, now + 3000);
  assert.notEqual(restarted.id, started.id);
  assert.equal(restarted.status, "in_progress");
  assert.equal(restarted.answers.length, 0);
  assert.deepEqual(await getRecord("attempts", started.id), savedAttempt);
  assert.equal(
    (await loadQuizSession(quizId, userId, now + 4000)).attempt?.id,
    restarted.id,
  );
});

test("attendance scores exact multiple choice sets and enforces retake policy", async () => {
  const { quizId, userId, now } = await attendanceFixture(null, null);
  const quiz = await getRecord("quizzes", quizId);
  assert.ok(quiz);
  const question = quiz.questions[0];
  await saveRecord("quizzes", {
    ...quiz,
    retakesAllowed: false,
    questions: [
      {
        ...question,
        type: "multiple",
        correctOptionIds: question.options
          .slice(0, 2)
          .map((option) => option.id),
      },
    ],
  });
  const started = await startOrResumeAttempt(quizId, userId, now);
  const finished = await submitAnswer(
    started.id,
    question.id,
    question.options.slice(0, 2).map((option) => option.id),
    now + 1000,
  );
  assert.equal(finished.status, "completed");
  assert.equal(finished.question, null);
  const result = await completeAttempt(started.id, now + 1000);
  assert.equal(result.score, 1);
  assert.equal(result.percentage, 100);
  assert.equal(result.correctQuestions, 1);
  assert.equal(result.incorrectQuestions, 0);
  assert.equal(result.unansweredQuestions, 0);
  await assert.rejects(
    startOrResumeAttempt(quizId, userId, now + 2000),
    /one attempt/,
  );
  assert.equal(
    (await loadQuizSession(quizId, userId, now + 3000)).attempt?.id,
    started.id,
  );
  await saveRecord("quizzes", { ...quiz, retakesAllowed: true });
  const retake = await startOrResumeAttempt(quizId, userId, now + 4000);
  assert.notEqual(retake.id, started.id);
  assert.equal(retake.answers.length, 0);
});

test("attendance ignores late submissions, validates options, and preserves fresh drafts on reload", async () => {
  const { quizId, userId, now } = await attendanceFixture(null, 10);
  const started = await startOrResumeAttempt(quizId, userId, now);
  const { question } = await getCurrentQuestion(started.id, now);
  assert.ok(question);
  await assert.rejects(
    submitAnswer(started.id, question.id, [], now + 1000),
    /at least one/,
  );
  await assert.rejects(
    saveDraft(started.id, question.id, ["unknown-option"], now + 1000),
    /valid answer/,
  );
  await assert.rejects(
    submitAnswer(
      started.id,
      question.id,
      question.options.slice(0, 2).map((option) => option.id),
      now + 1000,
    ),
    /valid answer/,
  );
  await saveDraft(
    started.id,
    question.id,
    [question.options[0].id],
    now + 2000,
  );
  await closeDatabase();
  const resumed = await loadQuizSession(quizId, userId, now + 5000);
  assert.equal(resumed.attempt?.currentQuestionIndex, 0);
  assert.deepEqual(resumed.attempt?.draftOptionIds, [question.options[0].id]);
  const late = await submitAnswer(
    started.id,
    question.id,
    [question.options[1].id],
    now + 10000,
  );
  assert.equal(late.index, 1);
  const saved = await getRecord("attempts", started.id);
  assert.equal(saved?.answers.length, 1);
  assert.deepEqual(saved?.answers[0].selectedOptionIds, [
    question.options[0].id,
  ]);
  const expired = await loadQuizSession(quizId, userId, now + 60000);
  assert.equal(expired.attempt?.status, "completed");
  assert.equal(expired.attempt?.timeTakenSeconds, 30);
});

test("current question reports both timers and does not reveal stored answer keys", async () => {
  const { quizId, userId, now } = await attendanceFixture();
  const attempt = await startOrResumeAttempt(quizId, userId, now);
  assert.equal("quizSnapshot" in attempt, false);
  const current = await getCurrentQuestion(attempt.id, now + 1500);
  assert.equal(current.remainingSeconds, 9);
  assert.equal(current.questionRemainingSeconds, 9);
  assert.equal(current.overallRemainingSeconds, 119);
  assert.ok(current.question);
  await submitAnswer(
    attempt.id,
    current.question.id,
    [current.question.options[0].id],
    now + 2000,
  );
  const resumed = await startOrResumeAttempt(quizId, userId, now + 3000);
  assert.equal("quizSnapshot" in resumed, false);
  assert.equal("isCorrect" in resumed.answers[0], false);
  const next = await getCurrentQuestion(attempt.id, now + 3000);
  assert.equal(next.remainingSeconds, 9);
  assert.equal(next.overallRemainingSeconds, 117);
});

test("attempt API rejects missing records, unavailable quizzes and empty quizzes", async () => {
  const { quizId, userId, now } = await attendanceFixture();
  await assert.rejects(getCurrentQuestion("missing", now), /not found/);
  await assert.rejects(completeAttempt("missing", now), /not found/);
  await assert.rejects(
    submitAnswer("missing", "missing", ["missing"], now),
    /not found/,
  );
  await assert.rejects(startOrResumeAttempt("missing", userId, now), /deleted/);
  await assert.rejects(
    startOrResumeAttempt(quizId, "missing", now),
    /not available/,
  );
  const quiz = await getRecord("quizzes", quizId);
  assert.ok(quiz);
  await saveRecord("quizzes", { ...quiz, countries: [] });
  await assert.rejects(
    startOrResumeAttempt(quizId, userId, now),
    /not available/,
  );
  await saveRecord("quizzes", { ...quiz, questions: [] });
  await assert.rejects(
    startOrResumeAttempt(quizId, userId, now),
    /no questions/,
  );
});

test("completion scores correct, incorrect and unanswered questions separately", async () => {
  const { quizId, userId, now } = await attendanceFixture(null, null);
  const quiz = await getRecord("quizzes", quizId);
  assert.ok(quiz);
  const attempt = await startOrResumeAttempt(quizId, userId, now);
  await submitAnswer(
    attempt.id,
    quiz.questions[0].id,
    quiz.questions[0].correctOptionIds,
    now + 1000,
  );
  const wrong = quiz.questions[1].options.find(
    (option) => !quiz.questions[1].correctOptionIds.includes(option.id),
  );
  assert.ok(wrong);
  await submitAnswer(attempt.id, quiz.questions[1].id, [wrong.id], now + 2000);
  const result = await completeAttempt(attempt.id, now + 3000);
  assert.equal(result.score, 1);
  assert.equal(result.percentage, 33);
  assert.equal(result.correctQuestions, 1);
  assert.equal(result.incorrectQuestions, 1);
  assert.equal(result.unansweredQuestions, 1);
  assert.equal(result.timeTakenSeconds, 3);
  const late = await submitAnswer(
    attempt.id,
    quiz.questions[2].id,
    quiz.questions[2].correctOptionIds,
    now + 4000,
  );
  assert.equal(late.question, null);
  assert.deepEqual(await completeAttempt(attempt.id, now + 5000), result);
});

test("initialization seeds every empty table from the JSON file", async (): Promise<void> => {
  await initializeDatabase();

  assert.deepEqual(await getAllRecords("meta"), [seed.meta]);
  for (const tableName of [
    "countries",
    "users",
    "quizzes",
    "attempts",
  ] as const) {
    const records = await getAllRecords(tableName);
    assert.equal(records.length, seed[tableName].length);
    for (const record of seed[tableName]) {
      assert.ok(
        records.some(
          (stored) => JSON.stringify(stored) === JSON.stringify(record),
        ),
      );
    }
  }
});

test("concurrent initialization shares one connection without duplicate records", async (): Promise<void> => {
  const [firstDatabase, secondDatabase] = await Promise.all([
    initializeDatabase(),
    initializeDatabase(),
  ]);

  assert.equal(firstDatabase, secondDatabase);
  assert.equal((await getAllRecords("attempts")).length, seed.attempts.length);
});

test("reopening preserves edits and deletions in nonempty tables", async (): Promise<void> => {
  const user = await getRecord("users", "u1");
  assert.ok(user);
  await saveRecord("users", { ...user, name: "Updated name" });
  await deleteRecord("users", "u2");
  await closeDatabase();
  await initializeDatabase();

  assert.equal((await getRecord("users", "u1"))?.name, "Updated name");
  assert.equal(await getRecord("users", "u2"), undefined);
  assert.equal((await getAllRecords("users")).length, seed.users.length - 1);
});

test("reopening seeds only empty tables", async (): Promise<void> => {
  const database = await initializeDatabase();
  await database.clear("countries");
  await saveRecord("users", {
    id: "custom-user",
    name: "Custom User",
    country: "IN",
    role: "user",
  });
  await closeDatabase();
  await initializeDatabase();

  assert.equal(
    (await getAllRecords("countries")).length,
    seed.countries.length,
  );
  assert.equal((await getRecord("users", "custom-user"))?.name, "Custom User");
  assert.equal((await getAllRecords("users")).length, seed.users.length + 1);
});

test("quiz queries omit answer keys without changing stored questions", async (): Promise<void> => {
  const { quizzes, total } = await getQuizzesQuery(1, 100, "u1", "IN");
  assert.ok(quizzes.length > 0);
  assert.equal(total, quizzes.length);

  for (const quiz of quizzes) {
    const storedQuiz = await getRecord("quizzes", quiz.id);
    assert.ok(storedQuiz);
    assert.ok(quiz.questions.length > 0);
    assert.deepEqual(
      quiz.questions,
      storedQuiz.questions.map(({ id, text, type, options }) => ({
        id,
        text,
        type,
        options,
      })),
    );
    for (const question of quiz.questions) {
      assert.equal("correctOptionIds" in question, false);
    }
    assert.ok(
      storedQuiz.questions.every(
        (question) => question.correctOptionIds.length > 0,
      ),
    );
  }
});

test("quiz queries scope attempts to the user and filter countries before pagination", async (): Promise<void> => {
  const database = await initializeDatabase();
  const quiz = await database.get("quizzes", "q1");
  const activeAttempt = await database.get("attempts", "a11");
  const completedAttempt = await database.get("attempts", "a1");
  assert.ok(quiz);
  assert.ok(activeAttempt);
  assert.ok(completedAttempt);
  await database.clear("quizzes");
  await database.clear("attempts");

  for (const id of ["q1", "q2", "q3"]) {
    await database.put("quizzes", {
      ...quiz,
      id,
      countries: id === "q1" ? ["AE"] : ["IN", "GB"],
      timeLimitSeconds: null,
      perQuestionSeconds: null,
    });
  }
  await database.put("attempts", {
    ...activeAttempt,
    quizId: "q2",
    userId: "u2",
  });
  await database.put("attempts", {
    ...completedAttempt,
    quizId: "q3",
    userId: "u1",
  });

  const result = await getQuizzes(1, 10, "u1", "IN");
  assert.equal(result.total, 2);
  assert.deepEqual(
    result.quizzes.map(({ id, status }) => ({
      id,
      status,
    })),
    [
      { id: "q2", status: "not-started" },
      { id: "q3", status: "completed" },
    ],
  );
  assert.deepEqual(
    (await getQuizzesQuery(1, 10, "u2", "GB")).quizzes.map(
      ({ id, status }) => ({
        id,
        status,
      }),
    ),
    [
      { id: "q2", status: "in_progress" },
      { id: "q3", status: "not-started" },
    ],
  );
  assert.deepEqual(
    (await getQuizzesQuery(1, 1, "u1", "IN", "completed")).quizzes.map(
      ({ id }) => id,
    ),
    ["q3"],
  );
  assert.deepEqual(await getQuizzesQuery(1, 10, "u1", "US"), {
    quizzes: [],
    total: 0,
  });
});

test("quiz queries keep correct, incorrect, and unanswered questions separate", async (): Promise<void> => {
  const now = new Date("2026-10-17T10:00:00Z");
  vi.useFakeTimers({ toFake: ["Date"], now });
  const database = await initializeDatabase();
  const quiz = await database.get("quizzes", "q1");
  const attempt = (await database.get("attempts", "a11")) as InProgressAttempt;
  const completedAttempt = (await database.get(
    "attempts",
    "a1",
  )) as CompletedAttempt;
  assert.ok(quiz);
  assert.ok(attempt);
  assert.ok(completedAttempt);
  await database.clear("quizzes");
  await database.clear("attempts");
  const questions = quiz.questions.slice(0, 5);
  const answers = [
    {
      ...attempt.answers[0],
      questionId: questions[0].id,
      isCorrect: false,
      answeredAt: "2026-10-17T09:59:50Z",
    },
    {
      ...attempt.answers[0],
      questionId: questions[0].id,
      isCorrect: true,
      answeredAt: "2026-10-17T09:59:40Z",
    },
    { ...attempt.answers[0], questionId: questions[1].id, isCorrect: true },
    {
      ...attempt.answers[0],
      questionId: questions[2].id,
      selectedOptionIds: [],
      isCorrect: false,
    },
    { ...attempt.answers[0], questionId: "unknown-question", isCorrect: true },
  ];

  for (const id of ["active", "expired", "finished", "untouched", "empty"]) {
    await database.put("quizzes", {
      ...quiz,
      id,
      questions: id === "empty" ? [] : questions,
      timeLimitSeconds: 300,
    });
    if (id !== "untouched" && id !== "empty") {
      await database.put("attempts", {
        ...attempt,
        id,
        quizId: id,
        userId: "u1",
        totalQuestions: 5,
        answers,
        startedAt:
          id === "expired" ? "2026-10-17T09:50:00Z" : "2026-10-17T09:59:00Z",
      });
    }
  }
  await database.put("attempts", {
    ...completedAttempt,
    id: "finished",
    quizId: "finished",
    userId: "u1",
    totalQuestions: 5,
    answers,
    score: 1,
    percentage: 20,
  });
  await database.put("attempts", {
    ...completedAttempt,
    id: "prior-retake",
    quizId: "active",
    userId: "u1",
    startedAt: "2026-10-16T09:00:00Z",
  });
  await database.put("attempts", {
    ...completedAttempt,
    id: "other-user",
    quizId: "untouched",
    userId: "u2",
  });

  const { quizzes } = await getQuizzesQuery(1, 10, "u1", "IN");
  for (const id of ["active", "expired", "finished"]) {
    const result = quizzes.find((quiz) => quiz.id === id);
    assert.ok(result);
    assert.equal(result.answeredQuestions, 2);
    assert.equal(result.correctQuestions, 1);
    assert.equal(result.incorrectQuestions, 1);
    assert.equal(result.unansweredQuestions, 3);
    assert.equal(result.score, id === "active" ? null : 1);
    assert.equal(result.scorePercentage, id === "active" ? null : 20);
    assert.equal("answers" in result, false);
    assert.ok(
      result.questions.every((question) => !("correctOptionIds" in question)),
    );
  }
  const untouched = quizzes.find((quiz) => quiz.id === "untouched");
  assert.ok(untouched);
  assert.equal(untouched.answeredQuestions, 0);
  assert.equal(untouched.correctQuestions, 0);
  assert.equal(untouched.incorrectQuestions, 0);
  assert.equal(untouched.unansweredQuestions, 5);
  assert.equal(untouched.score, null);
  assert.equal(
    quizzes.find((quiz) => quiz.id === "empty")?.unansweredQuestions,
    0,
  );
  assert.deepEqual(
    (await database.get("attempts", "finished"))?.answers,
    answers,
  );
  assert.equal(
    (await database.get("attempts", "expired"))?.status,
    "in_progress",
  );
});

test("quiz queries derive status from attempts and time limits before pagination", async (): Promise<void> => {
  const now = new Date("2026-10-17T10:00:00Z");
  vi.useFakeTimers({ toFake: ["Date"], now });
  const database = await initializeDatabase();
  const quiz = await database.get("quizzes", "q1");
  const activeAttempt = await database.get("attempts", "a11");
  const completedAttempt = await database.get("attempts", "a1");
  assert.ok(quiz);
  assert.ok(activeAttempt);
  assert.ok(completedAttempt);
  await database.clear("quizzes");
  await database.clear("attempts");

  const cases = [
    {
      id: "q1",
      status: "not-started",
      elapsed: null,
      total: 60,
      perQuestion: null,
    },
    {
      id: "q2",
      status: "in_progress",
      elapsed: 59,
      total: 60,
      perQuestion: null,
    },
    {
      id: "q3",
      status: "completed",
      elapsed: 60,
      total: 60,
      perQuestion: null,
    },
    {
      id: "q4",
      status: "completed",
      elapsed: 61,
      total: 60,
      perQuestion: null,
    },
    {
      id: "q5",
      status: "completed",
      elapsed: null,
      total: null,
      perQuestion: null,
    },
    {
      id: "q6",
      status: "in_progress",
      elapsed: 10000,
      total: null,
      perQuestion: null,
    },
    {
      id: "q7",
      status: "completed",
      elapsed: 50,
      total: null,
      perQuestion: 10,
    },
    {
      id: "q8",
      status: "in_progress",
      elapsed: 49,
      total: null,
      perQuestion: 10,
    },
    { id: "q9", status: "completed", elapsed: 50, total: 100, perQuestion: 10 },
  ] as const;

  for (const scenario of cases) {
    await database.put("quizzes", {
      ...quiz,
      id: scenario.id,
      timeLimitSeconds: scenario.total,
      perQuestionSeconds: scenario.perQuestion,
    });
    if (scenario.elapsed !== null) {
      await database.put("attempts", {
        ...activeAttempt,
        id: `active-${scenario.id}`,
        quizId: scenario.id,
        userId: "u1",
        totalQuestions: 5,
        answers: [
          { ...activeAttempt.answers[0], questionId: quiz.questions[0].id },
          { ...activeAttempt.answers[0], questionId: quiz.questions[0].id },
          { ...activeAttempt.answers[0], questionId: "unknown-question" },
          {
            ...activeAttempt.answers[0],
            questionId: quiz.questions[1].id,
            selectedOptionIds: [],
          },
        ],
        startedAt: new Date(
          now.getTime() - scenario.elapsed * 1000,
        ).toISOString(),
      });
    }
    if (scenario.id === "q2" || scenario.id === "q5") {
      await database.put("attempts", {
        ...completedAttempt,
        id: `completed-${scenario.id}`,
        quizId: scenario.id,
        userId: "u1",
      });
    }
  }

  const { quizzes, total } = await getQuizzesQuery(1, 20, "u1", "IN");
  assert.equal(total, cases.length);
  assert.deepEqual(
    quizzes.map(({ id, status }) => ({ id, status })),
    cases.map(({ id, status }) => ({ id, status })),
  );
  assert.deepEqual(
    quizzes.map(({ answeredQuestions }) => answeredQuestions),
    cases.map((scenario) =>
      scenario.elapsed !== null
        ? 1
        : scenario.id === "q5"
          ? quiz.questions.length
          : 0,
    ),
  );
  assert.ok(quizzes.every((quiz) => !("answers" in quiz)));
  for (const status of ["not-started", "in_progress", "completed"] as const) {
    const matchingQuizzes = quizzes.filter((quiz) => quiz.status === status);
    assert.deepEqual(await getQuizzesQuery(1, 20, "u1", "IN", status), {
      quizzes: matchingQuizzes,
      total: matchingQuizzes.length,
    });
  }
  assert.deepEqual(await getQuizzesQuery(1, 20, "u1", "IN", "all"), {
    quizzes,
    total,
  });
  assert.deepEqual(await getQuizzesQuery(2, 2, "u1", "IN", "completed"), {
    quizzes: [quizzes[4], quizzes[6]],
    total: 5,
  });
  assert.deepEqual(await getQuizzesQuery(3, 2, "u1", "IN", "completed"), {
    quizzes: [quizzes[8]],
    total: 5,
  });
  assert.deepEqual(await getQuizzesQuery(10, 2, "u1", "IN"), {
    quizzes: [],
    total: cases.length,
  });
  assert.equal(
    (await database.get("attempts", "active-q3"))?.status,
    "in_progress",
  );
  assert.equal("status" in (await database.get("quizzes", "q3"))!, false);
  for (const invalid of [0, -1, 1.5, NaN, Infinity]) {
    await assert.rejects(getQuizzesQuery(invalid, 2, "u1", "IN"), RangeError);
    await assert.rejects(getQuizzesQuery(1, invalid, "u1", "IN"), RangeError);
  }
});

test("resetDatabase clears modifications and restores seed data", async () => {
  await initializeDatabase();
  const quiz = await getRecord("quizzes", "q1");
  assert.ok(quiz);
  await saveRecord("quizzes", { ...quiz, title: "Modified Title" });
  assert.equal((await getRecord("quizzes", "q1"))?.title, "Modified Title");

  await saveRecord("quizzes", {
    ...quiz,
    id: "new-custom-quiz",
    title: "Custom Quiz",
  });
  assert.ok(await getRecord("quizzes", "new-custom-quiz"));

  await deleteRecord("attempts", "a1");
  assert.equal(await getRecord("attempts", "a1"), undefined);

  await resetDatabase();

  const restoredQ1 = await getRecord("quizzes", "q1");
  assert.equal(restoredQ1?.title, quiz.title);

  assert.equal(await getRecord("quizzes", "new-custom-quiz"), undefined);

  const restoredA1 = await getRecord("attempts", "a1");
  assert.ok(restoredA1);

  const allQuizzes = await getAllRecords("quizzes");
  assert.equal(allQuizzes.length, seed.quizzes.length);

  const allAttempts = await getAllRecords("attempts");
  assert.equal(allAttempts.length, seed.attempts.length);

  const allUsers = await getAllRecords("users");
  assert.equal(allUsers.length, seed.users.length);

  const allCountries = await getAllRecords("countries");
  assert.equal(allCountries.length, seed.countries.length);
});
