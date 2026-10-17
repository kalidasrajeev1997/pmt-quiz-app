import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { deleteDB } from "idb";
import seed from "../src/data/seed.json";
import { getQuizzes } from "../src/services/quiz.service";
import { getQuizzesQuery } from "../src/services/db/queries/quiz";
import {
  closeDatabase,
  DATABASE_NAME,
  deleteRecord,
  getAllRecords,
  getRecord,
  initializeDatabase,
  saveRecord,
} from "../src/services/db/database";

afterEach(async (): Promise<void> => {
  await closeDatabase();
  await deleteDB(DATABASE_NAME);
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
  const quizzes = await getQuizzesQuery(1, 100, "u1", "IN");
  assert.ok(quizzes.length > 0);

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

  assert.deepEqual(
    (await getQuizzes(1, 10, "u1", "IN")).map(({ id, status }) => ({
      id,
      status,
    })),
    [
      { id: "q2", status: "not-started" },
      { id: "q3", status: "completed" },
    ],
  );
  assert.deepEqual(
    (await getQuizzesQuery(1, 10, "u2", "GB")).map(({ id, status }) => ({
      id,
      status,
    })),
    [
      { id: "q2", status: "in-progress" },
      { id: "q3", status: "not-started" },
    ],
  );
  assert.deepEqual(
    (await getQuizzesQuery(1, 1, "u1", "IN", "completed")).map(({ id }) => id),
    ["q3"],
  );
  assert.deepEqual(await getQuizzesQuery(1, 10, "u1", "US"), []);
});

test("quiz queries derive status from attempts and time limits before pagination", async (context): Promise<void> => {
  const now = new Date("2026-10-17T10:00:00Z");
  context.mock.timers.enable({ apis: ["Date"], now });
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
      status: "in-progress",
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
      status: "in-progress",
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
      status: "in-progress",
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

  const quizzes = await getQuizzesQuery(1, 20, "u1", "IN");
  assert.deepEqual(
    quizzes.map(({ id, status }) => ({ id, status })),
    cases.map(({ id, status }) => ({ id, status })),
  );
  for (const status of ["not-started", "in-progress", "completed"] as const) {
    assert.deepEqual(
      await getQuizzesQuery(1, 20, "u1", "IN", status),
      quizzes.filter((quiz) => quiz.status === status),
    );
  }
  assert.deepEqual(await getQuizzesQuery(1, 20, "u1", "IN", "all"), quizzes);
  assert.deepEqual(await getQuizzesQuery(2, 2, "u1", "IN", "completed"), [
    quizzes[4],
    quizzes[6],
  ]);
  assert.deepEqual(await getQuizzesQuery(10, 2, "u1", "IN"), []);
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
