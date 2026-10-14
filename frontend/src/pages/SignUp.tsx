
import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ShieldCheck,
} from "lucide-react";
import { apiPost, ApiError } from "@/lib/api";


interface RegisterResponse {
  user_id: number;
  email: string;
}


function Brand() {
  return (
    <a href="/" className="inline-flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-lg border border-emerald-400/25 bg-emerald-400/10 text-emerald-300">
        <ShieldCheck size={21} strokeWidth={1.8} />
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-white">
        Agentic<span className="text-emerald-300">Enclave</span>
      </span>
    </a>
  );
}

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSuccess(false);

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await apiPost<RegisterResponse>(
        "/api/auth/register",
        {
          email: email.trim(),
          password,
        },
      );

      setIsSuccess(true);
      setMessage(
        `Account created successfully for ${result.email}. You can now sign in.`,
      );
      setEmail(result.email);
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          setMessage(
            "An account with this email already exists. Try signing in instead.",
          );
        } else if (error.status === 422) {
          setMessage(
            "The email or password does not meet the requirements. Use a valid email and a password between 12 and 128 characters.",
          );
        } else {
          setMessage(error.message);
        }
      } else {
        setMessage("Unable to create your account. Please try again.");
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

          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={15} />
            Back to home
          </a>
        </nav>
      </header>

      <section className="relative flex flex-1 items-center justify-center px-5 py-12 sm:px-8 sm:py-16">
        <div className="w-full max-w-md">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-300">
              <ShieldCheck size={23} />
            </div>

            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
              Join the lab
            </p>

            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Create your account
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Get ready to explore AI agent security scenarios.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.09] bg-[#0c1119]/90 p-6 shadow-2xl shadow-black/20 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  maxLength={254}
                  value={email}
                  disabled={isSubmitting || isSuccess}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setMessage("");
                  }}
                  className="h-11 w-full rounded-lg border border-white/10 bg-white/[0.025] px-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-300/50 focus:ring-2 focus:ring-emerald-300/10 disabled:opacity-60"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Password
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Create a password"
                  minLength={12}
                  maxLength={128}
                  required
                  value={password}
                  disabled={isSubmitting || isSuccess}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setMessage("");
                  }}
                  className="h-11 w-full rounded-lg border border-white/10 bg-white/[0.025] px-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-300/50 focus:ring-2 focus:ring-emerald-300/10 disabled:opacity-60"
                />

                <p className="mt-1.5 text-xs text-slate-600">
                  Use 12–128 characters.
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Confirm password
                </label>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  minLength={12}
                  maxLength={128}
                  required
                  value={confirmPassword}
                  disabled={isSubmitting || isSuccess}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setMessage("");
                  }}
                  className="h-11 w-full rounded-lg border border-white/10 bg-white/[0.025] px-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-300/50 focus:ring-2 focus:ring-emerald-300/10 disabled:opacity-60"
                />
              </div>

              <div className="flex items-start gap-2.5 pt-1 text-xs leading-5 text-slate-500">
                <Check
                  size={15}
                  className="mt-0.5 shrink-0 text-emerald-300"
                />
                <p>
                  Designed for hands-on exploration of vulnerable and hardened
                  AI agent implementations.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isSuccess}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-300 px-4 text-sm font-semibold text-[#08110e] transition hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1119] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? "Creating account..."
                  : isSuccess
                    ? "Account created"
                    : "Create account"}
                {!isSubmitting && !isSuccess && <ArrowRight size={16} />}
              </button>

              {message && (
                <p
                  role="status"
                  aria-live="polite"
                  className={`rounded-lg border p-3 text-xs leading-5 ${
                    isSuccess
                      ? "border-emerald-300/20 bg-emerald-300/[0.05] text-emerald-200"
                      : "border-red-300/20 bg-red-300/[0.05] text-red-200"
                  }`}
                >
                  {message}
                </p>
              )}
            </form>

            <div className="my-6 border-t border-white/[0.07]" />

            <p className="text-center text-sm text-slate-400">
              Already have an account?{" "}
              <a
                href="/signin"
                className="font-medium text-emerald-300 transition hover:text-emerald-200"
              >
                Sign in
              </a>
            </p>
          </div>

          <p className="mt-6 text-center text-xs leading-5 text-slate-600">
            Account creation requires a connection to the API.
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
