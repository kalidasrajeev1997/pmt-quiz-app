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

export type TabStatus = "all" | "not-started" | "in-progress" | "completed";
