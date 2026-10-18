import { describe, expect, it } from "vitest";
import TAB_VALUES from "../tabs";

describe("TAB_VALUES", () => {
  it("includes all expected quiz tab statuses", () => {
    expect(TAB_VALUES).toEqual(["all", "not-started", "in_progress", "completed"]);
  });
});
