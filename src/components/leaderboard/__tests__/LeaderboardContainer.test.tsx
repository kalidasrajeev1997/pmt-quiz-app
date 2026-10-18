import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LeaderboardContainer from "../LeaderboardContainer";
import { leaderboardColumns } from "../LeaderboardRow";
import { useSelection } from "@/hooks/useSelection";
import {
  getLeaderboard,
  getLeaderboardQuizzes,
} from "@/services/leaderboard.service";
import type { LeaderboardEntry } from "@/types/leaderboard";

vi.mock("@/hooks/useSelection", () => ({ useSelection: vi.fn() }));
vi.mock("@/services/leaderboard.service", () => ({
  getLeaderboard: vi.fn(),
  getLeaderboardQuizzes: vi.fn(),
}));

const leader: LeaderboardEntry = {
  rank: 1,
  userId: "user-1",
  name: "Ada Lovelace",
  score: 28,
  timeTakenSeconds: 90,
  quizzesCompleted: 3,
};
const currentUser: LeaderboardEntry = {
  rank: 12,
  userId: "user-me",
  name: "Grace Hopper",
  score: 12,
  timeTakenSeconds: 120,
  quizzesCompleted: 2,
};

function renderLeaderboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const view = render(
    <QueryClientProvider client={queryClient}>
      <LeaderboardContainer />
    </QueryClientProvider>,
  );
  return { ...view, queryClient };
}

