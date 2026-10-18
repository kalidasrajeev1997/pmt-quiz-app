import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useQuizAttempt } from "../useQuizAttempt";
import { useSelection } from "@/hooks/useSelection";
import * as quizService from "@/services/quiz.service";
import * as router from "@tanstack/react-router";
import type { CurrentQuestion, PublicQuiz, QuizAttempt, QuizSession } from "@/types/quiz";
import { attemptSteps, quizStatuses } from "@/helpers/constants";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: vi.fn(),
  useLocation: vi.fn(),
}));

vi.mock("@/hooks/useSelection", () => ({
  useSelection: vi.fn(),
}));

vi.mock("@/services/quiz.service", () => ({
  getQuiz: vi.fn(),
  startOrResumeAttempt: vi.fn(),
  saveDraft: vi.fn(),
  submitAnswer: vi.fn(),
}));

const mockQuiz: PublicQuiz = {
  id: "quiz-1",
  title: "Test Quiz",
  description: "Math test",
  timeLimitSeconds: 60,
  perQuestionSeconds: null,
  retakesAllowed: true,
  countries: ["IN"],
  questions: [
    {
      id: "q-1",
      text: "1 + 1 = ?",
      type: "single",
      options: [
        { id: "opt-1", text: "2" },
        { id: "opt-2", text: "3" },
      ],
    },
  ],
};

const mockCurrentQuestion: CurrentQuestion = {
  attemptId: "att-1",
  status: "in_progress",
  question: mockQuiz.questions[0],
  index: 0,
  total: 1,
  remainingSeconds: 60,
  overallRemainingSeconds: 60,
  questionRemainingSeconds: null,
  selectedOptionIds: ["opt-1"],
};

