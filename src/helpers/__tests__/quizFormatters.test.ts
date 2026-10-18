import { describe, expect, it } from "vitest";
import { formatDuration } from "../quizFormatters";

describe("formatDuration", () => {
  it("formats seconds when less than 1 minute", () => {
    expect(formatDuration(45)).toBe("45 sec");
    expect(formatDuration(0)).toBe("0 sec");
  });

  it("formats exact minutes without seconds", () => {
    expect(formatDuration(60)).toBe("1 min");
    expect(formatDuration(120)).toBe("2 min");
  });

  it("formats minutes with remaining seconds", () => {
    expect(formatDuration(75)).toBe("1 min 15 sec");
    expect(formatDuration(150)).toBe("2 min 30 sec");
  });
});
