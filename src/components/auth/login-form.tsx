"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Loader2, LogIn, School } from "lucide-react";

import { loginAction, type LoginState } from "@/server/actions/auth-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";

const initialState: LoginState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Kirilmoqda...
        </>
      ) : (
        <>
          <LogIn className="size-4" />
          Kirish
        </>
      )}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <School className="size-6" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">
          Ta&apos;lim markazi
        </h1>
        <p className="text-sm text-muted-foreground">
          Boshqaruv tizimiga kirish uchun hisobingizga kiring
        </p>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg">Tizimga kirish</CardTitle>
          <CardDescription>
            Elektron pochta va parolingizni kiriting
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form action={formAction} className="space-y-4">
            {state.error ? (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{state.error}</span>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="email">Elektron pochta</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                placeholder="admin@markaz.uz"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Parol</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
              />
            </div>

            <SubmitButton />
          </form>
        </CardContent>
      </Card>

      <p className="max-w-xs text-center text-xs text-muted-foreground">
        Hisoblar faqat administrator tomonidan yaratiladi. O&apos;z-o&apos;zidan
        ro&apos;yxatdan o&apos;tish mavjud emas.
      </p>
    </main>
  );
}