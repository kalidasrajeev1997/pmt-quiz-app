import HomeTabs from "./HomeTabs";
import QuizCard from "@/components/home/QuizCard";
import QuizCardSkeleton from "@/components/home/QuizCardSkeleton";
import QuizPagination from "@/components/home/QuizPagination";
import QuizEmptyState from "@/components/home/QuizEmptyState";
import { useQuizzes } from "@/hooks/useQuizzes";

const HomeContainer = () => {
  const {
    quizzes,
    totalPages,
    tab,
    page,
    setTab,
    isLoading,
    isFetching,
    error,
    hasSelection,
  } = useQuizzes();

  return (
    <div className="p-3">
      <HomeTabs tab={tab} setTab={setTab}>
        {isLoading ? (
          <>
            <p role="status" className="sr-only">
              Loading quizzes...
            </p>

            <QuizCardSkeleton />
          </>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : !hasSelection ? (
          <p>No user or country available.</p>
        ) : quizzes?.length === 0 ? (
          <QuizEmptyState tab={tab} />
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