describe("useQuizAttempt hook", () => {
  let queryClient: QueryClient;
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    vi.mocked(router.useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(router.useLocation).mockReturnValue("" as never);

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
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("initializes with overview step when there is no attempt", async () => {
    const session: QuizSession = {
      quiz: mockQuiz,
      attempt: null,
    };
    vi.mocked(quizService.getQuiz).mockResolvedValue(session);

    const { result } = renderHook(() => useQuizAttempt("quiz-1"), { wrapper });

    await waitFor(() => {
      expect(result.current.quiz).toEqual(mockQuiz);
    });

    expect(result.current.showOverview).toBe(true);
    expect(result.current.currentStep).toBe(attemptSteps.OVERVIEW);
    expect(result.current.isAllowedRetake).toBe(false);
  });

  it("handles starting a quiz and navigates to clear hash", async () => {
    const initialSession: QuizSession = {
      quiz: mockQuiz,
      attempt: null,
    };
    const inProgressAttempt: QuizAttempt = {
      id: "att-1",
      quizId: "quiz-1",
      userId: "u-1",
      status: quizStatuses.IN_PROGRESS,
      startedAt: new Date().toISOString(),
      currentQuestionIndex: 0,
      totalQuestions: 1,
      answers: [],
      completedAt: null,
      score: null,
      percentage: null,
      timeTakenSeconds: null,
    };
    const updatedSession: QuizSession = {
      quiz: mockQuiz,
      attempt: inProgressAttempt,
    };

    vi.mocked(quizService.getQuiz)
      .mockResolvedValueOnce(initialSession)
      .mockResolvedValueOnce(updatedSession);
    vi.mocked(quizService.startOrResumeAttempt).mockResolvedValue(inProgressAttempt);

    const { result } = renderHook(() => useQuizAttempt("quiz-1"), { wrapper });

    await waitFor(() => {
      expect(result.current.showOverview).toBe(true);
    });

    await act(async () => {
      result.current.startQuiz();
    });

    await waitFor(() => {
      expect(result.current.currentStep).toBe(attemptSteps.IN_PROGRESS);
      expect(result.current.isPending).toBe(false);
    });

    expect(quizService.startOrResumeAttempt).toHaveBeenCalledWith("quiz-1", "u-1");
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/quiz/$id",
      params: { id: "quiz-1" },
      hash: "",
      replace: true,
    });
  });

  it("handles draft saving and submitting answers", async () => {
    const inProgressAttempt: QuizAttempt = {
      id: "att-1",
      quizId: "quiz-1",
      userId: "u-1",
      status: quizStatuses.IN_PROGRESS,
      startedAt: new Date().toISOString(),
      currentQuestionIndex: 0,
      totalQuestions: 1,
      answers: [],
      completedAt: null,
      score: null,
      percentage: null,
      timeTakenSeconds: null,
    };
    const session: QuizSession = {
      quiz: mockQuiz,
      attempt: inProgressAttempt,
    };

    vi.mocked(quizService.getQuiz).mockResolvedValue(session);
    vi.mocked(quizService.saveDraft).mockResolvedValue(mockCurrentQuestion);
    vi.mocked(quizService.submitAnswer).mockResolvedValue(mockCurrentQuestion);

    const { result } = renderHook(() => useQuizAttempt("quiz-1"), { wrapper });

    await waitFor(() => {
      expect(result.current.currentStep).toBe(attemptSteps.IN_PROGRESS);
    });

    await act(async () => {
      result.current.handleCommand({
        type: "draft",
        attemptId: "att-1",
        questionId: "q-1",
        selectedOptionIds: ["opt-1"],
      });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(quizService.saveDraft).toHaveBeenCalledWith("att-1", "q-1", ["opt-1"]);

    await act(async () => {
      result.current.handleCommand({
        type: "submit",
        attemptId: "att-1",
        questionId: "q-1",
        selectedOptionIds: ["opt-1"],
      });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(quizService.submitAnswer).toHaveBeenCalledWith("att-1", "q-1", ["opt-1"]);
  });

  it("handles completed attempt and retake navigation", async () => {
    const completedAttempt: QuizAttempt = {
      id: "att-1",
      quizId: "quiz-1",
      userId: "u-1",
      status: quizStatuses.COMPLETED,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      currentQuestionIndex: 0,
      totalQuestions: 1,
      answers: [],
      score: 1,
      percentage: 100,
      timeTakenSeconds: 15,
      correctQuestions: 1,
      incorrectQuestions: 0,
      unansweredQuestions: 0,
    };
    const session: QuizSession = {
      quiz: mockQuiz,
      attempt: completedAttempt,
    };

    vi.mocked(quizService.getQuiz).mockResolvedValue(session);

    const { result } = renderHook(() => useQuizAttempt("quiz-1"), { wrapper });

    await waitFor(() => {
      expect(result.current.currentStep).toBe(attemptSteps.COMPLETED);
    });

    result.current.retakeQuiz();
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/quiz/$id",
      params: { id: "quiz-1" },
      hash: "retake",
    });
  });

  it("handles retake state when hash is 'retake'", async () => {
    vi.mocked(router.useLocation).mockReturnValue("retake" as never);

    const completedAttempt: QuizAttempt = {
      id: "att-1",
      quizId: "quiz-1",
      userId: "u-1",
      status: quizStatuses.COMPLETED,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      currentQuestionIndex: 0,
      totalQuestions: 1,
      answers: [],
      score: 1,
      percentage: 100,
      timeTakenSeconds: 15,
      correctQuestions: 1,
      incorrectQuestions: 0,
      unansweredQuestions: 0,
    };

    vi.mocked(quizService.getQuiz).mockResolvedValue({
      quiz: mockQuiz,
      attempt: completedAttempt,
    });

    const { result } = renderHook(() => useQuizAttempt("quiz-1"), { wrapper });

    await waitFor(() => {
      expect(result.current.isAllowedRetake).toBe(true);
    });

    expect(result.current.showOverview).toBe(true);
    expect(result.current.currentStep).toBe(attemptSteps.OVERVIEW);
  });
});
