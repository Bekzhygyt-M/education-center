import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/server/auth/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side gate: every page in this route group needs a session.
  // The UI simply never renders without one; the real protection is this check.
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  return <AppShell user={user}>{children}</AppShell>;
}