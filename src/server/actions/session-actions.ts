"use server";

import { signOut } from "@/server/auth/auth";

/**
 * Signs the current user out and returns them to the login page.
 * Bound to a form action, so it needs no client-side JavaScript.
 */
export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}