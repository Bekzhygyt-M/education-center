import {
  CalendarDays,
  ClipboardList,
  GraduationCap,
  Users,
  UsersRound,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/server/auth/session";
import { getDashboardData } from "@/server/queries/dashboard";
import { ATTENDANCE_STATUS_LABELS, LESSON_STATUS_LABELS } from "@/server/constants";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PRESENT: "default",
  LATE: "secondary",
  ABSENT: "destructive",
  EXCUSED: "outline",
};

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData(user);

  const stats = [
    { title: "O'quvchilar", icon: GraduationCap, value: data.students },
    { title: "O'qituvchilar", icon: UsersRound, value: data.teachers },
    { title: "Guruhlar", icon: Users, value: data.groups },
    { title: "Bugungi darslar", icon: CalendarDays, value: data.lessonsToday },
  ];

  const attendance = [
    { key: "PRESENT", value: data.todayAttendance.present },
    { key: "LATE", value: data.todayAttendance.late },
    { key: "ABSENT", value: data.todayAttendance.absent },
    { key: "EXCUSED", value: data.todayAttendance.excused },
    { key: "UNMARKED", value: data.todayAttendance.unmarked },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Boshqaruv paneli</h2>
        <p className="text-sm text-muted-foreground">
          Xush kelibsiz, {user.fullName}. Bugungi holat quyida.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="size-4" />
              Bugungi davomat
            </CardTitle>
            <CardDescription>Bugungi darslar bo&apos;yicha</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {attendance.map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-3">
                <span className="text-sm">
                  {item.key === "UNMARKED"
                    ? "Belgilanmagan"
                    : ATTENDANCE_STATUS_LABELS[item.key]}
                </span>
                <Badge
                  variant={item.key === "UNMARKED" ? "outline" : STATUS_VARIANT[item.key]}
                  className="tabular-nums"
                >
                  {item.value}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="size-4" />
              Bugungi darslar
            </CardTitle>
            <CardDescription>
              {user.role === "TEACHER" ? "Sizga biriktirilgan guruhlar" : "Markaz bo'ylab"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.upcomingLessons.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Bugun uchun dars rejalashtirilmagan.
              </p>
            ) : (
              <ul className="space-y-3">
                {data.upcomingLessons.map((lesson) => (
                  <li
                    key={lesson.id}
                    className="flex items-start justify-between gap-3 border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{lesson.groupName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {lesson.teacherName}
                        {lesson.topic ? ` · ${lesson.topic}` : ""}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {LESSON_STATUS_LABELS[lesson.status] ?? lesson.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}