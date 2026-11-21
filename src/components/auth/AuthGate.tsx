"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/layout/Logo";
import { Spinner } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { APP_HOME, ROUTES } from "@/constants/routes";

export function LoadingScreen() {
  return (
    <div
      role="status"
      className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#FAFDF9]"
    >
      <Logo variant="mark" />
      <Spinner label="Loading ResQMeal" />
    </div>
  );
}

export function AuthGate({
  mode,
  children,
}: {
  mode: "protected" | "guest";
  children: ReactNode;
}) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated" && mode === "protected") {
      router.replace(ROUTES.login);
    } else if (status === "authenticated" && mode === "guest") {
      router.replace(APP_HOME);
    }
  }, [status, mode, router]);

  if (status === "loading") {
    return <LoadingScreen />;
  }

  if (mode === "protected" && status === "unauthenticated") {
    return <LoadingScreen />;
  }

  if (mode === "guest" && status === "authenticated") {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
