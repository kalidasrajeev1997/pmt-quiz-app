export function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) return `${seconds} sec`;

  return `${minutes} min${remainingSeconds ? ` ${remainingSeconds} sec` : ""}`;
}
