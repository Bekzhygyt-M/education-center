"use client";

import { LogOut, User } from "lucide-react";

import { logoutAction } from "@/server/actions/session-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrator",
  TEACHER: "O'qituvchi",
};

export function UserMenu({
  name,
  email,
  role,
}: {
  name: string;
  email: string;
  role: string;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="Foydalanuvchi menyusi" />
        }
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {initials || <User className="size-4" />}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-1">
            <span className="truncate text-sm font-medium">{name}</span>
            <span className="truncate text-xs font-normal text-muted-foreground">
              {email}
            </span>
            <Badge variant="secondary" className="mt-1 w-fit text-xs">
              {ROLE_LABEL[role] ?? role}
            </Badge>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          render={
            <form action={logoutAction}>
              <button type="submit" className="flex w-full items-center gap-2">
                <LogOut className="size-4" />
                Chiqish
              </button>
            </form>
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}