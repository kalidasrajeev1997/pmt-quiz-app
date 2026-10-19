import { useEffect, useRef, useState } from "react";

export interface UseCountdownOptions {
  intervalMs?: number;
  urgentThresholdMs?: number;
  onExpire?: () => void;
}

export interface UseCountdownReturn {
  now: number;
  remainingMs: number | null;
  remainingSeconds: number | null;
  formatted: string;
  isExpired: boolean;
  isUrgent: boolean;
}

export function formatCountdown(
  deadline: number | null | undefined,
  now: number,
): string {
  if (
    deadline === null ||
    deadline === undefined ||
    !Number.isFinite(deadline)
  ) {
    return "";
  }

  const totalSeconds = Math.max(0, Math.ceil((deadline - now) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = String(Math.floor(totalSeconds / 60) % 60).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return `${hours ? `${hours}:` : ""}${minutes}:${seconds}`;
}

/**
 * Custom hook to track countdown timer progress towards a target deadline.
 * Automatically handles window focus and visibility changes to prevent timer drift
 * when the user switches tabs or returns to the application.
 */
export function useCountdown(
  targetDeadline?: number | null,
  options: UseCountdownOptions = {},
): UseCountdownReturn {
  const { intervalMs = 250, urgentThresholdMs = 10_000, onExpire } = options;

  const [now, setNow] = useState(() => Date.now());
  const onExpireRef = useRef(onExpire);
  const hasExpiredRef = useRef(false);

  const hasDeadline =
    targetDeadline !== null &&
    targetDeadline !== undefined &&
    Number.isFinite(targetDeadline);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!hasDeadline) return;

    const updateClock = () => setNow(Date.now());

    // Update immediately on mount / when timer changes
    updateClock();

    const intervalId = window.setInterval(updateClock, intervalMs);

    // Resync immediately when tab becomes visible or receives focus
    document.addEventListener("visibilitychange", updateClock);
    window.addEventListener("focus", updateClock);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", updateClock);
      window.removeEventListener("focus", updateClock);
    };
  }, [hasDeadline, intervalMs]);

  const remainingMs = hasDeadline ? Math.max(0, targetDeadline - now) : null;
  const remainingSeconds =
    remainingMs !== null ? Math.ceil(remainingMs / 1000) : null;
  const isExpired = hasDeadline ? now >= targetDeadline : false;
  const isUrgent =
    hasDeadline && !isExpired
      ? targetDeadline - now <= urgentThresholdMs
      : false;
  const formatted = hasDeadline ? formatCountdown(targetDeadline, now) : "";

  // Trigger onExpire callback once when transitioning to expired
  useEffect(() => {
    if (isExpired && !hasExpiredRef.current) {
      hasExpiredRef.current = true;
      onExpireRef.current?.();
    } else if (!isExpired) {
      hasExpiredRef.current = false;
    }
  }, [isExpired]);

  return {
    now,
    remainingMs,
    remainingSeconds,
    formatted,
    isExpired,
    isUrgent,
  };
}
