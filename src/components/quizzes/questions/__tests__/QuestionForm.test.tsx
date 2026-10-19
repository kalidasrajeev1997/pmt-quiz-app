import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import QuestionForm from "@/components/quizzes/questions/QuestionForm";
import type { InProgressQuizAttempt, PublicQuiz } from "@/types/quiz";

function makeSampleQuiz(overrides: Partial<PublicQuiz> = {}): PublicQuiz {
  return {
    id: "quiz-form-1",
    title: "TypeScript Form Quiz",
    description: "Testing QuestionForm",
    countries: ["IN"],
    retakesAllowed: true,
    timeLimitSeconds: 300,
    perQuestionSeconds: 30,
    questions: [
      {
        id: "q1",
        text: "What is TypeScript?",
        type: "single",
        options: [
          { id: "o1", text: "Typed superset of JavaScript" },
          { id: "o2", text: "A database system" },
        ],
      },
      {
        id: "q2",
        text: "Which are primitive types?",
        type: "multiple",
        options: [
          { id: "m1", text: "string" },
          { id: "m2", text: "number" },
          { id: "m3", text: "HTMLElement" },
        ],
      },
    ],
    ...overrides,
  };
}

function makeSampleAttempt(
  overrides: Partial<InProgressQuizAttempt> = {},
): InProgressQuizAttempt {
  return {
    id: "att-form-1",
    quizId: "quiz-form-1",
    userId: "u1",
    startedAt: new Date(Date.now() - 5000).toISOString(),
    questionStartedAt: new Date(Date.now() - 5000).toISOString(),
    currentQuestionIndex: 0,
    totalQuestions: 2,
    status: "in_progress",
    completedAt: null,
    score: null,
    percentage: null,
    timeTakenSeconds: null,
    draftOptionIds: [],
    answers: [],
    ...overrides,
  };
}

