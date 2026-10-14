
import { useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  FlaskConical,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  ShieldAlert,
  ShieldCheck,
  Workflow,
  Eye,
  MessageSquareWarning,  
  Users,
  Wrench,
  FileOutput,
  X,
} from "lucide-react";

type ScenarioId =
  | "SEC-01"
  | "SEC-02"
  | "SEC-03"
  | "SEC-04"
  | "SEC-05"
  | "SEC-06"
  | "SEC-07"
  | "SEC-08"
  | "SEC-09"
  | "SEC-10";

interface LabSidebarProps {
  activeScenario?: ScenarioId;
}

interface NavigationItem {
  id: ScenarioId;
  title: string;
  description: string;
  available: boolean;
  icon: typeof ShieldAlert;
}

const scenarios: NavigationItem[] = [
  {
    id: "SEC-01",
    title: "BOLA / IDOR",
    description: "Order cancellation",
    available: true,
    icon: ShieldAlert,
  },
  {
    id: "SEC-02",
    title: "Broken Access Control",
    description: "Excessive privileges",
    available: false,
    icon: LockKeyhole,
  },
  {
    id: "SEC-03",
    title: "Sensitive Information Disclosure",
    description: "Sensitive data exposure",
    available: false,
    icon: Eye,
  },
  {
    id: "SEC-04",
    title: "Business Logic Violation",
    description: "Workflow enforcement",
    available: false,
    icon: Workflow,
  },
  {
    id: "SEC-05",
    title: "Direct Prompt Injection",
    description: "Direct manipulation",
    available: false,
    icon: MessageSquareWarning,
  },
  {
    id: "SEC-06",
    title: "Indirect Prompt Injection",
    description: "Untrusted content",
    available: false,
    icon: FlaskConical,
  },
  {
    id: "SEC-07",
    title: "Excessive Agency",
    description: "Unnecessary autonomy",
    available: false,
    icon: ShieldAlert,
  },
  {
    id: "SEC-08",
    title: "Tool Misuse",
    description: "Unauthorized tool invocation",
    available: false,
    icon: Wrench,
  },
  {
    id: "SEC-09",
    title: "Agent-to-Agent Privilege Escalation",
    description: "Multi-agent security",
    available: false,
    icon: Users,
  },
  {
    id: "SEC-10",
    title: "Improper Output Handling",
    description: "Unsafe model output",
    available: false,
    icon: FileOutput,
  },
];

function Brand() {
  return (
    <a href="/" className="inline-flex items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-emerald-400/25 bg-emerald-400/10 text-emerald-300">
        <ShieldCheck size={20} strokeWidth={1.8} />
      </span>

      <span className="text-sm font-semibold tracking-tight text-white">
        Agentic<span className="text-emerald-300">Enclave</span>
      </span>
    </a>
  );
}

function SidebarContent({
  activeScenario,
  onNavigate,
}: {
  activeScenario?: ScenarioId;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="border-b border-white/[0.07] px-5 py-5">
        <Brand />
      </div>

      <div className="flex-1 px-3 py-6">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Security lab
        </p>

        <a
          href="/"
          onClick={onNavigate}
          className="mb-6 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
        >
          <LayoutDashboard size={17} />
          Project overview
          <ArrowLeft className="ml-auto" size={14} />
        </a>

        <div className="mb-3 flex items-center justify-between px-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Scenarios
          </p>
          <span className="text-[10px] text-slate-600">01 / 10</span>
        </div>

        <nav aria-label="Security scenarios" className="space-y-1.5">
          {scenarios.map((scenario) => {
            const isActive = activeScenario === scenario.id;
            const Icon = scenario.icon;

            if (!scenario.available) {
              return (
                <div
                  key={scenario.id}
                  aria-disabled="true"
                  className="flex cursor-not-allowed items-start gap-3 rounded-lg border border-transparent px-3 py-3 opacity-55"
                  title="This scenario is planned but not available yet"
                >
                  <Icon
                    size={17}
                    className="mt-0.5 shrink-0 text-slate-500"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium leading-5 text-slate-300">
                      {scenario.id} · {scenario.title}
                    </p>
                    <p className="mt-1 text-[11px] leading-4 text-slate-500">
                      {scenario.description}
                    </p>
                  </div>

                  <span className="mt-0.5 shrink-0 rounded border border-white/[0.08] px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-slate-500">
                    Planned
                  </span>
                </div>
              );
            }

            return (
              <a
                key={scenario.id}
                href="/lab/sec-01"
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={`group flex items-start gap-3 rounded-lg border px-3 py-3 transition ${
                  isActive
                    ? "border-emerald-300/15 bg-emerald-300/[0.07] text-emerald-200"
                    : "border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Icon
                  size={17}
                  className={`mt-0.5 shrink-0 ${
                    isActive
                      ? "text-emerald-300"
                      : "text-slate-500 group-hover:text-slate-300"
                  }`}
                />

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium leading-5">
                    {scenario.id} · {scenario.title}
                  </p>
                  <p
                    className={`mt-1 text-[11px] ${
                      isActive ? "text-emerald-300/65" : "text-slate-500"
                    }`}
                  >
                    {scenario.description}
                  </p>
                </div>

                {isActive && (
                  <ChevronRight
                    size={15}
                    className="mt-0.5 shrink-0 text-emerald-300"
                  />
                )}
              </a>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-white/[0.07] p-4">
        <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-3">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-emerald-300" />
            <p className="text-[11px] font-medium text-slate-300">
              Lab preview
            </p>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-slate-500">
            Explore vulnerable and hardened AI agent implementations.
          </p>
        </div>

        <p className="mt-4 px-1 text-[10px] text-slate-600">
          FM ByteShift Software
        </p>
      </div>
    </>
  );
}

export default function LabSidebar({
  activeScenario,
}: LabSidebarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-white/[0.07] bg-[#080b11] px-4 md:hidden">
        <Brand />

        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={mobileMenuOpen}
          className="flex size-10 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
        >
          <Menu size={20} />
        </button>
      </header>

      <aside className="hidden min-h-screen w-64 shrink-0 flex-col border-r border-white/[0.07] bg-[#0a0e15] md:flex">
        <SidebarContent activeScenario={activeScenario} />
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/70"
          />

          <aside className="relative flex h-full w-[min(18rem,85vw)] flex-col overflow-y-auto border-r border-white/[0.08] bg-[#0a0e15] shadow-2xl">
            <div className="absolute right-3 top-4 z-10">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="flex size-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
              >
                <X size={19} />
              </button>
            </div>

            <SidebarContent
              activeScenario={activeScenario}
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </aside>
        </div>
      )}
    </>
  );
}
