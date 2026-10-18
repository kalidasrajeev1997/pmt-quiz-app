import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LeaderboardContainer from "../LeaderboardContainer";

describe("LeaderboardContainer", () => {
  it("renders leaderboard container", () => {
    render(<LeaderboardContainer />);
    expect(screen.getByText("Leaderboard")).toBeInTheDocument();
  });
});
