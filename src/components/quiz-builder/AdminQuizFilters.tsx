import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from "@/components/ui/select";

const sortOptions = [
  { value: "title-asc", label: "Title: A to Z" },
  { value: "title-desc", label: "Title: Z to A" },
  { value: "questions-desc", label: "Most questions" },
  { value: "questions-asc", label: "Fewest questions" },
];

interface AdminQuizFiltersProps {
  search: string;
  sort: string;
  onSearchChange: (search: string) => void;
  onSortChange: (sort: string) => void;
}

export default function AdminQuizFilters({
  search,
  sort,
  onSearchChange,
  onSortChange,
}: AdminQuizFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative w-full sm:w-70 sm:flex-none">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground"
        />
        <Input
          aria-label="Search quizzes"
          type="search"
          placeholder="Search quizzes or countries"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-10 pl-9"
        />
      </div>
      <Select
        value={sort}
        items={sortOptions}
        onValueChange={(value) => {
          if (value) onSortChange(value);
        }}
      >
        <SelectTrigger
          aria-label="Sort quizzes"
          className="w-full data-[size=default]:h-10 sm:w-48"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectGroup>
            <SelectLabel>Sort by</SelectLabel>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
