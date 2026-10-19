import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SettingsContainer from "../SettingsContainer";
import { useResetData } from "@/hooks/useResetData";

vi.mock("@/hooks/useResetData", () => ({
  useResetData: vi.fn(),
}));

describe("SettingsContainer", () => {
  const mutateMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useResetData).mockReturnValue({
      mutate: mutateMock,
      isPending: false,
      isSuccess: false,
      error: null,
    } as unknown as ReturnType<typeof useResetData>);
  });

  it("renders Settings header, description, and Reset data button", () => {
    render(<SettingsContainer />);

    expect(
      screen.getByRole("heading", { name: "Settings", level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Manage your application data and preferences"),
    ).toBeInTheDocument();
    expect(screen.getByText("Reset Database")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /reset data/i }),
    ).toBeInTheDocument();
  });

  it("opens confirmation popup when Reset data button is clicked", () => {
    render(<SettingsContainer />);

    const button = screen.getByRole("button", { name: /reset data/i });
    fireEvent.click(button);

    expect(
      screen.getByRole("heading", { name: /reset all data to seed json\?/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/this will permanently reset all quizzes/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Confirm reset" }),
    ).toBeInTheDocument();
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it("closes confirmation popup without resetting when Cancel is clicked", () => {
    render(<SettingsContainer />);

    fireEvent.click(screen.getByRole("button", { name: /reset data/i }));
    expect(
      screen.getByRole("heading", { name: /reset all data to seed json\?/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      screen.queryByRole("heading", { name: /reset all data to seed json\?/i }),
    ).not.toBeInTheDocument();
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it("calls reset mutation when Confirm reset is clicked in popup", () => {
    render(<SettingsContainer />);

    fireEvent.click(screen.getByRole("button", { name: /reset data/i }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm reset" }));

    expect(mutateMock).toHaveBeenCalledTimes(1);
  });

  it("shows loading indicator and disables buttons while reset is pending", () => {
    vi.mocked(useResetData).mockReturnValue({
      mutate: mutateMock,
      isPending: true,
      isSuccess: false,
      error: null,
    } as unknown as ReturnType<typeof useResetData>);

    render(<SettingsContainer />);

    const button = screen.getByRole("button", { name: /resetting data\.\.\./i });
    expect(button).toBeDisabled();
  });

  it("displays success alert when reset completes successfully", () => {
    mutateMock.mockImplementation((_vars, options) => {
      options?.onSuccess?.();
    });

    vi.mocked(useResetData).mockReturnValue({
      mutate: mutateMock,
      isPending: false,
      isSuccess: true,
      error: null,
    } as unknown as ReturnType<typeof useResetData>);

    render(<SettingsContainer />);

    fireEvent.click(screen.getByRole("button", { name: /reset data/i }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm reset" }));

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Data Reset Successful")).toBeInTheDocument();
  });

  it("displays error alert when reset fails", () => {
    mutateMock.mockImplementation((_vars, options) => {
      options?.onError?.(new Error("Failed to clear database"));
    });

    vi.mocked(useResetData).mockReturnValue({
      mutate: mutateMock,
      isPending: false,
      isSuccess: false,
      error: new Error("Failed to clear database"),
    } as unknown as ReturnType<typeof useResetData>);

    render(<SettingsContainer />);

    fireEvent.click(screen.getByRole("button", { name: /reset data/i }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm reset" }));

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Reset Failed")).toBeInTheDocument();
    expect(screen.getByText("Failed to clear database")).toBeInTheDocument();
  });
});
