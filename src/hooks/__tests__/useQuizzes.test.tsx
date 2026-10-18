import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useQuizzes } from "../useQuizzes";
import { useSelection } from "@/hooks/useSelection";
import { getQuizzes } from "@/services/quiz.service";
import * as router from "@tanstack/react-router";

vi.mock("@tanstack/react-router", () => ({
  useSearch: vi.fn(),
  useNavigate: vi.fn(),
}));

vi.mock("@/hooks/useSelection", () => ({
  useSelection: vi.fn(),
}));

vi.mock("@/services/quiz.service", () => ({
  getQuizzes: vi.fn(),
}));

describe("useQuizzes hook", () => {
  let queryClient: QueryClient;
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.mocked(router.useSearch).mockReturnValue({ status: "all", page: 1 });
    vi.mocked(router.useNavigate).mockReturnValue(mockNavigate);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("handles selection loading and no selection state", () => {
    vi.mocked(useSelection).mockReturnValue({
      users: [],
      countries: [],
      selectedUser: null,
      selectedCountry: null,
      isLoading: true,
      error: null,
      selectUser: vi.fn(),
      selectCountry: vi.fn(),
    });

    const { result } = renderHook(() => useQuizzes(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.hasSelection).toBe(false);
    expect(result.current.quizzes).toBeUndefined();
  });

  it("loads quizzes successfully when selection is available", async () => {
    vi.mocked(useSelection).mockReturnValue({
      users: [],
      countries: [],
      selectedUser: { id: "u-1", name: "Alice", country: "IN", role: "user" },
      selectedCountry: { code: "IN", name: "India" },
      isLoading: false,
      error: null,
      selectUser: vi.fn(),
      selectCountry: vi.fn(),
    });

    const mockQuizzes = [
      {
        id: "q-1",
        title: "Test Quiz",
        category: "Tech",
        description: "Desc",
        timeLimitSeconds: 60,
        perQuestionSeconds: null,
        retakesAllowed: true,
        countries: ["IN"],
        status: "not-started" as const,
        attempt: null,
        totalTimeSeconds: 60,
        deadline: null,
        answeredQuestions: 0,
        correctQuestions: 0,
        incorrectQuestions: 0,
        unansweredQuestions: 0,
        score: null,
        scorePercentage: null,
        questions: [],
      },
    ];

    vi.mocked(getQuizzes).mockResolvedValue({
      quizzes: mockQuizzes,
      total: 15,
    });

    const { result } = renderHook(() => useQuizzes({ pageSize: 10 }), { wrapper });

    await waitFor(() => {
      expect(result.current.quizzes).toEqual(mockQuizzes);
    });

    expect(result.current.total).toBe(15);
    expect(result.current.totalPages).toBe(2);
    expect(result.current.hasSelection).toBe(true);
    expect(result.current.tab).toBe("all");
    expect(result.current.page).toBe(1);
  });

  it("calls navigate on setTab and setPage", () => {
    vi.mocked(useSelection).mockReturnValue({
      users: [],
      countries: [],
      selectedUser: null,
      selectedCountry: null,
      isLoading: false,
      error: null,
      selectUser: vi.fn(),
      selectCountry: vi.fn(),
    });

    const { result } = renderHook(() => useQuizzes(), { wrapper });

    result.current.setTab("completed");
    expect(mockNavigate).toHaveBeenCalledWith({
      search: { status: "completed", page: 1 },
    });

    result.current.setPage(3);
    expect(mockNavigate).toHaveBeenCalled();
  });

  it("reports error when getQuizzes fails", async () => {
    vi.mocked(useSelection).mockReturnValue({
      users: [],
      countries: [],
      selectedUser: { id: "u-1", name: "Alice", country: "IN", role: "user" },
      selectedCountry: { code: "IN", name: "India" },
      isLoading: false,
      error: null,
      selectUser: vi.fn(),
      selectCountry: vi.fn(),
    });

    vi.mocked(getQuizzes).mockRejectedValue(new Error("Network failed"));

    const { result } = renderHook(() => useQuizzes(), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBe("Error loading quizzes: Network failed");
    });
  });
});
