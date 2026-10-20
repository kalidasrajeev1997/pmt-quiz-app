import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import notFoundIllustration from "@/assets/404/404.svg";
import { Button } from "@/components/ui/button";
import { useSelection } from "@/hooks/useSelection";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { selectedUser } = useSelection();

  function returnToQuizzes() {
    if (selectedUser?.role === "admin") {
      navigate({ to: "/admin" });
      return;
    }

    navigate({ to: "/home", search: { status: "all", page: 1 } });
  }

  return (
    <div className="flex min-h-[calc(100dvh-7rem)] items-center px-5 py-10 md:min-h-[calc(100dvh-3.25rem)] md:px-10">
      <section
        aria-labelledby="not-found-title"
        className="mx-auto grid w-full max-w-5xl grid-cols-1 items-center gap-12 md:grid-cols-[1.1fr_0.9fr] md:gap-1"
      >
        <img
          src={notFoundIllustration}
          alt=""
          aria-hidden="true"
          className="w-[min(78vw,30rem)] justify-self-center md:w-[min(38vw,30rem)]"
        />
        <div className="-mt-4 max-w-md md:mt-0 md:-ml-24 text-center md:text-left">
          <h1
            id="not-found-title"
            className="md:max-w-[15ch] text-3xl font-medium leading-tight tracking-tight text-foreground sm:text-4xl"
          >
            Oops. You took a wrong turn.
          </h1>
          <p className="mt-3 text-base leading-relaxed text-foreground/75">
            No worries. Your quizzes are right where you left them. Head back
            there, or see who’s leading the leaderboard.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Button onClick={returnToQuizzes} className="h-10 px-4 text-white">
              <ArrowLeft aria-hidden="true" />
              {selectedUser?.role === "admin"
                ? "Back to quiz admin"
                : "Back to your quizzes"}
            </Button>
            <Link
              to="/leaderboard"
              search={{}}
              className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4"
            >
              View the leaderboard
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
