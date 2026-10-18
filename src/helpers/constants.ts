export const statusStyles = {
  "not-started": {
    label: "Not started",
    color: "text-muted-foreground",
    dot: "bg-muted-foreground",
  },
  in_progress: {
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
  OVERVIEW: 0,
  IN_PROGRESS: 1,
  COMPLETED: 2,
} as const;

export const saveLabels = {
  PENDING: "Saving...",
  FAILED: "Not saved",
  SUCCESS: "Progress saved",
} as const;

export const submitLabels = {
  TIME_EXPIRED: "Time expired...",
  FINISH_QUIZ: "Finish quiz",
  SUBMIT_ANSWER: "Submit answer",
} as const;

export const quizStatuses = {
  NOT_STARTED: "not-started",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
} as const;

export const quizLinkHashes = {
  RESULTS: "results",
  RETAKE: "retake",
  CONTINUE: "continue",
  START: "start",
} as const;
