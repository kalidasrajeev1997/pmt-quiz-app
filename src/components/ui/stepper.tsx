import { Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperProps {
  steps: { label: string; icon: LucideIcon }[];
  currentStep: number;
}

function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <ol aria-label="Quiz progress" className="flex w-fit max-w-full">
      {steps.map(({ label, icon: Icon }, index) => (
        <li
          key={label}
          aria-current={index === currentStep ? "step" : undefined}
          className="relative w-80 min-w-0 sm:w-80"
        >
          {index < steps.length - 1 && (
            <div
              aria-hidden="true"
              className={cn(
                "absolute left-1/2 top-4 h-px w-full",
                index < currentStep ? "bg-primary" : "bg-[#00a5df80]",
              )}
            />
          )}
          <div
            className={cn(
              "relative flex flex-col items-center gap-2 px-2 text-center text-sm",
              index > currentStep ? "text-muted-foreground" : "text-foreground",
            )}
          >
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-full",
                index <= currentStep
                  ? "bg-primary text-white"
                  : "bg-accent text-[#0087c1]",
              )}
            >
              {index < currentStep ? (
                <Check className="size-4" aria-hidden="true" />
              ) : (
                <Icon className="size-4" aria-hidden="true" />
              )}
            </span>
            <span className="text-xs">{label}</span>
            {index < currentStep && <span className="sr-only">Completed</span>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export { Stepper };
