
import { useState, type FormEvent, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowDown,  
  Bot,  
  Code2,
  Copy,
  Database,
  LockKeyhole,
  LoaderCircle,
  RotateCcw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  UserRound,
  Workflow,
} from "lucide-react";
import LabSidebar from "@/components/layout/LabSidebar";
import { ApiError, apiPost } from "@/lib/api";

type DemoMode = "vulnerable" | "hardened";
type MessageRole = "assistant" | "user";

interface AgentResponse {
  message: string;
  order_id: number;
  order_status: string;
}

interface ChatMessage {
  id: number;
  role: MessageRole;
  content: string;
  httpStatus?: number;
  orderId?: number;
  orderStatus?: string;
  error?: boolean;
}

const initialMessage: ChatMessage = {
  id: 0,
  role: "assistant",
  content:
    "Hello! I'm the Orders Agent. I can help with order-related requests, including order cancellation. What would you like me to do?",
};

const order = {
  id: "ORD-1844",
  owner: "Customer #2",
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
  children: ReactNode;
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
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastRequest, setLastRequest] = useState<string | null>(null);
  const [lastHttpStatus, setLastHttpStatus] = useState<number | null>(null);

  const isHardened = mode === "hardened";
  const endpoint = isHardened
    ? "/api/orders/cancel"
    : "/api/vulnerable/orders/cancel";

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const userInput = input.trim();
    if (!userInput || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: userInput,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);
    setCopied(false);
    setLastRequest(JSON.stringify({ user_input: userInput }, null, 2));
    setLastHttpStatus(null);

    try {
      const response = await apiPost<AgentResponse>(endpoint, {
        user_input: userInput,
      });

      setLastHttpStatus(200);
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: response.message,
          httpStatus: 200,
          orderId: response.order_id,
          orderStatus: response.order_status,
        },
      ]);
    } catch (error) {
      const apiError =
        error instanceof ApiError
          ? error
          : new ApiError("An unexpected error occurred.", 0);

      setLastHttpStatus(apiError.status);

      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: apiError.message,
          httpStatus: apiError.status,
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function changeMode(nextMode: DemoMode) {
    if (loading) return;

    setMode(nextMode);
    setMessages([
      {
        ...initialMessage,
        content:
          nextMode === "vulnerable"
            ? "Vulnerable mode is active. I can help with order-related requests. Try asking me to cancel order 1844."
            : "Hardened mode is active. I can help with order-related requests. Try asking me to cancel order 1844.",
      },
    ]);
    setLastRequest(null);
    setLastHttpStatus(null);
    setCopied(false);
  }

  function resetChat() {
    if (loading) return;

    setMessages([initialMessage]);
    setInput("");
    setLastRequest(null);
    setLastHttpStatus(null);
    setCopied(false);
  }

  async function copyRequest() {
    if (!lastRequest) return;

    const request = `POST ${endpoint}\nContent-Type: application/json\n\n${lastRequest}`;

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
                  <span className="text-emerald-300">→ request rejected</span>
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-white/[0.08] py-8">
            <SectionHeading
              eyebrow="02 / Interactive lab"
              title="Talk to the AI agent"
              description="Send a request in natural language and observe how the selected implementation handles the operation."
            />

            <div className="mt-5 overflow-hidden rounded-xl border border-white/[0.09] bg-[#0b1018]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-4 sm:px-5">
                <div className="flex items-center gap-2.5">
                  <Workflow size={17} className="text-slate-400" />
                  <span className="text-sm font-medium text-white">
                    Orders Agent
                  </span>
                </div>
                <StatusBadge variant={isHardened ? "green" : "red"}>
                  {isHardened ? (
                    <ShieldCheck size={12} />
                  ) : (
                    <ShieldAlert size={12} />
                  )}
                  {isHardened ? "Hardened mode" : "Vulnerable mode"}
                </StatusBadge>
              </div>

              <div className="p-4 sm:p-5">
                <p className="mb-3 text-xs font-medium text-slate-400">
                  Select implementation
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => changeMode("vulnerable")}
                    aria-pressed={!isHardened}
                    className={`rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      !isHardened
                        ? "border-red-400/35 bg-red-400/[0.06] ring-1 ring-red-400/10"
                        : "border-white/[0.08] bg-white/[0.015] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm font-medium text-white">
                        <ShieldAlert size={17} className="text-red-300" />
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
                    disabled={loading}
                    onClick={() => changeMode("hardened")}
                    aria-pressed={isHardened}
                    className={`rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      isHardened
                        ? "border-emerald-400/35 bg-emerald-400/[0.06] ring-1 ring-emerald-400/10"
                        : "border-white/[0.08] bg-white/[0.015] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm font-medium text-white">
                        <ShieldCheck size={17} className="text-emerald-300" />
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
                          Current session
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-slate-500">
                          Requested action
                        </span>
                        <span className="text-xs font-medium text-slate-200">
                          Order cancellation
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
                            The demonstration order belongs to Customer #2.
                            Try requesting cancellation of order 1844.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-lg border border-white/[0.07] bg-[#080b11] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-slate-500">
                          API endpoint
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          POST
                        </span>
                      </div>
                      <p className="mt-2 break-all font-mono text-xs text-slate-300">
                        {endpoint}
                      </p>
                      <p className="mt-2 text-[10px] leading-5 text-slate-600">
                        Requests are sent to the backend using your current
                        authenticated session.
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="mb-3 flex items-center gap-2">
                      <Bot size={17} className="text-slate-400" />
                      <h3 className="text-sm font-medium text-white">
                        Conversation
                      </h3>
                      <span className="ml-auto text-[10px] text-slate-600">
                        {messages.length} messages
                      </span>
                    </div>

                    <div
                      className="flex min-h-80 flex-col gap-4 rounded-lg border border-white/[0.08] bg-[#080b11] p-4"
                      aria-live="polite"
                      aria-label="Agent conversation"
                    >
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-2.5 ${
                            message.role === "user"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          {message.role === "assistant" && (
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-emerald-400/15 bg-emerald-400/[0.06]">
                              <Bot size={16} className="text-emerald-300" />
                            </div>
                          )}

                          <div
                            className={`min-w-0 max-w-[88%] rounded-xl border p-3 ${
                              message.role === "user"
                                ? "border-white/[0.08] bg-white/[0.06]"
                                : message.error
                                  ? "border-red-400/15 bg-red-400/[0.04]"
                                  : "border-white/[0.07] bg-white/[0.025]"
                            }`}
                          >
                            <p className="mb-1.5 text-[10px] font-medium text-slate-500">
                              {message.role === "user"
                                ? "You"
                                : "Orders Agent"}
                            </p>
                            <p className="whitespace-pre-wrap break-words text-xs leading-6 text-slate-300">
                              {message.content}
                            </p>

                            {message.httpStatus !== undefined && (
                              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-2">
                                <span
                                  className={`font-mono text-[10px] ${
                                    message.httpStatus >= 200 &&
                                    message.httpStatus < 300
                                      ? "text-emerald-300"
                                      : "text-red-300"
                                  }`}
                                >
                                  HTTP {message.httpStatus}
                                </span>
                                {message.orderId !== undefined &&
                                  message.orderStatus && (
                                    <span className="text-[10px] text-slate-500">
                                      Order #{message.orderId}:{" "}
                                      <span className="text-slate-300">
                                        {message.orderStatus}
                                      </span>
                                    </span>
                                  )}
                              </div>
                            )}
                          </div>

                          {message.role === "user" && (
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04]">
                              <UserRound
                                size={15}
                                className="text-slate-400"
                              />
                            </div>
                          )}
                        </div>
                      ))}

                      {loading && (
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 items-center justify-center rounded-lg border border-emerald-400/15 bg-emerald-400/[0.06]">
                            <Bot size={16} className="text-emerald-300" />
                          </div>
                          <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-3">
                            <LoaderCircle
                              size={14}
                              className="animate-spin text-emerald-300"
                            />
                            <span className="text-xs text-slate-400">
                              Agent is processing your request...
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <form onSubmit={sendMessage} className="mt-3">
                      <label
                        htmlFor="agent-message"
                        className="mb-2 block text-xs font-medium text-slate-400"
                      >
                        Message the agent
                      </label>
                      <div className="flex items-end gap-2 rounded-xl border border-white/[0.1] bg-[#080b11] p-2 focus-within:border-emerald-300/30">
                        <textarea
                          id="agent-message"
                          value={input}
                          onChange={(event) => setInput(event.target.value)}
                          onKeyDown={(event) => {
                            if (
                              event.key === "Enter" &&
                              !event.shiftKey &&
                              !event.nativeEvent.isComposing
                            ) {
                              event.preventDefault();
                              event.currentTarget.form?.requestSubmit();
                            }
                          }}
                          disabled={loading}
                          rows={2}
                          maxLength={2000}
                          placeholder="e.g. Please cancel order 1844."
                          className="min-h-12 min-w-0 flex-1 resize-y bg-transparent px-2 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 disabled:opacity-50"
                        />
                        <button
                          type="submit"
                          disabled={loading || !input.trim()}
                          aria-label="Send message"
                          className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-300 text-[#08110e] transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {loading ? (
                            <LoaderCircle size={17} className="animate-spin" />
                          ) : (
                            <Send size={16} />
                          )}
                        </button>
                      </div>
                      <p className="mt-2 text-[10px] leading-5 text-slate-600">
                        Enter to send · Shift+Enter for a new line. The agent
                        currently supports order cancellation.
                      </p>
                    </form>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={resetChat}
                        disabled={loading}
                        className="inline-flex items-center gap-2 text-xs text-slate-500 transition hover:text-white disabled:opacity-40"
                      >
                        <RotateCcw size={13} />
                        Clear conversation
                      </button>
                      <div className="flex items-center gap-2 text-[10px] text-slate-600">
                        <span
                          className={`size-1.5 rounded-full ${
                            lastHttpStatus === null
                              ? "bg-slate-600"
                              : lastHttpStatus >= 200 &&
                                  lastHttpStatus < 300
                                ? "bg-emerald-400"
                                : "bg-red-400"
                          }`}
                        />
                        {lastHttpStatus === null
                          ? "No request result yet"
                          : `Last HTTP status: ${lastHttpStatus}`}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 border-t border-white/[0.07] pt-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Terminal size={16} className="text-slate-400" />
                    <h3 className="text-sm font-medium text-white">
                      Latest API request
                    </h3>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-[#080b11]">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-3.5 py-3">
                      <span className="break-all font-mono text-[11px] text-slate-400">
                        POST {endpoint}
                      </span>
                      <button
                        type="button"
                        onClick={copyRequest}
                        disabled={!lastRequest}
                        className="flex shrink-0 items-center gap-1.5 rounded-md border border-white/[0.08] px-2 py-1.5 text-[10px] text-slate-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Copy size={12} />
                        {copied ? "Copied" : "Copy request"}
                      </button>
                    </div>

                    <pre className="overflow-x-auto whitespace-pre-wrap break-words p-4 font-mono text-xs leading-6 text-amber-200">
                      {lastRequest ?? "Send a message to inspect the request payload."}
                    </pre>
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
              Live agent requests · Results reflect actual API responses.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
