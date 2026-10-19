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
import AdminQuizList from "@/components/quiz-builder/AdminQuizList";
import QuizEditor from "@/components/quiz-builder/QuizEditor";
import RoleBoundary from "./RoleBoundary";
import { getActiveUser, requireRole } from "./roleMiddleware";

export interface HomeSearch {
  status: TabStatus;
  page: number;
}

const rootRoute = createRootRoute({
  component: () => (
    <PageLayout>
      <RoleBoundary>
        <Outlet />
      </RoleBoundary>
    </PageLayout>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: async () => {
    if ((await getActiveUser())?.role === "admin")
      throw redirect({ to: "/admin" });
    throw redirect({ to: "/home", search: { status: "all", page: 1 } });
  },
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/home",
  beforeLoad: () => requireRole("user"),
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
  beforeLoad: () => requireRole("admin"),
  component: AdminQuizList,
});

const newQuizRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/quizzes/new",
  beforeLoad: () => requireRole("admin"),
  component: () => <QuizEditor />,
});

const editQuizRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/quizzes/$id",
  beforeLoad: () => requireRole("admin"),
  component: () => {
    const { id } = editQuizRoute.useParams();
    return <QuizEditor key={id} quizId={id} />;
  },
});

const quizRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/quiz/$id",
  beforeLoad: () => requireRole("user"),
  component: () => {
    const { id } = quizRoute.useParams();

    return <QuizContainer key={id} quizId={id} />;
  },
});

export interface LeaderboardSearch {
  quizId?: string;
}

const leaderboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/leaderboard",
  validateSearch: (search: Record<string, unknown>): LeaderboardSearch => {
    return {
      quizId:
        typeof search.quizId === "string" && search.quizId.trim().length > 0
          ? search.quizId.trim()
          : undefined,
    };
  },
  component: () => <LeaderboardContainer />,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  homeRoute,
  adminRoute,
  newQuizRoute,
  editQuizRoute,
  quizRoute,
  leaderboardRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
