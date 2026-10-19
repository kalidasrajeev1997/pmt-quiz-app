import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminQuizFilters from "./AdminQuizFilters";
import AdminQuizTable from "./AdminQuizTable";
import AdminQuizTableSkeleton from "./AdminQuizTableSkeleton";
import DeleteQuizDialog from "./DeleteQuizDialog";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { getAdminQuizzes } from "@/services/quiz.service";
import { useSelection } from "@/hooks/useSelection";
import { useQuizMutations } from "@/hooks/useQuizMutations";
import type { Quiz } from "@/types/quiz";

export default function AdminQuizList() {
  const { countries } = useSelection();
  const {
    data: quizzes = [],
    isPending,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.ADMIN_QUIZZES,
    queryFn: getAdminQuizzes,
  });
  const { remove } = useQuizMutations();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("title-asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [deleting, setDeleting] = useState<Quiz | null>(null);
  const matching = quizzes.filter((quiz) =>
    `${quiz.title} ${quiz.description} ${quiz.countries.map((code) => `${code} ${countries.find((country) => country.code === code)?.name ?? ""}`).join(" ")}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  matching.sort((first, second) => {
    if (sort === "questions-desc")
      return (
        second.questions.length - first.questions.length ||
        first.title.localeCompare(second.title)
      );
    if (sort === "questions-asc")
      return (
        first.questions.length - second.questions.length ||
        first.title.localeCompare(second.title)
      );
    return sort === "title-desc"
      ? second.title.localeCompare(first.title)
      : first.title.localeCompare(second.title);
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 text-foreground md:p-5">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium">Quiz admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {quizzes.length} quizzes
          </p>
        </div>
        <Button
          size="lg"
          nativeButton={false}
          render={<Link to="/admin/quizzes/new" />}
          className="min-h-10 rounded-md px-4 text-white"
        >
          <Plus />
          New quiz
        </Button>
      </header>
      <AdminQuizFilters
        search={search}
        sort={sort}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        onSortChange={(value) => {
          setSort(value);
          setPage(1);
        }}
      />
      {isPending ? (
        <AdminQuizTableSkeleton rowCount={pageSize} />
      ) : error ? (
        <div
          role="alert"
          className="space-y-3 rounded-md bg-destructive/10 p-5"
        >
          <p>{error.message}</p>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <AdminQuizTable
          quizzes={matching}
          search={search}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(value) => {
            setPageSize(value);
            setPage(1);
          }}
          onDelete={(quiz) => {
            remove.reset();
            setDeleting(quiz);
          }}
        />
      )}
      <DeleteQuizDialog
        quiz={deleting}
        isPending={remove.isPending}
        error={remove.error}
        onOpenChange={(open) => {
          if (!open && !remove.isPending) setDeleting(null);
        }}
        onConfirm={() => {
          if (!deleting) return;
          remove.mutate(deleting.id, {
            onSuccess: () => setDeleting(null),
          });
        }}
      />
    </div>
  );
}
