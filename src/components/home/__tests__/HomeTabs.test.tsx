import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import HomeTabs from "../HomeTabs";
import type { TabStatus } from "@/types/quiz";

describe("HomeTabs", () => {
  it("renders all tabs and triggers setTab on tab change", async () => {
    const user = userEvent.setup();
    const setTab = vi.fn();

    render(
      <HomeTabs tab="all" setTab={setTab}>
        <div>Tab content</div>
      </HomeTabs>,
    );

    expect(screen.getByRole("tab", { name: "All" })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Not Started" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "In Progress" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Completed" })).toBeInTheDocument();
    expect(screen.getByText("Tab content")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Completed" }));
    expect(setTab).toHaveBeenCalledWith("completed", expect.anything());
  });

  it("renders children only when active tab matches", () => {
    const { rerender } = render(
      <HomeTabs tab="all" setTab={vi.fn()}>
        <div>All content</div>
      </HomeTabs>,
    );

    expect(screen.getByText("All content")).toBeInTheDocument();

    rerender(
      <HomeTabs tab={"not-started" as TabStatus} setTab={vi.fn()}>
        <div>Not started content</div>
      </HomeTabs>,
    );

    expect(screen.getByText("Not started content")).toBeInTheDocument();
    expect(screen.queryByText("All content")).not.toBeInTheDocument();
  });
});
