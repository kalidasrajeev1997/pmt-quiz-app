import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { ModeToggle } from "../mode-toggle";
import { ThemeProvider } from "@/providers/ThemeProvider";

describe("ModeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("light", "dark");
  });

  it("renders with accessible label in light mode", () => {
    render(
      <ThemeProvider defaultTheme="light">
        <ModeToggle />
      </ThemeProvider>,
    );

    const button = screen.getByRole("button", {
      name: "Switch to dark theme",
    });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("renders with accessible label in dark mode", () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ModeToggle />
      </ThemeProvider>,
    );

    const button = screen.getByRole("button", {
      name: "Switch to light theme",
    });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("toggles theme when clicked", async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider defaultTheme="light">
        <ModeToggle />
      </ThemeProvider>,
    );

    const button = screen.getByRole("button", {
      name: "Switch to dark theme",
    });
    expect(button).toHaveAttribute("aria-pressed", "false");

    await user.click(button);

    expect(
      screen.getByRole("button", { name: "Switch to light theme" }),
    ).toBeInTheDocument();
    expect(document.documentElement).toHaveClass("dark");

    await user.click(
      screen.getByRole("button", { name: "Switch to light theme" }),
    );

    expect(
      screen.getByRole("button", { name: "Switch to dark theme" }),
    ).toBeInTheDocument();
    expect(document.documentElement).toHaveClass("light");
  });
});
