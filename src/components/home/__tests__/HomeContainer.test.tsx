import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HomeContainer from "../HomeContainer";
import { useQuizzes } from "@/hooks/useQuizzes";
import type { QuizQueryResult } from "@/services/db/queries/quiz";
import type { TabStatus } from "@/types/quiz";

vi.mock("@/hooks/useQuizzes", () => ({
  useQuizzes: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useRouter: vi.fn().mockReturnValue({
    buildLocation: vi.fn().mockReturnValue({ href: "#" }),
  }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  Link: ({
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props}>{children}</a>
  ),
}));

describe("HomeContainer", () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <HomeContainer />
      </QueryClientProvider>,
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading skeletons when isLoading is true", () => {
    vi.mocked(useQuizzes).mockReturnValue({
      quizzes: undefined,
      total: 0,
      totalPages: 1,
      tab: "all",
      page: 1,
      pageSize: 10,
      setTab: vi.fn(),
      setPage: vi.fn(),
      isLoading: true,
      isFetching: false,
      error: null,
      hasSelection: true,
    });

    renderComponent();

    expect(screen.getByText("Loading quizzes...")).toBeInTheDocument();
  });

  it("renders error alert when error occurs", () => {
    vi.mocked(useQuizzes).mockReturnValue({
      quizzes: undefined,
      total: 0,
      totalPages: 1,
      tab: "all",
      page: 1,
      pageSize: 10,
      setTab: vi.fn(),
      setPage: vi.fn(),
      isLoading: false,
      isFetching: false,
      error: "Failed to fetch quizzes",
      hasSelection: true,
    });

    renderComponent();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Failed to fetch quizzes",
    );
  });

  it("renders message when no user or country is selected", () => {
    vi.mocked(useQuizzes).mockReturnValue({
      quizzes: undefined,
      total: 0,
      totalPages: 1,
      tab: "all",
      page: 1,
      pageSize: 10,
      setTab: vi.fn(),
      setPage: vi.fn(),
      isLoading: false,
      isFetching: false,
      error: null,
      hasSelection: false,
    });

    renderComponent();

    expect(
      screen.getByText("No user or country available."),
    ).toBeInTheDocument();
  });

  it.each<{ tab: TabStatus; title: string; description: string }>([
    {
      tab: "all",
      title: "No quizzes found.",
      description: "No quizzes are available for this country yet.",
    },
    {
      tab: "not-started",
      title: "No unstarted quizzes",
      description: "There are no quizzes waiting to be started.",
    },
    {
      tab: "in_progress",
      title: "No quizzes in progress",
      description: "Your ongoing quizzes will appear here.",
    },
    {
      tab: "completed",
      title: "No completed quizzes yet",
      description: "Your completed quizzes will appear here.",
    },
  ])(
    "renders the empty state for $tab quizzes",
    ({ tab, title, description }) => {
      vi.mocked(useQuizzes).mockReturnValue({
        quizzes: [],
        total: 0,
        totalPages: 1,
        tab,
        page: 1,
        pageSize: 10,
        setTab: vi.fn(),
        setPage: vi.fn(),
        isLoading: false,
        isFetching: false,
        error: null,
        hasSelection: true,
      });

      renderComponent();

      expect(screen.getByRole("status", { name: title })).toHaveTextContent(
        description,
      );
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
      expect(
        screen.queryByRole("list", { name: "Quizzes" }),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole("article")).not.toBeInTheDocument();
    },
  );

  it("renders quiz cards when quizzes are present", () => {
    const mockQuiz: QuizQueryResult = {
      id: "q-1",
      title: "Science 101",
      description: "Basic science",
      timeLimitSeconds: 60,
      perQuestionSeconds: null,
      retakesAllowed: true,
      countries: ["IN"],
      status: "not-started",
      totalTimeSeconds: 60,
      deadline: null,
      answeredQuestions: 0,
      correctQuestions: 0,
      incorrectQuestions: 0,
      unansweredQuestions: 1,
      score: null,
      scorePercentage: null,
      questions: [
        {
          id: "q1",
          text: "Earth is flat?",
          type: "single",
          options: [
            { id: "o1", text: "True" },
            { id: "o2", text: "False" },
          ],
        },
      ],
    };

    vi.mocked(useQuizzes).mockReturnValue({
      quizzes: [mockQuiz],
      total: 1,
      totalPages: 1,
      tab: "all",
      page: 1,
      pageSize: 10,
      setTab: vi.fn(),
      setPage: vi.fn(),
      isLoading: false,
      isFetching: false,
      error: null,
      hasSelection: true,
    });

    renderComponent();

    expect(screen.getByText("Science 101")).toBeInTheDocument();
  });
});
