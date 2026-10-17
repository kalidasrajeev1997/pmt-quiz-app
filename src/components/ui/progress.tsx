import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import { cn } from "cn";

type ProgressSegment = { value: number; className: string };

function Progress({
  className,
  children,
  value,
  variant = "linear",
  segments,
  ...props
}: ProgressPrimitive.Root.Props & {
  variant?: "linear" | "circular";
  segments?: ProgressSegment[];
}) {
  const percentage = Math.max(0, Math.min(100, value ?? 0));
  const circularSegments = segments?.reduce<
    (ProgressSegment & { offset: number })[]
  >((result, segment) => {
    const previousSegment = result.at(-1);
    const offset = previousSegment
      ? previousSegment.offset + previousSegment.value
      : 0;
    const length = Math.max(0, Math.min(100 - offset, segment.value));
    return length > 0
      ? [...result, { ...segment, value: length, offset }]
      : result;
  }, []);

  return (
    <ProgressPrimitive.Root
      value={value}
      data-slot="progress"
      className={cn(
        variant === "circular"
          ? "relative grid size-20 shrink-0 place-items-center"
          : "flex flex-wrap gap-3",
        className,
      )}
      {...props}
    >
      {variant === "circular" && (
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 size-full -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx="50"
            cy="50"
            r="43"
            fill="none"
            strokeWidth="7"
            className="stroke-border"
          />
          {circularSegments ? (
            circularSegments.map((segment) => (
              <circle
                key={segment.offset}
                cx="50"
                cy="50"
                r="43"
                fill="none"
                strokeWidth="7"
                pathLength="100"
                strokeDasharray={`${segment.value} ${100 - segment.value}`}
                strokeDashoffset={-segment.offset}
                className={segment.className}
              />
            ))
          ) : (
            <circle
              cx="50"
              cy="50"
              r="43"
              fill="none"
              strokeWidth="7"
              strokeLinecap="round"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={100 - percentage}
              className="stroke-current transition-[stroke-dashoffset] duration-500 motion-reduce:transition-none"
            />
          )}
        </svg>
      )}
      {children}
      {variant === "linear" && (
        <ProgressTrack>
          <ProgressIndicator />
        </ProgressTrack>
      )}
    </ProgressPrimitive.Root>
  );
}

function ProgressTrack({ className, ...props }: ProgressPrimitive.Track.Props) {
  return (
    <ProgressPrimitive.Track
      className={cn(
        "relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-muted",
        className,
      )}
      data-slot="progress-track"
      {...props}
    />
  );
}

function ProgressIndicator({
  className,
  ...props
}: ProgressPrimitive.Indicator.Props) {
  return (
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      className={cn(
        "h-full bg-primary transition-transform motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}

function ProgressLabel({ className, ...props }: ProgressPrimitive.Label.Props) {
  return (
    <ProgressPrimitive.Label
      className={cn("text-sm font-medium", className)}
      data-slot="progress-label"
      {...props}
    />
  );
}

function ProgressValue({ className, ...props }: ProgressPrimitive.Value.Props) {
  return (
    <ProgressPrimitive.Value
      className={cn(
        "ml-auto text-sm text-muted-foreground tabular-nums",
        className,
      )}
      data-slot="progress-value"
      {...props}
    />
  );
}

export {
  Progress,
  ProgressTrack,
  ProgressIndicator,
  ProgressLabel,
  ProgressValue,
};
