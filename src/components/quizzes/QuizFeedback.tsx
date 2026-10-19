import { CircleAlert, RotateCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QuizAttemptError } from "@/types/quiz";

export function QuizLoading() {
  return (
    <div role="status" className="space-y-6 p-4">
      <span className="sr-only">Loading quiz...</span>
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export function QuizSelectionRequired({ error }: { error: string | null }) {
  return (
    <Alert className="border-0 bg-muted p-5">
      <CircleAlert />
      <AlertTitle>Choose a user to continue</AlertTitle>
      <AlertDescription>
        {error ?? "No user is available for the selected country."}
      </AlertDescription>
    </Alert>
  );
}

interface QuizUnavailableProps {
  error: Error;
  onRetry: () => void;
}

export function QuizUnavailable({ error, onRetry }: QuizUnavailableProps) {
  return (
    <Alert variant="destructive" className="border-0 bg-muted p-5">
      <CircleAlert />
      <AlertTitle>Quiz unavailable</AlertTitle>
      <AlertDescription>
        <div className="flex flex-col">
          {error instanceof QuizAttemptError
            ? error.message
            : "Your quiz could not be loaded. Check that browser storage is available, then try again."}
          <Button
            variant="secondary"
            onClick={onRetry}
            className="mt-3 w-fit h-10 bg-foreground text-background"
          >
            <RotateCcw />
            Try again
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

export function QuizSaveError({ error }: { error: Error }) {
  return (
    <Alert variant="destructive" className="border-0 bg-muted p-4">
      <CircleAlert />
      <AlertTitle>Progress could not be saved</AlertTitle>
      <AlertDescription>
        {error instanceof QuizAttemptError
          ? error.message
          : "Please try again. Keep this tab open until your progress is saved."}
      </AlertDescription>
    </Alert>
  );
}
