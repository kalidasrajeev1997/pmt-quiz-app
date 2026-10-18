import "fake-indexeddb/auto";
import { deleteDB } from "idb";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  closeDatabase,
  DATABASE_NAME,
  initializeDatabase,
  saveRecord,
} from "@/services/db/database";
import {
  getLeaderboard,
  getLeaderboardQuizzes,
} from "@/services/leaderboard.service";
import type { CompletedAttempt, Quiz } from "@/types/quiz";

describe("leaderboard service", () => {
  beforeEach(async () => {
    const database = await initializeDatabase();
    const transaction = database.transaction(
      ["attempts", "users", "quizzes"],
      "readwrite",
    );
    await Promise.all([
      transaction.objectStore("attempts").clear(),
      transaction.objectStore("users").clear(),
      transaction.objectStore("quizzes").clear(),
    ]);
    await transaction.done;
    const quiz: Quiz = {
      id: "quiz-a",
      title: "Alpha quiz",
      description: "",
      countries: ["IN"],
      timeLimitSeconds: null,
      perQuestionSeconds: null,
      retakesAllowed: true,
      questions: [],
    };
    await Promise.all([
      saveRecord("quizzes", quiz),
      saveRecord("quizzes", { ...quiz, id: "quiz-b", title: "Beta quiz" }),
      ...["Ada", "Ben", "Cleo"].map((name, index) =>
        saveRecord("users", {
          id: `user-${index + 1}`,
          name,
          country: "IN",
          role: "user",
        }),
      ),
    ]);
  });

  afterEach(async () => {
    await closeDatabase();
    await deleteDB(DATABASE_NAME);
  });

  async function addAttempt(
    id: string,
    userId: string,
    score: number,
    timeTakenSeconds: number,
    quizId = "quiz-a",
  ) {
    const attempt: CompletedAttempt = {
      id,
      userId,
      quizId,
      score,
      timeTakenSeconds,
      status: "completed",
      startedAt: "2026-10-18T10:00:00.000Z",
      completedAt: "2026-10-18T10:05:00.000Z",
      percentage: score * 10,
      totalQuestions: 10,
      currentQuestionIndex: 10,
      answers: [],
    };
    await saveRecord("attempts", attempt);
    return attempt;
  }

  it("ranks by score, breaks ties by faster time, and returns a user outside the limit", async () => {
    await addAttempt("a1", "user-1", 8, 90);
    await addAttempt("a2", "user-2", 8, 60);
    await addAttempt("a3", "user-3", 7, 20);

    const result = await getLeaderboard("quiz-a", 1, "user-3");
    expect(result.entries).toEqual([
      expect.objectContaining({ userId: "user-2", rank: 1, score: 8 }),
    ]);
    expect(result.currentUser).toMatchObject({ userId: "user-3", rank: 3 });
    expect(result.totalParticipants).toBe(3);
  });

  it("keeps only the highest score and then fastest retake per user and quiz", async () => {
    await addAttempt("a1", "user-1", 8, 90);
    await addAttempt("a2", "user-1", 7, 10);
    await addAttempt("a3", "user-1", 8, 60);
    await addAttempt("a4", "user-1", 8, 80);
    const result = await getLeaderboard("quiz-a");
    expect(result.totalParticipants).toBe(1);
    expect(result.entries[0]).toMatchObject({ score: 8, timeTakenSeconds: 60 });
  });

  it("sums best scores and completion times across quizzes for overall standings", async () => {
    await addAttempt("a1", "user-1", 8, 90);
    await addAttempt("a2", "user-1", 7, 20);
    await addAttempt("b1", "user-1", 6, 30, "quiz-b");
    await addAttempt("a3", "user-2", 9, 10);
    await addAttempt("b2", "user-2", 5, 60, "quiz-b");

    const result = await getLeaderboard(null, 10, "user-1");
    expect(result.entries.map((entry) => entry.userId)).toEqual([
      "user-2",
      "user-1",
    ]);
    expect(result.currentUser).toMatchObject({
      rank: 2,
      score: 14,
      timeTakenSeconds: 120,
      quizzesCompleted: 2,
    });
    expect((await getLeaderboard("quiz-b")).entries[0].score).toBe(6);
  });

  it("shares ranks for exact ties and orders those users deterministically", async () => {
    await addAttempt("a1", "user-2", 8, 60);
    await addAttempt("a2", "user-1", 8, 60);
    await addAttempt("a3", "user-3", 7, 20);
    const result = await getLeaderboard(null);
    expect(result.entries.map(({ name, rank }) => ({ name, rank }))).toEqual([
      { name: "Ada", rank: 1 },
      { name: "Ben", rank: 1 },
      { name: "Cleo", rank: 3 },
    ]);
  });

  it("excludes unfinished attempts and orphan records", async () => {
    const attempt = await addAttempt("a1", "user-1", 0, 30);
    await saveRecord("attempts", {
      ...attempt,
      id: "unfinished",
      userId: "user-2",
      status: "in_progress",
      completedAt: null,
      score: null,
      percentage: null,
      timeTakenSeconds: null,
    });
    await addAttempt("missing-user", "missing", 10, 5);
    await addAttempt("missing-quiz", "user-3", 10, 5, "missing");
    const result = await getLeaderboard(null, 10, "user-2");
    expect(result.totalParticipants).toBe(1);
    expect(result.entries[0].score).toBe(0);
    expect(result.currentUser).toBeNull();
  });

  it("handles empty standings and lists quiz choices without questions", async () => {
    expect(await getLeaderboard(null)).toEqual({
      entries: [],
      currentUser: null,
      totalParticipants: 0,
    });
    expect(await getLeaderboardQuizzes()).toEqual([
      { id: "quiz-a", title: "Alpha quiz" },
      { id: "quiz-b", title: "Beta quiz" },
    ]);
  });

  async function addQuiz(id: string, countries: string[]) {
    const database = await initializeDatabase();
    const quiz = await database.get("quizzes", "quiz-a");
    await saveRecord("quizzes", { ...quiz!, id, title: id, countries });
  }

  it("scopes quiz choices and overall scores to the user's country", async () => {
    await addQuiz("quiz-gb", ["GB"]);
    await addQuiz("quiz-shared", ["IN", "GB"]);
    await addAttempt("a1", "user-1", 8, 90);
    await addAttempt("foreign", "user-1", 10, 5, "quiz-gb");
    await addAttempt("shared", "user-1", 3, 30, "quiz-shared");
    await addAttempt("foreign-only", "user-2", 10, 5, "quiz-gb");

    const quizzes = await getLeaderboardQuizzes("user-1");
    expect(quizzes.map((quiz) => quiz.id)).toEqual([
      "quiz-a",
      "quiz-b",
      "quiz-shared",
    ]);
    const result = await getLeaderboard(null, 10, "user-1");
    expect(result.totalParticipants).toBe(1);
    expect(result.currentUser).toMatchObject({
      score: 11,
      timeTakenSeconds: 120,
      quizzesCompleted: 2,
    });
    await expect(getLeaderboard("quiz-gb", 10, "user-1")).rejects.toThrow(
      "Quiz not found.",
    );
  });

  it("allows admins to see quizzes and overall scores from every country", async () => {
    await saveRecord("users", {
      id: "admin",
      name: "Admin",
      country: "IN",
      role: "admin",
    });
    await addQuiz("quiz-gb", ["GB"]);
    await addAttempt("local", "user-1", 8, 90);
    await addAttempt("foreign", "user-1", 10, 5, "quiz-gb");

    expect(
      (await getLeaderboardQuizzes("admin")).map((quiz) => quiz.id),
    ).toContain("quiz-gb");
    expect((await getLeaderboard(null, 10, "admin")).entries[0]).toMatchObject({
      score: 18,
      timeTakenSeconds: 95,
      quizzesCompleted: 2,
    });
    expect(
      (await getLeaderboard("quiz-gb", 10, "admin")).entries[0].score,
    ).toBe(10);
  });

  it("scopes by quiz country rather than excluding participants from other countries", async () => {
    await saveRecord("users", {
      id: "user-2",
      name: "Ben",
      country: "GB",
      role: "user",
    });
    await addQuiz("quiz-gb", ["GB"]);
    await addAttempt("local", "user-2", 8, 90);
    await addAttempt("foreign", "user-1", 10, 5, "quiz-gb");

    expect(
      (await getLeaderboard("quiz-a", 10, "user-1")).entries[0].userId,
    ).toBe("user-2");
    expect(await getLeaderboardQuizzes("user-2")).toEqual([
      { id: "quiz-gb", title: "quiz-gb" },
    ]);
    expect((await getLeaderboard(null, 10, "user-2")).entries[0]).toMatchObject(
      { userId: "user-1", score: 10 },
    );
  });

  it("returns empty rankings when no quiz belongs to the user's country and rejects unknown viewers", async () => {
    await saveRecord("users", {
      id: "user-3",
      name: "Cleo",
      country: "AE",
      role: "user",
    });
    await addAttempt("local", "user-1", 8, 90);
    expect(await getLeaderboardQuizzes("user-3")).toEqual([]);
    expect(await getLeaderboard(null, 10, "user-3")).toEqual({
      entries: [],
      currentUser: null,
      totalParticipants: 0,
    });
    await expect(getLeaderboardQuizzes("missing")).rejects.toThrow(
      "User not found.",
    );
    await expect(getLeaderboard(null, 10, "missing")).rejects.toThrow(
      "User not found.",
    );
  });

  it("rejects invalid limits and unknown quizzes", async () => {
    for (const limit of [0, -1, 1.5, NaN, Infinity]) {
      await expect(getLeaderboard(null, limit)).rejects.toThrow(RangeError);
    }
    await expect(getLeaderboard("missing")).rejects.toThrow("Quiz not found.");
  });
});
