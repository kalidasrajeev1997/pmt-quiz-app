import { useEffect, type ReactNode } from "react";
import { useLocation, useRouter } from "@tanstack/react-router";
import { useSelection } from "@/hooks/useSelection";

export default function RoleBoundary({ children }: { children: ReactNode }) {
  const { selectedUser, isLoading, error } = useSelection();
  const router = useRouter();
  const { pathname } = useLocation();
  const userId = selectedUser?.id;

  useEffect(() => {
    if (!isLoading && userId) void router.invalidate();
  }, [router, userId, isLoading]);

  if (isLoading)
    return (
      <p role="status" className="p-6">
        Loading your workspace...
      </p>
    );
  if (error)
    return (
      <p role="alert" className="p-6 text-destructive">
        {error}
      </p>
    );
  if (!selectedUser)
    return (
      <p role="alert" className="p-6">
        No user is available for this country.
      </p>
    );
  const adminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const quizPath = pathname === "/home" || pathname.startsWith("/quiz/");
  if (
    (adminPath && selectedUser.role !== "admin") ||
    (quizPath && selectedUser.role === "admin")
  ) {
    return (
      <p role="status" className="p-6">
        Opening your workspace...
      </p>
    );
  }
  return children;
}
