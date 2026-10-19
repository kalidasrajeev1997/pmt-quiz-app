import type { ComponentProps, ReactNode } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import type { QuizFormValues } from "@/helpers/quizSchema";

interface QuestionFieldsProps {
  index: number;
  total: number;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
}

function SortableOption({
  id,
  label,
  disabled,
  children,
  error,
}: {
  id: string;
  label: string;
  disabled: boolean;
  children: ReactNode;
  error: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : undefined,
      }}
      className="relative space-y-1 rounded-md bg-muted motion-reduce:transition-none!"
    >
      <div className="flex min-w-0 items-center gap-2">
        <Button
          ref={setActivatorNodeRef}
          type="button"
          variant="ghost"
          size="icon"
          className="touch-none cursor-grab active:cursor-grabbing"
          title="Reorder option"
          disabled={disabled}
          {...attributes}
          {...listeners}
          aria-label={label}
        >
          <GripVertical />
        </Button>
        {children}
      </div>
      {error}
    </div>
  );
}

export default function QuestionFields({
  index,
  total,
  onMove,
  onRemove,
}: QuestionFieldsProps) {
  const {
    control,
    register,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useFormContext<QuizFormValues>();
  const prefix = `questions.${index}` as const;
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: `${prefix}.options`,
  });
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const type = useWatch({ control, name: `${prefix}.type` });
  const correctIds =
    useWatch({ control, name: `${prefix}.correctOptionIds` }) ?? [];
  const questionErrors = errors.questions?.[index];
  const answerError = questionErrors?.correctOptionIds?.message;
  const optionsError =
    questionErrors?.options?.root?.message ?? questionErrors?.options?.message;
  const OptionGroup = type === "single" ? RadioGroup : "div";
  const radioGroupProps: ComponentProps<typeof RadioGroup> = {
    name: `correct-${index}`,
    value: correctIds[0] ?? null,
    onValueChange: (value: string | null) => {
      if (value !== null) markCorrect(value, true);
    },
    onKeyDown: (event) => {
      if ((event.target as HTMLElement).getAttribute("role") !== "radio") {
        event.preventBaseUIHandler();
      }
    },
  };

  function reorderOptions({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id || isSubmitting) return;
    const from = fields.findIndex((field) => field.id === active.id);
    const to = fields.findIndex((field) => field.id === over.id);
    if (from !== -1 && to !== -1) move(from, to);
  }

  function markCorrect(optionId: string, checked: boolean) {
    const next =
      type === "single"
        ? checked
          ? [optionId]
          : []
        : checked
          ? [...correctIds, optionId]
          : correctIds.filter((id) => id !== optionId);
    setValue(`${prefix}.correctOptionIds`, next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  return (
    <fieldset className="min-w-0 space-y-5 rounded-lg bg-muted/60 p-4 md:p-5">
      <legend className="sr-only">Question {index + 1}</legend>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-medium">Question {index + 1}</h3>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Move question ${index + 1} up`}
            title="Move up"
            disabled={index === 0}
            onClick={() => onMove(index, index - 1)}
          >
            <ArrowUp />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Move question ${index + 1} down`}
            title="Move down"
            disabled={index === total - 1}
            onClick={() => onMove(index, index + 1)}
          >
            <ArrowDown />
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            aria-label={`Remove question ${index + 1}`}
            title="Remove question"
            onClick={onRemove}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`question-${index}`}>Question text</Label>
        <Textarea
          id={`question-${index}`}
          {...register(`${prefix}.text`)}
          aria-invalid={!!questionErrors?.text}
          aria-describedby={
            questionErrors?.text ? `question-${index}-error` : undefined
          }
          className="min-h-20 bg-background"
        />
        {questionErrors?.text && (
          <p
            id={`question-${index}-error`}
            role="alert"
            className="text-sm text-destructive"
          >
            {questionErrors.text.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`type-${index}`}>Answer type</Label>
        <Select
          value={type}
          items={[
            { value: "single", label: "Single choice" },
            { value: "multiple", label: "Multiple choice" },
          ]}
          onValueChange={(value) => {
            if (!value) return;
            setValue(`${prefix}.type`, value, {
              shouldDirty: true,
              shouldValidate: true,
            });
            if (value === "single" && correctIds.length > 1) {
              setValue(`${prefix}.correctOptionIds`, correctIds.slice(0, 1), {
                shouldDirty: true,
                shouldValidate: true,
              });
            }
          }}
        >
          <SelectTrigger
            id={`type-${index}`}
            className="w-full bg-background sm:w-52"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Answer type</SelectLabel>
              <SelectItem value="single">Single choice</SelectItem>
              <SelectItem value="multiple">Multiple choice</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-3">
        <p className="text-sm font-medium">Options</p>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={reorderOptions}
        >
          <SortableContext
            items={fields.map((field) => field.id)}
            strategy={verticalListSortingStrategy}
          >
            <OptionGroup
              {...(type === "single" ? radioGroupProps : { role: "group" })}
              aria-label={`Correct answers for question ${index + 1}`}
              aria-describedby={
                answerError ? `answers-${index}-error` : undefined
              }
              className="grid gap-3"
            >
              {fields.map((field, optionIndex) => {
                const optionId = getValues(
                  `${prefix}.options.${optionIndex}.id`,
                );
                const optionError =
                  questionErrors?.options?.[optionIndex]?.text;
                return (
                  <SortableOption
                    key={field.id}
                    id={field.id}
                    label={`Reorder option ${optionIndex + 1} for question ${index + 1}`}
                    disabled={isSubmitting}
                    error={
                      optionError && (
                        <p
                          id={`option-${index}-${optionIndex}-error`}
                          role="alert"
                          className="pl-7 text-sm text-destructive"
                        >
                          {optionError.message}
                        </p>
                      )
                    }
                  >
                    {type === "single" ? (
                      <RadioGroupItem
                        value={optionId}
                        aria-label={`Option ${optionIndex + 1} is correct`}
                      />
                    ) : (
                      <Checkbox
                        aria-label={`Option ${optionIndex + 1} is correct`}
                        checked={correctIds.includes(optionId)}
                        onCheckedChange={(checked) =>
                          markCorrect(optionId, checked)
                        }
                      />
                    )}
                    <Input
                      {...register(`${prefix}.options.${optionIndex}.text`)}
                      aria-label={`Option ${optionIndex + 1} for question ${index + 1}`}
                      aria-invalid={!!optionError}
                      aria-describedby={
                        optionError
                          ? `option-${index}-${optionIndex}-error`
                          : undefined
                      }
                      placeholder={`Option ${optionIndex + 1}`}
                      className="h-10 bg-background"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Remove option"
                      aria-label={`Remove option ${optionIndex + 1} from question ${index + 1}`}
                      onClick={() => {
                        setValue(
                          `${prefix}.correctOptionIds`,
                          correctIds.filter((id) => id !== optionId),
                          { shouldDirty: true, shouldValidate: true },
                        );
                        remove(optionIndex);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </SortableOption>
                );
              })}
            </OptionGroup>
          </SortableContext>
        </DndContext>
        {optionsError && (
          <p role="alert" className="text-sm text-destructive">
            {optionsError}
          </p>
        )}
        {answerError && (
          <p
            id={`answers-${index}-error`}
            role="alert"
            className="text-sm text-destructive"
          >
            {answerError}
          </p>
        )}
        <Button
          type="button"
          variant="secondary"
          className="h-10 bg-muted rounded-md px-3"
          onClick={() => append({ id: crypto.randomUUID(), text: "" })}
        >
          <Plus />
          Add option
        </Button>
      </div>
    </fieldset>
  );
}
