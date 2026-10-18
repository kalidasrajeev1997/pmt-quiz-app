import HomeTabs from "./HomeTabs";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { useSelection } from "@/hooks/useSelection";
import { getQuizzes } from "@/services/quiz.service";
import QuizCard from "@/components/home/QuizCard";
import QuizCardSkeleton from "@/components/home/QuizCardSkeleton";
import QuizPagination from "@/components/home/QuizPagination";
import type { TabStatus } from "@/types/quiz";

const PAGE_SIZE = 10;

const HomeContainer = () => {
  const { status: tab, page } = useSearch({ from: "/home" });
  const navigate = useNavigate({ from: "/home" });
  const { selectedUser, selectedCountry, isLoading, error } = useSelection();

  const setTab = (status: TabStatus) =>
    navigate({ search: { status, page: 1 } });

  const {
    data,
    isLoading: quizzesLoading,
    isFetching,
    error: quizzesError,
  } = useQuery({
    enabled: !isLoading && !error && !!selectedUser && !!selectedCountry,
    queryKey: [
      ...QUERY_KEYS.QUIZZES,
      selectedUser?.id ?? "",
      selectedCountry?.code ?? "",
      tab,
      page,
      PAGE_SIZE,
    ],
    queryFn: () =>
      getQuizzes(
        page,
        PAGE_SIZE,
        selectedUser?.id ?? "",
        selectedCountry?.code ?? "",
        tab,
      ),
  });
  const quizzes = data?.quizzes;
  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE);

  return (
    <div className="p-3">
      <HomeTabs tab={tab} setTab={setTab}>
        {isLoading || quizzesLoading ? (
          <>
            <p role="status" className="sr-only">
              Loading quizzes...
            </p>
            <ul
              aria-label="Loading quizzes"
              aria-busy="true"
              className="grid auto-rows-fr grid-cols-1 gap-4 py-3 md:grid-cols-2 xl:grid-cols-3"
            >
              {Array.from({ length: 4 }, (_, index) => (
                <li key={index} className="min-w-0">
                  <QuizCardSkeleton />
                </li>
              ))}
            </ul>
          </>
        ) : error || quizzesError ? (
          <p role="alert">
            {error ?? `Error loading quizzes: ${quizzesError?.message}`}
          </p>
        ) : !selectedUser || !selectedCountry ? (
          <p>No user or country available.</p>
        ) : quizzes?.length === 0 ? (
          <p>No quizzes found.</p>
        ) : (
          <ul
            aria-label="Quizzes"
            className="grid auto-rows-fr grid-cols-1 gap-4 py-3 md:grid-cols-2 xl:grid-cols-3"
          >
            {quizzes?.map((quiz) => (
              <li key={quiz.id} className="min-w-0">
                <QuizCard quiz={quiz} />
              </li>
            ))}
          </ul>
        )}
        <QuizPagination
          page={page}
          totalPages={totalPages}
          disabled={isFetching}
        />
      </HomeTabs>
    </div>
  );
};

export default HomeContainer;
