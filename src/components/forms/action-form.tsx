"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type State = { error?: string; success?: string };
export function ActionForm({ action, children, submit = "Saqlash" }: { action: (state: State, formData: FormData) => Promise<State>; children: React.ReactNode; submit?: string }) {
  const [state, formAction, pending] = useActionState(action, {});
  return <form action={formAction} className="space-y-3 rounded-lg border bg-card p-4">
    {children}
    {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
    {state.success && <p role="status" className="text-sm text-green-700 dark:text-green-400">{state.success}</p>}
    <Button type="submit" disabled={pending}>{pending && <Loader2 className="size-4 animate-spin" />}{submit}</Button>
  </form>;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-1 text-sm"><span className="font-medium">{label}</span>{children}</label>; }
export const inputClass = "h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm";
