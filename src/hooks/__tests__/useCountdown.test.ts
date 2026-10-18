import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatCountdown, useCountdown } from "@/hooks/useCountdown";

describe("formatCountdown", () => {
  const BASE_TIME = 1_000_000;

  it("returns empty string for null, undefined, and non-finite deadlines", () => {
    expect(formatCountdown(null, BASE_TIME)).toBe("");
    expect(formatCountdown(undefined, BASE_TIME)).toBe("");
    expect(formatCountdown(NaN, BASE_TIME)).toBe("");
    expect(formatCountdown(Infinity, BASE_TIME)).toBe("");
  });

  it("formats sub-minute remaining seconds as 00:SS", () => {
    expect(formatCountdown(BASE_TIME + 5_000, BASE_TIME)).toBe("00:05");
    expect(formatCountdown(BASE_TIME + 45_000, BASE_TIME)).toBe("00:45");
    expect(formatCountdown(BASE_TIME + 59_000, BASE_TIME)).toBe("00:59");
  });

  it("formats minute durations as MM:SS", () => {
    expect(formatCountdown(BASE_TIME + 60_000, BASE_TIME)).toBe("01:00");
    expect(formatCountdown(BASE_TIME + 125_000, BASE_TIME)).toBe("02:05");
    expect(formatCountdown(BASE_TIME + 600_000, BASE_TIME)).toBe("10:00");
  });

  it("formats multi-hour durations with hours prefix H:MM:SS", () => {
    // 1 hour, 1 minute, 5 seconds = 3665 seconds
    expect(formatCountdown(BASE_TIME + 3_665_000, BASE_TIME)).toBe("1:01:05");
    // 2 hours exactly = 7200 seconds
    expect(formatCountdown(BASE_TIME + 7_200_000, BASE_TIME)).toBe("2:00:00");
  });

  it("formats 00:00 when deadline is at or before current time", () => {
    expect(formatCountdown(BASE_TIME, BASE_TIME)).toBe("00:00");
    expect(formatCountdown(BASE_TIME - 5_000, BASE_TIME)).toBe("00:00");
  });
});

describe("useCountdown Hook", () => {
  const INITIAL_NOW = Date.parse("2026-10-18T12:00:00.000Z");

  beforeEach(() => {
    vi.useFakeTimers({ now: INITIAL_NOW });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns inactive / null state when targetDeadline is null or undefined", () => {
    const { result, rerender } = renderHook(
      ({ deadline }: { deadline?: number | null }) => useCountdown(deadline),
      { initialProps: { deadline: null as number | null | undefined } }
    );

    expect(result.current.remainingMs).toBeNull();
    expect(result.current.remainingSeconds).toBeNull();
    expect(result.current.formatted).toBe("");
    expect(result.current.isExpired).toBe(false);
    expect(result.current.isUrgent).toBe(false);

    rerender({ deadline: undefined });
    expect(result.current.remainingMs).toBeNull();
    expect(result.current.isExpired).toBe(false);
  });

  it("tracks countdown, formats remaining time, and updates on tick", () => {
    const deadline = INITIAL_NOW + 30_000; // 30 seconds in future

    const { result } = renderHook(() =>
      useCountdown(deadline, { intervalMs: 250, urgentThresholdMs: 10_000 })
    );

    expect(result.current.remainingSeconds).toBe(30);
    expect(result.current.remainingMs).toBe(30_000);
    expect(result.current.formatted).toBe("00:30");
    expect(result.current.isExpired).toBe(false);
    expect(result.current.isUrgent).toBe(false);

    // Advance 5 seconds
    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    expect(result.current.remainingSeconds).toBe(25);
    expect(result.current.formatted).toBe("00:25");
    expect(result.current.isExpired).toBe(false);
    expect(result.current.isUrgent).toBe(false);
  });

  it("toggles isUrgent to true when remaining time reaches urgentThresholdMs", () => {
    const deadline = INITIAL_NOW + 15_000; // 15 seconds

    const { result } = renderHook(() =>
      useCountdown(deadline, { intervalMs: 250, urgentThresholdMs: 10_000 })
    );

    expect(result.current.isUrgent).toBe(false);

    // Advance 6 seconds (remaining 9 seconds <= 10s threshold)
    act(() => {
      vi.advanceTimersByTime(6_000);
    });

    expect(result.current.isUrgent).toBe(true);
    expect(result.current.isExpired).toBe(false);
    expect(result.current.remainingSeconds).toBe(9);
  });

  it("transitions to isExpired and invokes onExpire callback once", () => {
    const onExpire = vi.fn();
    const deadline = INITIAL_NOW + 5_000;

    const { result } = renderHook(() =>
      useCountdown(deadline, { intervalMs: 250, onExpire })
    );

    expect(result.current.isExpired).toBe(false);
    expect(onExpire).not.toHaveBeenCalled();

    // Advance 5 seconds to expiry
    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    expect(result.current.isExpired).toBe(true);
    expect(result.current.isUrgent).toBe(false);
    expect(result.current.remainingSeconds).toBe(0);
    expect(result.current.formatted).toBe("00:00");
    expect(onExpire).toHaveBeenCalledTimes(1);

    // Advance further; onExpire should not be called again
    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("resyncs clock on document visibilitychange and window focus events", () => {
    const deadline = INITIAL_NOW + 60_000;
    const { result } = renderHook(() => useCountdown(deadline));

    expect(result.current.remainingSeconds).toBe(60);

    // Simulate system clock jump without interval ticking (e.g. background tab)
    vi.setSystemTime(INITIAL_NOW + 20_000);

    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(result.current.remainingSeconds).toBe(40);

    // Simulate focus event
    vi.setSystemTime(INITIAL_NOW + 35_000);
    act(() => {
      window.dispatchEvent(new Event("focus"));
    });
    expect(result.current.remainingSeconds).toBe(25);
  });

  it("cleans up timer interval and event listeners on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    const docRemoveEventListenerSpy = vi.spyOn(document, "removeEventListener");
    const clearIntervalSpy = vi.spyOn(window, "clearInterval");

    const { unmount } = renderHook(() => useCountdown(INITIAL_NOW + 10_000));
    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    expect(removeEventListenerSpy).toHaveBeenCalledWith("focus", expect.any(Function));
    expect(docRemoveEventListenerSpy).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
  });
});
