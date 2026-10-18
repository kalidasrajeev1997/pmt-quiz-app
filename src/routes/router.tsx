import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import PageLayout from "../components/layouts/PageLayout";
import HomeContainer from "../components/home/HomeContainer";
import QuizContainer from "../components/quizzes/QuizContainer";
import TAB_VALUES from "../helpers/tabs";
import type { TabStatus } from "../types/quiz";
import LeaderboardContainer from "@/components/leaderboard/LeaderboardContainer";

export interface HomeSearch {
  status: TabStatus;
  page: number;
}

const rootRoute = createRootRoute({
  component: () => (
    <PageLayout>
      <Outlet />
    </PageLayout>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/home", search: { status: "all", page: 1 } });
  },
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/home",
  validateSearch: (search: Record<string, unknown>): HomeSearch => {
    const status = TAB_VALUES.find((value) => value === search.status);
    const page = Math.floor(Number(search.page));
    return {
      status: status ?? "all",
      page: Number.isFinite(page) && page > 0 ? page : 1,
    };
  },
  component: () => <HomeContainer />,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: () => <h1>Admin</h1>,
});

const quizRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/quiz/$id",
  component: () => {
    const { id } = quizRoute.useParams();

    return <QuizContainer key={id} quizId={id} />;
  },
});

const leaderboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/leaderboard",
  component: () => <LeaderboardContainer />,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  homeRoute,
  adminRoute,
  quizRoute,
  leaderboardRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
