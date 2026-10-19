import { openDB } from "idb";
import type { IDBPDatabase, StoreKey, StoreValue } from "idb";
import seed from "../../data/seed.json";
import type { QuizDatabase, TableName } from "../../types/database";
import type { SeedData } from "../../types/quiz";

export const DATABASE_NAME = "pmt-quiz-app";
export const DATABASE_VERSION = 1;

const TABLE_NAMES = [
  "meta",
  "countries",
  "users",
  "quizzes",
  "attempts",
] as const satisfies readonly TableName[];

const seedData = seed as SeedData;
const seedRecords: { [Table in TableName]: StoreValue<QuizDatabase, Table>[] } =
  {
    meta: [seedData.meta],
    countries: seedData.countries,
    users: seedData.users,
    quizzes: seedData.quizzes,
    attempts: seedData.attempts,
  };

let databasePromise: Promise<IDBPDatabase<QuizDatabase>> | undefined;

async function seedEmptyTables(
  database: IDBPDatabase<QuizDatabase>,
): Promise<void> {
  const transaction = database.transaction(TABLE_NAMES, "readwrite");

  try {
    const initialized = (await transaction.objectStore("meta").count()) > 0;
    await Promise.all(
      TABLE_NAMES.map(async (tableName): Promise<void> => {
        if (
          initialized &&
          (tableName === "quizzes" || tableName === "attempts")
        )
          return;
        const store = transaction.objectStore(tableName);

        if ((await store.count()) > 0) {
          return;
        }

        await Promise.all(
          seedRecords[tableName].map((record) => store.add(record)),
        );
      }),
    );
    await transaction.done;
  } catch (error: unknown) {
    try {
      transaction.abort();
    } catch {
      await transaction.done.catch((): void => {});
      throw error;
    }
    await transaction.done.catch((): void => {});
    throw error;
  }
}

async function openDatabase(): Promise<IDBPDatabase<QuizDatabase>> {
  const database = await openDB<QuizDatabase>(DATABASE_NAME, DATABASE_VERSION, {
    upgrade(database): void {
      database.createObjectStore("meta", { keyPath: "version" });
      database.createObjectStore("countries", { keyPath: "code" });
      database.createObjectStore("users", { keyPath: "id" });
      database.createObjectStore("quizzes", { keyPath: "id" });
      database.createObjectStore("attempts", { keyPath: "id" });
    },
    blocking(): void {
      closeDatabase();
    },
    terminated(): void {
      databasePromise = undefined;
    },
  });

  try {
    await seedEmptyTables(database);
    return database;
  } catch (error: unknown) {
    database.close();
    throw error;
  }
}

export function initializeDatabase(): Promise<IDBPDatabase<QuizDatabase>> {
  databasePromise ??= openDatabase().catch((error: unknown): never => {
    databasePromise = undefined;
    throw error;
  });

  return databasePromise;
}

export async function closeDatabase(): Promise<void> {
  const pendingDatabase = databasePromise;
  databasePromise = undefined;

  if (pendingDatabase) {
    const database = await pendingDatabase;
    database.close();
  }
}

export async function getAllRecords<Table extends TableName>(
  tableName: Table,
): Promise<StoreValue<QuizDatabase, Table>[]> {
  const database = await initializeDatabase();
  return database.getAll(tableName);
}

export async function getRecord<Table extends TableName>(
  tableName: Table,
  key: StoreKey<QuizDatabase, Table>,
): Promise<StoreValue<QuizDatabase, Table> | undefined> {
  const database = await initializeDatabase();
  return database.get(tableName, key);
}

export async function saveRecord<Table extends TableName>(
  tableName: Table,
  record: StoreValue<QuizDatabase, Table>,
): Promise<StoreKey<QuizDatabase, Table>> {
  const database = await initializeDatabase();
  return database.put(tableName, record);
}

export async function deleteRecord<Table extends TableName>(
  tableName: Table,
  key: StoreKey<QuizDatabase, Table>,
): Promise<void> {
  const database = await initializeDatabase();
  await database.delete(tableName, key);
}

export async function resetDatabase(): Promise<void> {
  const database = await initializeDatabase();
  const transaction = database.transaction(TABLE_NAMES, "readwrite");

  try {
    const freshRecords: {
      [Table in TableName]: StoreValue<QuizDatabase, Table>[];
    } = {
      meta: [structuredClone(seedData.meta)],
      countries: structuredClone(seedData.countries),
      users: structuredClone(seedData.users),
      quizzes: structuredClone(seedData.quizzes),
      attempts: structuredClone(seedData.attempts),
    };

    await Promise.all(
      TABLE_NAMES.map(async (tableName): Promise<void> => {
        const store = transaction.objectStore(tableName);
        await store.clear();
        await Promise.all(
          freshRecords[tableName].map((record) => store.add(record)),
        );
      }),
    );
    await transaction.done;
  } catch (error: unknown) {
    try {
      transaction.abort();
    } catch {
      await transaction.done.catch((): void => {});
      throw error;
    }
    await transaction.done.catch((): void => {});
    throw error;
  }
}
