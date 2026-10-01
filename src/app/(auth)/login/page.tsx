import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/server/auth/session";

export const metadata = {
  title: "Kirish — Ta'lim markazi",
  description: "Ta'lim markazi boshqaruv tizimiga kirish",
};

export default async function LoginPage() {
  // Already signed in? Skip the form.
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return <LoginForm />;
}