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
import { usePagination } from "@/hooks/usePagination";

interface QuizPaginationProps {
  page: number;
  totalPages: number;
  disabled?: boolean;
}

const QuizPagination = ({
  page,
  totalPages,
  disabled = false,
}: QuizPaginationProps) => {
  const router = useRouter();
  const navigate = useNavigate({ from: "/home" });

  const { items, canPrevious, canNext, previousPage, nextPage } = usePagination(
    { page, totalPages },
  );

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
            {...linkProps(previousPage)}
            aria-disabled={!canPrevious || disabled}
            className={!canPrevious || disabled ? disabledClass : undefined}
          />
        </PaginationItem>
        {items.map((item, index) =>
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
            <PaginationItem key={`${item}-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext
            {...linkProps(nextPage)}
            aria-disabled={!canNext || disabled}
            className={!canNext || disabled ? disabledClass : undefined}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default QuizPagination;
