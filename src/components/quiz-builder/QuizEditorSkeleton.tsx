import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export default function QuizEditorSkeleton() {
  return (
    <div role="status" aria-busy="true" className="h-full min-h-0">
      <span className="sr-only">Loading quiz...</span>
      <div
        aria-hidden="true"
        className="flex h-full min-h-0 flex-col overflow-hidden **:data-[slot=skeleton]:bg-muted-foreground/15 motion-reduce:**:data-[slot=skeleton]:animate-none"
      >
        <div className="shrink-0 bg-background">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 p-3 md:px-5">
            <div className="flex min-w-0 items-center gap-2">
              <Skeleton className="size-9 shrink-0" />
              <Skeleton className="h-7 w-28" />
            </div>
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <div className="mx-auto max-w-6xl p-4 md:p-5">
            <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] lg:gap-10">
              <div className="min-w-0 space-y-7">
                <div className="space-y-4">
                  <Skeleton className="h-7 w-28" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-10" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-28 w-full" />
                  </div>
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-7 w-40" />
                  {["overall", "per-question"].map((limit) => (
                    <div key={limit} className="space-y-2">
                      <Skeleton className="h-4 w-48 max-w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                  <div className="flex items-center gap-3 py-2">
                    <Skeleton className="size-4" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-7 w-28" />
                  <Skeleton className="h-4 w-52 max-w-full" />
                  {["first", "second", "third"].map((country) => (
                    <div key={country} className="flex items-center gap-3">
                      <Skeleton className="size-4" />
                      <Skeleton className="h-5 w-28" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="min-w-0 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Skeleton className="h-7 w-32" />
                  <Skeleton className="h-10 w-36" />
                </div>
                <div className="space-y-4 rounded-md bg-muted/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Skeleton className="h-5 w-28" />
                    <div className="flex gap-2">
                      <Skeleton className="size-8" />
                      <Skeleton className="size-8" />
                      <Skeleton className="size-8" />
                    </div>
                  </div>
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-5 w-20" />
                  {["first", "second", "third", "fourth"].map((option) => (
                    <div key={option} className="flex items-center gap-3">
                      <Skeleton className="size-4 shrink-0" />
                      <Skeleton className="h-10 flex-1" />
                      <Skeleton className="size-8 shrink-0" />
                    </div>
                  ))}
                  <Skeleton className="h-9 w-28" />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
