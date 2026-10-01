"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Both icons always render; CSS on the `dark` class that next-themes sets
  // on <html> decides which is visible. Server and client markup stay
  // identical, so there is no hydration mismatch and no mounted effect.
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Rangni o'zgartirish"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <Sun className="size-5 dark:hidden" />
      <Moon className="hidden size-5 dark:block" />
    </Button>
  );
}