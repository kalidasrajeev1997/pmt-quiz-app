import { beforeEach, describe, expect, it, vi } from "vitest";
import { getActiveUser, requireRole } from "../roleMiddleware";
import { createMemoryHistory, createRouter } from "@tanstack/react-router";
import { router } from "../router";

const selection = vi.hoisted(() => ({ country: "IN", user: "u1" }));
vi.mock("@/services/filters.service", () => ({
  getCountry: () => selection.country,
  getUser: () => selection.user,
}));
vi.mock("@/services/db/database", () => ({
  getAllRecords: async (table: string) =>
    table === "countries"
      ? [
          { code: "IN", name: "India" },
          { code: "GB", name: "United Kingdom" },
        ]
      : [
          { id: "u1", country: "IN", role: "user" },
          { id: "u5", country: "IN", role: "admin" },
          { id: "u3", country: "GB", role: "user" },
        ],
}));

describe("role middleware", () => {
  beforeEach(() => {
    selection.country = "IN";
    selection.user = "u1";
  });

  it("allows users only into user routes", async () => {
    await expect(requireRole("user")).resolves.toBeUndefined();
    await expect(requireRole("admin")).rejects.toMatchObject({
      options: { to: "/home" },
    });
  });

  it("allows admins only into admin routes", async () => {
    selection.user = "u5";
    await expect(requireRole("admin")).resolves.toBeUndefined();
    await expect(requireRole("user")).rejects.toMatchObject({
      options: { to: "/admin" },
    });
  });

  it("matches the header fallback after a country change", async () => {
    selection.user = "u5";
    selection.country = "GB";
    await expect(getActiveUser()).resolves.toMatchObject({
      id: "u3",
      role: "user",
    });
    await expect(requireRole("admin")).rejects.toMatchObject({
      options: { to: "/home" },
    });
  });

  it.each(["/admin", "/admin/quizzes/new", "/admin/quizzes/q1"])(
    "blocks direct user navigation to %s",
    async (path) => {
      const guardedRouter = createRouter({
        routeTree: router.routeTree,
        history: createMemoryHistory({ initialEntries: [path] }),
      });
      await guardedRouter.load();
      expect(guardedRouter.state.location.pathname).toBe("/home");
    },
  );

  it.each(["/", "/home", "/quiz/q1"])(
    "redirects admins from %s to their workspace",
    async (path) => {
      selection.user = "u5";
      const guardedRouter = createRouter({
        routeTree: router.routeTree,
        history: createMemoryHistory({ initialEntries: [path] }),
      });
      await guardedRouter.load();
      expect(guardedRouter.state.location.pathname).toBe("/admin");
    },
  );
});
