import { Skeleton } from "@/components/ui/skeleton";
import { leaderboardColumns } from "./LeaderboardRow";

const LeaderboardSkeleton = ({ overall }: { overall: boolean }) => (
  <div role="status" aria-busy="true">
    <span className="sr-only">Loading leaderboard...</span>
    <div
      aria-hidden="true"
      className="**:data-[slot=skeleton]:bg-muted-foreground/15 motion-reduce:**:data-[slot=skeleton]:animate-none"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-5 w-28" />
      </div>
      <div className="bg-background border-2 border-b-6 rounded-xl px-2 py-4">
        <div className="hidden sm:block">
          <div className={`${leaderboardColumns} pb-3`}>
            <Skeleton className="mx-auto h-5 w-8" />
            <Skeleton className="h-5 w-12" />
            <Skeleton className="ml-auto h-5 w-16" />
            <Skeleton className="ml-auto h-5 w-16" />
          </div>
        </div>
        <div className="space-y-1">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className={`${leaderboardColumns} min-h-22 rounded-lg py-3 sm:min-h-20`}
            >
              <Skeleton className="row-span-2 mx-auto size-9 rounded-full sm:row-span-1" />
              <div className="min-w-0">
                <Skeleton className="h-5 w-32 max-w-full" />
                {overall && (
                  <Skeleton className="mt-1 hidden h-5 w-16 sm:block" />
                )}
              </div>
              <Skeleton className="ml-auto h-6 w-12" />
              <Skeleton className="col-span-2 col-start-2 h-5 w-20 sm:col-span-1 sm:col-start-auto sm:ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default LeaderboardSkeleton;
