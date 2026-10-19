import { lazyRouteComponent } from "@tanstack/react-router";
import { describe, expect, it, vi } from "vitest";
import { router } from "../router";

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    lazyRouteComponent: vi.fn(actual.lazyRouteComponent),
  };
});

describe("Router configuration", () => {
  it("initializes router with expected registered routes", () => {
    expect(router).toBeDefined();
    expect(router.routesByPath["/home"]).toBeDefined();
    expect(router.routesByPath["/quiz/$id"]).toBeDefined();
    expect(router.routesByPath["/leaderboard"]).toBeDefined();
    expect(router.routesByPath["/admin"]).toBeDefined();
    expect(router.routesByPath["/settings"]).toBeDefined();
  });

  it("defers all six page modules through lazy route components", async () => {
    const lazyComponents = vi.mocked(lazyRouteComponent);

    expect(lazyComponents).toHaveBeenCalledTimes(6);

    for (const [importPage] of lazyComponents.mock.calls) {
      const page = await importPage();
      expect(page.default).toBeTypeOf("function");
    }
  });

  it.each([
    "/home",
    "/admin",
    "/admin/quizzes/new",
    "/admin/quizzes/$id",
    "/quiz/$id",
    "/leaderboard",
    "/settings",
  ] as const)("allows the router to preload %s", (path) => {
    expect(router.routesByPath[path].options.component?.preload).toBeTypeOf(
      "function",
    );
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

  it("validates leaderboard search parameters", () => {
    const leaderboardRoute = router.routesByPath["/leaderboard"];
    const validateSearch = leaderboardRoute?.options?.validateSearch;

    expect(validateSearch).toBeDefined();

    if (typeof validateSearch === "function") {
      // Valid quizId parameter
      expect(validateSearch({ quizId: "quiz-123" })).toEqual({
        quizId: "quiz-123",
      });

      // Whitespace or empty quizId falls back to undefined
      expect(validateSearch({ quizId: "   " })).toEqual({
        quizId: undefined,
      });

      expect(validateSearch({ quizId: 123 })).toEqual({
        quizId: undefined,
      });

      // Missing search parameter
      expect(validateSearch({})).toEqual({
        quizId: undefined,
      });
    }
  });
});
