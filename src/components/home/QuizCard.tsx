import { Clock3, RotateCcw } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import countryFlagMap from "@/helpers/countryFlagMap";
import { statusStyles } from "@/helpers/constants";
import { formatDuration } from "@/helpers/quizFormatters";
import type { QuizQueryResult } from "@/services/db/queries/quiz";
import QuizCardActions from "@/components/home/QuizCardActions";
import QuizCardProgress from "@/components/home/QuizCardProgress";

const QuizCard = ({ quiz }: { quiz: QuizQueryResult }) => {
  const totalQuestions = quiz.questions.length;
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
      className="h-full min-w-0 gap-5.5 rounded-lg bg-muted py-5 shadow-none ring-0 [--card-spacing:--spacing(4)] sm:[--card-spacing:--spacing(5)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300"
    >
      <CardHeader className="flex items-start justify-between gap-4 rounded-none">
        <div className="min-w-0 flex-1">
          <h2
            id={`quiz-title-${quiz.id}`}
            className="text-[18px] leading-6 font-semibold tracking-normal wrap-anywhere"
          >
            {quiz.title}
          </h2>
          <p className="mt-2 text-md leading-relaxed text-foreground wrap-anywhere">
            {quiz.description}
          </p>
        </div>
        <QuizCardProgress quiz={quiz} />
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
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
        <QuizCardActions quiz={quiz} />
      </CardFooter>
    </Card>
  );
};

export default QuizCard;
