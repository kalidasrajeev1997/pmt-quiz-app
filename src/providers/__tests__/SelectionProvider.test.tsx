import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SelectionProvider } from "../SelectionProvider";
import { useSelection } from "@/hooks/useSelection";
import * as db from "@/services/db/database";
import type { Country, User } from "@/types/quiz";

vi.mock("@/services/db/database", () => ({
  getAllRecords: vi.fn(),
}));

function Consumer() {
  const {
    users,
    countries,
    selectedUser,
    selectedCountry,
    isLoading,
    error,
    selectUser,
    selectCountry,
  } = useSelection();

  if (isLoading) return <div>Loading selection...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <div data-testid="selected-user">{selectedUser?.name ?? "none"}</div>
      <div data-testid="selected-country">{selectedCountry?.code ?? "none"}</div>
      <div data-testid="user-count">{users.length}</div>
      <div data-testid="country-count">{countries.length}</div>
      <button onClick={() => selectCountry("GB")}>Select GB</button>
      <button onClick={() => selectUser("u-2")}>Select User 2</button>
    </div>
  );
}

describe("SelectionProvider", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  it("loads countries and users and defaults to the first available", async () => {
    const mockCountries: Country[] = [
      { code: "IN", name: "India" },
      { code: "GB", name: "United Kingdom" },
    ];
    const mockUsers: User[] = [
      { id: "u-1", name: "Alice", country: "IN", role: "user" },
      { id: "u-2", name: "Bob", country: "GB", role: "user" },
    ];

    vi.mocked(db.getAllRecords).mockImplementation((table: string) => {
      if (table === "countries") return Promise.resolve(mockCountries as never);
      if (table === "users") return Promise.resolve(mockUsers as never);
      return Promise.resolve([] as never);
    });

    render(
      <QueryClientProvider client={queryClient}>
        <SelectionProvider>
          <Consumer />
        </SelectionProvider>
      </QueryClientProvider>,
    );

    expect(screen.getByText("Loading selection...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("selected-country")).toHaveTextContent("IN");
    });

    expect(screen.getByTestId("selected-user")).toHaveTextContent("Alice");
    expect(screen.getByTestId("country-count")).toHaveTextContent("2");
    expect(screen.getByTestId("user-count")).toHaveTextContent("1");
  });

  it("updates selection when selectCountry and selectUser are called", async () => {
    const user = userEvent.setup();
    const mockCountries: Country[] = [
      { code: "IN", name: "India" },
      { code: "GB", name: "United Kingdom" },
    ];
    const mockUsers: User[] = [
      { id: "u-1", name: "Alice", country: "IN", role: "user" },
      { id: "u-2", name: "Bob", country: "GB", role: "user" },
    ];

    vi.mocked(db.getAllRecords).mockImplementation((table: string) => {
      if (table === "countries") return Promise.resolve(mockCountries as never);
      if (table === "users") return Promise.resolve(mockUsers as never);
      return Promise.resolve([] as never);
    });

    render(
      <QueryClientProvider client={queryClient}>
        <SelectionProvider>
          <Consumer />
        </SelectionProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("selected-country")).toHaveTextContent("IN");
    });

    await act(async () => {
      await user.click(screen.getByText("Select GB"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("selected-country")).toHaveTextContent("GB");
      expect(screen.getByTestId("selected-user")).toHaveTextContent("Bob");
    });

    expect(localStorage.getItem("selectedCountry")).toBe("GB");

    await act(async () => {
      await user.click(screen.getByText("Select User 2"));
    });

    expect(localStorage.getItem("selectedUser")).toBe("u-2");
  });

  it("handles error when database query fails", async () => {
    vi.mocked(db.getAllRecords).mockRejectedValue(new Error("Database error"));

    render(
      <QueryClientProvider client={queryClient}>
        <SelectionProvider>
          <Consumer />
        </SelectionProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Users and countries could not be loaded"),
      ).toBeInTheDocument();
    });
  });
});
