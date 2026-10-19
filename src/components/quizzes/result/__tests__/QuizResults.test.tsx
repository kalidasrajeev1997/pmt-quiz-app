import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import QuizResults from "../QuizResults";
import type { PublicQuiz, QuizResult } from "@/types/quiz";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    search,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    to: string;
    search?: Record<string, unknown>;
  }) => {
    const searchString = search
      ? `?${new URLSearchParams(search as Record<string, string>).toString()}`
      : "";
    return (
      <a href={`${to}${searchString}`} {...props}>
        {children}
      </a>
    );
  },
}));

function makeQuiz(overrides: Partial<PublicQuiz> = {}): PublicQuiz {
  return {
    id: "quiz-123",
    title: "TypeScript Deep Dive",
    description: "A quiz on TypeScript internals.",
    countries: ["IN", "GB"],
    timeLimitSeconds: 300,
    perQuestionSeconds: null,
    retakesAllowed: true,
    questions: [],
    ...overrides,
  };
}

function makeAttempt(overrides: Partial<QuizResult> = {}): QuizResult {
  return {
    id: "attempt-456",
    quizId: "quiz-123",
    userId: "user-1",
    score: 80,
    percentage: 80,
    totalQuestions: 5,
    currentQuestionIndex: 5,
    correctQuestions: 4,
    incorrectQuestions: 1,
    unansweredQuestions: 0,
    timeTakenSeconds: 120,
    status: "completed",
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    answers: [],
    draftOptionIds: [],
    ...overrides,
  };
}

describe("QuizResults Component", () => {
  it("renders completed heading, quiz title, and achievement card", async () => {
    const quiz = makeQuiz();
    const attempt = makeAttempt({
      percentage: 80,
      score: 4,
      totalQuestions: 5,
    });

    render(<QuizResults quiz={quiz} attempt={attempt} onRetake={vi.fn()} />);

    expect(
      screen.getByRole("heading", { name: "Quiz completed" }),
    ).toBeInTheDocument();
    expect(screen.getByText("TypeScript Deep Dive")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("80%")).toBeInTheDocument();
    });
  });

  it("renders Leaderboard button deep-linked to the quiz's leaderboard", () => {
    const quiz = makeQuiz({ id: "quiz-special", title: "Special Quiz" });
    const attempt = makeAttempt({ quizId: "quiz-special" });

    render(<QuizResults quiz={quiz} attempt={attempt} onRetake={vi.fn()} />);

    const leaderboardButton = screen.getByRole("button", {
      name: "View leaderboard for Special Quiz",
    });
    expect(leaderboardButton).toBeInTheDocument();
    expect(leaderboardButton).toHaveAttribute(
      "href",
      "/leaderboard?quizId=quiz-special",
    );
    expect(leaderboardButton).toHaveTextContent("Leaderboard");
  });

  it("renders Retake quiz button when retakesAllowed is true and calls onRetake", async () => {
    const user = userEvent.setup();
    const onRetake = vi.fn();
    const quiz = makeQuiz({ retakesAllowed: true });
    const attempt = makeAttempt();

    render(<QuizResults quiz={quiz} attempt={attempt} onRetake={onRetake} />);

    const retakeButton = screen.getByRole("button", { name: /retake quiz/i });
    expect(retakeButton).toBeInTheDocument();

    await user.click(retakeButton);
    expect(onRetake).toHaveBeenCalledTimes(1);
  });

  it("does not render Retake quiz button when retakesAllowed is false", () => {
    const quiz = makeQuiz({ retakesAllowed: false });
    const attempt = makeAttempt();

    render(<QuizResults quiz={quiz} attempt={attempt} onRetake={vi.fn()} />);

    expect(
      screen.queryByRole("button", { name: /retake quiz/i }),
    ).not.toBeInTheDocument();
    // Leaderboard button is still accessible even when retakes are disabled
    expect(
      screen.getByRole("button", { name: /view leaderboard for/i }),
    ).toBeInTheDocument();
  });

  it("renders timeout warning banner when quiz time limit is reached", () => {
    const quiz = makeQuiz({ timeLimitSeconds: 60 });
    const attempt = makeAttempt({ timeTakenSeconds: 60 });

    render(<QuizResults quiz={quiz} attempt={attempt} onRetake={vi.fn()} />);

    expect(screen.getByText("Time limit reached")).toBeInTheDocument();
    expect(
      screen.getByText("Your saved answers were submitted automatically."),
    ).toBeInTheDocument();
  });
});
