import { ArrowRight, Play, RotateCcw } from "lucide-react";

export const QuizButtonLabel = ({ status }: { status: string }) => {
  switch (status) {
    case "not-started":
      return {
        icon: <Play aria-hidden="true" data-icon="inline-start" />,
        label: "Start Quiz",
      };
    case "in_progress":
      return {
        icon: <ArrowRight aria-hidden="true" data-icon="inline-start" />,
        label: "Continue Quiz",
      };
    case "completed":
      return {
        icon: <RotateCcw aria-hidden="true" data-icon="inline-start" />,
        label: "Retake quiz",
      };
    default:
      return {
        icon: <RotateCcw aria-hidden="true" data-icon="inline-start" />,
        label: "Unknown Status",
      };
  }
};
