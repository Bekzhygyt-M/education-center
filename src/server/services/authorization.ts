import type { SessionUser } from "@/server/auth/session";

export function canAccessTeacherId(user: SessionUser, teacherId: string): boolean {
  return user.role === "ADMIN" || (user.role === "TEACHER" && user.teacherId === teacherId);
}

export function canAccessGroup(user: SessionUser, group: { teacherId: string }): boolean {
  return canAccessTeacherId(user, group.teacherId);
}
