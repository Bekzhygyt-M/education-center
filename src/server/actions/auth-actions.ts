import "server-only";

import { AuthError } from "next-auth";

import { signIn } from "@/server/auth/auth";
import { loginSchema } from "@/server/validation/auth";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Ma'lumotlar to'g'ri kiritilmagan" };
  }

  try {
    // Auth.js throws a redirect on success; it must be allowed to propagate.
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // Deliberately vague: do not reveal whether the email exists.
      return { error: "Elektron pochta yoki parol noto'g'ri" };
    }
    throw error;
  }

  return {};
}