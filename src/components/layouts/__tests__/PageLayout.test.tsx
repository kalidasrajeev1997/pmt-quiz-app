import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PageLayout from "../PageLayout";
import { useSelection } from "@/hooks/useSelection";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeProvider } from "@/providers/ThemeProvider";

const location = vi.hoisted(() => ({
  pathname: "/home",
  href: "/home?status=all&page=1",
}));

vi.mock("@/hooks/useSelection", () => ({
  useSelection: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useLocation: () => location,
  Link: ({
    children,
    to,
    activeProps,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    to: string;
    activeProps?: Record<string, unknown>;
  }) => {
    void activeProps;
    return (
      <a href={to} {...props}>
        {children}
      </a>
    );
  },
}));

describe("PageLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    location.pathname = "/home";
    location.href = "/home?status=all&page=1";
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

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders header with user and country details and main content", () => {
    vi.mocked(useSelection).mockReturnValue({
      users: [{ id: "u-1", name: "Alice Bob", country: "IN", role: "user" }],
      countries: [{ code: "IN", name: "India" }],
      selectedUser: {
        id: "u-1",
        name: "Alice Bob",
        country: "IN",
        role: "user",
      },
      selectedCountry: { code: "IN", name: "India" },
      isLoading: false,
      error: null,
      selectUser: vi.fn(),
      selectCountry: vi.fn(),
    });

    render(
      <PageLayout>
        <div>Page Body Content</div>
      </PageLayout>,
    );

    expect(screen.getByText("Quizly")).toBeInTheDocument();
    expect(screen.getByText("Alice Bob")).toBeInTheDocument();
    expect(screen.getByText("AB")).toBeInTheDocument();
    expect(screen.getByText("IN")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /switch to (dark|light) theme/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Page Body Content")).toBeInTheDocument();
    expect(screen.getByRole("banner").parentElement).toHaveClass("h-dvh");
    expect(screen.getByRole("main")).toHaveClass("h-full", "min-h-full");
    expect(screen.getByRole("main")).not.toHaveClass("pb-20");
    expect(
      document.querySelectorAll('[data-slot="scroll-area-viewport"]'),
    ).toHaveLength(1);
  });

  it("renders mode toggle button in header and allows toggling theme", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider defaultTheme="light">
        <PageLayout>
          <div>Body</div>
        </PageLayout>
      </ThemeProvider>,
    );

    const toggle = screen.getByRole("button", {
      name: "Switch to dark theme",
    });
    expect(toggle).toBeInTheDocument();

    await user.click(toggle);

    expect(
      screen.getByRole("button", { name: "Switch to light theme" }),
    ).toBeInTheDocument();
    expect(document.documentElement).toHaveClass("dark");
  });

  it("lets quiz screens own scrolling without a nested layout scroller", () => {
    location.pathname = "/quiz/q1";
    location.href = "/quiz/q1";

    render(
      <PageLayout>
        <ScrollArea>Quiz content</ScrollArea>
      </PageLayout>,
    );

    expect(
      document.querySelectorAll('[data-slot="scroll-area-viewport"]'),
    ).toHaveLength(1);
    expect(screen.getByRole("main")).toHaveClass("min-h-0", "overflow-hidden");
  });

  it("resets scrolling on screen and search changes, but not ordinary updates", () => {
    const content = <div>Page content</div>;
    const { rerender } = render(<PageLayout>{content}</PageLayout>);
    const viewport = document.querySelector<HTMLDivElement>(
      '[data-slot="scroll-area-viewport"]',
    )!;

    viewport.scrollTop = 180;
    viewport.scrollLeft = 25;
    rerender(<PageLayout>{content}</PageLayout>);
    expect(viewport.scrollTop).toBe(180);
    expect(viewport.scrollLeft).toBe(25);

    for (const href of [
      "/home?status=all&page=2",
      "/leaderboard",
      "/home?status=all&page=1",
    ]) {
      viewport.scrollTop = 180;
      viewport.scrollLeft = 25;
      location.href = href;
      location.pathname = href.split("?")[0];
      rerender(<PageLayout>{content}</PageLayout>);
      expect(viewport.scrollTop).toBe(0);
      expect(viewport.scrollLeft).toBe(0);
    }
  });

  it("omits decorative edge strips and restores document colors", () => {
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
    const originalHtmlStyle = document.documentElement.getAttribute("style");
    const originalBodyStyle = document.body.getAttribute("style");
    document.documentElement.style.backgroundColor = "red";
    document.body.style.backgroundColor = "blue";
    const themeColor = document.createElement("meta");
    themeColor.name = "theme-color";
    themeColor.content = "#123456";
    document.head.append(themeColor);

    const { unmount } = render(<PageLayout>Content</PageLayout>);

    for (const selector of [".edge-top", ".edge-bottom"]) {
      expect(document.querySelector(selector)).not.toBeInTheDocument();
    }
    expect(document.documentElement.style.backgroundColor).not.toBe("red");
    expect(document.body.style.backgroundColor).not.toBe("blue");
    expect(themeColor.content).not.toBe("#123456");

    unmount();

    expect(document.querySelector(".edge-top")).not.toBeInTheDocument();
    expect(document.querySelector(".edge-bottom")).not.toBeInTheDocument();
    expect(document.documentElement.style.backgroundColor).toBe("red");
    expect(document.body.style.backgroundColor).toBe("blue");
    expect(themeColor.content).toBe("#123456");
    themeColor.remove();
    if (originalHtmlStyle === null)
      document.documentElement.removeAttribute("style");
    else document.documentElement.setAttribute("style", originalHtmlStyle);
    if (originalBodyStyle === null) document.body.removeAttribute("style");
    else document.body.setAttribute("style", originalBodyStyle);
  });

  it("synchronizes one palette after nested scrolling, restoration, and viewport changes", async () => {
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
    const viewport = new EventTarget();
    vi.stubGlobal("visualViewport", viewport);
    const frames = new Map<number, FrameRequestCallback>();
    let nextFrame = 0;
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => {
        frames.set(++nextFrame, callback);
        return nextFrame;
      }),
    );
    const cancelFrame = vi.fn((frame: number) => frames.delete(frame));
    vi.stubGlobal("cancelAnimationFrame", cancelFrame);
    const flushFrame = async () => {
      await act(async () => {
        const pending = [...frames.values()];
        frames.clear();
        pending.forEach((callback) => callback(0));
      });
    };
    const actualGetComputedStyle = window.getComputedStyle.bind(window);
    let palette = {
      "--page-background": "#eeeeee",
      "--page-top-background": "#aabbcc",
      "--page-bottom-background": "#ddeeff",
    };
    vi.spyOn(window, "getComputedStyle").mockImplementation(
      (element, pseudo) => {
        const styles = actualGetComputedStyle(element, pseudo);
        if (element.classList.contains("page-layout")) {
          const getPropertyValue = styles.getPropertyValue.bind(styles);
          styles.getPropertyValue = (property) =>
            palette[property as keyof typeof palette] ??
            getPropertyValue(property);
        }
        return styles;
      },
    );
    const { unmount } = render(<PageLayout>Content</PageLayout>);
    const page = screen.getByRole("banner").parentElement!;
    const cssColor = (color: string) => {
      const probe = document.createElement("div");
      probe.style.backgroundColor = color;
      return probe.style.backgroundColor;
    };
    const expectPalette = () => {
      expect(page.style.getPropertyValue("--visible-page-background")).toBe(
        palette["--page-background"],
      );
      expect(page.style.getPropertyValue("--visible-top-background")).toBe(
        palette["--page-top-background"],
      );
      expect(page.style.getPropertyValue("--visible-bottom-background")).toBe(
        palette["--page-bottom-background"],
      );
      expect(
        document.documentElement.style.getPropertyValue(
          "--edge-top-background",
        ),
      ).toBe(palette["--page-top-background"]);
      expect(
        document.documentElement.style.getPropertyValue(
          "--edge-bottom-background",
        ),
      ).toBe(palette["--page-bottom-background"]);
      expect(document.documentElement.style.backgroundColor).toBe(
        cssColor(palette["--page-top-background"]),
      );
      expect(document.body.style.backgroundColor).toBe(
        cssColor(palette["--page-bottom-background"]),
      );
      expect(
        document.querySelector('meta[name="theme-color"]'),
      ).toHaveAttribute("content", palette["--page-top-background"]);
    };
    expectPalette();
    await flushFrame();
    await flushFrame();
    expect(frames.size).toBe(0);

    const scrollArea = document.querySelector(
      '[data-slot="scroll-area-viewport"]',
    )!;
    const events = [
      () => fireEvent.scroll(scrollArea),
      () => fireEvent(window, new Event("pageshow")),
      () => fireEvent.resize(window),
      () => viewport.dispatchEvent(new Event("resize")),
      () => viewport.dispatchEvent(new Event("scroll")),
    ];
    for (const [index, dispatch] of events.entries()) {
      palette = {
        "--page-background": `rgb(${index}, 20, 30)`,
        "--page-top-background": `rgb(${index}, 40, 50)`,
        "--page-bottom-background": `rgb(${index}, 60, 70)`,
      };
      dispatch();
      await flushFrame();
      expectPalette();
    }

    palette = { ...palette, "--page-background": "#abcdef" };
    await act(async () => page.classList.add("palette-changed"));
    await flushFrame();
    expectPalette();

    fireEvent.scroll(scrollArea);
    expect(frames.size).toBe(1);
    unmount();
    expect(cancelFrame).toHaveBeenCalled();
    expect(frames.size).toBe(0);
    expect(document.querySelector('meta[name="theme-color"]')).toBeNull();
    events.forEach((dispatch) => dispatch());
    expect(frames.size).toBe(0);
  });

  it("resolves each modern palette color once for visible surfaces and theme metadata", () => {
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
    const getImageData = vi.fn(() => ({
      data: new Uint8ClampedArray([255, 255, 255, 255]),
    }));
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      fillStyle: "",
      fillRect: vi.fn(),
      getImageData,
    } as unknown as CanvasRenderingContext2D);
    const actualGetComputedStyle = window.getComputedStyle.bind(window);
    vi.spyOn(window, "getComputedStyle").mockImplementation(
      (element, pseudo) => {
        const styles = actualGetComputedStyle(element, pseudo);
        if (element.classList.contains("page-layout")) {
          styles.getPropertyValue = () => "oklch(1 0 0)";
        }
        return styles;
      },
    );

    const { unmount } = render(<PageLayout>Content</PageLayout>);
    const page = screen.getByRole("banner").parentElement!;

    expect(getImageData).toHaveBeenCalledTimes(1);
    for (const property of [
      "--visible-page-background",
      "--visible-top-background",
      "--visible-bottom-background",
    ]) {
      expect(page.style.getPropertyValue(property)).toBe("rgb(255, 255, 255)");
    }
    expect(
      document.documentElement.style.getPropertyValue("--edge-top-background"),
    ).toBe("rgb(255, 255, 255)");
    expect(
      document.documentElement.style.getPropertyValue(
        "--edge-bottom-background",
      ),
    ).toBe("rgb(255, 255, 255)");
    expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute(
      "content",
      "rgb(255, 255, 255)",
    );
    unmount();
  });

  it("calls selectUser when user option is selected", async () => {
    const user = userEvent.setup();
    const selectUser = vi.fn();

    vi.mocked(useSelection).mockReturnValue({
      users: [
        { id: "u-1", name: "Alice", country: "IN", role: "user" },
        { id: "u-2", name: "Bob", country: "IN", role: "user" },
      ],
      countries: [
        { code: "IN", name: "India" },
        { code: "GB", name: "United Kingdom" },
      ],
      selectedUser: { id: "u-1", name: "Alice", country: "IN", role: "user" },
      selectedCountry: { code: "IN", name: "India" },
      isLoading: false,
      error: null,
      selectUser,
      selectCountry: vi.fn(),
    });

    render(
      <PageLayout>
        <div>Content</div>
      </PageLayout>,
    );

    const userTrigger = screen.getByRole("combobox", { name: "Selected user" });
    await user.click(userTrigger);
    const bobOption = await screen.findByRole("option", { name: /Bob/i });
    await user.click(bobOption);
    expect(selectUser).toHaveBeenCalledWith("u-2");
  });

  it("calls selectCountry when country option is selected", async () => {
    const user = userEvent.setup();
    const selectCountry = vi.fn();

    vi.mocked(useSelection).mockReturnValue({
      users: [{ id: "u-1", name: "Alice", country: "IN", role: "user" }],
      countries: [
        { code: "IN", name: "India" },
        { code: "GB", name: "United Kingdom" },
      ],
      selectedUser: { id: "u-1", name: "Alice", country: "IN", role: "user" },
      selectedCountry: { code: "IN", name: "India" },
      isLoading: false,
      error: null,
      selectUser: vi.fn(),
      selectCountry,
    });

    render(
      <PageLayout>
        <div>Content</div>
      </PageLayout>,
    );

    const countryTrigger = screen.getByRole("combobox", {
      name: "Selected country",
    });
    await user.click(countryTrigger);
    const gbOption = await screen.findByRole("option", { name: /GB/i });
    await user.click(gbOption);
    expect(selectCountry).toHaveBeenCalledWith("GB");
  });

  it("renders error message when error is present", () => {
    vi.mocked(useSelection).mockReturnValue({
      users: [],
      countries: [],
      selectedUser: null,
      selectedCountry: null,
      isLoading: false,
      error: "Failed to load selection",
      selectUser: vi.fn(),
      selectCountry: vi.fn(),
    });

    render(
      <PageLayout>
        <div>Content</div>
      </PageLayout>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Failed to load selection",
    );
  });
});
