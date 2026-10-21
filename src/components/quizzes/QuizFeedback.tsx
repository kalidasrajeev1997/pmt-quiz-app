import { CircleAlert, RotateCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QuizAttemptError, QuizEditedError } from "@/types/quiz";

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
  onRestartEditedAttempt: () => void;
  isRestarting: boolean;
  restartError: Error | null;
}

export function QuizUnavailable({
  error,
  onRetry,
  onRestartEditedAttempt,
  isRestarting,
  restartError,
}: QuizUnavailableProps) {
  const wasEdited = error instanceof QuizEditedError;
  return (
    <Alert variant="destructive" className="border-0 bg-muted p-5">
      <CircleAlert />
      <AlertTitle>Quiz unavailable</AlertTitle>
      <AlertDescription>
        <div className="flex flex-col">
          {error instanceof QuizAttemptError
            ? error.message
            : "Your quiz could not be loaded. Check that browser storage is available, then try again."}
          {wasEdited ? (
            <Button
              variant="secondary"
              onClick={onRestartEditedAttempt}
              disabled={isRestarting}
              className="mt-3 w-fit h-10 bg-foreground text-background hover:bg-foreground/70"
            >
              <RotateCcw />
              {isRestarting ? "Starting..." : "Start a new attempt"}
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={onRetry}
              className="mt-3 w-fit h-10 bg-foreground text-background"
            >
              <RotateCcw />
              Try again
            </Button>
          )}
          {restartError && restartError !== error && (
            <p className="mt-2">{restartError.message}</p>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

interface QuizSaveErrorProps {
  error: Error;
  onRestartEditedAttempt: () => void;
  isRestarting: boolean;
}

export function QuizSaveError({
  error,
  onRestartEditedAttempt,
  isRestarting,
}: QuizSaveErrorProps) {
  const wasEdited = error instanceof QuizEditedError;
  return (
    <Alert variant="destructive" className="border-0 bg-muted p-4">
      <CircleAlert />
      <AlertTitle>Progress could not be saved</AlertTitle>
      <AlertDescription>
        <div className="flex flex-col">
          {error instanceof QuizAttemptError
            ? error.message
            : "Please try again. Keep this tab open until your progress is saved."}
          {wasEdited && (
            <Button
              variant="secondary"
              onClick={onRestartEditedAttempt}
              disabled={isRestarting}
              className="mt-3 w-fit h-10 bg-foreground text-background hover:bg-foreground/70"
            >
              <RotateCcw />
              {isRestarting ? "Starting..." : "Start a new attempt"}
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
