import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import seed from "@/data/seed.json";
import { getAdminQuiz } from "@/services/quiz.service";
import type { Quiz } from "@/types/quiz";
import QuizEditor from "../QuizEditor";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
}));
vi.mock("@/hooks/useQuizMutations", () => ({
  useQuizMutations: () => ({ save: { mutateAsync: vi.fn() } }),
}));
vi.mock("@/services/quiz.service", () => ({
  getAdminQuiz: vi.fn(),
}));
vi.mock("../QuizForm", () => ({
  default: ({ quiz }: { quiz?: Quiz }) => (
    <form aria-label={quiz ? quiz.title : "New quiz"} />
  ),
}));

function setup(quizId?: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <QuizEditor quizId={quizId} />
    </QueryClientProvider>,
  );
}

describe("quiz editor loading", () => {
  beforeEach(() => {
    vi.mocked(getAdminQuiz).mockReset();
    vi.mocked(getAdminQuiz).mockImplementation(() => new Promise(() => {}));
  });

  it("shows an accessible, non-interactive skeleton while the quiz loads", () => {
    setup("q1");

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveTextContent("Loading quiz...");
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();

    const placeholders = status.querySelector('[aria-hidden="true"]');
    expect(placeholders).toHaveClass(
      "motion-reduce:**:data-[slot=skeleton]:animate-none",
    );
    expect(
      placeholders?.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(10);
    expect(getAdminQuiz).toHaveBeenCalledWith("q1");
  });

  it("replaces the skeleton with the form once the quiz is available", async () => {
    const quiz = seed.quizzes[0] as Quiz;
    vi.mocked(getAdminQuiz).mockResolvedValue(quiz);
    setup(quiz.id);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(
      await screen.findByRole("form", { name: quiz.title }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("opens the new-quiz form immediately without a skeleton or request", () => {
    setup();

    expect(screen.getByRole("form", { name: "New quiz" })).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(getAdminQuiz).not.toHaveBeenCalled();
  });

  it("replaces the skeleton with the existing recovery actions on failure", async () => {
    vi.mocked(getAdminQuiz).mockRejectedValue(new Error("Quiz not found"));
    setup("missing");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Quiz not found",
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Back to quizzes" }),
    ).toBeInTheDocument();
  });
});
