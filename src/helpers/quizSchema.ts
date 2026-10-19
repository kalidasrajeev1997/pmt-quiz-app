import { z } from "zod";

const optionSchema = z.object({
  id: z.string().min(1),
  text: z.string().trim().min(1, "Enter an option."),
});

const questionSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().trim().min(1, "Enter a question."),
    type: z.enum(["single", "multiple"]),
    options: z.array(optionSchema).min(2, "Add at least two options."),
    correctOptionIds: z
      .array(z.string())
      .min(1, "Mark at least one correct option."),
  })
  .superRefine((question, context) => {
    if (question.type === "single" && question.correctOptionIds.length > 1) {
      context.addIssue({
        code: "custom",
        path: ["correctOptionIds"],
        message: "Single-choice questions need exactly one correct option.",
      });
    }
    const optionIds = new Set(question.options.map((option) => option.id));
    if (optionIds.size !== question.options.length) {
      context.addIssue({
        code: "custom",
        path: ["options"],
        message: "Option IDs must be unique.",
      });
    }
    if (
      question.correctOptionIds.some((id) => !optionIds.has(id)) ||
      new Set(question.correctOptionIds).size !==
        question.correctOptionIds.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["correctOptionIds"],
        message: "Choose existing, distinct options.",
      });
    }
  });

const timerSchema = z
  .number({ error: "Enter a valid number of seconds." })
  .int("Use whole seconds.")
  .positive("Time must be greater than zero.")
  .max(86400, "Use 86,400 seconds or fewer.")
  .nullable();

export const quizSchema = z
  .object({
    title: z.string().trim().min(1, "Enter a quiz title."),
    description: z.string().trim(),
    countries: z
      .array(z.string().min(1))
      .min(1, "Assign at least one country."),
    timeLimitSeconds: timerSchema,
    perQuestionSeconds: timerSchema,
    retakesAllowed: z.boolean(),
    questions: z.array(questionSchema).min(1, "Add at least one question."),
  })
  .superRefine((quiz, context) => {
    if (
      new Set(quiz.questions.map((question) => question.id)).size !==
      quiz.questions.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["questions"],
        message: "Question IDs must be unique.",
      });
    }
  });

export type QuizFormValues = z.infer<typeof quizSchema>;

export function newQuestion(): QuizFormValues["questions"][number] {
  return {
    id: crypto.randomUUID(),
    text: "",
    type: "single",
    options: [
      { id: crypto.randomUUID(), text: "" },
      { id: crypto.randomUUID(), text: "" },
    ],
    correctOptionIds: [],
  };
}
