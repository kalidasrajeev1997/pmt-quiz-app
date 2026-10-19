import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLeaderboard } from "../useLeaderboard";
import { useSelection } from "@/hooks/useSelection";
import {
  getLeaderboard,
  getLeaderboardQuizzes,
} from "@/services/leaderboard.service";
import * as router from "@tanstack/react-router";
import type { LeaderboardEntry, LeaderboardResult } from "@/types/leaderboard";

vi.mock("@tanstack/react-router", () => ({
  useSearch: vi.fn(),
  useNavigate: vi.fn(),
}));

vi.mock("@/hooks/useSelection", () => ({
  useSelection: vi.fn(),
}));

vi.mock("@/services/leaderboard.service", () => ({
  getLeaderboard: vi.fn(),
  getLeaderboardQuizzes: vi.fn(),
}));

const mockLeader: LeaderboardEntry = {
  rank: 1,
  userId: "user-1",
  name: "Ada Lovelace",
  score: 100,
  timeTakenSeconds: 60,
  quizzesCompleted: 2,
};

describe("useLeaderboard hook", () => {
  let queryClient: QueryClient;
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.mocked(router.useSearch).mockReturnValue({});
    vi.mocked(router.useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(useSelection).mockReturnValue({
      users: [],
      countries: [],
      selectedUser: {
        id: "user-me",
        name: "Grace Hopper",
        country: "IN",
        role: "user",
      },
      selectedCountry: null,
      isLoading: false,
      error: null,
      selectUser: vi.fn(),
      selectCountry: vi.fn(),
    });
    vi.mocked(getLeaderboardQuizzes).mockResolvedValue([
      { id: "quiz-1", title: "React Fundamentals" },
      { id: "quiz-2", title: "TypeScript Mastery" },
    ]);
    vi.mocked(getLeaderboard).mockResolvedValue({
      entries: [mockLeader],
      currentUser: mockLeader,
      totalParticipants: 1,
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("loads overall leaderboard by default when no quizId search param is present", async () => {
    const { result } = renderHook(() => useLeaderboard(), { wrapper });

    await waitFor(() => expect(result.current.leaderboard).toBeDefined());
    expect(result.current.quizId).toBeNull();
    expect(getLeaderboard).toHaveBeenCalledWith(null, 10, "user-me");
  });

  it("loads specific quiz leaderboard when quizId is provided in URL search params", async () => {
    vi.mocked(router.useSearch).mockReturnValue({ quizId: "quiz-1" });

    const { result } = renderHook(() => useLeaderboard(), { wrapper });

    await waitFor(() => expect(result.current.leaderboard).toBeDefined());
    expect(result.current.quizId).toBe("quiz-1");
    expect(getLeaderboard).toHaveBeenCalledWith("quiz-1", 10, "user-me");
  });

  it("navigates with updated search params when setQuizId is called", async () => {
    const { result } = renderHook(() => useLeaderboard(), { wrapper });

    await waitFor(() => expect(result.current.leaderboard).toBeDefined());

    await waitFor(() => {
      result.current.setQuizId("quiz-2");
    });
    expect(mockNavigate).toHaveBeenCalledWith({
      search: { quizId: "quiz-2" },
    });

    await waitFor(() => {
      result.current.setQuizId(null);
    });
    expect(mockNavigate).toHaveBeenCalledWith({
      search: { quizId: undefined },
    });
  });

  it("cleans up search param and falls back to null if quizId is not in available quizzes", async () => {
    vi.mocked(router.useSearch).mockReturnValue({ quizId: "non-existent-quiz" });

    const { result } = renderHook(() => useLeaderboard(), { wrapper });

    await waitFor(() => expect(result.current.quizId).toBeNull());
    expect(mockNavigate).toHaveBeenCalledWith({
      search: { quizId: undefined },
      replace: true,
    });
    expect(getLeaderboard).toHaveBeenCalledWith(null, 10, "user-me");
  });

  it("clears stale data and sets isLoading to true when switching users until fresh data is fetched", async () => {
    const { result, rerender } = renderHook(() => useLeaderboard(), { wrapper });

    await waitFor(() => expect(result.current.leaderboard).toBeDefined());
    expect(result.current.leaderboard?.entries[0].name).toBe("Ada Lovelace");
    expect(result.current.isLoading).toBe(false);

    // Prepare pending fetch for new user
    let resolveLeaderboard: (val: LeaderboardResult) => void;
    vi.mocked(getLeaderboard).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLeaderboard = resolve;
        }),
    );

    vi.mocked(useSelection).mockReturnValue({
      users: [],
      countries: [],
      selectedUser: {
        id: "user-2",
        name: "Alan Turing",
        country: "IN",
        role: "user",
      },
      selectedCountry: null,
      isLoading: false,
      error: null,
      selectUser: vi.fn(),
      selectCountry: vi.fn(),
    });

    rerender();

    // Stale data must NOT be shown; loading state must be active
    expect(result.current.leaderboard).toBeUndefined();
    expect(result.current.isLoading).toBe(true);

    await waitFor(() =>
      expect(getLeaderboard).toHaveBeenCalledWith(null, 10, "user-2"),
    );

    const freshLeader: LeaderboardEntry = {
      rank: 1,
      userId: "user-2",
      name: "Alan Turing",
      score: 150,
      timeTakenSeconds: 45,
      quizzesCompleted: 3,
    };
    resolveLeaderboard!({
      entries: [freshLeader],
      currentUser: freshLeader,
      totalParticipants: 2,
    });

    await waitFor(() => {
      expect(result.current.leaderboard?.entries[0].name).toBe("Alan Turing");
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("clears stale data and sets isLoading to true when user country changes until fresh data is fetched", async () => {
    const { result, rerender } = renderHook(() => useLeaderboard(), { wrapper });

    await waitFor(() => expect(result.current.leaderboard).toBeDefined());
    expect(result.current.leaderboard?.entries[0].name).toBe("Ada Lovelace");
    expect(result.current.isLoading).toBe(false);

    let resolveLeaderboard: (val: LeaderboardResult) => void;
    vi.mocked(getLeaderboard).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLeaderboard = resolve;
        }),
    );

    // Switch country for the user
    vi.mocked(useSelection).mockReturnValue({
      users: [],
      countries: [],
      selectedUser: {
        id: "user-me",
        name: "Grace Hopper",
        country: "US",
        role: "user",
      },
      selectedCountry: { code: "US", name: "United States" },
      isLoading: false,
      error: null,
      selectUser: vi.fn(),
      selectCountry: vi.fn(),
    });

    rerender();

    // Stale data for old country must NOT be shown
    expect(result.current.leaderboard).toBeUndefined();
    expect(result.current.isLoading).toBe(true);

    await waitFor(() =>
      expect(getLeaderboard).toHaveBeenCalledTimes(2),
    );

    const freshLeader: LeaderboardEntry = {
      rank: 1,
      userId: "user-us",
      name: "Margaret Hamilton",
      score: 180,
      timeTakenSeconds: 50,
      quizzesCompleted: 4,
    };
    resolveLeaderboard!({
      entries: [freshLeader],
      currentUser: freshLeader,
      totalParticipants: 5,
    });

    await waitFor(() => {
      expect(result.current.leaderboard?.entries[0].name).toBe("Margaret Hamilton");
      expect(result.current.isLoading).toBe(false);
    });
  });
});
