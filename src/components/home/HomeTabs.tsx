import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ReactNode } from "react";
import type { TabStatus } from "@/types/quiz";
import TAB_VALUES from "@/helpers/tabs";

interface HomeTabsProps {
  tab: TabStatus;
  setTab: (tab: TabStatus) => void;
  children: ReactNode;
}

const HomeTabs = ({ tab, setTab, children }: HomeTabsProps) => {
  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <TabsList className="inline-flex w-full max-w-full justify-start overflow-x-auto p-1 sm:w-fit sm:justify-center">
        <TabsTrigger value="all" className="flex-1 shrink-0 px-2.5 text-xs sm:flex-initial">
          All
        </TabsTrigger>
        <TabsTrigger value="not-started" className="flex-1 shrink-0 px-2.5 text-xs sm:flex-initial">
          Not Started
        </TabsTrigger>
        <TabsTrigger value="in_progress" className="flex-1 shrink-0 px-2.5 text-xs sm:flex-initial">
          In Progress
        </TabsTrigger>
        <TabsTrigger value="completed" className="flex-1 shrink-0 px-2.5 text-xs sm:flex-initial">
          Completed
        </TabsTrigger>
      </TabsList>
      {TAB_VALUES.map((value) => (
        <TabsContent key={value} value={value}>
          {tab === value && children}
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default HomeTabs;
