import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminQuizTableSkeleton({
  rowCount = 5,
}: {
  rowCount?: number;
}) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Loading quizzes...</span>
      <div
        aria-hidden="true"
        className="space-y-6 **:data-[slot=skeleton]:bg-muted-foreground/15 motion-reduce:**:data-[slot=skeleton]:animate-none"
      >
        <Table>
          <TableHeader className="bg-muted [&_tr]:border-0">
            <TableRow className="border-0">
              <TableHead className="w-full">Quiz</TableHead>
              <TableHead className="hidden md:table-cell">Questions</TableHead>
              <TableHead className="hidden lg:table-cell">Countries</TableHead>
              <TableHead className="hidden xl:table-cell">
                Time limits
              </TableHead>
              <TableHead className="hidden xl:table-cell">Retakes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rowCount }, (_, index) => (
              <TableRow key={index} className="border-0 even:bg-muted/40">
                <TableCell className="max-w-0 py-4 whitespace-normal">
                  <Skeleton className="h-5 w-48 max-w-full" />
                  <Skeleton className="mt-1 h-5 w-80 max-w-full" />
                  <Skeleton className="mt-1 h-4 w-24 max-w-full lg:hidden" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Skeleton className="h-5 w-8" />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Skeleton className="h-5 w-16" />
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="mt-1 h-4 w-24" />
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <Skeleton className="h-5 w-20" />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Skeleton className="size-8" />
                    <Skeleton className="size-8" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-5 w-32" />
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-8 w-32" />
            <div className="flex items-center gap-2">
              <Skeleton className="size-8" />
              <Skeleton className="h-5 w-9" />
              <Skeleton className="size-8" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
