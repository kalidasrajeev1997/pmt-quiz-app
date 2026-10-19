import { Link } from "@tanstack/react-router";
import { ListChecks, Settings, ShieldCheck, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSelection } from "@/hooks/useSelection";
const navLinkClass =
  "group flex min-h-11 flex-1 flex-col items-center justify-center gap-0 md:gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:min-h-0 md:w-full md:flex-initial md:flex-row md:items-center md:justify-start md:gap-2 md:p-2 md:text-sm";

const activeProps = {
  className: "font-medium text-foreground! bg-muted",
  "aria-current": "page" as const,
};

const Sidebar = () => {
  const { selectedUser } = useSelection();
  return (
    <nav
      aria-label="Primary"
      className="order-last flex w-full shrink-0 flex-row items-center justify-around border-t bg-background px-3 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] md:order-first md:h-full md:w-48 md:flex-col md:items-stretch md:justify-start md:gap-1 md:overflow-y-auto md:border-r md:border-t-0 md:p-2"
    >
      {selectedUser?.role === "admin" ? (
        <Link
          to="/admin"
          activeOptions={{ exact: false }}
          aria-label="Quiz admin"
          className={navLinkClass}
          activeProps={activeProps}
        >
          <ShieldCheck className="size-5 shrink-0 md:size-4" />
          <span>Quiz admin</span>
        </Link>
      ) : (
        selectedUser && (
          <Link
            to="/home"
            search={{ status: "all", page: 1 }}
            activeOptions={{ includeSearch: false }}
            aria-label="Quizzes"
            className={navLinkClass}
            activeProps={activeProps}
          >
            <ListChecks className={cn("size-5 shrink-0 md:size-4")} />
            <span>Quizzes</span>
          </Link>
        )
      )}
      <Link
        to="/leaderboard"
        search={{}}
        activeOptions={{ includeSearch: false }}
        aria-label="Leaderboard"
        className={navLinkClass}
        activeProps={activeProps}
      >
        <Trophy className={cn("size-5 shrink-0 md:size-4")} />
        <span>Leaderboard</span>
      </Link>
      <Link
        to="/settings"
        activeOptions={{ exact: false }}
        aria-label="Settings"
        className={navLinkClass}
        activeProps={activeProps}
      >
        <Settings className={cn("size-5 shrink-0 md:size-4")} />
        <span>Settings</span>
      </Link>
    </nav>
  );
};

export default Sidebar;
