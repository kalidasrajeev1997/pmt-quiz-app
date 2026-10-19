import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import seed from "@/data/seed.json";
import type { Quiz } from "@/types/quiz";
import QuizForm from "../QuizForm";

vi.mock("@/hooks/useSelection", () => ({
  useSelection: () => ({ countries: seed.countries }),
}));
vi.mock("@/hooks/useUnsavedChanges", () => ({
  useUnsavedChanges: () => ({ status: "idle" }),
}));

const quiz = {
  ...seed.quizzes[0],
  questions: seed.quizzes[0].questions.slice(0, 2),
} as Quiz;

function setup(initial?: Quiz, save = vi.fn().mockResolvedValue(undefined)) {
  const onSaved = vi.fn();
  render(
    <QuizForm
      quiz={initial}
      onSave={save}
      onSaved={onSaved}
      onCancel={vi.fn()}
    />,
  );
  return { user: userEvent.setup(), save, onSaved };
}

async function submit() {
  fireEvent.click(screen.getByRole("button", { name: "Save quiz" }));
}

function optionHandles(question: HTMLElement) {
  const handles = within(question).getAllByRole("button", {
    name: /Reorder option/,
  });
  handles.forEach((handle, position) => {
    vi.spyOn(
      handle.parentElement!.parentElement!,
      "getBoundingClientRect",
    ).mockReturnValue(new DOMRect(0, 100 + position * 60, 400, 48));
  });
  return handles;
}

