import { Plus } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { newQuestion, type QuizFormValues } from "@/helpers/quizSchema";
import QuestionFields from "./QuestionFields";

export default function QuizQuestionsFields() {
  const {
    control,
    formState: { errors },
  } = useFormContext<QuizFormValues>();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "questions",
  });
  const questionsError =
    errors.questions?.root?.message ?? errors.questions?.message;

  return (
    <section className="min-w-0 space-y-4" aria-labelledby="questions-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="questions-title" className="text-lg font-medium">
          Questions ({fields.length})
        </h2>
        <Button
          type="button"
          variant="secondary"
          className="min-h-10 rounded-md bg-muted px-3"
          onClick={() => append(newQuestion())}
        >
          <Plus />
          Add question
        </Button>
      </div>
      {questionsError && (
        <p role="alert" className="text-sm text-destructive">
          {questionsError}
        </p>
      )}
      {fields.length === 0 && (
        <p className="bg-muted p-5 text-sm">No questions yet.</p>
      )}
      <div className="space-y-5">
        {fields.map((field, index) => (
          <QuestionFields
            key={field.id}
            index={index}
            total={fields.length}
            onMove={move}
            onRemove={() => remove(index)}
          />
        ))}
      </div>
    </section>
  );
}
