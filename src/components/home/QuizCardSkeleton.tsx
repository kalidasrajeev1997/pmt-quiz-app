import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const QuizCardSkeleton = () => (
  <ul
    aria-label="Loading quizzes"
    aria-busy="true"
    className="grid auto-rows-fr grid-cols-1 gap-4 py-3 md:grid-cols-2 xl:grid-cols-3"
  >
    {Array.from({ length: 4 }, (_, index) => (
      <li key={index} className="min-w-0">
        <Card
          aria-hidden="true"
          className="h-full min-w-0 gap-4 rounded-lg bg-muted/90 py-5 shadow-none ring-0 [--card-spacing:--spacing(5)]"
        >
          <CardHeader className="flex items-start justify-between gap-4 rounded-none">
            <div className="min-w-0 flex-1">
              <Skeleton className="h-6 w-2/3 bg-muted-foreground/15 motion-reduce:animate-none" />
              <div className="mt-2 space-y-2 py-1">
                <Skeleton className="h-4 w-full bg-muted-foreground/15 motion-reduce:animate-none" />
                <Skeleton className="h-4 w-4/5 bg-muted-foreground/15 motion-reduce:animate-none" />
              </div>
            </div>
            <Skeleton className="size-16 shrink-0 rounded-full bg-muted-foreground/15 motion-reduce:animate-none" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <Skeleton className="h-4 w-24 bg-muted-foreground/15 motion-reduce:animate-none" />
              <Skeleton className="h-4 w-20 bg-muted-foreground/15 motion-reduce:animate-none" />
              <Skeleton className="h-4 w-28 bg-muted-foreground/15 motion-reduce:animate-none" />
            </div>
            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-3.5 w-16 bg-muted-foreground/15 motion-reduce:animate-none" />
              <Skeleton className="h-3.5 w-16 bg-muted-foreground/15 motion-reduce:animate-none" />
            </div>
          </CardContent>
          <CardFooter className="mt-auto flex flex-col items-stretch gap-4 rounded-none border-0 bg-transparent pt-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Skeleton className="h-5 w-32 bg-muted-foreground/15 motion-reduce:animate-none" />
              <Skeleton className="h-5 w-20 bg-muted-foreground/15 motion-reduce:animate-none" />
            </div>
            <Skeleton className="h-10 w-full bg-muted-foreground/15 motion-reduce:animate-none" />
          </CardFooter>
        </Card>
      </li>
    ))}
  </ul>
);

export default QuizCardSkeleton;
