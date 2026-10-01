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
import { Skeleton } from "@/components/ui/skeleton";

const stats = [
  { title: "O'quvchilar", icon: GraduationCap, value: "—" },
  { title: "O'qituvchilar", icon: UsersRound, value: "—" },
  { title: "Guruhlar", icon: Users, value: "—" },
  { title: "Bugungi darslar", icon: CalendarDays, value: "—" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Boshqaruv paneli</h2>
        <p className="text-sm text-muted-foreground">
          Ta&apos;lim markazining umumiy holati.
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
              <Skeleton className="h-8 w-16" />
              <p className="mt-2 text-xs text-muted-foreground">
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="size-4" />
            Bugungi davomat
          </CardTitle>
          <CardDescription>
            Davomat statistikasi 1-bosqichda ma&apos;lumotlar bazasidan
            o&apos;qiladi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}