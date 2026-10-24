import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QuizHomeLink() {
  return (
    <Button
      variant="ghost"
      nativeButton={false}
      className="min-h-11 justify-start rounded-md px-2 hover:bg-transparent hover:dark:bg-background hover:underline"
      render={
        <Link
          to="/home"
          search={(prev) => ({
            ...prev,
            status: prev.status ?? "all",
            page: 1,
            query: prev.query ?? "",
          })}
          preload="render"
        />
      }
    >
      <ArrowLeft aria-hidden="true" />
      Back to quizzes
    </Button>
  );
}
