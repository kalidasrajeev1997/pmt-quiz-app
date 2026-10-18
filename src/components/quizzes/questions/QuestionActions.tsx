import { ArrowRight, Check, CircleAlert, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuestionActionsProps {
  pending: boolean;
  saveFailed: boolean;
  expired: boolean;
  isSubmitting: boolean;
  lastQuestion: boolean;
}

export default function QuestionActions({
  pending,
  saveFailed,
  expired,
  isSubmitting,
  lastQuestion,
}: QuestionActionsProps) {
  const SaveIcon = pending ? LoaderCircle : saveFailed ? CircleAlert : Check;
  const saveLabel = pending
    ? "Saving..."
    : saveFailed
      ? "Not saved"
      : "Progress saved";
  const submitLabel = expired
    ? "Time expired..."
    : lastQuestion
      ? "Finish quiz"
      : "Submit answer";
  const SubmitIcon = lastQuestion ? Check : ArrowRight;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
      <span
        role="status"
        className="flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <SaveIcon
          className={`size-4 ${pending ? "motion-safe:animate-spin" : ""}`}
          aria-hidden="true"
        />
        {saveLabel}
      </span>
      <Button
        type="submit"
        size="lg"
        disabled={pending || expired || isSubmitting}
        className="min-h-11 rounded-md px-5"
      >
        {submitLabel}
        <SubmitIcon aria-hidden="true" />
      </Button>
    </div>
  );
}
