import type { ReactNode } from "react";
import { Logo } from "@/components/layout/Logo";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <aside className="relative hidden overflow-hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:bg-[#12372A] lg:p-12 lg:text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#16A34A] opacity-20"
        />
        <div className="relative">
          <Logo variant="light" />
        </div>
        <div className="relative flex flex-col gap-4">
          <h2 className="text-4xl font-bold">Rescue Food. Reduce Waste.</h2>
          <p className="max-w-md text-lg text-white/80">
            Connect with surplus food near you before it becomes waste.
          </p>
        </div>
      </aside>

      <div className="flex flex-1 flex-col bg-[#FAFDF9]">
        <header className="flex justify-center px-4 pt-8 lg:hidden">
          <Logo variant="full" />
        </header>
        <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  );
}
