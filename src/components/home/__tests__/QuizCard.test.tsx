import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import QuizCard from "../QuizCard";
import QuizCardSkeleton from "../QuizCardSkeleton";
import type { QuizQueryResult } from "@/services/db/queries/quiz";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props}>{children}</a>
  ),
}));

const baseQuiz: QuizQueryResult = {
  id: "quiz-1",
  title: "JavaScript Basics",
  description: "Test your JS knowledge",
  timeLimitSeconds: 120,
  perQuestionSeconds: null,
  retakesAllowed: true,
  countries: ["IN", "GB"],
  status: "not-started",
  totalTimeSeconds: 120,
  deadline: null,
  answeredQuestions: 0,
  correctQuestions: 0,
  incorrectQuestions: 0,
  unansweredQuestions: 2,
  score: null,
  scorePercentage: null,
  questions: [
    {
      id: "q-1",
      text: "What is JS?",
      type: "single",
      options: [
        { id: "o-1", text: "Language" },
        { id: "o-2", text: "Coffee" },
      ],
    },
    {
      id: "q-2",
      text: "Is JS dynamic?",
      type: "single",
      options: [
        { id: "o-3", text: "Yes" },
        { id: "o-4", text: "No" },
      ],
    },
  ],
};

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe("QuizCard and related card components", () => {
  it("renders not-started quiz card with meta details and start action", () => {
    renderWithClient(<QuizCard quiz={baseQuiz} />);

    expect(
      screen.getByRole("heading", { name: "JavaScript Basics" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Test your JS knowledge")).toBeInTheDocument();
    expect(screen.getByText("2 min limit")).toBeInTheDocument();
    expect(screen.getByText("Retakes allowed")).toBeInTheDocument();
    expect(screen.getByText("IN")).toBeInTheDocument();
    expect(screen.getByText("GB")).toBeInTheDocument();
    expect(screen.getByText("0 of 2 answered")).toBeInTheDocument();
    expect(screen.getByText("Not started")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Start quiz: JavaScript Basics/i }),
    ).toBeInTheDocument();
  });

  it("renders in-progress quiz card with countdown timer and continue action", () => {
    const inProgressQuiz: QuizQueryResult = {
      ...baseQuiz,
      status: "in_progress",
      deadline: Date.now() + 60000,
      answeredQuestions: 1,
    };

    renderWithClient(<QuizCard quiz={inProgressQuiz} />);

    expect(screen.getByText("In progress")).toBeInTheDocument();
    expect(screen.getByText("1 of 2 answered")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Continue quiz: JavaScript Basics/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("01:00")).toBeInTheDocument();
  });

  it("renders urgent countdown styling when less than 10 seconds remain", () => {
    const urgentQuiz: QuizQueryResult = {
      ...baseQuiz,
      status: "in_progress",
      deadline: Date.now() + 5000,
      answeredQuestions: 1,
    };

    renderWithClient(<QuizCard quiz={urgentQuiz} />);
    expect(screen.getByText("00:05")).toBeInTheDocument();
  });

  it("renders completed quiz card with results link and retake action", () => {
    const completedQuiz: QuizQueryResult = {
      ...baseQuiz,
      status: "completed",
      answeredQuestions: 2,
      correctQuestions: 2,
      incorrectQuestions: 0,
      unansweredQuestions: 0,
      score: 2,
      scorePercentage: 100,
    };

    renderWithClient(<QuizCard quiz={completedQuiz} />);

    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "View results for JavaScript Basics",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Retake quiz: JavaScript Basics/i }),
    ).toBeInTheDocument();
  });

  it("renders single attempt text and hides retake button when retakes are disabled", () => {
    const singleAttemptCompletedQuiz: QuizQueryResult = {
      ...baseQuiz,
      retakesAllowed: false,
      status: "completed",
      timeLimitSeconds: null,
      perQuestionSeconds: 30,
    };

    renderWithClient(<QuizCard quiz={singleAttemptCompletedQuiz} />);

    expect(screen.getByText("30 sec / ques")).toBeInTheDocument();
    expect(screen.getByText("Single attempt")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "View results for JavaScript Basics",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Retake quiz/i }),
    ).not.toBeInTheDocument();
  });

  it("renders No time limit when neither quiz nor question time limit exists", () => {
    const noTimeLimitQuiz: QuizQueryResult = {
      ...baseQuiz,
      timeLimitSeconds: null,
      perQuestionSeconds: null,
    };

    renderWithClient(<QuizCard quiz={noTimeLimitQuiz} />);
    expect(screen.getByText("No time limit")).toBeInTheDocument();
  });

  it("renders QuizCardSkeleton placeholder without errors", () => {
    const { container } = render(<QuizCardSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
