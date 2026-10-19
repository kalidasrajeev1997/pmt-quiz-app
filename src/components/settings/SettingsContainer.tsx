import { useState } from "react";
import { CheckCircle2, Database, RotateCcw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useResetData } from "@/hooks/useResetData";
import { cn } from "@/lib/utils";
import ResetConfirmDialog from "./ResetConfirmDialog";

export default function SettingsContainer() {
  const { mutate: resetData, isPending, isSuccess, error } = useResetData();
  const [showSuccess, setShowSuccess] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleConfirmReset = () => {
    setShowSuccess(false);
    resetData(undefined, {
      onSuccess: () => {
        setIsConfirmOpen(false);
        setShowSuccess(true);
      },
      onError: () => {
        setIsConfirmOpen(false);
      },
    });
  };

  return (
    <section
      aria-labelledby="settings-title"
      className="p-4 md:p-6 text-foreground tracking-normal"
    >
      <header className="mb-6 flex flex-col">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Settings aria-hidden="true" className="size-8" strokeWidth={1.7} />
          </div>
          <div className="flex flex-col justify-center">
            <h1
              id="settings-title"
              className="text-2xl font-medium leading-tight"
            >
              Settings
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your application data and preferences
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl space-y-4">
        {showSuccess && isSuccess && (
          <Alert
            role="status"
            className="border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          >
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
            <AlertTitle>Data Reset Successful</AlertTitle>
            <AlertDescription>
              All quiz, attempt, user, and country data has been reset to the
              original seed JSON dataset.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Reset Failed</AlertTitle>
            <AlertDescription>
              {error instanceof Error
                ? error.message
                : "Failed to reset data to seed JSON."}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="size-5 text-muted-foreground" />
              <CardTitle>Reset Database</CardTitle>
            </div>
            <CardDescription>
              Restore the database to its original initial seed state.
            </CardDescription>
          </CardHeader>

          <CardFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t pt-4">
            <Button
              variant="destructive"
              onClick={() => setIsConfirmOpen(true)}
              disabled={isPending}
            >
              <RotateCcw
                className={cn("size-4", isPending && "animate-spin")}
              />
              {isPending ? "Resetting data..." : "Reset data"}
            </Button>
          </CardFooter>
        </Card>

        <ResetConfirmDialog
          open={isConfirmOpen}
          isPending={isPending}
          onOpenChange={(open) => {
            if (!isPending) setIsConfirmOpen(open);
          }}
          onConfirm={handleConfirmReset}
        />
      </div>
    </section>
  );
}
