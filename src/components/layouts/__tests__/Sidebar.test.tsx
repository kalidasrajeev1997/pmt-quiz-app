import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import Sidebar from "../Sidebar";

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
    return (
      <a href={to} {...props}>
        {children}
      </a>
    );
  },
}));

describe("Sidebar", () => {
  it("renders navigation links for Quizzes and Leaderboard", () => {
    render(<Sidebar />);

    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Quizzes" })).toHaveAttribute("href", "/home");
    expect(screen.getByRole("link", { name: "Leaderboard" })).toHaveAttribute("href", "/leaderboard");
  });
});
