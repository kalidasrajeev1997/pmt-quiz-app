import { ArrowLeft, Save } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { QuizFormValues } from "@/helpers/quizSchema";

interface QuizFormHeaderProps {
  editing: boolean;
  onCancel: () => void;
}

export default function QuizFormHeader({
  editing,
  onCancel,
}: QuizFormHeaderProps) {
  const {
    formState: { isDirty, isSubmitting },
  } = useFormContext<QuizFormValues>();

  return (
    <header className="shrink-0 border-b bg-background">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 p-3 md:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Back to quizzes"
            title="Back to quizzes"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            <ArrowLeft />
          </Button>
          <h1 className="text-xl font-medium">
            {editing ? "Edit quiz" : "New quiz"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <span
              className="sr-only text-sm text-muted-foreground sm:not-sr-only"
              role="status"
            >
              Unsaved changes
            </span>
          )}
          <Button
            type="submit"
            className="h-10 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner className="h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save /> Save quiz
              </>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
