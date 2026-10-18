import { describe, expect, it } from "vitest";
import { QuizButtonLabel } from "@/helpers/quizStatus";

describe("QuizButtonLabel", () => {
  it("returns Start Quiz for not-started status", () => {
    const res = QuizButtonLabel({ status: "not-started" });
    expect(res.label).toBe("Start Quiz");
    expect(res.icon).toBeDefined();
  });

  it("returns Continue Quiz for in_progress status", () => {
    const res = QuizButtonLabel({ status: "in_progress" });
    expect(res.label).toBe("Continue Quiz");
    expect(res.icon).toBeDefined();
  });

  it("returns Retake quiz for completed status", () => {
    const res = QuizButtonLabel({ status: "completed" });
    expect(res.label).toBe("Retake quiz");
    expect(res.icon).toBeDefined();
  });

  it("returns Unknown Status for unfamiliar status", () => {
    const res = QuizButtonLabel({ status: "other" });
    expect(res.label).toBe("Unknown Status");
    expect(res.icon).toBeDefined();
  });
});
