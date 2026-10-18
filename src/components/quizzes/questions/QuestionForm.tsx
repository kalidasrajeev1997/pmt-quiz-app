import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Progress } from "@/components/ui/progress";
import { getDeadlines } from "@/helpers/quizHelpers";
import type { InProgressQuizAttempt, PublicQuiz } from "@/types/quiz";
import QuestionActions from "./QuestionActions";
import QuestionOptions from "./QuestionOptions";
import QuestionTimer from "./QuestionTimer";

const answerSchema = z.object({
  selectedOptionIds: z.array(z.string()).min(1, "Select at least one answer."),
});

type AnswerValues = z.infer<typeof answerSchema>;

export interface AnswerAction {
  type: "draft" | "submit";
  attemptId: string;
  questionId: string;
  selectedOptionIds: string[];
}

interface QuestionFormProps {
  quiz: PublicQuiz;
  attempt: InProgressQuizAttempt;
  pending: boolean;
  saveFailed: boolean;
  onCommand: (command: AnswerAction) => void;
}

export default function QuestionForm({
  quiz,
  attempt,
  pending,
  saveFailed,
  onCommand,
}: QuestionFormProps) {
  const question = quiz.questions[attempt.currentQuestionIndex];
  const headingRef = useRef<HTMLParagraphElement>(null);
  const [now, setNow] = useState(() => Date.now());
  const form = useForm<AnswerValues>({
    resolver: zodResolver(answerSchema),
    defaultValues: { selectedOptionIds: attempt.draftOptionIds ?? [] },
  });
  const deadlines = getDeadlines(quiz, attempt);
  const nearestDeadline = Math.min(
    deadlines.overall ?? Infinity,
    deadlines.question ?? Infinity,
  );
  const expired = now >= nearestDeadline;
  const lastQuestion =
    attempt.currentQuestionIndex === quiz.questions.length - 1;
  const answerError = form.formState.errors.selectedOptionIds?.message;

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.scrollIntoView({ block: "nearest" });

    const updateClock = () => setNow(Date.now());
    const interval = window.setInterval(updateClock, 250);
    document.addEventListener("visibilitychange", updateClock);
    window.addEventListener("focus", updateClock);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", updateClock);
      window.removeEventListener("focus", updateClock);
    };
  }, []);

  function sendAnswerCommand(
    type: AnswerAction["type"],
    selectedOptionIds: string[],
  ) {
    onCommand({
      type,
      attemptId: attempt.id,
      questionId: question.id,
      selectedOptionIds,
    });
  }

  const submitAnswer = form.handleSubmit(({ selectedOptionIds }) => {
    if (!pending && !expired) sendAnswerCommand("submit", selectedOptionIds);
  });

  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    const isSubmitButton =
      event.target instanceof HTMLButtonElement &&
      event.target.type === "submit";

    if (event.key !== "Enter" || event.repeat || isSubmitButton) return;

    event.preventDefault();
    if (!pending && !expired) void submitAnswer();
  }

  return (
    <section
      className="quiz-scene relative space-y-4 sm:space-y-4 rounded-xl border-2 border-b-6 border-gray-300 p-4 bg-white"
      aria-label="Current question"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <h1 className="text-lg leading-snug font-semibold wrap-anywhere sm:text-xl">
            {quiz.title}
          </h1>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Question {attempt.currentQuestionIndex + 1} of{" "}
            {quiz.questions.length}
          </p>
        </div>
        <QuestionTimer deadlines={deadlines} now={now} />
      </div>
      <Progress
        value={(attempt.currentQuestionIndex / quiz.questions.length) * 100}
        aria-label="Questions submitted"
        aria-valuetext={`${attempt.currentQuestionIndex} of ${quiz.questions.length} submitted`}
      />
      <form
        noValidate
        onSubmit={submitAnswer}
        onKeyDown={handleKeyDown}
        className="space-y-5 sm:space-y-6"
      >
        <fieldset
          disabled={expired || form.formState.isSubmitting}
          className="min-w-0 space-y-4 sm:space-y-5"
        >
          <legend className="sr-only">{question.text}</legend>
          <div className="space-y-2">
            <p
              ref={headingRef}
              tabIndex={-1}
              id="question-prompt"
              className="text-xl leading-relaxed font-medium outline-none wrap-anywhere sm:text-2xl"
            >
              {question.text}
            </p>
            <p id="answer-kind" className="text-sm text-muted-foreground">
              {question.type === "single"
                ? "Select one answer"
                : "Select all that apply"}
            </p>
          </div>
          <Controller
            control={form.control}
            name="selectedOptionIds"
            render={({ field, fieldState }) => (
              <QuestionOptions
                question={question}
                selectedOptionIds={field.value}
                invalid={fieldState.invalid}
                inputRef={field.ref}
                onBlur={field.onBlur}
                onChange={(selectedOptionIds) => {
                  field.onChange(selectedOptionIds);
                  sendAnswerCommand("draft", selectedOptionIds);
                }}
              />
            )}
          />
          {answerError && (
            <p
              role="alert"
              id="answer-error"
              className="text-sm text-destructive"
            >
              {answerError}
            </p>
          )}
        </fieldset>
        <QuestionActions
          pending={pending}
          saveFailed={saveFailed}
          expired={expired}
          isSubmitting={form.formState.isSubmitting}
          lastQuestion={lastQuestion}
        />
      </form>
    </section>
  );
}
