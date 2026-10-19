import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useResetData } from "../useResetData";
import { resetDataToSeed } from "@/services/quiz.service";

vi.mock("@/services/quiz.service", () => ({
  resetDataToSeed: vi.fn(),
}));

describe("useResetData hook", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("calls resetDataToSeed and invalidates query cache on success", async () => {
    vi.mocked(resetDataToSeed).mockResolvedValue(undefined);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useResetData(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(resetDataToSeed).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalled();
  });
});
