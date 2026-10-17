import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { deleteDB } from "idb";
import seed from "../src/data/seed.json";
import {
  closeDatabase,
  DATABASE_NAME,
  deleteRecord,
  getAllRecords,
  getRecord,
  initializeDatabase,
  saveRecord,
} from "../src/services/database";

afterEach(async (): Promise<void> => {
  await closeDatabase();
  await deleteDB(DATABASE_NAME);
});

test("initialization seeds every empty table from the JSON file", async (): Promise<void> => {
  await initializeDatabase();

  assert.deepEqual(await getAllRecords("meta"), [seed.meta]);
  for (const tableName of [
    "countries",
    "users",
    "quizzes",
    "attempts",
  ] as const) {
    const records = await getAllRecords(tableName);
    assert.equal(records.length, seed[tableName].length);
    for (const record of seed[tableName]) {
      assert.ok(
        records.some(
          (stored) => JSON.stringify(stored) === JSON.stringify(record),
        ),
      );
    }
  }
});

test("concurrent initialization shares one connection without duplicate records", async (): Promise<void> => {
  const [firstDatabase, secondDatabase] = await Promise.all([
    initializeDatabase(),
    initializeDatabase(),
  ]);

  assert.equal(firstDatabase, secondDatabase);
  assert.equal((await getAllRecords("attempts")).length, seed.attempts.length);
});

test("reopening preserves edits and deletions in nonempty tables", async (): Promise<void> => {
  const user = await getRecord("users", "u1");
  assert.ok(user);
  await saveRecord("users", { ...user, name: "Updated name" });
  await deleteRecord("users", "u2");
  await closeDatabase();
  await initializeDatabase();

  assert.equal((await getRecord("users", "u1"))?.name, "Updated name");
  assert.equal(await getRecord("users", "u2"), undefined);
  assert.equal((await getAllRecords("users")).length, seed.users.length - 1);
});

test("reopening seeds only empty tables", async (): Promise<void> => {
  const database = await initializeDatabase();
  await database.clear("countries");
  await saveRecord("users", {
    id: "custom-user",
    name: "Custom User",
    country: "IN",
    role: "user",
  });
  await closeDatabase();
  await initializeDatabase();

  assert.equal(
    (await getAllRecords("countries")).length,
    seed.countries.length,
  );
  assert.equal((await getRecord("users", "custom-user"))?.name, "Custom User");
  assert.equal((await getAllRecords("users")).length, seed.users.length + 1);
});
