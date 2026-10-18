import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import QuizPagination from "../QuizPagination";
import * as router from "@tanstack/react-router";

vi.mock("@tanstack/react-router", () => ({
  useRouter: vi.fn(),
  useNavigate: vi.fn(),
}));

describe("QuizPagination", () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(router.useRouter).mockReturnValue({
      buildLocation: vi.fn().mockReturnValue({ href: "/home?status=all&page=2" }),
    } as unknown as ReturnType<typeof router.useRouter>);
    vi.mocked(router.useNavigate).mockReturnValue(mockNavigate);
  });

  it("returns null when totalPages <= 1", () => {
    const { container } = render(<QuizPagination page={1} totalPages={1} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders page buttons and triggers navigate on click", async () => {
    const user = userEvent.setup();

    render(<QuizPagination page={2} totalPages={5} />);

    expect(screen.getByRole("button", { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "3" }));
    expect(mockNavigate).toHaveBeenCalled();
  });

  it("disables interaction when disabled prop is true", async () => {
    const user = userEvent.setup();

    render(<QuizPagination page={1} totalPages={5} disabled={true} />);

    await user.click(screen.getByRole("button", { name: "2" }));
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
