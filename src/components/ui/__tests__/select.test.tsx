import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "../select";

describe("Select component", () => {
  it("renders trigger and value", () => {
    const items = [
      { label: "Option 1", value: "opt1" },
      { label: "Option 2", value: "opt2" },
    ];

    render(
      <Select items={items} defaultValue="opt1">
        <SelectTrigger aria-label="Select an option">
          <SelectValue placeholder="Choose option" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Options</SelectLabel>
            <SelectItem value="opt1">Option 1</SelectItem>
            <SelectSeparator />
            <SelectItem value="opt2">Option 2</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>,
    );

    expect(screen.getByRole("combobox", { name: "Select an option" })).toBeInTheDocument();
  });

  it("opens options when clicked", async () => {
    const user = userEvent.setup();
    const items = [
      { label: "Option 1", value: "opt1" },
      { label: "Option 2", value: "opt2" },
    ];

    render(
      <Select items={items}>
        <SelectTrigger aria-label="Custom trigger" size="sm">
          <SelectValue placeholder="Choose option" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Options</SelectLabel>
            <SelectItem value="opt1">Option 1</SelectItem>
            <SelectSeparator />
            <SelectItem value="opt2">Option 2</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>,
    );

    const trigger = screen.getByRole("combobox", { name: "Custom trigger" });
    await user.click(trigger);

    expect(screen.getByText("Option 1")).toBeInTheDocument();
    expect(screen.getByText("Option 2")).toBeInTheDocument();
  });
});