describe("QuestionForm Component", () => {
  it("focuses the first option without selecting it and supports immediate arrow selection", async () => {
    const user = userEvent.setup();
    const onCommand = vi.fn();

    render(
      <QuestionForm
        quiz={makeSampleQuiz()}
        attempt={makeSampleAttempt()}
        pending={false}
        saveFailed={false}
        onCommand={onCommand}
      />,
    );

    const options = screen.getAllByRole("radio");
    await waitFor(() => expect(options[0]).toHaveFocus());
    expect(options[0]).not.toBeChecked();
    expect(onCommand).not.toHaveBeenCalled();

    await user.keyboard("{ArrowDown}");

    await waitFor(() => expect(options[1]).toHaveFocus());
    expect(options[1]).toBeChecked();
    expect(onCommand).toHaveBeenCalledWith(
      expect.objectContaining({ type: "draft", selectedOptionIds: ["o2"] }),
    );

    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(onCommand).toHaveBeenCalledWith(
        expect.objectContaining({ type: "submit", selectedOptionIds: ["o2"] }),
      );
    });
  });

  it("focuses the saved option without saving again or stealing focus on rerender", async () => {
    const user = userEvent.setup();
    const onCommand = vi.fn();
    const quiz = makeSampleQuiz();
    const attempt = makeSampleAttempt({ draftOptionIds: ["o2"] });
    const { rerender } = render(
      <QuestionForm
        quiz={quiz}
        attempt={attempt}
        pending={false}
        saveFailed={false}
        onCommand={onCommand}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("radio", { name: "A database system" }),
      ).toHaveFocus();
    });
    expect(onCommand).not.toHaveBeenCalled();

    await user.tab();
    const submitButton = screen.getByRole("button", { name: /submit answer/i });
    expect(submitButton).toHaveFocus();

    rerender(
      <QuestionForm
        quiz={quiz}
        attempt={attempt}
        pending={true}
        saveFailed={false}
        onCommand={onCommand}
      />,
    );

    expect(
      screen.getByRole("radio", { name: "A database system" }),
    ).not.toHaveFocus();
  });

  it("navigates multiple-choice options with arrows and toggles only with Space", async () => {
    const user = userEvent.setup();
    const onCommand = vi.fn();

    render(
      <QuestionForm
        quiz={makeSampleQuiz()}
        attempt={makeSampleAttempt({ currentQuestionIndex: 1 })}
        pending={false}
        saveFailed={false}
        onCommand={onCommand}
      />,
    );

    const options = screen.getAllByRole("checkbox");
    await waitFor(() => expect(options[0]).toHaveFocus());

    await user.keyboard("{ArrowDown}");
    expect(options[1]).toHaveFocus();
    expect(onCommand).not.toHaveBeenCalled();

    await user.keyboard(" ");
    expect(options[1]).toBeChecked();
    expect(onCommand).toHaveBeenCalledWith(
      expect.objectContaining({ type: "draft", selectedOptionIds: ["m2"] }),
    );
    onCommand.mockClear();

    await user.keyboard("{End}");
    expect(options[2]).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(options[0]).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(options[2]).toHaveFocus();
    await user.keyboard("{Home}");
    expect(options[0]).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(options[2]).toHaveFocus();
    expect(options[1]).toBeChecked();
    expect(onCommand).not.toHaveBeenCalled();
  });

  it("renders question prompt, progress indicator, and single-choice options", () => {
    const quiz = makeSampleQuiz();
    const attempt = makeSampleAttempt();
    const onCommand = vi.fn();

    render(
      <QuestionForm
        quiz={quiz}
        attempt={attempt}
        pending={false}
        saveFailed={false}
        onCommand={onCommand}
      />,
    );

    expect(screen.getByText("TypeScript Form Quiz")).toBeInTheDocument();
    expect(screen.getByText("Question 1 of 2")).toBeInTheDocument();
    expect(screen.getAllByText("What is TypeScript?")).toHaveLength(2);
    expect(
      screen.getByText("Typed superset of JavaScript"),
    ).toBeInTheDocument();
    expect(screen.getByText("A database system")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /submit answer/i }),
    ).toBeInTheDocument();
  });

  it("selecting single-choice option updates selection and emits draft command", async () => {
    const user = userEvent.setup();
    const quiz = makeSampleQuiz();
    const attempt = makeSampleAttempt();
    const onCommand = vi.fn();

    render(
      <QuestionForm
        quiz={quiz}
        attempt={attempt}
        pending={false}
        saveFailed={false}
        onCommand={onCommand}
      />,
    );

    const optionText = screen.getByText("Typed superset of JavaScript");
    await user.click(optionText);

    expect(onCommand).toHaveBeenCalledWith({
      type: "draft",
      attemptId: attempt.id,
      questionId: "q1",
      selectedOptionIds: ["o1"],
    });
  });

  it("submitting without selection triggers validation error message and blocks submit", async () => {
    const user = userEvent.setup();
    const quiz = makeSampleQuiz();
    const attempt = makeSampleAttempt();
    const onCommand = vi.fn();

    render(
      <QuestionForm
        quiz={quiz}
        attempt={attempt}
        pending={false}
        saveFailed={false}
        onCommand={onCommand}
      />,
    );

    const submitBtn = screen.getByRole("button", { name: /submit answer/i });
    await user.click(submitBtn);

    // Validation alert shown
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Select at least one answer.",
    );
    // Submit command was not dispatched
    expect(onCommand).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "submit" }),
    );
  });

  it("submitting selected single-choice answer calls onCommand with submit action", async () => {
    const user = userEvent.setup();
    const quiz = makeSampleQuiz();
    const attempt = makeSampleAttempt();
    const onCommand = vi.fn();

    render(
      <QuestionForm
        quiz={quiz}
        attempt={attempt}
        pending={false}
        saveFailed={false}
        onCommand={onCommand}
      />,
    );

    await user.click(screen.getByText("Typed superset of JavaScript"));
    const submitBtn = screen.getByRole("button", { name: /submit answer/i });
    await user.click(submitBtn);

    expect(onCommand).toHaveBeenCalledWith({
      type: "submit",
      attemptId: attempt.id,
      questionId: "q1",
      selectedOptionIds: ["o1"],
    });
  });

  it("supports multiple-choice checkboxes and submits array of selected IDs", async () => {
    const user = userEvent.setup();
    const quiz = makeSampleQuiz();
    const attempt = makeSampleAttempt({ currentQuestionIndex: 1 });
    const onCommand = vi.fn();

    render(
      <QuestionForm
        quiz={quiz}
        attempt={attempt}
        pending={false}
        saveFailed={false}
        onCommand={onCommand}
      />,
    );

    expect(screen.getAllByText("Which are primitive types?")).toHaveLength(2);
    expect(screen.getByText("Select all that apply")).toBeInTheDocument();

    await user.click(screen.getByText("string"));
    await user.click(screen.getByText("number"));

    const finishBtn = screen.getByRole("button", { name: /finish quiz/i });
    await user.click(finishBtn);

    expect(onCommand).toHaveBeenCalledWith({
      type: "submit",
      attemptId: attempt.id,
      questionId: "q2",
      selectedOptionIds: ["m1", "m2"],
    });
  });

  it("keyboard navigation: pressing Enter submits the form when an option is selected", async () => {
    const user = userEvent.setup();
    const quiz = makeSampleQuiz();
    const attempt = makeSampleAttempt();
    const onCommand = vi.fn();

    const { container } = render(
      <QuestionForm
        quiz={quiz}
        attempt={attempt}
        pending={false}
        saveFailed={false}
        onCommand={onCommand}
      />,
    );

    await user.click(screen.getByText("Typed superset of JavaScript"));

    // Press Enter on form and await async handleSubmit
    const formElement = container.querySelector("form")!;
    fireEvent.keyDown(formElement, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(onCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "submit",
          questionId: "q1",
          selectedOptionIds: ["o1"],
        }),
      );
    });
  });

  it("disables options and shows 'Time expired...' when deadline has passed", () => {
    const quiz = makeSampleQuiz({ perQuestionSeconds: 10 });
    // Started 20s ago with a 10s per-question timer -> expired!
    const attempt = makeSampleAttempt({
      startedAt: new Date(Date.now() - 20_000).toISOString(),
      questionStartedAt: new Date(Date.now() - 20_000).toISOString(),
    });
    const onCommand = vi.fn();

    const { container } = render(
      <QuestionForm
        quiz={quiz}
        attempt={attempt}
        pending={false}
        saveFailed={false}
        onCommand={onCommand}
      />,
    );

    // Fieldset is disabled
    const fieldset = container.querySelector("fieldset");
    expect(fieldset).toBeDisabled();

    // Button shows Time expired... and is disabled
    const expiredBtn = screen.getByRole("button", { name: /time expired/i });
    expect(expiredBtn).toBeDisabled();
  });

  it("renders pending and save failed states", () => {
    const quiz = makeSampleQuiz();
    const attempt = makeSampleAttempt();
    const onCommand = vi.fn();

    const { rerender } = render(
      <QuestionForm
        quiz={quiz}
        attempt={attempt}
        pending={true}
        saveFailed={false}
        onCommand={onCommand}
      />,
    );

    expect(screen.getByText("Saving...")).toBeInTheDocument();

    rerender(
      <QuestionForm
        quiz={quiz}
        attempt={attempt}
        pending={false}
        saveFailed={true}
        onCommand={onCommand}
      />,
    );

    expect(screen.getByText("Not saved")).toBeInTheDocument();
  });
});
