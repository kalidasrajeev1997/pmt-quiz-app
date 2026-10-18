import type { MouseEvent } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface QuizPaginationProps {
  page: number;
  totalPages: number;
  disabled?: boolean;
}

const getPageItems = (page: number, totalPages: number) => {
  const pages = new Set(
    [1, page - 1, page, page + 1, totalPages].filter(
      (value) => value >= 1 && value <= totalPages,
    ),
  );
  const items: (number | "ellipsis-start" | "ellipsis-end")[] = [];
  let previous = 0;
  for (const value of [...pages].sort((a, b) => a - b)) {
    if (value - previous > 1) {
      items.push(previous === 0 ? "ellipsis-start" : "ellipsis-end");
    }
    items.push(value);
    previous = value;
  }
  return items;
};

const QuizPagination = ({
  page,
  totalPages,
  disabled = false,
}: QuizPaginationProps) => {
  const router = useRouter();
  const navigate = useNavigate({ from: "/home" });

  if (totalPages <= 1) {
    return null;
  }

  const linkProps = (target: number) => ({
    href: router.buildLocation({
      to: "/home",
      search: (prev) => ({
        ...prev,
        status: prev.status ?? "all",
        page: target,
      }),
    }).href,
    onClick: (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      if (!disabled) {
        navigate({ search: (prev) => ({ ...prev, page: target }) });
      }
    },
  });
  const disabledClass = "pointer-events-none opacity-50";

  return (
    <Pagination className="py-3">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            {...linkProps(page - 1)}
            aria-disabled={page <= 1 || disabled}
            className={page <= 1 || disabled ? disabledClass : undefined}
          />
        </PaginationItem>
        {getPageItems(page, totalPages).map((item) =>
          typeof item === "number" ? (
            <PaginationItem key={item}>
              <PaginationLink
                {...linkProps(item)}
                isActive={item === page}
                aria-disabled={disabled}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <PaginationEllipsis />
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext
            {...linkProps(page + 1)}
            aria-disabled={page >= totalPages || disabled}
            className={
              page >= totalPages || disabled ? disabledClass : undefined
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default QuizPagination;
