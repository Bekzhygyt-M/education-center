import type { ReactNode } from "react";

import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { APP_NAME } from "@/components/layout/navigation";
import { Brand, SidebarNav } from "@/components/layout/sidebar-nav";
import { UserMenu } from "@/components/layout/user-menu";
import type { SessionUser } from "@/server/auth/session";

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full w-full flex-col md:flex-row">
      {/* Sidebar: persistent on desktop, stacked above content on mobile */}
      <aside className="flex shrink-0 flex-col border-b bg-sidebar md:h-screen md:w-64 md:border-b-0 md:border-r">
        <Brand />
        <Separator />
        <div className="py-3">
          <SidebarNav />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b px-4 py-3 md:px-6">
          <h1 className="truncate text-sm font-medium text-muted-foreground md:text-base">
            {APP_NAME}
          </h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserMenu name={user.fullName} email={user.email} role={user.role} />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}