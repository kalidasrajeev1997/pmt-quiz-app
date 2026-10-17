import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Blocks } from "lucide-react";

const items = [
  { label: "Select a fruit", value: null },
  { label: "Apple", value: "apple" },
  { label: "Banana", value: "banana" },
  { label: "Blueberry", value: "blueberry" },
  { label: "Grapes", value: "grapes" },
  { label: "Pineapple", value: "pineapple" },
];

const PageLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* header */}
      <header className="h-12 shrink-0 border">
        <div className="flex items-center justify-between h-full px-2">
          <div className="flex items-center">
            <div className="bg-primary rounded p-1">
              <Blocks className="text-white" />
            </div>
            <span className="text-black ml-2 font-semibold">Quizly</span>
          </div>
          <div>
            <Select items={items}>
              <SelectTrigger className="w-full max-w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Fruits</SelectLabel>
                  {items.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>
      {/* main content */}
      <ScrollArea className="min-h-0 flex-1">
        <main>{children}</main>
      </ScrollArea>
    </div>
  );
};

export default PageLayout;
