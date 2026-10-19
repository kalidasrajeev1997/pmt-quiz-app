import { Button } from "@/components/ui/button";
import { formatDuration } from "@/helpers/quizFormatters";
import type { PublicQuiz } from "@/types/quiz";
import {
  CircleCheck,
  Clock,
  ClockFading,
  Goal,
  ListChecks,
  ListTodo,
  LoaderCircle,
  Play,
  RotateCcw,
} from "lucide-react";
import QuizDetailCard from "./QuizDetailCard";
import { Spinner } from "@/components/ui/spinner";

interface QuizOverviewProps {
  quiz: PublicQuiz;
  pending: boolean;
  retake: boolean;
  onStart: () => void;
}

export default function QuizOverview({
  quiz,
  pending,
  retake,
  onStart,
}: QuizOverviewProps) {
  const rules = [
    "1 point per correct answer",
    "No negative marking applied",
    "Scores available after completion",
    quiz.timeLimitSeconds !== null || quiz.perQuestionSeconds !== null
      ? "Progress saved; timers continue while away"
      : "Progress saved; resume anytime",
  ];
  const StartIcon = pending ? LoaderCircle : retake ? RotateCcw : Play;
  const startLabel = pending
    ? "Starting"
    : retake
      ? "Start new attempt"
      : "Start Quiz";

  return (
    <section className="quiz-scene relative space-y-4 sm:space-y-4 rounded-xl border-2 border-b-6 border-gray-300 dark:border-border p-4 bg-white dark:bg-card text-foreground">
      <div className="max-w-[60ch] space-y-2">
        <span className="flex gap-1 items-center">
          <h1 className="text-xl leading-tight font-medium wrap-anywhere sm:text-2xl">
            {quiz.title}
          </h1>
          <Goal className="text-[#2f8646] size-6" />
        </span>

        <p className="text-base leading-relaxed text-foreground">
          {quiz.description}
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 sm:gap-y-6">
        <QuizDetailCard
          title="Questions"
          stat={quiz.questions.length.toString()}
          icon={ListTodo}
          color="text-[#19904c]"
        />
        <QuizDetailCard
          title="Time limit"
          stat={
            quiz.timeLimitSeconds === null
              ? "No overall limit"
              : formatDuration(quiz.timeLimitSeconds)
          }
          icon={Clock}
          color="text-[#0c7199]"
        />
        <QuizDetailCard
          title="Per question"
          stat={
            quiz.perQuestionSeconds === null
              ? "No separate limit"
              : formatDuration(quiz.perQuestionSeconds)
          }
          icon={ClockFading}
          color="text-[#56449c]"
        />
      </dl>
      <div className="flex flex-wrap items-center gap-4">
        <Button
          size="lg"
          className="rounded-md px-5 text-white"
          disabled={pending || !quiz.questions.length}
          onClick={onStart}
        >
          {pending ? (
            <>
              {startLabel}
              <Spinner className="size-4 inline-block ml-2" />
            </>
          ) : (
            <>
              <StartIcon aria-hidden="true" />
              {startLabel}
            </>
          )}
        </Button>
        <p className="text-sm text-muted-foreground">
          {quiz.retakesAllowed ? "Retakes allowed" : "Single attempt"}
        </p>
      </div>
      {!quiz.questions.length && (
        <p role="status">This quiz has no questions yet.</p>
      )}

      <section
        className="space-y-4 border-t pt-6"
        aria-labelledby="assessment-rules-title"
      >
        <h2
          id="assessment-rules-title"
          className="flex items-center gap-2 text-md font-medium"
        >
          <ListChecks
            className="size-5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          Assessment Rules
        </h2>
        <ul className="grid gap-x-6 gap-y-3 pb-2 sm:grid-cols-2">
          {rules.map((rule) => (
            <li
              key={rule}
              className="flex items-start gap-2 text-sm text-muted-foreground"
            >
              <CircleCheck
                className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-400"
                aria-hidden="true"
              />
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
