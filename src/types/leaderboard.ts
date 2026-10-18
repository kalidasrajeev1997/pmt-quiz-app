import type { Quiz, User } from "./quiz";

export interface LeaderboardEntry {
  rank: number;
  userId: User["id"];
  name: string;
  score: number;
  timeTakenSeconds: number;
  quizzesCompleted: number;
}

export interface LeaderboardResult {
  entries: LeaderboardEntry[];
  currentUser: LeaderboardEntry | null;
  totalParticipants: number;
}

export type LeaderboardQuiz = Pick<Quiz, "id" | "title">;
