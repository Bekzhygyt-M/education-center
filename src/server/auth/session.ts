import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { auth, handlers, signIn, signOut } from "@/server/auth/auth";
import { prisma } from "@/server/db/prisma";
import type { Role } from "@/generated/prisma/enums";

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  /** Present only for teachers; null for admins. */
  teacherId: string | null;
};

export { auth, handlers, signIn, signOut };

/**
 * Returns the signed-in user, or null.
 * `cache` dedupes the session read within a single render pass.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();

  if (!session?.user?.id) return null;

  // Read the role and teacherId from the database rather than trusting the
  // session token, so a role change or deactivation takes effect immediately.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      teacher: { select: { id: true } },
    },
  });

  if (!user || !user.isActive) return null;

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    teacherId: user.teacher?.id ?? null,
  };
});

/** Requires a signed-in user; redirects to the login page otherwise. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Requires a signed-in admin; redirects otherwise. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}

/** Requires a signed-in teacher; redirects otherwise. */
export async function requireTeacher(): Promise<SessionUser & { teacherId: string }> {
  const user = await requireUser();
  if (user.role !== "TEACHER" || !user.teacherId) redirect("/dashboard");
  return user as SessionUser & { teacherId: string };
}

/**
 * Authorisation for teacher-scoped data. An admin may act on any resource;
 * a teacher may act only on records they own or that belong to one of their
 * groups. Call this in EVERY server action and query that touches scoped data —
 * hiding a button in the UI is not an authorisation check.
 */
export function canManageTeacherResource(
  user: SessionUser,
  resource: { teacherId?: string | null; groupTeacherId?: string | null },
): boolean {
  if (user.role === "ADMIN") return true;
  if (user.role !== "TEACHER") return false;

  const ownTeacherId = resource.teacherId ?? resource.groupTeacherId;
  return Boolean(user.teacherId && ownTeacherId === user.teacherId);
}