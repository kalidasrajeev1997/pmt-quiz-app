import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useSelection } from "@/hooks/useSelection";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { getQuizzes } from "@/services/quiz.service";
import type { TabStatus } from "@/types/quiz";
import type { QuizQueryResult } from "@/services/db/queries/quiz";

export interface UseQuizzesOptions {
  pageSize?: number;
}

export interface UseQuizzesReturn {
  quizzes: QuizQueryResult[] | undefined;
  total: number;
  totalPages: number;
  tab: TabStatus;
  page: number;
  pageSize: number;
  setTab: (status: TabStatus) => void;
  setPage: (page: number) => void;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  hasSelection: boolean;
}

const DEFAULT_PAGE_SIZE = 10;

/**
 * Custom hook to manage the quiz catalog listing on the Home view.
 *
 * Synchronizes:
 * - URL search params for active tab and pagination
 * - Selected user and country scoping
 * - TanStack Query caching and background refetching
 */
export function useQuizzes(options: UseQuizzesOptions = {}): UseQuizzesReturn {
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;

  const { status: tab, page } = useSearch({ from: "/home" });
  const navigate = useNavigate({ from: "/home" });

  const {
    selectedUser,
    selectedCountry,
    isLoading: selectionLoading,
    error: selectionError,
  } = useSelection();

  const hasSelection =
    !selectionLoading && !selectionError && !!selectedUser && !!selectedCountry;

  const {
    data,
    isLoading: quizzesLoading,
    isFetching,
    error: quizzesError,
  } = useQuery({
    enabled: hasSelection,
    queryKey: [
      ...QUERY_KEYS.QUIZZES,
      selectedUser?.id ?? "",
      selectedCountry?.code ?? "",
      tab,
      page,
      pageSize,
    ],
    queryFn: () =>
      getQuizzes(
        page,
        pageSize,
        selectedUser?.id ?? "",
        selectedCountry?.code ?? "",
        tab,
      ),
  });

  const quizzes = data?.quizzes;
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const setTab = (status: TabStatus) => {
    navigate({ search: { status, page: 1 } });
  };

  const setPage = (newPage: number) => {
    navigate({ search: (prev) => ({ ...prev, page: newPage }) });
  };

  const isLoading = selectionLoading || quizzesLoading;
  const error =
    selectionError ??
    (quizzesError ? `Error loading quizzes: ${quizzesError.message}` : null);

  return {
    quizzes,
    total,
    totalPages,
    tab,
    page,
    pageSize,
    setTab,
    setPage,
    isLoading,
    isFetching,
    error,
    hasSelection: !!selectedUser && !!selectedCountry,
  };
}
