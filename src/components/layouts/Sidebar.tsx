import { Link } from "@tanstack/react-router";
import { ListChecks, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
const items = [
  { label: "Quizzes", to: "/home", icon: ListChecks },
  { label: "Leaderboard", to: "/leaderboard", icon: Trophy },
] as const;
const Sidebar = () => (
  <nav
    aria-label="Primary"
    className="order-last flex w-full shrink-0 flex-row items-center justify-around border-t bg-background px-3 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] md:order-first md:h-full md:w-48 md:flex-col md:items-stretch md:justify-start md:gap-1 md:overflow-y-auto md:border-r md:border-t-0 md:p-2"
  >
    {items.map(({ label, to, icon: Icon }) => (
      <Link
        key={to}
        to={to as "/home"}
        search={{ status: "all", page: 1 }}
        activeOptions={{ includeSearch: false }}
        aria-label={label}
        className="group flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:min-h-0 md:w-full md:flex-initial md:flex-row md:items-center md:justify-start md:gap-2 md:p-2 md:text-sm"
        activeProps={{
          className: "font-medium text-foreground! bg-muted",
          "aria-current": "page",
        }}
      >
        <Icon className={cn("size-5 shrink-0 md:size-4")} />
        <span>{label}</span>
      </Link>
    ))}
  </nav>
);
export default Sidebar;
