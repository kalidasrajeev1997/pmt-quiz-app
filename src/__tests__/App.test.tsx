import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "../App";
import * as db from "@/services/db/database";

vi.mock("@/services/db/database", () => ({
  getAllRecords: vi.fn(),
  getRecordById: vi.fn(),
}));

describe("App root component", () => {
  it("mounts the application and providers without crashing", async () => {
    vi.mocked(db.getAllRecords).mockImplementation((table: string) => {
      if (table === "countries") {
        return Promise.resolve([{ code: "IN", name: "India" }] as never);
      }
      if (table === "users") {
        return Promise.resolve([
          { id: "u-1", name: "Alice", country: "IN", role: "user" },
        ] as never);
      }
      return Promise.resolve([] as never);
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Quizly")).toBeInTheDocument();
    });
  });
});
