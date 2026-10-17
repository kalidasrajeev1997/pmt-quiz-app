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

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Avatar aria-hidden="true" className="size-5">
      <AvatarFallback className="bg-primary text-[10px] font-semibold text-white!">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

const PageLayout = ({ children }: { children: React.ReactNode }) => {
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
    <div className="flex h-screen flex-col overflow-hidden">
      {/* header */}
      <header className="shrink-0 border-b">
        <div className="flex min-h-13 flex-wrap items-center justify-between gap-2 p-2">
          <div className="flex items-center">
            <div className="bg-primary rounded p-1">
              <Blocks className="text-white" />
            </div>
            <span className="text-black ml-2 font-semibold">Quizly</span>
          </div>
          <div className="flex w-full min-w-0 gap-2 sm:w-auto">
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
                className="w-46 min-w-0 shrink-0"
              >
                <SelectValue
                  placeholder={isLoading ? "Loading users..." : "No users"}
                  className="text-xs"
                >
                  {selectedUser && (
                    <>
                      <UserAvatar name={selectedUser.name} />
                      <span className="truncate">{selectedUser.name}</span>
                    </>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Users</SelectLabel>
                  {users.map((user) => (
                    <SelectItem
                      key={user.id}
                      value={user.id}
                      className="text-xs flex items-center gap-2 "
                    >
                      <UserAvatar name={user.name} />
                      <span className="truncate pt-0.5 text-xs">
                        {user.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
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
                className="w-22 shrink-0"
              >
                <SelectValue
                  className="min-w-0 text-xs"
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
                        className="w-4 h-4 mr-1"
                      />
                      <span className="truncate">{selectedCountry.code}</span>
                    </>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Countries</SelectLabel>
                  {countries.map((country) => (
                    <SelectItem
                      key={country.code}
                      value={country.code}
                      className="text-xs"
                    >
                      <img
                        src={countryFlagMap[country.code as "IN" | "GB" | "AE"]}
                        alt={`${country.name} flag`}
                        className="w-4 h-4 mr-1"
                      />
                      {country.code}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        {error && (
          <p role="alert" className="px-2 pb-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </header>
      {/* main content */}
      <ScrollArea className="min-h-0 flex-1">
        <main>{children}</main>
      </ScrollArea>
    </div>
  );
};

export default PageLayout;
