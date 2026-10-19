import { ArrowRight, Check, CircleAlert, LoaderIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveLabels, submitLabels } from "@/helpers/constants";

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
  const SaveIcon = pending ? LoaderIcon : saveFailed ? CircleAlert : Check;

  const saveLabel = pending
    ? saveLabels.PENDING
    : saveFailed
      ? saveLabels.FAILED
      : saveLabels.SUCCESS;

  const submitLabel = expired
    ? submitLabels.TIME_EXPIRED
    : lastQuestion
      ? submitLabels.FINISH_QUIZ
      : submitLabels.SUBMIT_ANSWER;

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
        className="min-h-10 rounded-md px-4 text-white"
      >
        {submitLabel}
        <SubmitIcon aria-hidden="true" />
      </Button>
    </div>
  );
}
