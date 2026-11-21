import type { ReactNode } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { AppShell } from "@/components/layout/AppShell";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate mode="protected">
      <AppShell>{children}</AppShell>
    </AuthGate>
  );
}
