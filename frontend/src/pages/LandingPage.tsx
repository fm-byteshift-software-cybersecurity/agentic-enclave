
import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Code2,
  LockKeyhole,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Workflow,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError, apiGet, apiPost } from "@/lib/api";

type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "error";

interface AuthenticatedUser {
  user_id: number;
  email: string;
}

const scenarios = [
  {
    id: "SEC-01",
    title: "Broken Object Level Authorization",
    shortName: "BOLA",
    description:
      "Can an authenticated user make an AI agent access another customer's resources?",
    status: "Available",
    icon: ShieldAlert,
  },
  {
    id: "SEC-02",
    title: "Prompt Injection",
    shortName: "LLM Security",
    description:
      "What happens when untrusted instructions try to influence an agent's behavior?",
    status: "Planned",
    icon: Terminal,
  },
  {
    id: "SEC-03",
    title: "Excessive Agency",
    shortName: "Tool Security",
    description:
      "Can an agent invoke capabilities beyond what the task actually requires?",
    status: "Planned",
    icon: Workflow,
  },
];

function Brand() {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-lg border border-emerald-400/25 bg-emerald-400/10 text-emerald-300">
        <ShieldCheck size={21} strokeWidth={1.8} />
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-white">
        Agentic<span className="text-emerald-300">Enclave</span>
      </span>
    </Link>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
      <span className="h-px w-6 bg-emerald-400/70" />
      {children}
    </div>
  );
}


function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute -inset-5 rounded-3xl bg-emerald-400/[0.04] blur-3xl" />

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0c1119] shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-white/[0.05] text-slate-300">
              <Workflow size={18} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                AI Agent Security
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Application security boundary
              </p>
            </div>
          </div>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-2.5 py-1 text-[10px] font-medium text-emerald-300">
            CONCEPT
          </span>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-sky-400/20 bg-sky-400/[0.07] text-sky-300">
                <Workflow size={19} />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  AI agent
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Requests an action
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <div className="h-4 w-px bg-white/15" />
            <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-slate-500">
              Security boundary
            </span>
            <div className="h-4 w-px bg-white/15" />
          </div>

          <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.035] p-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300">
                <ShieldCheck size={19} />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  Application
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Enforces security rules
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.05] p-3">
                <Check size={16} className="shrink-0 text-emerald-300" />
                <span className="text-xs font-medium text-slate-200">
                  Allowed
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-red-400/15 bg-red-400/[0.04] p-3">
                <ShieldAlert size={16} className="shrink-0 text-red-300" />
                <span className="text-xs font-medium text-slate-200">
                  Blocked
                </span>
              </div>
            </div>
          </div>

          <p className="text-center text-[10px] text-slate-600">
            Conceptual illustration · No live request
          </p>
        </div>
      </div>
    </div>
  );
}


