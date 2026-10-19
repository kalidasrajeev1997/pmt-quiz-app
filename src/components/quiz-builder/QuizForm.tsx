import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  newQuestion,
  quizSchema,
  type QuizFormValues,
} from "@/helpers/quizSchema";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import type { Quiz } from "@/types/quiz";
import QuizCountryFields from "./QuizCountryFields";
import QuizDetailsFields from "./QuizDetailsFields";
import QuizFormHeader from "./QuizFormHeader";
import QuizQuestionsFields from "./QuizQuestionsFields";
import QuizTimingFields from "./QuizTimingFields";

interface QuizFormProps {
  quiz?: Quiz;
  onSave: (values: QuizFormValues) => Promise<unknown>;
  onSaved: () => void;
  onCancel: () => void;
}

export default function QuizForm({
  quiz,
  onSave,
  onSaved,
  onCancel,
}: QuizFormProps) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const form = useForm<QuizFormValues>({
    resolver: zodResolver(quizSchema),
    defaultValues: quiz ?? {
      title: "",
      description: "",
      countries: [],
      timeLimitSeconds: null,
      perQuestionSeconds: null,
      retakesAllowed: false,
      questions: [newQuestion()],
    },
    mode: "onChange",
  });
  const {
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting, isSubmitted },
  } = form;
  const blocker = useUnsavedChanges(isDirty && !saved);

  useEffect(() => {
    if (saved) onSaved();
  }, [saved, onSaved]);

  async function submit(values: QuizFormValues) {
    setSaveError(null);
    try {
      await onSave(values);
      reset(values);
      setSaved(true);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "The quiz could not be saved. Try again.",
      );
    }
  }

  return (
    <FormProvider {...form}>
      <form
        noValidate
        onSubmit={handleSubmit(submit)}
        className="flex h-full min-h-0 flex-col overflow-hidden text-foreground"
      >
        <QuizFormHeader editing={!!quiz} onCancel={onCancel} />
        <ScrollArea className="min-h-0 flex-1">
          <div className="mx-auto max-w-6xl space-y-7 p-4 md:p-5">
            {saveError && (
              <p
                role="alert"
                className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
              >
                {saveError}
              </p>
            )}
            {isSubmitted && Object.keys(errors).length > 0 && (
              <p
                role="alert"
                className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
              >
                Check the highlighted fields before saving.
              </p>
            )}
            <fieldset
              disabled={isSubmitting}
              className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] lg:gap-10"
            >
              <legend className="sr-only">Quiz configuration</legend>
              <div className="min-w-0 space-y-7">
                <QuizDetailsFields />
                <QuizTimingFields />
                <QuizCountryFields />
              </div>
              <QuizQuestionsFields />
            </fieldset>
          </div>
        </ScrollArea>
      </form>
      <AlertDialog
        open={blocker.status === "blocked"}
        onOpenChange={(open) => {
          if (!open) blocker.reset?.();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Your quiz changes have not been saved. Leaving this page will
              discard them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => blocker.proceed?.()}
            >
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FormProvider>
  );
}
