"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { School } from "lucide-react";

import { cn } from "@/lib/utils";
import { APP_NAME, APP_SUBTITLE, navigation } from "./navigation";

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3">
      {navigation.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 px-6 py-4">
      <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <School className="size-4" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-semibold">{APP_NAME}</span>
        <span className="text-xs text-muted-foreground">{APP_SUBTITLE}</span>
      </span>
    </Link>
  );
}