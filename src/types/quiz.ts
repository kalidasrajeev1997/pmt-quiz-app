export interface SeedMeta {
  version: number;
  generatedAt: string;
  notes: string;
}

export interface Country {
  code: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  country: Country["code"];
  role: "user" | "admin";
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  type: "single" | "multiple";
  options: QuestionOption[];
  correctOptionIds: QuestionOption["id"][];
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  countries: Country["code"][];
  timeLimitSeconds: number | null;
  perQuestionSeconds: number | null;
  retakesAllowed: boolean;
  questions: Question[];
}

export interface Answer {
  questionId: Question["id"];
  selectedOptionIds: QuestionOption["id"][];
  isCorrect: boolean;
  answeredAt: string;
}

interface AttemptBase {
  id: string;
  quizId: Quiz["id"];
  userId: User["id"];
  startedAt: string;
  currentQuestionIndex: number;
  answers: Answer[];
  totalQuestions: number;
  quizSnapshot?: string;
  supersededByAttemptId?: string;
  questionStartedAt?: string;
  draftOptionIds?: QuestionOption["id"][];
}

export interface InProgressAttempt extends AttemptBase {
  status: "in_progress";
  completedAt: null;
  score: null;
  percentage: null;
  timeTakenSeconds: null;
}

export interface CompletedAttempt extends AttemptBase {
  status: "completed";
  completedAt: string;
  score: number;
  percentage: number;
  timeTakenSeconds: number;
}

export type Attempt = InProgressAttempt | CompletedAttempt;

export interface SeedData {
  meta: SeedMeta;
  countries: Country[];
  users: User[];
  quizzes: Quiz[];
  attempts: Attempt[];
}

export type TabStatus = "all" | "not-started" | "in_progress" | "completed";

export class QuizAttemptError extends Error {}

export class QuizEditedError extends QuizAttemptError {}

export type PublicQuestion = Omit<Question, "correctOptionIds">;
export type PublicQuiz = Omit<Quiz, "questions"> & {
  questions: PublicQuestion[];
};
export type InProgressQuizAttempt = Omit<
  InProgressAttempt,
  "answers" | "quizSnapshot"
> & { answers: Omit<Answer, "isCorrect">[] };
export type QuizResult = Omit<CompletedAttempt, "quizSnapshot"> & {
  correctQuestions: number;
  incorrectQuestions: number;
  unansweredQuestions: number;
};
export type QuizAttempt = InProgressQuizAttempt | QuizResult;

export interface QuizSession {
  quiz: PublicQuiz;
  attempt: QuizAttempt | null;
}

export interface CurrentQuestion {
  attemptId: Attempt["id"];
  status: Attempt["status"];
  question: PublicQuestion | null;
  index: number;
  total: number;
  remainingSeconds: number | null;
  overallRemainingSeconds: number | null;
  questionRemainingSeconds: number | null;
  selectedOptionIds: string[];
}
