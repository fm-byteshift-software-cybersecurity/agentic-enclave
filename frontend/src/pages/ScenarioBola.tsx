
import { useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,  
  CircleHelp,
  Code2,
  Copy,
  Database,  
  LockKeyhole,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  UserRound,
  Workflow,
} from "lucide-react";
import LabSidebar from "@/components/layout/LabSidebar";

type DemoMode = "vulnerable" | "hardened";

interface DemoResult {
  status: number;
  title: string;
  description: string;
  orderStatus: string;
}

const initialOrderStatus = "Confirmed";

const order = {
  id: "ORD-1844",
  owner: "Customer #2",
  ownerId: 2,
  product: "Premium support plan",
  amount: "$249.00",
};

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-500">
        {eyebrow}
      </p>
      <h2 className="text-base font-semibold tracking-tight text-white sm:text-lg">
        {title}
      </h2>
      {description && (
        <p className="mt-1.5 text-sm leading-6 text-slate-400">
          {description}
        </p>
      )}
    </div>
  );
}

function StatusBadge({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "red" | "green" | "neutral" | "amber";
}) {
  const styles = {
    red: "border-red-400/20 bg-red-400/[0.08] text-red-300",
    green: "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300",
    neutral: "border-white/10 bg-white/[0.04] text-slate-400",
    amber: "border-amber-400/20 bg-amber-400/[0.08] text-amber-300",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-medium ${styles[variant]}`}
    >
      {children}
    </span>
  );
}



export default function ScenarioBola() {
  const [mode, setMode] = useState<DemoMode>("vulnerable");
  const [result, setResult] = useState<DemoResult | null>(null);
  const [copied, setCopied] = useState(false);

  const isHardened = mode === "hardened";
  //const orderStatus = result?.orderStatus ?? initialOrderStatus;

  function runSimulation() {
    if (mode === "vulnerable") {
      setResult({
        status: 200,
        title: "Unauthorized action succeeded",
        description:
          "The application cancelled an order belonging to another user. The endpoint did not enforce object-level ownership authorization.",
        orderStatus: "Cancelled",
      });
      return;
    }

    setResult({
      status: 403,
      title: "Access denied",
      description:
        "The application rejected the cancellation because the authenticated user does not own this order. The order remains unchanged.",
      orderStatus: initialOrderStatus,
    });
  }

  function resetSimulation() {
    setResult(null);
    setCopied(false);
  }

  async function copyRequest() {
    const request = `POST /api/${
      isHardened ? "orders/cancel" : "vulnerable/orders/cancel"
    }\nContent-Type: application/json\n\n{"order_id": 1844}`;

    try {
      await navigator.clipboard.writeText(request);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-200 selection:bg-emerald-300/20 selection:text-emerald-100 md:flex">
      <LabSidebar activeScenario="SEC-01" />

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
          <div className="mb-8 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>Security lab</span>
            <span className="text-slate-700">/</span>
            <span>Scenarios</span>
            <span className="text-slate-700">/</span>
            <span className="text-slate-300">SEC-01</span>
          </div>

          <header className="border-b border-white/[0.08] pb-8">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge variant="green">
                <span className="size-1.5 rounded-full bg-emerald-300" />
                Available
              </StatusBadge>
              <StatusBadge variant="neutral">API Security</StatusBadge>
              <StatusBadge variant="neutral">OWASP API Security</StatusBadge>
            </div>

            <div className="mt-5 flex items-start gap-4">
              <div className="hidden size-12 shrink-0 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/[0.06] text-red-300 sm:flex">
                <ShieldAlert size={23} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium tracking-wide text-emerald-300">
                  SEC-01
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
                  Broken Object Level Authorization
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">
                  An AI agent can request an action on an object. If the
                  application fails to verify ownership, the agent may act on
                  data that belongs to someone else.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-3.5">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">
                  Vulnerability
                </p>
                <p className="mt-1.5 text-sm font-medium text-red-300">
                  Object-level authorization
                </p>
              </div>
              <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-3.5">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">
                  Potential impact
                </p>
                <p className="mt-1.5 text-sm font-medium text-slate-200">
                  Unauthorized data changes
                </p>
              </div>
              <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-3.5">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">
                  Demonstration
                </p>
                <p className="mt-1.5 text-sm font-medium text-slate-200">
                  Cross-user order cancellation
                </p>
              </div>
            </div>
          </header>

          <section className="py-8">
            <SectionHeading
              eyebrow="01 / Understand the flaw"
              title="Authentication is not authorization"
              description="Knowing who is making a request does not mean they are allowed to modify every resource."
            />

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-red-400/15 bg-red-400/[0.035] p-5">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={17} className="text-red-300" />
                  <h3 className="text-sm font-semibold text-red-200">
                    Vulnerable behavior
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  The endpoint accepts an order identifier and performs the
                  requested action without checking whether the authenticated
                  user owns that order.
                </p>
                <div className="mt-4 rounded-lg border border-red-400/10 bg-black/20 p-3 font-mono text-xs leading-5 text-red-200/80">
                  authenticated user ≠ order owner
                  <br />
                  <span className="text-red-300">→ action still allowed</span>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.035] p-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={17} className="text-emerald-300" />
                  <h3 className="text-sm font-semibold text-emerald-200">
                    Hardened behavior
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  The application enforces authorization for the specific
                  object before allowing the action. Authentication alone is
                  not sufficient.
                </p>
                <div className="mt-4 rounded-lg border border-emerald-400/10 bg-black/20 p-3 font-mono text-xs leading-5 text-emerald-200/80">
                  authenticated user ≠ order owner
                  <br />
                  <span className="text-emerald-300">
                    → request rejected
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-white/[0.08] py-8">
            <SectionHeading
              eyebrow="02 / Interactive lab"
              title="Test the authorization boundary"
              description="An authenticated user attempts to cancel an order belonging to another user. Switch implementations and compare the simulated outcomes."
            />

            <div className="mt-5 rounded-xl border border-white/[0.09] bg-[#0b1018]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-4 sm:px-5">
                <div className="flex items-center gap-2.5">
                  <Workflow size={17} className="text-slate-400" />
                  <span className="text-sm font-medium text-white">
                    Authorization test
                  </span>
                </div>
                <StatusBadge variant="amber">
                  <CircleHelp size={12} />
                  Local simulation
                </StatusBadge>
              </div>

              <div className="p-4 sm:p-5">
                <p className="mb-3 text-xs font-medium text-slate-400">
                  Select implementation
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("vulnerable");
                      resetSimulation();
                    }}
                    aria-pressed={mode === "vulnerable"}
                    className={`rounded-xl border p-4 text-left transition ${
                      !isHardened
                        ? "border-red-400/35 bg-red-400/[0.06] ring-1 ring-red-400/10"
                        : "border-white/[0.08] bg-white/[0.015] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm font-medium text-white">
                        <ShieldAlert
                          size={17}
                          className="text-red-300"
                        />
                        Vulnerable
                      </span>
                      <span
                        className={`size-3 rounded-full border ${
                          !isHardened
                            ? "border-red-300 bg-red-300"
                            : "border-slate-600"
                        }`}
                      />
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      No object ownership check before cancellation.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode("hardened");
                      resetSimulation();
                    }}
                    aria-pressed={mode === "hardened"}
                    className={`rounded-xl border p-4 text-left transition ${
                      isHardened
                        ? "border-emerald-400/35 bg-emerald-400/[0.06] ring-1 ring-emerald-400/10"
                        : "border-white/[0.08] bg-white/[0.015] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm font-medium text-white">
                        <ShieldCheck
                          size={17}
                          className="text-emerald-300"
                        />
                        Hardened
                      </span>
                      <span
                        className={`size-3 rounded-full border ${
                          isHardened
                            ? "border-emerald-300 bg-emerald-300"
                            : "border-slate-600"
                        }`}
                      />
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      Ownership is checked before the action is allowed.
                    </p>
                  </button>
                </div>

                <div className="my-5 border-t border-white/[0.07]" />

                <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <UserRound size={16} className="text-slate-400" />
                      <h3 className="text-sm font-medium text-white">
                        Request context
                      </h3>
                    </div>

                    <div className="space-y-3 rounded-lg border border-white/[0.07] bg-white/[0.015] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-slate-500">
                          Authenticated user
                        </span>
                        <span className="text-xs font-medium text-slate-200">
                          User #1
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-slate-500">
                          Requested action
                        </span>
                        <span className="text-xs font-medium text-slate-200">
                          Cancel order
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-slate-500">
                          Target order
                        </span>
                        <span className="font-mono text-xs text-slate-200">
                          {order.id}
                        </span>
                      </div>

                      <div className="border-t border-white/[0.07] pt-3">
                        <div className="flex items-start gap-2">
                          <Database
                            size={15}
                            className="mt-0.5 shrink-0 text-amber-300"
                          />
                          <p className="text-xs leading-5 text-slate-400">
                            The target order belongs to User #2, not the
                            authenticated user.
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={runSimulation}
                      className={`mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1018] ${
                        isHardened
                          ? "bg-emerald-300 text-[#08110e] hover:bg-emerald-200 focus-visible:ring-emerald-300"
                          : "bg-red-400 text-[#1b0808] hover:bg-red-300 focus-visible:ring-red-300"
                      }`}
                    >
                      <Play size={15} />
                      Run simulated test
                      <ArrowRight size={15} />
                    </button>

                    <p className="mt-2 text-center text-[10px] leading-5 text-slate-600">
                      No API request is sent. Results are illustrative.
                    </p>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <Terminal size={16} className="text-slate-400" />
                      <h3 className="text-sm font-medium text-white">
                        Simulated response
                      </h3>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-[#080b11]">
                      <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-3.5 py-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className={`size-2 rounded-full ${
                              result
                                ? result.status === 200
                                  ? "bg-red-400"
                                  : "bg-emerald-400"
                                : "bg-slate-600"
                            }`}
                          />
                          <span className="truncate font-mono text-[11px] text-slate-400">
                            POST /api/
                            {isHardened
                              ? "orders/cancel"
                              : "vulnerable/orders/cancel"}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={copyRequest}
                          className="flex shrink-0 items-center gap-1.5 rounded-md border border-white/[0.08] px-2 py-1.5 text-[10px] text-slate-400 transition hover:text-white"
                          title="Copy example request"
                        >
                          <Copy size={12} />
                          {copied ? "Copied" : "Copy"}
                        </button>
                      </div>

                      <div className="p-4">
                        <div className="font-mono text-xs leading-6">
                          <p className="text-slate-500">{"{"}</p>
                          <p className="pl-4 text-slate-400">
                            "order_id": <span className="text-amber-200">1844</span>
                          </p>
                          <p className="text-slate-500">{"}"}</p>
                        </div>

                        <div className="my-4 border-t border-white/[0.07]" />

                        {!result ? (
                          <div className="flex min-h-36 flex-col items-center justify-center text-center">
                            <Terminal
                              size={23}
                              className="mb-3 text-slate-600"
                            />
                            <p className="text-sm text-slate-400">
                              Waiting for test
                            </p>
                            <p className="mt-1 max-w-xs text-xs leading-5 text-slate-600">
                              Run the simulation to see how this implementation
                              handles the request.
                            </p>
                          </div>
                        ) : (
                          <div aria-live="polite">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-md px-2 py-1 font-mono text-xs font-semibold ${
                                  result.status === 200
                                    ? "bg-red-400/10 text-red-300"
                                    : "bg-emerald-400/10 text-emerald-300"
                                }`}
                              >
                                HTTP {result.status}
                              </span>
                              <StatusBadge
                                variant={
                                  result.status === 200 ? "red" : "green"
                                }
                              >
                                {result.status === 200
                                  ? "Vulnerability reproduced"
                                  : "Request blocked"}
                              </StatusBadge>
                            </div>

                            <h4
                              className={`mt-4 text-sm font-semibold ${
                                result.status === 200
                                  ? "text-red-200"
                                  : "text-emerald-200"
                              }`}
                            >
                              {result.title}
                            </h4>
                            <p className="mt-2 text-xs leading-6 text-slate-400">
                              {result.description}
                            </p>

                            <div className="mt-4 rounded-lg border border-white/[0.07] bg-white/[0.02] p-3">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-xs text-slate-500">
                                  Order status
                                </span>
                                <span
                                  className={`text-xs font-medium ${
                                    result.orderStatus === "Cancelled"
                                      ? "text-red-300"
                                      : "text-emerald-300"
                                  }`}
                                >
                                  {result.orderStatus}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={resetSimulation}
                              className="mt-4 inline-flex items-center gap-2 text-xs text-slate-500 transition hover:text-white"
                            >
                              <RotateCcw size={13} />
                              Reset simulation
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-white/[0.08] py-8">
            <SectionHeading
              eyebrow="03 / Defense in depth"
              title="Enforce authorization at the application boundary"
              description="The agent can propose an action. The application must decide whether that action is permitted."
            />

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4">
                <LockKeyhole size={18} className="text-emerald-300" />
                <h3 className="mt-3 text-sm font-medium text-white">
                  Verify ownership
                </h3>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Check that the authenticated principal can act on the
                  requested object.
                </p>
              </div>
              <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4">
                <Code2 size={18} className="text-emerald-300" />
                <h3 className="mt-3 text-sm font-medium text-white">
                  Enforce server-side
                </h3>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Do not rely on the agent, prompt instructions, or client-side
                  checks to enforce access control.
                </p>
              </div>
              <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4">
                <Database size={18} className="text-emerald-300" />
                <h3 className="mt-3 text-sm font-medium text-white">
                  Test object boundaries
                </h3>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Verify that one user cannot read or modify another user's
                  resources.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-lg border border-white/[0.07] bg-white/[0.02] p-4">
              <ArrowDown
                size={16}
                className="mt-0.5 shrink-0 text-slate-500"
              />
              <p className="text-xs leading-6 text-slate-400">
                <span className="font-medium text-slate-200">
                  Key principle:
                </span>{" "}
                authorization must be enforced for every sensitive operation
                and every object access, regardless of whether the request
                originated from an AI agent or a conventional client.
              </p>
            </div>
          </section>

          <footer className="border-t border-white/[0.08] py-6">
            <p className="text-xs leading-5 text-slate-600">
              SEC-01 · Broken Object Level Authorization
              <span className="mx-2 text-slate-700">/</span>
              UI preview only. All results are simulated.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
