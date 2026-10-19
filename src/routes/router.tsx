import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import PageLayout from "../components/layouts/PageLayout";
import TAB_VALUES from "../helpers/tabs";
import type { TabStatus } from "../types/quiz";
import { Spinner } from "@/components/ui/spinner";
import RoleBoundary from "./RoleBoundary";
import { getActiveUser, requireRole } from "./roleMiddleware";

const HomeContainer = lazyRouteComponent(
  () => import("../components/home/HomeContainer"),
);
const QuizContainer = lazyRouteComponent(
  () => import("../components/quizzes/QuizContainer"),
);
const LeaderboardContainer = lazyRouteComponent(
  () => import("@/components/leaderboard/LeaderboardContainer"),
);
const AdminQuizList = lazyRouteComponent(
  () => import("@/components/quiz-builder/AdminQuizList"),
);
const QuizEditor = lazyRouteComponent(
  () => import("@/components/quiz-builder/QuizEditor"),
);
const SettingsContainer = lazyRouteComponent(
  () => import("@/components/settings/SettingsContainer"),
);

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
  component: HomeContainer,
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
  component: QuizEditor,
});

const editQuizRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/quizzes/$id",
  beforeLoad: () => requireRole("admin"),
  component: Object.assign(
    () => {
      const { id } = editQuizRoute.useParams();
      return <QuizEditor key={id} quizId={id} />;
    },
    { preload: QuizEditor.preload },
  ),
});

const quizRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/quiz/$id",
  beforeLoad: () => requireRole("user"),
  component: Object.assign(
    () => {
      const { id } = quizRoute.useParams();

      return <QuizContainer key={id} quizId={id} />;
    },
    { preload: QuizContainer.preload },
  ),
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
  component: LeaderboardContainer,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsContainer,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  homeRoute,
  adminRoute,
  newQuizRoute,
  editQuizRoute,
  quizRoute,
  leaderboardRoute,
  settingsRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPendingComponent: () => (
    <div className="flex flex-1 items-center justify-center p-8 h-dvh">
      <Spinner className="size-4" />
    </div>
  ),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
