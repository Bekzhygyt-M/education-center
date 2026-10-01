import {
  CalendarDays,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Users,
  UsersRound,
} from "lucide-react";

/**
 * Nav is plain data with no "use client" directive, so both the server
 * AppShell and the client SidebarNav can import it. Keeping it here avoids
 * crossing the RSC/client boundary just to read a constant.
 */
export const navigation = [
  { href: "/dashboard", label: "Boshqaruv paneli", icon: LayoutDashboard },
  { href: "/teachers", label: "O'qituvchilar", icon: UsersRound },
  { href: "/students", label: "O'quvchilar", icon: GraduationCap },
  { href: "/groups", label: "Guruhlar", icon: Users },
  { href: "/schedule", label: "Dars jadvali", icon: CalendarDays },
  { href: "/attendance", label: "Davomat", icon: ClipboardList },
] as const;

export const APP_NAME = "Ta'lim markazi";
export const APP_SUBTITLE = "Boshqaruv tizimi";