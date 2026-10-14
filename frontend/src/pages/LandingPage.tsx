import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Code2,
  LockKeyhole,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Workflow,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
              <Terminal size={18} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                Security scenario
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                SEC-01 / BOLA
              </p>
            </div>
          </div>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-2.5 py-1 text-[10px] font-medium text-emerald-300">
            DEMO PREVIEW
          </span>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
            <div className="mb-3 flex items-center gap-2 text-xs text-slate-400">
              <LockKeyhole size={14} />
              Authenticated request
            </div>
            <div className="space-y-2 font-mono text-xs sm:text-sm">
              <p className="text-slate-400">
                actor <span className="text-slate-200">customer_101</span>
              </p>
              <p className="text-slate-400">
                action <span className="text-slate-200">cancel_order</span>
              </p>
              <p className="text-slate-400">
                target <span className="text-amber-300">order_204</span>
              </p>
            </div>
            <p className="mt-3 border-t border-white/[0.06] pt-3 text-xs leading-relaxed text-slate-500">
              The target order belongs to a different customer.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-red-400/20 bg-red-400/[0.04] p-4">
              <div className="mb-3 flex items-center gap-2">
                <ShieldAlert size={16} className="text-red-300" />
                <span className="text-xs font-medium text-slate-200">
                  Vulnerable
                </span>
              </div>
              <p className="font-mono text-2xl font-semibold text-red-300">
                200 OK
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Unauthorized cancellation succeeds.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-[11px] font-medium text-red-300">
                <ArrowUpRight size={13} />
                Unauthorized action
              </div>
            </div>

            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] p-4">
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-300" />
                <span className="text-xs font-medium text-slate-200">
                  Hardened
                </span>
              </div>
              <p className="font-mono text-2xl font-semibold text-emerald-300">
                403
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Authorization policy blocks the action.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-[11px] font-medium text-emerald-300">
                <Check size={13} />
                Order remains unchanged
              </div>
            </div>
          </div>

          <p className="text-center text-[10px] text-slate-600">
            Illustrative results · No live API request
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
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
                Rushing to adopt AI agents without testing their security can
                expose data, operations, and customer trust. Discover how
                vulnerabilities happen and see what effective controls change.
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
                Explore specific weaknesses, reproduce the attack, and compare
                the vulnerable behavior with the hardened implementation.
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
                  Explore the lab <ArrowDownRight size={17} />
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.07]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-7 sm:px-8 md:flex-row md:items-center md:justify-between">
          <Brand />
          <p className="text-xs leading-5 text-slate-500">
            A security engineering project by FM ByteShift Software.
          </p>
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
