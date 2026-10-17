import type { DBSchema, StoreNames } from "idb";
import type { Attempt, Country, Quiz, SeedMeta, User } from "./quiz";

export interface QuizDatabase extends DBSchema {
  meta: {
    key: number;
    value: SeedMeta;
  };
  countries: {
    key: string;
    value: Country;
  };
  users: {
    key: string;
    value: User;
  };
  quizzes: {
    key: string;
    value: Quiz;
  };
  attempts: {
    key: string;
    value: Attempt;
  };
}

export type TableName = StoreNames<QuizDatabase>;
