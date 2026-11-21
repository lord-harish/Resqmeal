"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/auth/AuthGate";
import { useAuth } from "@/hooks/useAuth";
import { APP_HOME, ROUTES } from "@/constants/routes";

export default function RootPage() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status !== "loading") {
      router.replace(status === "authenticated" ? APP_HOME : ROUTES.login);
    }
  }, [status, router]);

  return <LoadingScreen />;
}