describe("shared quiz form", () => {
  it.each([
    { initial: undefined, title: "New quiz" },
    { initial: quiz, title: "Edit quiz" },
  ])(
    "keeps the $title header outside the scrollable fields",
    ({ initial, title }) => {
      setup(initial);
      const heading = screen.getByRole("heading", { name: title });
      const header = heading.closest("header")!;
      const viewport = screen
        .getByLabelText("Title")
        .closest('[data-slot="scroll-area-viewport"]');

      expect(viewport).not.toBeNull();
      expect(header).toContainElement(
        screen.getByRole("button", { name: "Save quiz" }),
      );
      expect(header).toContainElement(
        screen.getByRole("button", { name: "Back to quizzes" }),
      );
      expect(viewport).not.toContainElement(header);
      expect(
        screen.queryByRole("button", { name: "Cancel" }),
      ).not.toBeInTheDocument();
    },
  );

  it("round-trips an existing quiz without losing question or option IDs", async () => {
    const { save, onSaved } = setup(quiz);
    await submit();
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        title: quiz.title,
        countries: quiz.countries,
        questions: quiz.questions,
      }),
    );
  });

  it("shows required title, country, question and correct-answer errors inline", async () => {
    const { save } = setup();
    await submit();
    expect(await screen.findByText("Enter a quiz title.")).toBeVisible();
    expect(screen.getByText("Assign at least one country.")).toBeVisible();
    expect(screen.getByText("Enter a question.")).toBeVisible();
    expect(screen.getByText("Mark at least one correct option.")).toBeVisible();
    expect(screen.getAllByText("Enter an option.")).toHaveLength(2);
    expect(save).not.toHaveBeenCalled();
  });

  it("validates an empty question list", async () => {
    const { user, save } = setup();
    await user.click(screen.getByRole("button", { name: "Remove question 1" }));
    await submit();
    expect(await screen.findByText("Add at least one question.")).toBeVisible();
    expect(save).not.toHaveBeenCalled();
  });

  it("keeps questions and their correct answers together when reordered", async () => {
    const { user, save } = setup(quiz);
    await user.click(
      screen.getByRole("button", { name: "Move question 1 down" }),
    );
    await submit();
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0][0].questions).toEqual([
      quiz.questions[1],
      quiz.questions[0],
    ]);
  });

  it.each([quiz.questions[0], seed.quizzes[0].questions[2]])(
    "reorders $type-choice options without changing their IDs or correct answers",
    async (questionData) => {
      const initial = { ...quiz, questions: [questionData] } as Quiz;
      const { user, save } = setup(initial);
      const question = screen.getByRole("group", { name: "Question 1" });
      const handles = optionHandles(question);
      const from = questionData.options.findIndex((option) =>
        questionData.correctOptionIds.includes(option.id),
      );
      const to = from === 0 ? 1 : from - 1;
      handles[from].focus();
      await user.keyboard("[Space]");
      await waitFor(() =>
        expect(handles[from]).toHaveAttribute("aria-pressed", "true"),
      );
      await user.keyboard(from === 0 ? "[ArrowDown]" : "[ArrowUp]");
      await screen.findByText(/was moved over droppable area/);
      await user.keyboard("[Space]");
      const expectedOptions = [...questionData.options];
      expectedOptions.splice(to, 0, expectedOptions.splice(from, 1)[0]);
      await waitFor(() =>
        expect(
          within(question).getByRole("textbox", {
            name: `Option ${to + 1} for question 1`,
          }),
        ).toHaveValue(questionData.options[from].text),
      );
      await submit();
      await waitFor(() => expect(save).toHaveBeenCalledOnce());
      expect(save.mock.calls[0][0].questions[0]).toEqual({
        ...questionData,
        options: expectedOptions,
      });
    },
  );

  it("keeps the original option order when a drag is cancelled", async () => {
    const { user, save } = setup(quiz);
    const handles = optionHandles(
      screen.getByRole("group", { name: "Question 1" }),
    );
    handles[0].focus();
    await user.keyboard("[Space]");
    await waitFor(() =>
      expect(handles[0]).toHaveAttribute("aria-pressed", "true"),
    );
    await user.keyboard("[ArrowDown]");
    await screen.findByText(/was moved over droppable area/);
    await user.keyboard("[Escape]");
    await submit();
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0][0].questions).toEqual(quiz.questions);
  });

  it("removes a deleted option from the correct answer set", async () => {
    const { user, save } = setup(quiz);
    await user.click(
      screen.getByRole("button", { name: "Remove option 3 from question 1" }),
    );
    await submit();
    expect(
      await screen.findByText("Mark at least one correct option."),
    ).toBeVisible();
    const question = screen.getByRole("group", { name: "Question 1" });
    await user.click(
      within(question).getByRole("radio", { name: "Option 1 is correct" }),
    );
    await submit();
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0][0].questions[0].correctOptionIds).toEqual([
      "q1-1-o1",
    ]);
    expect(save.mock.calls[0][0].questions[0].options).toHaveLength(3);
  });

  it("validates fewer than two options", async () => {
    const { user } = setup(quiz);
    await user.click(
      screen.getByRole("button", { name: "Remove option 4 from question 1" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Remove option 2 from question 1" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Remove option 1 from question 1" }),
    );
    await submit();
    expect(await screen.findByText("Add at least two options.")).toBeVisible();
  });

  it("persists blank timers as null and changes country assignment", async () => {
    const { user, save } = setup(quiz);
    await user.clear(screen.getByLabelText("Overall time limit (seconds)"));
    await user.click(
      screen.getByRole("checkbox", { name: "United Arab Emirates" }),
    );
    await submit();
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0][0].timeLimitSeconds).toBeNull();
    expect(save.mock.calls[0][0].perQuestionSeconds).toBeNull();
    expect(save.mock.calls[0][0].countries).toEqual(["IN", "GB"]);
  });

  it("retains input and shows a failed save without navigating away", async () => {
    const { save, onSaved } = setup(
      quiz,
      vi.fn().mockRejectedValue(new Error("Storage unavailable")),
    );
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Still editing" },
    });
    await submit();
    expect(await screen.findByText("Storage unavailable")).toBeVisible();
    expect(screen.getByLabelText("Title")).toHaveValue("Still editing");
    expect(save).toHaveBeenCalledOnce();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("adds questions and options and saves their generated IDs", async () => {
    const { user, save } = setup(quiz);
    await user.click(screen.getByRole("button", { name: "Add question" }));
    const question = screen.getByRole("group", { name: "Question 3" });
    fireEvent.change(within(question).getByLabelText("Question text"), {
      target: { value: "New question" },
    });
    fireEvent.change(
      within(question).getByRole("textbox", {
        name: "Option 1 for question 3",
      }),
      { target: { value: "First answer" } },
    );
    fireEvent.change(
      within(question).getByRole("textbox", {
        name: "Option 2 for question 3",
      }),
      { target: { value: "Second answer" } },
    );
    await user.click(
      within(question).getByRole("button", { name: "Add option" }),
    );
    fireEvent.change(
      within(question).getByRole("textbox", {
        name: "Option 3 for question 3",
      }),
      { target: { value: "Third answer" } },
    );
    await user.click(
      within(question).getByRole("radio", { name: "Option 3 is correct" }),
    );
    await submit();
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    const added = save.mock.calls[0][0].questions[2];
    expect(added.id).toBeTruthy();
    expect(added.options).toHaveLength(3);
    expect(added.correctOptionIds).toEqual([added.options[2].id]);
  });

  it("selects one correct answer by click and arrow key without changing another question", async () => {
    const { user, save } = setup(quiz);
    const group = screen.getByRole("radiogroup", {
      name: "Correct answers for question 1",
    });
    const radios = within(group).getAllByRole("radio");
    expect(radios[2]).toBeChecked();

    await user.click(radios[0]);
    expect(radios[0]).toBeChecked();
    expect(radios[2]).not.toBeChecked();

    await user.keyboard("[ArrowDown]");
    expect(radios[1]).toHaveFocus();
    expect(radios[1]).toBeChecked();
    expect(radios[0]).not.toBeChecked();

    await submit();
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0][0].questions[0].correctOptionIds).toEqual([
      quiz.questions[0].options[1].id,
    ]);
    expect(save.mock.calls[0][0].questions[1]).toEqual(quiz.questions[1]);
  });

  it("switches multiple-choice to single-choice with exactly one correct answer", async () => {
    const initial = {
      ...quiz,
      questions: [seed.quizzes[0].questions[2]],
    } as Quiz;
    const { user, save } = setup(initial);
    await user.click(screen.getByRole("combobox", { name: "Answer type" }));
    await user.click(screen.getByRole("option", { name: "Single choice" }));
    expect(screen.getAllByRole("radio", { checked: true })).toHaveLength(1);
    await submit();
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0][0].questions[0].type).toBe("single");
    expect(save.mock.calls[0][0].questions[0].correctOptionIds).toHaveLength(1);
  });
});
