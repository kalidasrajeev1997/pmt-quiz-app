import "fake-indexeddb/auto";
import { deleteDB } from "idb";
import { afterEach, describe, expect, it } from "vitest";
import seed from "@/data/seed.json";
import { quizSchema } from "@/helpers/quizSchema";
import type { Quiz } from "@/types/quiz";
import {
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getAdminQuiz,
  getAdminQuizzes,
} from "../quiz.service";
import {
  closeDatabase,
  DATABASE_NAME,
  getAllRecords,
  saveRecord,
} from "../db/database";

const values = seed.quizzes[0] as Quiz;

afterEach(async () => {
  await closeDatabase();
  await deleteDB(DATABASE_NAME);
});

describe("admin quiz CRUD", () => {
  it("creates and updates quizzes, preserving IDs and country assignments", async () => {
    const created = await createQuiz({
      ...values,
      title: " New quiz ",
      countries: ["AE"],
    });
    expect(created.id).not.toBe(values.id);
    expect(created.title).toBe("New quiz");
    const updated = await updateQuiz(created.id, {
      ...created,
      title: "Edited",
      countries: ["GB", "IN"],
    });
    expect(await getAdminQuiz(created.id)).toEqual(updated);
    expect(updated.id).toBe(created.id);
    expect(updated.countries).toEqual(["GB", "IN"]);
    expect(await getAdminQuizzes()).toHaveLength(6);
  });

  it("rejects invalid data and missing records without creating a quiz", async () => {
    await expect(createQuiz({ ...values, title: " " })).rejects.toThrow();
    await expect(createQuiz({ ...values, countries: ["XX"] })).rejects.toThrow(
      "valid assigned country",
    );
    await expect(updateQuiz("missing", values)).rejects.toThrow("not found");
    expect(await getAdminQuizzes()).toHaveLength(5);
  });

  it("deletes only the selected quiz and its attempts", async () => {
    await deleteQuiz("q1");
    await expect(getAdminQuiz("q1")).rejects.toThrow("not found");
    const attempts = await getAllRecords("attempts");
    expect(attempts.some((attempt) => attempt.quizId === "q1")).toBe(false);
    expect(attempts.some((attempt) => attempt.quizId === "q2")).toBe(true);
  });

  it("keeps an existing attempt snapshot intact when a quiz is edited", async () => {
    await saveRecord("attempts", {
      ...seed.attempts[0],
      quizSnapshot: "original",
    } as never);
    await updateQuiz("q1", { ...values, title: "Updated" });
    expect((await getAllRecords("attempts"))[0].quizSnapshot).toBe("original");
  });

  it("does not restore deleted quizzes or attempts when the database reopens", async () => {
    for (const quiz of await getAdminQuizzes()) await deleteQuiz(quiz.id);
    await closeDatabase();
    expect(await getAdminQuizzes()).toEqual([]);
    expect(await getAllRecords("attempts")).toEqual([]);
  });
});

describe("quiz schema", () => {
  it.each([
    { ...values, title: "" },
    { ...values, questions: [] },
    { ...values, timeLimitSeconds: 0 },
    { ...values, perQuestionSeconds: 1.5 },
    { ...values, countries: [] },
    {
      ...values,
      questions: [
        { ...values.questions[0], options: [values.questions[0].options[0]] },
      ],
    },
    {
      ...values,
      questions: [{ ...values.questions[0], correctOptionIds: [] }],
    },
    {
      ...values,
      questions: [
        { ...values.questions[0], correctOptionIds: ["q1-1-o1", "q1-1-o2"] },
      ],
    },
    {
      ...values,
      questions: [{ ...values.questions[0], correctOptionIds: ["missing"] }],
    },
  ])("rejects invalid quiz input", (input) => {
    expect(quizSchema.safeParse(input).success).toBe(false);
  });

  it("accepts the complete seed structure", () => {
    for (const quiz of seed.quizzes)
      expect(quizSchema.safeParse(quiz).success).toBe(true);
  });
});
