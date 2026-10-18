import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PageLayout from "../PageLayout";
import { useSelection } from "@/hooks/useSelection";

vi.mock("@/hooks/useSelection", () => ({
  useSelection: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
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
    expect(screen.getByText("Page Body Content")).toBeInTheDocument();
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
