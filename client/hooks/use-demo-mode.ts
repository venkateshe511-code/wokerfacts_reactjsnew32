import { useAuth } from "@/hooks/use-auth";

/**
 * Returns true only for the designated sample/demo account.
 */
import { useAuth } from "./use-auth";

export const useDemoMode = (): boolean => {
  const { user } = useAuth();
  const email = user?.email?.toLowerCase() || "";
  const sampleFlag =
    typeof window !== "undefined" && localStorage.getItem("sampleAccess") === "1";
  return email === "workerfacts@gmail.com" && sampleFlag;
};
