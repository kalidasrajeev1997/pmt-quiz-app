import type { Ref } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { PublicQuestion } from "@/types/quiz";

interface QuestionOptionsProps {
  question: PublicQuestion;
  selectedOptionIds: string[];
  invalid: boolean;
  inputRef: Ref<HTMLButtonElement>;
  onChange: (selectedOptionIds: string[]) => void;
  onBlur: () => void;
}

function optionClassName(selected: boolean) {
  const base =
    "flex min-h-14 cursor-pointer items-center gap-4 rounded-lg px-4 py-3 text-base leading-relaxed wrap-anywhere transition-colors motion-reduce:transition-none";
  const state = selected
    ? "bg-accent text-foreground border-2 border-b-6 border-primary"
    : "bg-muted text-foreground hover:bg-secondary border-2 border-b-6";

  return `${base} ${state}`;
}

export default function QuestionOptions({
  question,
  selectedOptionIds,
  invalid,
  inputRef,
  onChange,
  onBlur,
}: QuestionOptionsProps) {
  const descriptionId = invalid ? "answer-kind answer-error" : "answer-kind";

  if (question.type === "single") {
    return (
      <RadioGroup
        value={selectedOptionIds[0] ?? ""}
        onValueChange={(value) => onChange([String(value)])}
        onBlur={onBlur}
        aria-labelledby="question-prompt"
        aria-describedby={descriptionId}
        aria-invalid={invalid}
        className="grid-cols-1 gap-3 sm:grid-cols-2"
      >
        {question.options.map((option, index) => (
          <label
            key={option.id}
            className={optionClassName(selectedOptionIds.includes(option.id))}
          >
            <RadioGroupItem
              ref={index === 0 ? inputRef : undefined}
              value={option.id}
              className="size-5 border-muted-foreground"
            />
            <span className="min-w-0">{option.text}</span>
          </label>
        ))}
      </RadioGroup>
    );
  }

  function toggleOption(optionId: string, checked: boolean) {
    const nextSelection = checked
      ? [...selectedOptionIds, optionId]
      : selectedOptionIds.filter((selectedId) => selectedId !== optionId);

    onChange(nextSelection);
  }

  return (
    <div
      role="group"
      aria-labelledby="question-prompt"
      aria-describedby={descriptionId}
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
    >
      {question.options.map((option, index) => (
        <label
          key={option.id}
          className={optionClassName(selectedOptionIds.includes(option.id))}
        >
          <Checkbox
            ref={index === 0 ? inputRef : undefined}
            checked={selectedOptionIds.includes(option.id)}
            onCheckedChange={(checked) => toggleOption(option.id, checked)}
            onBlur={onBlur}
            aria-invalid={invalid}
            className="size-5 border-muted-foreground"
          />
          <span className="min-w-0">{option.text}</span>
        </label>
      ))}
    </div>
  );
}
