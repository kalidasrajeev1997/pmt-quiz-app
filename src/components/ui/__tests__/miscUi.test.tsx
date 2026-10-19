import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Spinner } from "../spinner";
import { Skeleton } from "../skeleton";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "../alert";
import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "../progress";
import { AchievementCard } from "../achievement-card";

describe("Miscellaneous UI primitives", () => {
  it("renders Spinner component", () => {
    render(<Spinner />);
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  it("renders Skeleton placeholder", () => {
    const { container } = render(<Skeleton className="w-12 h-4" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders Alert and AlertAction", () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>Attention</AlertTitle>
        <AlertDescription>Danger alert</AlertDescription>
        <AlertAction>
          <button>Dismiss</button>
        </AlertAction>
      </Alert>,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Attention")).toBeInTheDocument();
    expect(screen.getByText("Danger alert")).toBeInTheDocument();
    expect(screen.getByText("Dismiss")).toBeInTheDocument();
  });

  it("renders linear Progress with track, indicator, label and value", () => {
    render(
      <Progress variant="linear" value={65}>
        <ProgressLabel>Overall</ProgressLabel>
        <ProgressValue>{() => "65%"}</ProgressValue>
        <ProgressTrack>
          <ProgressIndicator />
        </ProgressTrack>
      </Progress>,
    );

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.getByText("Overall")).toBeInTheDocument();
    expect(screen.getByText("65%")).toBeInTheDocument();
  });

  it("renders circular Progress with multiple segments", () => {
    render(
      <Progress
        variant="circular"
        value={80}
        segments={[
          { value: 50, className: "stroke-green-500" },
          { value: 30, className: "stroke-red-500" },
        ]}
      />,
    );

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("renders AchievementCard with medal and details", () => {
    const mockAttempt = {
      id: "att-1",
      userId: "u-1",
      quizId: "quiz-1",
      status: "completed" as const,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      currentQuestionIndex: 2,
      totalQuestions: 10,
      score: 8,
      percentage: 80,
      timeTakenSeconds: 45,
      correctQuestions: 8,
      incorrectQuestions: 2,
      unansweredQuestions: 0,
      answers: [
        {
          questionId: "q1",
          selectedOptionIds: ["opt1"],
          isCorrect: true,
          answeredAt: new Date().toISOString(),
        },
        {
          questionId: "q2",
          selectedOptionIds: [],
          isCorrect: false,
          answeredAt: new Date().toISOString(),
        },
      ],
    };

    render(<AchievementCard attempt={mockAttempt} />);

    expect(screen.getByText("Score")).toBeInTheDocument();
    expect(screen.getByText("Correct")).toBeInTheDocument();
    expect(screen.getByText("Unanswered")).toBeInTheDocument();
    expect(screen.getByText("Time taken")).toBeInTheDocument();
  });
});
