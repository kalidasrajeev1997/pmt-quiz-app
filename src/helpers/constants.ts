export const statusStyles = {
  "not-started": {
    label: "Not started",
    color: "text-muted-foreground",
    dot: "bg-muted-foreground",
  },
  "in-progress": {
    label: "In progress",
    color: "text-ring",
    dot: "bg-primary",
  },
  completed: {
    label: "Completed",
    color: "text-green-700",
    dot: "bg-green-100",
  },
};

export const attemptSteps = {
  Overview: 0,
  InProgress: 1,
  Completed: 2,
} as const;

export type attemptSteps = (typeof attemptSteps)[keyof typeof attemptSteps];
