import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "@/components/providers/AuthProvider";

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
