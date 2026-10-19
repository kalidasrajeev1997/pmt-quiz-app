import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import Sidebar from "../Sidebar";
import { SelectionContext } from "@/hooks/useSelection";
import type { User } from "@/types/quiz";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    to: string;
    activeProps?: Record<string, unknown>;
  }) => {
    delete (props as Record<string, unknown>).activeProps;
    delete (props as Record<string, unknown>).activeOptions;
    delete (props as Record<string, unknown>).search;
    return (
      <a href={to} {...props}>
        {children}
      </a>
    );
  },
}));

function sidebar(user: User | null) {
  return (
    <SelectionContext
      value={{
        users: [],
        countries: [],
        selectedUser: user,
        selectedCountry: null,
        isLoading: false,
        error: null,
        selectUser: vi.fn(),
        selectCountry: vi.fn(),
      }}
    >
      <Sidebar />
    </SelectionContext>
  );
}

describe("Sidebar", () => {
  it("renders navigation links for Quizzes and Leaderboard", () => {
    render(sidebar({ id: "u1", name: "Aarav", country: "IN", role: "user" }));

    expect(
      screen.getByRole("navigation", { name: "Primary" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Primary" })).toHaveClass(
      "shrink-0",
      "pb-[max(0.25rem,env(safe-area-inset-bottom))]",
      "md:overflow-y-auto",
    );
    expect(screen.getByRole("link", { name: "Quizzes" })).toHaveAttribute(
      "href",
      "/home",
    );
    expect(screen.getByRole("link", { name: "Leaderboard" })).toHaveAttribute(
      "href",
      "/leaderboard",
    );
    expect(
      screen.queryByRole("link", { name: "Quiz admin" }),
    ).not.toBeInTheDocument();
  });

  it("replaces quizzes with admin navigation when the selected role changes", () => {
    const { rerender } = render(
      sidebar({ id: "u1", name: "Aarav", country: "IN", role: "user" }),
    );
    rerender(
      sidebar({ id: "u5", name: "Admin User", country: "IN", role: "admin" }),
    );
    expect(
      screen.queryByRole("link", { name: "Quizzes" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Quiz admin" })).toHaveAttribute(
      "href",
      "/admin",
    );
    expect(
      screen.getByRole("link", { name: "Leaderboard" }),
    ).toBeInTheDocument();
  });

  it("does not expose either workspace while no user is selected", () => {
    render(sidebar(null));
    expect(
      screen.queryByRole("link", { name: "Quizzes" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Quiz admin" }),
    ).not.toBeInTheDocument();
  });
});
