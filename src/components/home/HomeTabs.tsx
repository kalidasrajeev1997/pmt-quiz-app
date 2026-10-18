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
      <TabsList>
        <TabsTrigger value="all" className="text-xs">
          All
        </TabsTrigger>
        <TabsTrigger value="not-started" className="text-xs">
          Not Started
        </TabsTrigger>
        <TabsTrigger value="in_progress" className="text-xs">
          In Progress
        </TabsTrigger>
        <TabsTrigger value="completed" className="text-xs">
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
