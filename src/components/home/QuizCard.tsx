import {
  ArrowRight,
  ChartColumn,
  Clock3,
  ListChecks,
  Play,
  RotateCcw,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import countryFlagMap from "@/helpers/countryFlagMap";
import type { QuizQueryResult } from "@/services/db/queries/quiz";

const statusStyles = {
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

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes > 0
    ? `${minutes} min${remainder > 0 ? ` ${remainder} sec` : ""}`
    : `${seconds} sec`;
}

const QuizCard = ({ quiz }: { quiz: QuizQueryResult }) => {
  const totalQuestions = quiz.questions.length;
  const percentage =
    totalQuestions > 0
      ? Math.round((quiz.answeredQuestions / totalQuestions) * 100)
      : 0;
  const resultSummary = `${quiz.correctQuestions} correct, ${quiz.incorrectQuestions} incorrect, ${quiz.unansweredQuestions} unanswered`;
  const status = statusStyles[quiz.status];
  const timeLimit =
    quiz.timeLimitSeconds !== null
      ? `${formatDuration(quiz.timeLimitSeconds)} limit`
      : quiz.perQuestionSeconds !== null
        ? `${formatDuration(quiz.perQuestionSeconds)} / ques`
        : "No time limit";

  return (
    <Card
      role="article"
      aria-labelledby={`quiz-title-${quiz.id}`}
      className="h-full min-w-0 gap-4 rounded-lg bg-muted py-5 shadow-none ring-0 [--card-spacing:--spacing(5)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300"
    >
      <CardHeader className="flex items-start justify-between gap-4 rounded-none">
        <div className="min-w-0 flex-1">
          <h2
            id={`quiz-title-${quiz.id}`}
            className="text-lg leading-6 font-semibold tracking-normal wrap-anywhere"
          >
            {quiz.title}
          </h2>
          <p className="mt-2 text-base leading-relaxed text-foreground wrap-anywhere">
            {quiz.description}
          </p>
        </div>
        <Progress
          variant="circular"
          value={quiz.scorePercentage ?? percentage}
          segments={[
            {
              value:
                totalQuestions > 0
                  ? (quiz.correctQuestions / totalQuestions) * 100
                  : 0,
              className: "stroke-green-700 dark:stroke-green-400",
            },
            {
              value:
                totalQuestions > 0
                  ? (quiz.incorrectQuestions / totalQuestions) * 100
                  : 0,
              className: "stroke-red-600 dark:stroke-red-400",
            },
          ]}
          aria-label={`${quiz.title}: ${quiz.status === "completed" ? "prior score" : "answer progress"}`}
          aria-valuetext={`${quiz.score !== null ? `Prior score: ${quiz.score} of ${totalQuestions}. ` : ""}${quiz.answeredQuestions} of ${totalQuestions} answered. ${resultSummary}.`}
          className="size-16"
        >
          <span
            aria-hidden="true"
            className="relative flex flex-col items-center gap-1 text-base leading-none font-semibold text-foreground tabular-nums"
          >
            <span>
              {quiz.score ?? quiz.answeredQuestions}/{totalQuestions}
            </span>
          </span>
        </Progress>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <ListChecks className="size-4 shrink-0" aria-hidden="true" />
            {totalQuestions} {totalQuestions === 1 ? "question" : "questions"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="size-4 shrink-0" aria-hidden="true" />
            {timeLimit}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <RotateCcw className="size-4 shrink-0" aria-hidden="true" />
            {quiz.retakesAllowed ? "Retakes allowed" : "Single attempt"}
          </span>
        </div>
        <ul aria-label="Available countries" className="flex flex-wrap gap-3">
          {quiz.countries.map((country) => (
            <li
              key={country}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              {country in countryFlagMap && (
                <img
                  src={countryFlagMap[country as keyof typeof countryFlagMap]}
                  alt=""
                  className="h-3.5 w-5 rounded-xs object-cover"
                />
              )}
              {country}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="mt-auto flex flex-col items-stretch gap-4 rounded-none border-0 bg-transparent pt-0 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-col gap-1 tabular-nums">
            <span className="text-muted-foreground">
              {quiz.answeredQuestions} of {totalQuestions} answered
            </span>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 font-medium ${status.color}`}
          >
            <span
              aria-hidden="true"
              className={`size-1.5 rounded-full ${status.dot}`}
            />
            {status.label}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {quiz.status === "completed" && (
            <Button
              variant="secondary"
              nativeButton={false}
              className="min-h-10 min-w-0 flex-1 rounded-md bg-background px-3"
              render={
                <Link
                  to="/quiz/$id"
                  params={{ id: quiz.id }}
                  hash="results"
                  aria-label={`View results for ${quiz.title}`}
                />
              }
            >
              <ChartColumn aria-hidden="true" data-icon="inline-start" />
              View results
            </Button>
          )}
          {(quiz.status !== "completed" || quiz.retakesAllowed) && (
            <Button
              nativeButton={false}
              className="min-h-10 min-w-0 flex-1 rounded-md px-3 text-white"
              render={
                <Link
                  to="/quiz/$id"
                  params={{ id: quiz.id }}
                  hash={
                    quiz.status === "completed"
                      ? "retake"
                      : quiz.status === "in-progress"
                        ? "continue"
                        : "start"
                  }
                  aria-label={`${quiz.status === "completed" ? "Retake quiz" : quiz.status === "in-progress" ? "Continue quiz" : "Start quiz"}: ${quiz.title}`}
                />
              }
            >
              {quiz.status === "completed" ? (
                <RotateCcw aria-hidden="true" data-icon="inline-start" />
              ) : quiz.status === "in-progress" ? (
                <ArrowRight aria-hidden="true" data-icon="inline-start" />
              ) : (
                <Play aria-hidden="true" data-icon="inline-start" />
              )}
              {quiz.status === "completed"
                ? "Retake quiz"
                : quiz.status === "in-progress"
                  ? "Continue quiz"
                  : "Start quiz"}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default QuizCard;
