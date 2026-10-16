import { ScrollArea } from "@/components/ui/scroll-area";

const PageLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* header */}
      <header className="h-12 shrink-0 border"></header>
      {/* main content */}
      <ScrollArea className="min-h-0 flex-1">
        <main>{children}</main>
      </ScrollArea>
    </div>
  );
};

export default PageLayout;
