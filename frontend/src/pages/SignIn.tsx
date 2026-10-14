import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { apiPost, ApiError } from "../lib/api";

interface AuthResponse {
  user_id: number;
  email: string;
}

function Brand() {
  return (
    <Link to="/" className="inline-flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-lg border border-emerald-400/25 bg-emerald-400/10 text-emerald-300">
        <ShieldCheck size={21} strokeWidth={1.8} />
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-white">
        Agentic<span className="text-emerald-300">Enclave</span>
      </span>
    </Link>
  );
}

export default function SignIn() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      await apiPost<AuthResponse>("/api/auth/login", {
        email: email.trim(),
        password,
      });

      navigate("/lab/sec-01", { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          setMessage("Invalid email or password.");
        } else if (error.status === 403) {
          setMessage(
            "The request was rejected. Check the application origin configuration.",
          );
        } else if (error.status === 422) {
          setMessage("Please check your email and password.");
        } else {
          setMessage(error.message);
        }
      } else {
        setMessage("Unable to sign in. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#080b11] text-slate-200 selection:bg-emerald-300/20 selection:text-emerald-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_15%,rgba(16,185,129,0.09),transparent_45%)]" />

      <header className="relative z-10 border-b border-white/[0.07]">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8"
        >
          <Brand />

          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={15} />
            Back to home
          </Link>
        </nav>
      </header>

      <section className="relative flex flex-1 items-center justify-center px-5 py-14 sm:px-8 sm:py-20">
        <div className="w-full max-w-md">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-300">
              <LockKeyhole size={22} />
            </div>

            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
              Secure access
            </p>

            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Welcome back
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Sign in to continue to the AgenticEnclave security lab.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.09] bg-[#0c1119]/90 p-6 shadow-2xl shadow-black/20 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  required
                  value={email}
                  disabled={isSubmitting}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setMessage("");
                  }}
                  className="h-11 w-full rounded-lg border border-white/10 bg-white/[0.025] px-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-300/50 focus:ring-2 focus:ring-emerald-300/10 disabled:opacity-60"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-slate-200"
                  >
                    Password
                  </label>

                  <span className="text-xs text-slate-600">
                    Forgot password?
                  </span>
                </div>

                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                  value={password}
                  disabled={isSubmitting}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setMessage("");
                  }}
                  className="h-11 w-full rounded-lg border border-white/10 bg-white/[0.025] px-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-300/50 focus:ring-2 focus:ring-emerald-300/10 disabled:opacity-60"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-300 px-4 text-sm font-semibold text-[#08110e] transition hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1119] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
                {!isSubmitting && <ArrowRight size={16} />}
              </button>

              {message && (
                <p
                  role="alert"
                  aria-live="polite"
                  className="rounded-lg border border-amber-300/20 bg-amber-300/[0.05] p-3 text-xs leading-5 text-amber-200"
                >
                  {message}
                </p>
              )}
            </form>

            <div className="my-6 border-t border-white/[0.07]" />

            <p className="text-center text-sm text-slate-400">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-medium text-emerald-300 transition hover:text-emerald-200"
              >
                Create account
              </Link>
            </p>
          </div>

          <p className="mt-6 text-center text-xs leading-5 text-slate-600">
            Authentication is enabled for the security lab.
          </p>
        </div>
      </section>

      <footer className="relative border-t border-white/[0.07] px-5 py-5 text-center">
        <p className="text-xs text-slate-600">
          A security engineering project by FM ByteShift Software.
        </p>
      </footer>
    </main>
  );
}
