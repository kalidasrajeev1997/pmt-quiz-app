import { Controller, useFormContext } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { QuizFormValues } from "@/helpers/quizSchema";

export default function QuizTimingFields() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<QuizFormValues>();

  return (
    <section className="space-y-4" aria-labelledby="timing-title">
      <h2 id="timing-title" className="text-lg font-medium">
        Timing & retakes
      </h2>
      {(["timeLimitSeconds", "perQuestionSeconds"] as const).map((name) => (
        <div key={name} className="space-y-2">
          <Label htmlFor={name}>
            {name === "timeLimitSeconds"
              ? "Overall time limit (seconds)"
              : "Per-question limit (seconds)"}
          </Label>
          <Input
            id={name}
            type="number"
            min="1"
            max="86400"
            step="1"
            placeholder="No limit"
            {...register(name, {
              setValueAs: (value: string | number | null) =>
                value === "" || value === null ? null : Number(value),
            })}
            aria-invalid={!!errors[name]}
            aria-describedby={errors[name] ? `${name}-error` : undefined}
            className="h-10"
          />
          {errors[name] && (
            <p
              id={`${name}-error`}
              role="alert"
              className="text-sm text-destructive"
            >
              {errors[name].message}
            </p>
          )}
        </div>
      ))}
      <Controller
        control={control}
        name="retakesAllowed"
        render={({ field }) => (
          <div className="flex items-center gap-3 py-2">
            <Checkbox
              id="retakes"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
            <Label htmlFor="retakes">Allow retakes</Label>
          </div>
        )}
      />
    </section>
  );
}
