import { redirect } from "@tanstack/react-router";
import { getAllRecords } from "@/services/db/database";
import { getCountry, getUser } from "@/services/filters.service";
import type { User } from "@/types/quiz";

export async function getActiveUser(): Promise<User | null> {
  const [countries, users] = await Promise.all([
    getAllRecords("countries"),
    getAllRecords("users"),
  ]);
  const storedCountry = getCountry();
  const country =
    countries.find((entry) => entry.code === storedCountry) ?? countries[0];
  const availableUsers = users.filter((user) => user.country === country?.code);
  return (
    availableUsers.find((user) => user.id === getUser()) ??
    availableUsers[0] ??
    null
  );
}

export async function requireRole(role: User["role"]): Promise<void> {
  const user = await getActiveUser();
  if (user?.role === role) return;
  if (user?.role === "admin") throw redirect({ to: "/admin" });
  throw redirect({ to: "/home", search: { status: "all", page: 1 } });
}
