import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import QuizAttend from "@/components/quizzes/QuizContainer";
import * as quizAttemptHook from "@/hooks/useQuizAttempt";
import type { UseQuizAttemptReturn } from "@/hooks/useQuizAttempt";
import type {
  InProgressQuizAttempt,
  PublicQuiz,
  QuizResult,
  QuizSession,
} from "@/types/quiz";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    ...props
  }: {
    children?: React.ReactNode;
    to?: string | { to?: string };
    [key: string]: unknown;
  }) => (
    <a href={typeof to === "string" ? to : "/home"} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
  useLocation: () => ({ hash: "" }),
}));

function makePublicQuiz(overrides: Partial<PublicQuiz> = {}): PublicQuiz {
  return {
    id: "quiz-attend-1",
    title: "React Component Quiz",
    description: "Test your React knowledge",
    countries: ["IN"],
    retakesAllowed: true,
    timeLimitSeconds: 120,
    perQuestionSeconds: 30,
    questions: [
      {
        id: "q1",
        text: "What hook handles local component state?",
        type: "single",
        options: [
          { id: "o1", text: "useState" },
          { id: "o2", text: "useHistory" },
        ],
      },
      {
        id: "q2",
        text: "Which hooks accept a dependency array?",
        type: "multiple",
        options: [
          { id: "m1", text: "useEffect" },
          { id: "m2", text: "useMemo" },
          { id: "m3", text: "useRef" },
        ],
      },
    ],
    ...overrides,
  };
}

