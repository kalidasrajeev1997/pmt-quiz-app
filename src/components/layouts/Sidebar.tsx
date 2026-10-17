import { Link } from "@tanstack/react-router";
import { ListChecks, Trophy } from "lucide-react";

const items = [
  { label: "Quizzes", to: "/home", icon: ListChecks },
  { label: "Leaderboard", to: "/leaderboard", icon: Trophy },
] as const;

const Sidebar = () => (
  <nav
    aria-label="Primary"
    className="flex w-12 shrink-0 flex-col gap-1 border-r p-2 md:w-48"
  >
    {items.map(({ label, to, icon: Icon }) => (
      <Link
        key={to}
        // "/leaderboard" is not registered in the router yet; drop the cast once it is.
        to={to as "/home"}
        aria-label={label}
        className="flex items-center justify-center gap-2 rounded-md p-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:justify-start"
        activeProps={{
          className: "bg-muted font-medium text-foreground",
          "aria-current": "page",
        }}
      >
        <Icon className="size-4 shrink-0" />
        <span className="hidden md:inline">{label}</span>
      </Link>
    ))}
  </nav>
);

export default Sidebar;
