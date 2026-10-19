import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { QuizFormValues } from "@/helpers/quizSchema";

export default function QuizDetailsFields() {
  const {
    register,
    formState: { errors },
  } = useFormContext<QuizFormValues>();

  return (
    <section className="space-y-4" aria-labelledby="details-title">
      <h2 id="details-title" className="text-lg font-medium">
        Quiz details
      </h2>
      <div className="space-y-2">
        <Label htmlFor="quiz-title">Title</Label>
        <Input
          id="quiz-title"
          {...register("title")}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? "title-error" : undefined}
          className="h-10"
        />
        {errors.title && (
          <p id="title-error" role="alert" className="text-sm text-destructive">
            {errors.title.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="quiz-description">Description</Label>
        <Textarea
          id="quiz-description"
          {...register("description")}
          className="min-h-28"
        />
      </div>
    </section>
  );
}
