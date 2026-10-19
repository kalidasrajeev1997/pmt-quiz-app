import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Quiz } from "@/types/quiz";

interface AdminQuizTableProps {
  quizzes: Quiz[];
  search: string;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onDelete: (quiz: Quiz) => void;
}

export default function AdminQuizTable({
  quizzes,
  search,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onDelete,
}: AdminQuizTableProps) {
  const totalPages = Math.max(1, Math.ceil(quizzes.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * pageSize;
  const visible = quizzes.slice(offset, offset + pageSize);

  return (
    <>
      <Table aria-label="Quizzes">
        <TableHeader className="bg-muted [&_tr]:border-0">
          <TableRow className="border-0">
            <TableHead className="w-full">Quiz</TableHead>
            <TableHead className="hidden md:table-cell">Questions</TableHead>
            <TableHead className="hidden lg:table-cell">Countries</TableHead>
            <TableHead className="hidden xl:table-cell">Time limits</TableHead>
            <TableHead className="hidden xl:table-cell">Retakes</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map((quiz) => (
            <TableRow key={quiz.id} className="border-0 even:bg-muted/40">
              <TableCell className="max-w-0 py-4 whitespace-normal">
                <Link
                  to="/admin/quizzes/$id"
                  params={{ id: quiz.id }}
                  className="block font-medium wrap-break-word hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {quiz.title}
                </Link>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {quiz.description}
                </p>
                <p className="mt-1 text-xs text-muted-foreground lg:hidden">
                  {quiz.countries.join(", ")}
                  <span className="md:hidden">
                    {" "}
                    · {quiz.questions.length} questions
                  </span>
                </p>
              </TableCell>
              <TableCell className="hidden tabular-nums md:table-cell">
                {quiz.questions.length}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {quiz.countries.join(", ")}
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                <div>
                  {quiz.timeLimitSeconds
                    ? `${quiz.timeLimitSeconds}s overall`
                    : "No overall limit"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {quiz.perQuestionSeconds
                    ? `${quiz.perQuestionSeconds}s / question`
                    : "No question limit"}
                </div>
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                {quiz.retakesAllowed ? "Allowed" : "Not allowed"}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button
                    nativeButton={false}
                    variant="ghost"
                    size="icon"
                    title="Edit quiz"
                    aria-label={`Edit ${quiz.title}`}
                    render={
                      <Link to="/admin/quizzes/$id" params={{ id: quiz.id }} />
                    }
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    title="Delete quiz"
                    aria-label={`Delete ${quiz.title}`}
                    onClick={() => onDelete(quiz)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {visible.length === 0 && (
            <TableRow className="border-0">
              <TableCell
                colSpan={6}
                className="py-14 text-center whitespace-normal"
              >
                {search ? "No quizzes match your search." : "No quizzes yet."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <p role="status" className="text-muted-foreground">
          {quizzes.length
            ? `${offset + 1}-${Math.min(offset + pageSize, quizzes.length)} of ${quizzes.length} quizzes`
            : "0 quizzes"}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={String(pageSize)}
            items={[5, 10, 20].map((size) => ({
              value: String(size),
              label: `${size} per page`,
            }))}
            onValueChange={(value) => {
              if (value) onPageSizeChange(Number(value));
            }}
          >
            <SelectTrigger aria-label="Quizzes per page" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} per page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <nav aria-label="Quiz pagination" className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              title="Previous page"
              aria-label="Previous page"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              <ChevronLeft />
            </Button>
            <span className="tabular-nums">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              title="Next page"
              aria-label="Next page"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              <ChevronRight />
            </Button>
          </nav>
        </div>
      </div>
    </>
  );
}
