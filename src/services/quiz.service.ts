import { getQuizzesQuery } from "./db/queries";
import type { QuizQueryResult } from "./db/queries/quiz";
import type { Country, User } from "../types/quiz";

export const getQuizzes = async (
  page: number,
  pageSize: number,
  userId: User["id"],
  country: Country["code"],
  status: "all" | "not-started" | "in-progress" | "completed" = "all",
): Promise<QuizQueryResult[]> => {
  return await getQuizzesQuery(page, pageSize, userId, country, status);
};
