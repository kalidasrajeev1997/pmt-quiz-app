import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../tabs";

describe("Tabs UI primitive", () => {
  it("renders tabs and switches panels", async () => {
    const user = userEvent.setup();

    render(
      <Tabs defaultValue="tab1">
        <TabsList variant="line">
          <TabsTrigger value="tab1">First</TabsTrigger>
          <TabsTrigger value="tab2">Second</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">First Content</TabsContent>
        <TabsContent value="tab2">Second Content</TabsContent>
      </Tabs>,
    );

    expect(screen.getByRole("tab", { name: "First" })).toBeInTheDocument();
    expect(screen.getByText("First Content")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Second" }));
    expect(screen.getByText("Second Content")).toBeInTheDocument();
  });
});
