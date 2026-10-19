import { ClipboardList } from "lucide-react";
import type { TabStatus } from "@/types/quiz";

const messages: Record<TabStatus, { title: string; description: string }> = {
  all: {
    title: "No quizzes found.",
    description: "No quizzes are available for this country yet.",
  },
  "not-started": {
    title: "No unstarted quizzes",
    description: "There are no quizzes waiting to be started.",
  },
  in_progress: {
    title: "No quizzes in progress",
    description: "Your ongoing quizzes will appear here.",
  },
  completed: {
    title: "No completed quizzes yet",
    description: "Your completed quizzes will appear here.",
  },
};

const QuizEmptyState = ({ tab }: { tab: TabStatus }) => {
  const { title, description } = messages[tab];

  return (
    <div
      role="status"
      aria-labelledby="quiz-empty-title"
      className="my-3 flex min-h-64 flex-col items-center justify-center rounded-lg bg-muted px-6 py-10 text-center"
    >
      <ClipboardList
        aria-hidden="true"
        className="mb-4 size-10 text-muted-foreground"
        strokeWidth={1}
      />
      <h2 id="quiz-empty-title" className="text-lg font-medium">
        {title}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
};

export default QuizEmptyState;
