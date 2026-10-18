import { describe, expect, it } from "vitest";
import { router } from "../router";

describe("Router configuration", () => {
  it("initializes router with expected registered routes", () => {
    expect(router).toBeDefined();
    expect(router.routesByPath["/home"]).toBeDefined();
    expect(router.routesByPath["/quiz/$id"]).toBeDefined();
    expect(router.routesByPath["/leaderboard"]).toBeDefined();
    expect(router.routesByPath["/admin"]).toBeDefined();
  });

  it("validates home search parameters with fallback defaults", () => {
    const homeRoute = router.routesByPath["/home"];
    const validateSearch = homeRoute?.options?.validateSearch;

    expect(validateSearch).toBeDefined();

    if (typeof validateSearch === "function") {
      // Valid parameters
      expect(validateSearch({ status: "completed", page: 3 })).toEqual({
        status: "completed",
        page: 3,
      });

      // Invalid parameters fall back to defaults
      expect(validateSearch({ status: "invalid_status", page: -5 })).toEqual({
        status: "all",
        page: 1,
      });

      expect(validateSearch({})).toEqual({
        status: "all",
        page: 1,
      });
    }
  });
});
