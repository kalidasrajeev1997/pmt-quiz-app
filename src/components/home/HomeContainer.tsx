import HomeTabs from "./HomeTabs";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { useSelection } from "@/hooks/useSelection";
import { getQuizzes } from "@/services/quiz.service";
import QuizCard from "@/components/home/QuizCard";

const PAGE_SIZE = 10;

const HomeContainer = () => {
  const [tab, setTab] = useState<
    "all" | "not-started" | "in-progress" | "completed"
  >("all");
  const { selectedUser, selectedCountry, isLoading, error } = useSelection();
  const scope = JSON.stringify([tab, selectedUser?.id, selectedCountry?.code]);
  const [pagination, setPagination] = useState({ scope, page: 1 });
  if (pagination.scope !== scope) {
    setPagination({ scope, page: 1 });
  }
  const page = pagination.scope === scope ? pagination.page : 1;

  const {
    data,
    isLoading: quizzesLoading,
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
    queryFn: async () => {
      const userId = selectedUser?.id ?? "";
      const country = selectedCountry?.code ?? "";
      const quizzes = await getQuizzes(page, PAGE_SIZE, userId, country, tab);
      const hasNextPage =
        quizzes.length === PAGE_SIZE &&
        (await getQuizzes(page + 1, PAGE_SIZE, userId, country, tab)).length >
          0;
      return { quizzes, hasNextPage };
    },
  });
  const quizzes = data?.quizzes;

  console.log({ quizzes });
  // const previousDisabled = page === 1 || isFetching;
  // const nextDisabled = !data?.hasNextPage || isFetching || !!quizzesError;
  return (
    <div className="p-3">
      <HomeTabs tab={tab} setTab={setTab}>
        {isLoading || quizzesLoading ? (
          <p role="status">Loading quizzes...</p>
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
      </HomeTabs>
    </div>
  );
};

export default HomeContainer;
