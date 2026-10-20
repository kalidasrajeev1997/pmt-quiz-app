import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NotFoundPage from "../NotFoundPage";
import { useSelection } from "@/hooks/useSelection";
import type { User } from "@/types/quiz";

const mocks = vi.hoisted(() => ({ navigate: vi.fn() }));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => mocks.navigate,
}));

vi.mock("@/hooks/useSelection", () => ({
  useSelection: vi.fn(),
}));

describe("NotFoundPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSelection).mockReturnValue({
      users: [],
      countries: [],
      selectedUser: null,
      selectedCountry: null,
      isLoading: false,
      error: null,
      selectUser: vi.fn(),
      selectCountry: vi.fn(),
    });
  });

  it("explains the missing page and offers a way back", () => {
    render(<NotFoundPage />);

    expect(
      screen.getByRole("heading", { name: "Oops. You took a wrong turn." }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "No worries. Your quizzes are right where you left them. Head back there, or see who's leading the leaderboard.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Back to your quizzes" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View the leaderboard" }),
    ).toHaveAttribute("href", "/leaderboard");
    expect(document.querySelector("img")?.getAttribute("src")).toContain(
      "404.svg",
    );
  });

  it.each([
    ["user", { to: "/home", search: { status: "all", page: 1 } }],
    ["admin", { to: "/admin" }],
  ] as const)("returns a %s to their quiz area", (role, destination) => {
    const selectedUser: User = {
      id: "user-1",
      name: "Quiz User",
      country: "IN",
      role,
    };
    vi.mocked(useSelection).mockReturnValue({
      users: [selectedUser],
      countries: [{ code: "IN", name: "India" }],
      selectedUser,
      selectedCountry: { code: "IN", name: "India" },
      isLoading: false,
      error: null,
      selectUser: vi.fn(),
      selectCountry: vi.fn(),
    });

    render(<NotFoundPage />);
    fireEvent.click(
      screen.getByRole("button", {
        name: role === "admin" ? "Back to quiz admin" : "Back to your quizzes",
      }),
    );

    expect(mocks.navigate).toHaveBeenCalledWith(destination);
  });
});
