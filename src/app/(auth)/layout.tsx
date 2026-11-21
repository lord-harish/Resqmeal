import type { ReactNode } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { AuthShell } from "@/components/auth/AuthShell";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate mode="guest">
      <AuthShell>{children}</AuthShell>
    </AuthGate>
  );
}
