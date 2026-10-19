import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AdminQuizTableSkeleton from "../AdminQuizTableSkeleton";

describe("admin quiz table skeleton", () => {
  it("announces loading without exposing placeholder content or actions", () => {
    render(<AdminQuizTableSkeleton />);

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveTextContent("Loading quizzes...");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it.each([5, 10, 20])("reserves space for %i quiz rows", (rowCount) => {
    render(<AdminQuizTableSkeleton rowCount={rowCount} />);

    const table = screen.getByRole("table", { hidden: true });
    expect(within(table).getAllByRole("row", { hidden: true })).toHaveLength(
      rowCount + 1,
    );
    expect(
      within(table).getAllByRole("columnheader", { hidden: true }),
    ).toHaveLength(6);
  });

  it("defaults to five rows and disables pulsing for reduced motion", () => {
    render(<AdminQuizTableSkeleton />);

    const table = screen.getByRole("table", { hidden: true });
    expect(within(table).getAllByRole("row", { hidden: true })).toHaveLength(6);
    expect(table.closest('[aria-hidden="true"]')).toHaveClass(
      "motion-reduce:**:data-[slot=skeleton]:animate-none",
    );
  });
});