describe("LeaderboardContainer", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useSelection).mockReturnValue({
      users: [],
      countries: [],
      selectedUser: {
        id: "user-me",
        name: "Grace Hopper",
        country: "IN",
        role: "user",
      },
      selectedCountry: null,
      isLoading: false,
      error: null,
      selectUser: vi.fn(),
      selectCountry: vi.fn(),
    });
    vi.mocked(getLeaderboardQuizzes).mockResolvedValue([
      { id: "quiz-a", title: "Science quiz" },
    ]);
    vi.mocked(getLeaderboard).mockResolvedValue({
      entries: [leader],
      currentUser,
      totalParticipants: 12,
    });
  });

  it("shows overall standings and highlights the current user outside the top list", async () => {
    renderLeaderboard();
    expect(
      screen.getByRole("heading", { name: "Leaderboard" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("table", { name: "Overall standings" }),
    ).toBeInTheDocument();
    expect(getLeaderboard).toHaveBeenCalledWith(null, 10, "user-me");
    expect(getLeaderboardQuizzes).toHaveBeenCalledWith("user-me");
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("12 participants")).toBeInTheDocument();
    const position = screen.getByRole("table", { name: "Your position" });
    expect(within(position).getByRole("row")).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(within(position).getByText("Grace Hopper")).toBeInTheDocument();
    expect(
      within(position).getByText("12", { selector: "span" }),
    ).toBeInTheDocument();
    expect(within(position).getByText("You")).toBeInTheDocument();
    expect(within(position).getByText(/2 min/)).toBeInTheDocument();
  });

  it("uses the same grid and padding for column headings and standings rows", async () => {
    renderLeaderboard();
    const table = await screen.findByRole("table", {
      name: "Overall standings",
    });
    for (const row of within(table).getAllByRole("row")) {
      expect(row).toHaveClass(...leaderboardColumns.split(" "));
    }
    expect(
      within(table).getByRole("columnheader", { name: "Name" }),
    ).not.toHaveClass("sm:pl-13");
  });

  it("switches between quiz and overall rankings", async () => {
    const user = userEvent.setup();
    renderLeaderboard();
    await screen.findByRole("table", { name: "Overall standings" });
    await user.click(screen.getByRole("combobox", { name: "Standings" }));
    await user.click(
      await screen.findByRole("option", { name: "Science quiz" }),
    );
    await screen.findByRole("table", { name: "Quiz standings" });
    expect(getLeaderboard).toHaveBeenCalledWith("quiz-a", 10, "user-me");
    expect(screen.queryByText("Total score")).not.toBeInTheDocument();
    await user.click(screen.getByRole("combobox", { name: "Standings" }));
    await user.click(await screen.findByRole("option", { name: "Overall" }));
    await screen.findByRole("table", { name: "Overall standings" });
  });

  it("highlights the current user in the list without duplicating them", async () => {
    vi.mocked(getLeaderboard).mockResolvedValue({
      entries: [leader, currentUser],
      currentUser,
      totalParticipants: 2,
    });
    renderLeaderboard();
    await screen.findByText("Grace Hopper");
    expect(screen.getAllByText("Grace Hopper")).toHaveLength(1);
    expect(
      screen.getByText("Grace Hopper").closest('[role="row"]'),
    ).toHaveAttribute("aria-current", "true");
    expect(
      screen.queryByRole("heading", { name: "Your position" }),
    ).not.toBeInTheDocument();
  });

  it("shows a loading state without displaying stale standings", () => {
    vi.mocked(getLeaderboard).mockReturnValue(new Promise(() => {}));
    renderLeaderboard();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading leaderboard...",
    );
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("shows empty standings and an unranked current user", async () => {
    vi.mocked(getLeaderboard).mockResolvedValue({
      entries: [],
      currentUser: null,
      totalParticipants: 0,
    });
    const view = renderLeaderboard();
    expect(await screen.findByText("No finishers yet")).toBeInTheDocument();
    view.unmount();
    vi.mocked(getLeaderboard).mockResolvedValue({
      entries: [leader],
      currentUser: null,
      totalParticipants: 1,
    });
    renderLeaderboard();
    expect(
      await screen.findByText("You haven't completed a quiz yet."),
    ).toBeInTheDocument();
  });

  it("retries a failed request", async () => {
    const user = userEvent.setup();
    vi.mocked(getLeaderboard).mockRejectedValueOnce(
      new Error("Database unavailable"),
    );
    renderLeaderboard();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Database unavailable",
    );
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByRole("table", { name: "Overall standings" }),
    ).toBeInTheDocument();
  });

  it("hides completion prompts for admins in overall and quiz standings", async () => {
    const user = userEvent.setup();
    vi.mocked(useSelection).mockReturnValue({
      users: [],
      countries: [],
      selectedCountry: null,
      selectedUser: {
        id: "admin",
        name: "Admin",
        country: "IN",
        role: "admin",
      },
      isLoading: false,
      error: null,
      selectUser: vi.fn(),
      selectCountry: vi.fn(),
    });
    vi.mocked(getLeaderboard).mockResolvedValue({
      entries: [leader],
      currentUser: null,
      totalParticipants: 1,
    });
    renderLeaderboard();
    await screen.findByRole("table", { name: "Overall standings" });
    expect(getLeaderboardQuizzes).toHaveBeenCalledWith("admin");
    expect(screen.queryByText(/You haven't completed/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("combobox", { name: "Standings" }));
    await user.click(
      await screen.findByRole("option", { name: "Science quiz" }),
    );
    await screen.findByRole("table", { name: "Quiz standings" });
    expect(screen.queryByText(/You haven't completed/)).not.toBeInTheDocument();
  });

  it("shows an admin empty state without inviting them to complete a quiz", async () => {
    vi.mocked(useSelection).mockReturnValue({
      users: [],
      countries: [],
      selectedCountry: null,
      selectedUser: {
        id: "admin",
        name: "Admin",
        country: "IN",
        role: "admin",
      },
      isLoading: false,
      error: null,
      selectUser: vi.fn(),
      selectCountry: vi.fn(),
    });
    vi.mocked(getLeaderboard).mockResolvedValue({
      entries: [],
      currentUser: null,
      totalParticipants: 0,
    });
    renderLeaderboard();
    expect(
      await screen.findByText("No completed attempts yet."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Complete a quiz|Be the first|You haven't completed/),
    ).not.toBeInTheDocument();
  });

  it("waits for a selected user before requesting scoped quizzes or standings", () => {
    vi.mocked(useSelection).mockReturnValue({
      users: [],
      countries: [],
      selectedUser: null,
      selectedCountry: null,
      isLoading: true,
      error: null,
      selectUser: vi.fn(),
      selectCountry: vi.fn(),
    });
    renderLeaderboard();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(getLeaderboardQuizzes).not.toHaveBeenCalled();
    expect(getLeaderboard).not.toHaveBeenCalled();
  });

  it("does not retry unscoped requests when the selected user is unavailable", async () => {
    const user = userEvent.setup();
    vi.mocked(useSelection).mockReturnValue({
      users: [],
      countries: [],
      selectedUser: null,
      selectedCountry: null,
      isLoading: false,
      error: "User unavailable",
      selectUser: vi.fn(),
      selectCountry: vi.fn(),
    });
    renderLeaderboard();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(getLeaderboardQuizzes).not.toHaveBeenCalled();
    expect(getLeaderboard).not.toHaveBeenCalled();
  });

  it("drops another user's quiz selection and cached choices when switching users", async () => {
    const user = userEvent.setup();
    const view = renderLeaderboard();
    await screen.findByRole("table", { name: "Overall standings" });
    await user.click(screen.getByRole("combobox", { name: "Standings" }));
    await user.click(
      await screen.findByRole("option", { name: "Science quiz" }),
    );
    await screen.findByRole("table", { name: "Quiz standings" });

    vi.mocked(useSelection).mockReturnValue({
      users: [],
      countries: [],
      selectedCountry: { code: "IN", name: "India" },
      selectedUser: {
        id: "user-gb",
        name: "Oliver",
        country: "GB",
        role: "user",
      },
      isLoading: false,
      error: null,
      selectUser: vi.fn(),
      selectCountry: vi.fn(),
    });
    vi.mocked(getLeaderboardQuizzes).mockResolvedValue([
      { id: "quiz-gb", title: "British quiz" },
    ]);
    view.rerender(
      <QueryClientProvider client={view.queryClient}>
        <LeaderboardContainer />
      </QueryClientProvider>,
    );
    await screen.findByRole("table", { name: "Overall standings" });
    expect(getLeaderboardQuizzes).toHaveBeenLastCalledWith("user-gb");
    expect(getLeaderboard).toHaveBeenLastCalledWith(null, 10, "user-gb");
    expect(getLeaderboard).not.toHaveBeenCalledWith("quiz-a", 10, "user-gb");
    await user.click(screen.getByRole("combobox", { name: "Standings" }));
    expect(
      await screen.findByRole("option", { name: "British quiz" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Science quiz" }),
    ).not.toBeInTheDocument();
  });

  it("updates the current user's rank when the selected user changes", async () => {
    const view = renderLeaderboard();
    await screen.findByText("Grace Hopper");
    vi.mocked(useSelection).mockReturnValue({
      ...vi.mocked(useSelection).mock.results[0].value,
      selectedUser: {
        id: "user-1",
        name: "Ada Lovelace",
        country: "IN",
        role: "user",
      },
    });
    vi.mocked(getLeaderboard).mockResolvedValue({
      entries: [leader],
      currentUser: leader,
      totalParticipants: 12,
    });
    view.rerender(
      <QueryClientProvider client={view.queryClient}>
        <LeaderboardContainer />
      </QueryClientProvider>,
    );
    await waitFor(() =>
      expect(getLeaderboard).toHaveBeenLastCalledWith(null, 10, "user-1"),
    );
    expect(await screen.findByText("You")).toBeInTheDocument();
  });
});
