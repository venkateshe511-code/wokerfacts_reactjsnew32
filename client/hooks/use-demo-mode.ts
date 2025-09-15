/**
 * Global sample/demo mode flag.
 * Enabled when URL contains ?admin=raygagne@12!%&A and persisted in localStorage.
 */
export const useDemoMode = (): boolean => {
  if (typeof window !== "undefined") {
    try {
      const params = new URLSearchParams(window.location.search);
      const adminParam = params.get("admin");
      if (adminParam === "raygagne@12!%&A") {
        localStorage.setItem("sampleAccess", "1");
      }
    } catch {}
  }
  return (
    typeof window !== "undefined" &&
    localStorage.getItem("sampleAccess") === "1"
  );
};