function makeInProgressAttempt(
  overrides: Partial<InProgressQuizAttempt> = {},
): InProgressQuizAttempt {
  return {
    id: "attempt-123",
    quizId: "quiz-attend-1",
    userId: "u1",
    startedAt: new Date(Date.now() - 10_000).toISOString(),
    questionStartedAt: new Date(Date.now() - 10_000).toISOString(),
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

function makeCompletedAttempt(overrides: Partial<QuizResult> = {}): QuizResult {
  return {
    id: "attempt-123",
    quizId: "quiz-attend-1",
    userId: "u1",
    startedAt: new Date(Date.now() - 60_000).toISOString(),
    questionStartedAt: new Date(Date.now() - 10_000).toISOString(),
    currentQuestionIndex: 2,
    totalQuestions: 2,
    status: "completed",
    completedAt: new Date().toISOString(),
    score: 2,
    percentage: 100,
    timeTakenSeconds: 60,
    correctQuestions: 2,
    incorrectQuestions: 0,
    unansweredQuestions: 0,
    draftOptionIds: [],
    answers: [
      {
        questionId: "q1",
        selectedOptionIds: ["o1"],
        isCorrect: true,
        answeredAt: "...",
      },
      {
        questionId: "q2",
        selectedOptionIds: ["m1", "m2"],
        isCorrect: true,
        answeredAt: "...",
      },
    ],
    ...overrides,
  };
}

describe("QuizAttend Flow Component Tests", () => {
  let defaultHookReturn: UseQuizAttemptReturn;

  beforeEach(() => {
    const quiz = makePublicQuiz();
    const session: QuizSession = { quiz, attempt: null };

    defaultHookReturn = {
      session,
      quiz,
      attempt: null,
      currentStep: 0,
      showOverview: true,
      isAllowedRetake: false,
      isLoading: false,
      isPending: false,
      selectionLoading: false,
      selectionError: null,
      hasUser: true,
      isSessionError: false,
      sessionError: null,
      saveFailed: false,
      error: null,
      startQuiz: vi.fn(),
      handleCommand: vi.fn(),
      retakeQuiz: vi.fn(),
      refetchSession: vi.fn(),
    };

    vi.spyOn(quizAttemptHook, "useQuizAttempt").mockImplementation(
      () => defaultHookReturn,
    );
  });

  it.each(["overview", "questions", "results"])(
    "uses the shared page scroller for %s",
    (step) => {
      const quiz = makePublicQuiz();
      const attempt =
        step === "questions"
          ? makeInProgressAttempt()
          : step === "results"
            ? makeCompletedAttempt()
            : null;

      defaultHookReturn = {
        ...defaultHookReturn,
        showOverview: step === "overview",
        attempt,
        session: { quiz, attempt },
      };

      const { container } = render(<QuizAttend quizId="quiz-attend-1" />);

      expect(
        container.querySelector('[data-slot="scroll-area-viewport"]'),
      ).not.toBeInTheDocument();
      expect(container.firstElementChild).not.toHaveClass(
        "h-full",
        "overflow-hidden",
      );
      expect(
        screen.getByRole("button", { name: "Back to quizzes" }).parentElement,
      ).toHaveClass("sticky", "top-0");
    },
  );

  describe("Answering Flow", () => {
    it("renders QuizOverview initially and calls startQuiz on button click", async () => {
      const user = userEvent.setup();
      render(<QuizAttend quizId="quiz-attend-1" />);

      expect(screen.getByText("React Component Quiz")).toBeInTheDocument();
      expect(screen.getByText("Test your React knowledge")).toBeInTheDocument();
      expect(screen.getByText("Assessment Rules")).toBeInTheDocument();

      const startBtn = screen.getByRole("button", { name: /start quiz/i });
      await user.click(startBtn);

      expect(defaultHookReturn.startQuiz).toHaveBeenCalledWith(false);
    });

    it("renders QuestionForm when attempt is in progress and handles answer selection and submission", async () => {
      const user = userEvent.setup();
      const quiz = makePublicQuiz();
      const attempt = makeInProgressAttempt();

      defaultHookReturn = {
        ...defaultHookReturn,
        showOverview: false,
        currentStep: 1,
        attempt,
        session: { quiz, attempt },
      };

      render(<QuizAttend quizId="quiz-attend-1" />);

      // Shows Question 1 of 2
      expect(screen.getByText("Question 1 of 2")).toBeInTheDocument();
      expect(
        screen.getAllByText("What hook handles local component state?"),
      ).toHaveLength(2);

      // Select option
      const optionA = screen.getByText("useState");
      await user.click(optionA);

      // Draft action dispatched
      expect(defaultHookReturn.handleCommand).toHaveBeenCalledWith({
        type: "draft",
        attemptId: attempt.id,
        questionId: "q1",
        selectedOptionIds: ["o1"],
      });

      // Submit action dispatched
      const submitBtn = screen.getByRole("button", { name: /submit answer/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(defaultHookReturn.handleCommand).toHaveBeenCalledWith({
          type: "submit",
          attemptId: attempt.id,
          questionId: "q1",
          selectedOptionIds: ["o1"],
        });
      });
    });

    it("renders QuizResults when attempt is completed", async () => {
      const quiz = makePublicQuiz();
      const attempt = makeCompletedAttempt();

      defaultHookReturn = {
        ...defaultHookReturn,
        showOverview: false,
        currentStep: 2,
        attempt,
        session: { quiz, attempt },
      };

      render(<QuizAttend quizId="quiz-attend-1" />);

      expect(screen.getByText("Quiz completed")).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText("100%")).toBeInTheDocument();
        expect(screen.getByText("2/2")).toBeInTheDocument();
      });
      expect(
        screen.getByRole("button", { name: /retake quiz/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Timeout Auto-Submit Flow", () => {
    it("disables QuestionForm options and shows 'Time expired...' when question timer expires", () => {
      const quiz = makePublicQuiz({ perQuestionSeconds: 10 });
      // Question started 25s ago with 10s per-question timer -> expired
      const attempt = makeInProgressAttempt({
        startedAt: new Date(Date.now() - 25_000).toISOString(),
        questionStartedAt: new Date(Date.now() - 25_000).toISOString(),
      });

      defaultHookReturn = {
        ...defaultHookReturn,
        showOverview: false,
        currentStep: 1,
        attempt,
        session: { quiz, attempt },
      };

      const { container } = render(<QuizAttend quizId="quiz-attend-1" />);

      const fieldset = container.querySelector("fieldset");
      expect(fieldset).toBeDisabled();

      const expiredBtn = screen.getByRole("button", { name: /time expired/i });
      expect(expiredBtn).toBeDisabled();
    });

    it("renders timeout warning banner in QuizResults when overall quiz time limit was reached", () => {
      const quiz = makePublicQuiz({ timeLimitSeconds: 60 });
      // timeTakenSeconds (70s) >= timeLimitSeconds (60s) -> timedOut
      const attempt = makeCompletedAttempt({ timeTakenSeconds: 70 });

      defaultHookReturn = {
        ...defaultHookReturn,
        showOverview: false,
        currentStep: 2,
        attempt,
        session: { quiz, attempt },
      };

      render(<QuizAttend quizId="quiz-attend-1" />);

      // Timeout Alert rendered
      expect(screen.getByText("Time limit reached")).toBeInTheDocument();
      expect(
        screen.getByText("Your saved answers were submitted automatically."),
      ).toBeInTheDocument();
    });
  });

  describe("Resume Flow", () => {
    it("resumes directly at saved question index and restores saved draft options", () => {
      const quiz = makePublicQuiz();
      // Saved in-progress attempt at question index 1 (second question) with draft ["m1", "m2"]
      const attempt = makeInProgressAttempt({
        currentQuestionIndex: 1,
        draftOptionIds: ["m1", "m2"],
      });

      defaultHookReturn = {
        ...defaultHookReturn,
        showOverview: false,
        currentStep: 1,
        attempt,
        session: { quiz, attempt },
      };

      render(<QuizAttend quizId="quiz-attend-1" />);

      // Bypassed Overview directly to Question 2 of 2
      expect(screen.queryByText("Assessment Rules")).not.toBeInTheDocument();
      expect(screen.getByText("Question 2 of 2")).toBeInTheDocument();
      expect(
        screen.getAllByText("Which hooks accept a dependency array?"),
      ).toHaveLength(2);

      // Restored draft options are styled as selected (border-primary)
      expect(screen.getByText("useEffect").closest("label")).toHaveClass(
        "border-primary",
      );
      expect(screen.getByText("useMemo").closest("label")).toHaveClass(
        "border-primary",
      );
      expect(screen.getByText("useRef").closest("label")).not.toHaveClass(
        "border-primary",
      );
    });

    it("allows retaking when retakesAllowed is true and calls retakeQuiz", async () => {
      const user = userEvent.setup();
      const quiz = makePublicQuiz({ retakesAllowed: true });
      const attempt = makeCompletedAttempt();

      defaultHookReturn = {
        ...defaultHookReturn,
        showOverview: false,
        currentStep: 2,
        attempt,
        session: { quiz, attempt },
      };

      render(<QuizAttend quizId="quiz-attend-1" />);

      const retakeBtn = screen.getByRole("button", { name: /retake quiz/i });
      await user.click(retakeBtn);

      expect(defaultHookReturn.retakeQuiz).toHaveBeenCalledTimes(1);
    });

    it("hides retake button when retakesAllowed is false on completed attempt", () => {
      const quiz = makePublicQuiz({ retakesAllowed: false });
      const attempt = makeCompletedAttempt();

      defaultHookReturn = {
        ...defaultHookReturn,
        showOverview: false,
        currentStep: 2,
        attempt,
        session: { quiz, attempt },
      };

      render(<QuizAttend quizId="quiz-attend-1" />);

      expect(
        screen.queryByRole("button", { name: /retake quiz/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Feedback and Error States", () => {
    it("renders QuizSelectionRequired when no user is selected", () => {
      defaultHookReturn = {
        ...defaultHookReturn,
        hasUser: false,
        session: undefined,
      };

      render(<QuizAttend quizId="quiz-attend-1" />);
      expect(screen.getByText("Choose a user to continue")).toBeInTheDocument();
    });

    it("renders QuizUnavailable when session query fails and calls refetchSession on retry", async () => {
      const user = userEvent.setup();
      defaultHookReturn = {
        ...defaultHookReturn,
        isSessionError: true,
        sessionError: new Error("Storage unavailable"),
        session: undefined,
      };

      render(<QuizAttend quizId="quiz-attend-1" />);
      expect(screen.getByText("Quiz unavailable")).toBeInTheDocument();

      const retryBtn = screen.getByRole("button", { name: /try again/i });
      await user.click(retryBtn);

      expect(defaultHookReturn.refetchSession).toHaveBeenCalledTimes(1);
    });

    it("renders save error alert when error occurs during attempt", () => {
      const quiz = makePublicQuiz();
      const attempt = makeInProgressAttempt();

      defaultHookReturn = {
        ...defaultHookReturn,
        showOverview: false,
        currentStep: 1,
        attempt,
        session: { quiz, attempt },
        error: new Error("Network timeout saving answer"),
      };

      render(<QuizAttend quizId="quiz-attend-1" />);
      expect(
        screen.getByText("Progress could not be saved"),
      ).toBeInTheDocument();
    });
  });
});
