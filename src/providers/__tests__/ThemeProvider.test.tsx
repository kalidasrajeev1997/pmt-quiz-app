import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "../ThemeProvider";
import { useTheme } from "@/hooks/useTheme";

function ThemeConsumer() {
  const { theme, toggleTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-val">{theme}</span>
      <button onClick={toggleTheme}>Toggle</button>
      <button onClick={() => setTheme("dark")}>Set Dark</button>
      <button onClick={() => setTheme("light")}>Set Light</button>
    </div>
  );
}

describe("ThemeProvider and useTheme", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.style.colorScheme = "";
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  it("defaults to light theme when localStorage is empty and system is not dark", () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme-val")).toHaveTextContent("light");
    expect(document.documentElement).toHaveClass("light");
    expect(document.documentElement).not.toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("light");
  });

  it("detects system dark mode preference when no saved preference exists", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-color-scheme: dark)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme-val")).toHaveTextContent("dark");
    expect(document.documentElement).toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("initializes from stored localStorage preference", () => {
    localStorage.setItem("pmt-quiz-theme", "dark");

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme-val")).toHaveTextContent("dark");
    expect(document.documentElement).toHaveClass("dark");
  });

  it("toggles theme and updates document classes and localStorage", async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme-val")).toHaveTextContent("light");
    expect(document.documentElement).toHaveClass("light");

    await user.click(screen.getByRole("button", { name: "Toggle" }));

    expect(screen.getByTestId("theme-val")).toHaveTextContent("dark");
    expect(document.documentElement).toHaveClass("dark");
    expect(document.documentElement).not.toHaveClass("light");
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(localStorage.getItem("pmt-quiz-theme")).toBe("dark");

    await user.click(screen.getByRole("button", { name: "Toggle" }));

    expect(screen.getByTestId("theme-val")).toHaveTextContent("light");
    expect(document.documentElement).toHaveClass("light");
    expect(document.documentElement).not.toHaveClass("dark");
    expect(localStorage.getItem("pmt-quiz-theme")).toBe("light");
  });

  it("allows setting theme directly", async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Set Dark" }));
    expect(screen.getByTestId("theme-val")).toHaveTextContent("dark");
    expect(localStorage.getItem("pmt-quiz-theme")).toBe("dark");

    await user.click(screen.getByRole("button", { name: "Set Light" }));
    expect(screen.getByTestId("theme-val")).toHaveTextContent("light");
    expect(localStorage.getItem("pmt-quiz-theme")).toBe("light");
  });

  it("gracefully handles localStorage throwing errors", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError: localStorage is disabled");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("SecurityError: localStorage is disabled");
    });

    expect(() =>
      render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>,
      ),
    ).not.toThrow();

    expect(screen.getByTestId("theme-val")).toHaveTextContent("light");
  });

  it("returns default fallback when useTheme is called outside ThemeProvider", () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe("light");
    expect(typeof result.current.setTheme).toBe("function");
    expect(typeof result.current.toggleTheme).toBe("function");
    // Should not throw when executing fallback functions
    expect(() => {
      act(() => {
        result.current.toggleTheme();
        result.current.setTheme("dark");
      });
    }).not.toThrow();
  });
});
