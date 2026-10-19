import { ScrollArea } from "@/components/ui/scroll-area";
import { useSelection } from "@/hooks/useSelection";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import countryFlagMap from "@/helpers/countryFlagMap";
import Sidebar from "@/components/layouts/Sidebar";
import { usePageEdges } from "@/hooks/usePageEdges";
import { useLocation } from "@tanstack/react-router";
import { ModeToggle } from "@/components/ui/mode-toggle";

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Avatar aria-hidden="true" className="size-8 md:size-5">
      <AvatarFallback className="bg-primary text-xs font-semibold text-white! md:text-[10px]">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

const PageLayout = ({ children }: { children: React.ReactNode }) => {
  const pageRef = usePageEdges();
  const { pathname, href } = useLocation();
  const isQuizScreen = pathname.startsWith("/quiz/");
  const {
    users,
    countries,
    selectedUser,
    selectedCountry,
    selectUser,
    selectCountry,
    isLoading,
    error,
  } = useSelection();

  return (
    <div
      ref={pageRef}
      className="page-layout flex h-dvh flex-col overflow-hidden"
    >
      {/* header */}
      <header className="shrink-0 border-b-0 md:border-b">
        <div className="flex min-h-13 items-center justify-between gap-2 px-3 py-2 md:p-2">
          <div className="flex items-center">
            <div className="bg-primary rounded p-1">
              <Blocks className="size-5 text-white md:size-6" />
            </div>
            <span className="ml-2 font-semibold text-foreground max-md:sr-only">
              Quizly
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <Select
              items={countries.map((country) => ({
                label: country.name,
                value: country.code,
              }))}
              value={selectedCountry?.code ?? null}
              onValueChange={(value) => {
                if (value !== null) selectCountry(value);
              }}
              disabled={isLoading || countries.length === 0 || !!error}
            >
              <SelectTrigger
                aria-label="Selected country"
                hideChevron="mobile"
                className="size-8 shrink-0 rounded-full border-0 p-0 shadow-none hover:ring-2 hover:ring-primary/20 md:h-8 md:w-22 md:rounded-lg md:border md:border-input md:px-2.5 md:py-2 md:shadow-xs md:hover:ring-0"
              >
                <SelectValue
                  className="size-8 items-center justify-center text-xs md:size-auto md:min-w-0 md:justify-start"
                  placeholder={
                    isLoading ? "Loading countries..." : "No countries"
                  }
                >
                  {selectedCountry && (
                    <>
                      <img
                        src={
                          countryFlagMap[
                            selectedCountry.code as "IN" | "GB" | "AE"
                          ]
                        }
                        alt={`${selectedCountry.name} flag`}
                        className="size-8 rounded-full border border-border/40 object-cover shadow-xs md:mr-1 md:h-4 md:w-4 md:rounded-none md:border-0 md:shadow-none md:object-contain"
                      />
                      <span className="truncate max-md:sr-only">
                        {selectedCountry.code}
                      </span>
                    </>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="end" className="min-w-28">
                <SelectGroup>
                  <SelectLabel>Countries</SelectLabel>
                  {countries.map((country) => (
                    <SelectItem
                      key={country.code}
                      value={country.code}
                      className="cursor-pointer py-1.5 text-xs"
                    >
                      <img
                        src={countryFlagMap[country.code as "IN" | "GB" | "AE"]}
                        alt=""
                        className="mr-1 h-4 w-4 shrink-0 rounded-xs"
                      />
                      {country.code}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select
              items={users.map((user) => ({
                label: user.name,
                value: user.id,
              }))}
              value={selectedUser?.id ?? null}
              onValueChange={(value) => {
                if (value !== null) selectUser(value);
              }}
              disabled={isLoading || users.length === 0 || !!error}
            >
              <SelectTrigger
                aria-label="Selected user"
                hideChevron="mobile"
                className="size-8 shrink-0 rounded-full border-0 p-0 shadow-none hover:ring-2 hover:ring-primary/20 md:h-8 md:w-46 md:rounded-lg md:border md:border-input md:px-2.5 md:py-2 md:shadow-xs md:hover:ring-0"
              >
                <SelectValue
                  placeholder={isLoading ? "Loading users..." : "No users"}
                  className="size-8 items-center justify-center text-xs md:size-auto md:min-w-0 md:justify-start"
                >
                  {selectedUser && (
                    <>
                      <UserAvatar name={selectedUser.name} />
                      <span className="truncate max-md:sr-only">
                        {selectedUser.name}
                      </span>
                    </>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="end" className="min-w-44">
                <SelectGroup>
                  <SelectLabel>Users</SelectLabel>
                  {users.map((user) => (
                    <SelectItem
                      key={user.id}
                      value={user.id}
                      className="flex cursor-pointer items-center gap-2 py-1.5 text-xs"
                    >
                      <UserAvatar name={user.name} />
                      <span className="truncate pt-2 text-xs font-medium md:pt-0.5">
                        {user.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        {error && (
          <p role="alert" className="px-3 pb-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </header>
      {/* main content */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <Sidebar />
        {isQuizScreen ? (
          <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
            {children}
          </main>
        ) : (
          <ScrollArea resetKey={href} className="min-h-0 min-w-0 flex-1">
            <main className="h-full min-h-full min-w-0">{children}</main>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default PageLayout;
