import { useCallback, useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ApiError, apiGet } from "@/lib/api";

interface AuthenticatedUser {
  user_id: number;
  email: string;
}

type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "error";

export default function ProtectedRoute() {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const location = useLocation();

  const checkSession = useCallback(async () => {
    setStatus("loading");

    try {
      await apiGet<AuthenticatedUser>("/api/auth/me");
      setStatus("authenticated");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setStatus("unauthenticated");
        return;
      }

      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  if (status === "loading") {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-[#080b11] text-slate-300"
        role="status"
        aria-live="polite"
      >
        Checking your session...
      </main>
    );
  }

  if (status === "unauthenticated") {
    return (
      <Navigate
        to="/signin"
        replace
        state={{ from: location }}
      />
    );
  }

  if (status === "error") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#080b11] px-6 text-center text-slate-300">
        <p>Unable to verify your session. Check your connection and try again.</p>

        <button
          type="button"
          onClick={() => void checkSession()}
          className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-300/15"
        >
          Try again
        </button>
      </main>
    );
  }

  return <Outlet />;
}