export default function LandingPage() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        await apiGet<AuthenticatedUser>("/api/auth/me");

        if (isMounted) {
          setAuthStatus("authenticated");
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          setAuthStatus("unauthenticated");
        } else {
          setAuthStatus("error");
        }
      }
    }

    void checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      await apiPost<void>("/api/auth/logout", {});
      setAuthStatus("unauthenticated");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setAuthStatus("unauthenticated");
      } else {
        setLogoutError(
          error instanceof ApiError
            ? error.message
            : "Unable to sign out. Please try again.",
        );
      }
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#080b11] text-slate-200 selection:bg-emerald-300/20 selection:text-emerald-100">
      <header className="relative z-10 border-b border-white/[0.07]">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-6 px-5 sm:px-8"
        >
          <Brand />

          <div className="hidden items-center gap-7 md:flex">
            <a
              href="#platform"
              className="text-sm text-slate-400 transition hover:text-white"
            >
              Platform
            </a>
            <a
              href="#scenarios"
              className="text-sm text-slate-400 transition hover:text-white"
            >
              Security scenarios
            </a>
            <a
              href="#approach"
              className="text-sm text-slate-400 transition hover:text-white"
            >
              Our approach
            </a>
          </div>

          <div className="flex items-center gap-3">
            {authStatus === "unauthenticated" && (
              <>
                <Link
                  to="/signin"
                  className="hidden text-sm text-slate-300 transition hover:text-white sm:inline-flex"
                >
                  Sign in
                </Link>
                <Button
                  asChild
                  className="h-9 rounded-lg bg-emerald-300 px-4 text-xs font-semibold text-[#08110e] hover:bg-emerald-200 sm:text-sm"
                >
                  <Link to="/signup">
                    Get started <ArrowRight size={15} />
                  </Link>
                </Button>
              </>
            )}

            {authStatus === "authenticated" && (
              <div className="flex flex-col items-end gap-1">
                <Button
                  type="button"
                  onClick={() => void handleLogout()}
                  disabled={isLoggingOut}
                  variant="outline"
                  className="h-9 rounded-lg border-white/15 bg-white/[0.02] px-4 text-xs text-slate-200 hover:bg-white/[0.06] hover:text-white sm:text-sm"
                >
                  <LogOut size={15} />
                  {isLoggingOut ? "Signing out..." : "Sign out"}
                </Button>
                {logoutError && (
                  <p
                    role="alert"
                    className="max-w-64 text-right text-xs text-red-300"
                  >
                    {logoutError}
                  </p>
                )}
              </div>
            )}

            {authStatus === "error" && (
              <button
                type="button"
                onClick={() => navigate(0)}
                className="text-sm text-slate-400 transition hover:text-white"
              >
                Retry session check
              </button>
            )}
          </div>
        </nav>
      </header>

      <main>
        <section
          id="platform"
          className="relative border-b border-white/[0.06]"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_75%_25%,rgba(16,185,129,0.09),transparent_42%)]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12 lg:py-32">
            <div>
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300">
                <span className="size-1.5 rounded-full bg-emerald-300" />
                Security engineering for AI agents
              </div>

              <h1 className="max-w-2xl text-4xl font-semibold leading-[1.12] tracking-[-0.045em] text-white sm:text-5xl lg:text-[58px]">
                Your AI agents can take action.
                <span className="mt-2 block text-emerald-300">
                  Can you control what they do?
                </span>
              </h1>

              <p className="mt-7 max-w-xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
                Rushing to deploy AI agents without testing their security can
                expose data, enable unauthorized actions, and put customer trust
                at risk. Reproduce real attack scenarios and compare vulnerable
                implementations with effective security controls.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-lg bg-emerald-300 px-5 font-semibold text-[#08110e] hover:bg-emerald-200"
                >
                  <a href="#scenarios">
                    Explore security scenarios
                    <ArrowRight size={17} />
                  </a>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-lg border-white/15 bg-white/[0.02] px-5 text-slate-200 hover:bg-white/[0.06] hover:text-white"
                >
                  <a href="#approach">
                    How it works <ChevronRight size={16} />
                  </a>
                </Button>
              </div>

              <div className="mt-9 flex flex-wrap gap-x-5 gap-y-3 text-xs text-slate-500">
                <span className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-300" />
                  Reproducible scenarios
                </span>
                <span className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-300" />
                  Vulnerable vs. hardened
                </span>
                <span className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-300" />
                  Technical evidence
                </span>
              </div>
            </div>

            <HeroPreview />
          </div>
        </section>

        <section className="border-b border-white/[0.06] bg-white/[0.015]">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-9 sm:px-8 md:grid-cols-3 md:gap-10">
            <div className="flex gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]">
                <Zap size={18} className="text-emerald-300" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-white">
                  More autonomy, more responsibility
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-slate-500">
                  Tool access turns model output into actions with real
                  consequences.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]">
                <ShieldAlert size={18} className="text-amber-300" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-white">
                  Authentication is not authorization
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-slate-500">
                  A valid identity does not make every requested action
                  legitimate.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]">
                <Code2 size={18} className="text-sky-300" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-white">
                  Test controls, not assumptions
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-slate-500">
                  Compare observable outcomes instead of relying on security
                  claims alone.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="scenarios"
          className="mx-auto max-w-7xl scroll-mt-20 px-5 py-20 sm:px-8 sm:py-28"
        >
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <SectionLabel>Security scenarios</SectionLabel>
              <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Find the failure before it reaches production.
              </h2>
              <p className="mt-4 max-w-xl leading-7 text-slate-400">
                Reproduce specific attack scenarios and compare vulnerable
                behavior with the hardened implementation. Inspect the results
                to see what the security controls actually change.
              </p>
            </div>
            <span className="flex items-center gap-2 text-sm text-slate-500">
              <span className="size-2 rounded-full bg-emerald-300" />
              One scenario available
            </span>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {scenarios.map((scenario) => {
              const Icon = scenario.icon;
              const available = scenario.status === "Available";

              return (
                <article
                  key={scenario.id}
                  className={`group flex min-h-[270px] flex-col rounded-xl border p-5 transition ${
                    available
                      ? "border-emerald-300/20 bg-emerald-300/[0.025] hover:border-emerald-300/40"
                      : "border-white/[0.08] bg-white/[0.015]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`flex size-10 items-center justify-center rounded-lg border ${
                        available
                          ? "border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-300"
                          : "border-white/10 bg-white/[0.03] text-slate-500"
                      }`}
                    >
                      <Icon size={19} />
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${
                        available
                          ? "border-emerald-300/20 text-emerald-300"
                          : "border-white/10 text-slate-500"
                      }`}
                    >
                      {scenario.status}
                    </span>
                  </div>

                  <p className="mt-5 font-mono text-xs text-slate-500">
                    {scenario.id} · {scenario.shortName}
                  </p>
                  <h3 className="mt-2 text-lg font-medium text-white">
                    {scenario.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {scenario.description}
                  </p>

                  <div className="mt-auto pt-6">
                    {available ? (
                      <Link
                        to="/lab/sec-01"
                        className="inline-flex items-center gap-2 text-sm font-medium text-emerald-300 transition group-hover:gap-3"
                      >
                        Explore scenario <ArrowRight size={15} />
                      </Link>
                    ) : (
                      <span className="text-sm text-slate-600">
                        Planned for a future release
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section
          id="approach"
          className="border-y border-white/[0.06] bg-[#0b1017]"
        >
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-2 lg:items-center">
            <div>
              <SectionLabel>Our approach</SectionLabel>
              <h2 className="max-w-xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
                An agent may request an action.
                <span className="text-emerald-300">
                  {" "}
                  Your application must decide whether it is allowed.
                </span>
              </h2>
              <p className="mt-5 max-w-xl leading-7 text-slate-400">
                AgenticEnclave examines the security boundary between an AI
                agent and the application capabilities it can invoke. Each
                scenario demonstrates a weakness, its impact, and the controls
                that prevent it.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  number: "01",
                  title: "Reproduce the weakness",
                  text: "Observe how an insecure implementation handles the same request.",
                },
                {
                  number: "02",
                  title: "Apply security controls",
                  text: "Enforce authorization and business rules in the application.",
                },
                {
                  number: "03",
                  title: "Compare the evidence",
                  text: "Inspect responses and state changes to understand the difference.",
                },
              ].map((step) => (
                <div
                  key={step.number}
                  className="flex gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5"
                >
                  <span className="font-mono text-sm text-emerald-300">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="text-sm font-medium text-white">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-6 text-slate-400">
                      {step.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
          <div className="relative overflow-hidden rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.045] px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
            <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-emerald-300/[0.07] blur-3xl" />

            <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-center">
              <div className="max-w-2xl">
                <SectionLabel>Before you scale</SectionLabel>
                <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Don't let security become the cost of moving fast.
                </h2>
                <p className="mt-4 leading-7 text-slate-400">
                  Understand what can go wrong, see the evidence, and build
                  stronger controls into AI-powered systems.
                </p>
              </div>

              <Button
                asChild
                size="lg"
                className="h-12 shrink-0 rounded-lg bg-emerald-300 px-5 font-semibold text-[#08110e] hover:bg-emerald-200"
              >
                <a href="#scenarios">
                  Test your agent's security boundaries.
                  <ArrowDownRight size={17} />
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.07]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-7 sm:px-8 md:flex-row md:items-center md:justify-between">
          <Brand />

          <div className="max-w-md text-xs leading-5 text-slate-500">
            <p>
              A security research lab by{" "}
              <a
                href="https://cybersecuritypainintelligence.com"
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 transition hover:text-white"
              >
                Cybersecurity Pain Intelligence (CPI)
              </a>
              , a division of{" "}
              <a
                href="https://fmbyteshiftsoftware.com"
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 transition hover:text-white"
              >
                FM ByteShift Software
              </a>
              .
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <a href="#approach" className="transition hover:text-white">
              About
            </a>
            <a
              href="https://github.com/fm-byteshift-software-cybersecurity/agentic-enclave"
              target="_blank"
              rel="noreferrer"
              aria-label="AgenticEnclave on GitHub"
              className="inline-flex items-center gap-1.5 transition hover:text-white"
            >
              <Code2 size={15} /> GitHub
            </a>
            <a
              href="#platform"
              aria-label="Back to top"
              className="inline-flex items-center gap-1 transition hover:text-white"
            >
              Top <ArrowUpRight size={13} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}