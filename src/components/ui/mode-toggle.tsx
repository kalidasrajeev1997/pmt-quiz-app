import { Moon, Sun } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

export function ModeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Toggle
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      pressed={isDark}
      onPressedChange={() => toggleTheme()}
      variant="outline"
      size="sm"
      className={cn(
        "size-8 shrink-0 rounded-full border-0 p-0 shadow-none hover:ring-2 hover:ring-primary/20 md:h-8 md:w-8 md:rounded-lg md:border md:border-input md:p-0 md:shadow-xs md:hover:ring-0",
        className,
      )}
    >
      {isDark ? (
        <Moon className="size-4 shrink-0 transition-transform text-foreground" />
      ) : (
        <Sun className="size-4 shrink-0 transition-transform text-foreground" />
      )}
    </Toggle>
  );
}
