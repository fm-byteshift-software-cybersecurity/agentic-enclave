
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Bot,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldAlert,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import LabSidebar from "@/components/layout/LabSidebar";
import { ApiError, apiGet, apiPost } from "@/lib/api";

type DemoMode = "vulnerable" | "hardened";

interface AuthenticatedUser {
  user_id: number;
  email: string;
}

interface LabOrder {
  id: number;
  customer_id: number;
  status: string;
}

interface LabOrdersResponse {
  orders: LabOrder[];
}

interface AgentResponse {
  message: string;
  order_id: number;
  order_status: string;
  order_owner_id: number;
}

interface ChatMessage {
  id: number;
  role: "assistant" | "user";
  content: string;
  httpStatus?: number;
  orderId?: number;
  orderStatus?: string;
  orderOwnerId?: number;
  error?: boolean;
}

const initialMessage: ChatMessage = {
  id: 0,
  role: "assistant",
  content:
    "I'm the Orders Agent. Ask me to cancel an order from the list below, then compare both implementations.",
};

function errorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : "An unexpected error occurred. Please try again.";
}

export default function ScenarioBola() {
  const [mode, setMode] = useState<DemoMode>("vulnerable");
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const endpoint =
    mode === "vulnerable"
      ? "/api/vulnerable/orders/cancel"
      : "/api/orders/cancel";

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    setError(null);

    try {
      const response = await apiGet<LabOrdersResponse>(
        "/api/lab/sec-01/orders",
      );
      setOrders(response.orders);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadContext() {
      const [userResult, ordersResult] = await Promise.allSettled([
        apiGet<AuthenticatedUser>("/api/auth/me"),
        apiGet<LabOrdersResponse>("/api/lab/sec-01/orders"),
      ]);

      if (!active) return;

      if (userResult.status === "fulfilled") {
        setUser(userResult.value);
      } else {
        setError(`Could not load your session: ${errorMessage(userResult.reason)}`);
      }

      if (ordersResult.status === "fulfilled") {
        setOrders(ordersResult.value.orders);
      } else {
        setError((current) =>
          current
            ? `${current} Orders could not be loaded: ${errorMessage(ordersResult.reason)}`
            : `Could not load orders: ${errorMessage(ordersResult.reason)}`,
        );
      }

      setOrdersLoading(false);
    }

    void loadContext();

    return () => {
      active = false;
    };
  }, []);

  function changeMode(nextMode: DemoMode) {
    if (loading || mode === nextMode) return;

    setMode(nextMode);
    setMessages([
      {
        ...initialMessage,
        content:
          nextMode === "vulnerable"
            ? "Vulnerable mode is active. Try cancelling an order owned by another user in your lab."
            : "Hardened mode is active. Try cancelling another user's order and compare the authorization result.",
      },
    ]);
    setNotice(null);
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const userInput = input.trim();
    if (!userInput || loading || !user) return;

    setMessages((current) => [
      ...current,
      { id: Date.now(), role: "user", content: userInput },
    ]);
    setInput("");
    setLoading(true);
    setNotice(null);

    try {
      const response = await apiPost<AgentResponse>(endpoint, {
        user_input: userInput,
      });

      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: response.message,
          httpStatus: 200,
          orderId: response.order_id,
          orderStatus: response.order_status,
          orderOwnerId: response.order_owner_id,
        },
      ]);

      setNotice("Request completed. Orders refreshed.");
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;

      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: errorMessage(err),
          httpStatus: status,
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
      await loadOrders();
    }
  }

  async function resetLab() {
    if (resetting || loading) return;

    const confirmed = window.confirm(
      "Reset all orders in your lab to pending? Orders, IDs, and owners will be preserved.",
    );

    if (!confirmed) return;

    setResetting(true);
    setNotice(null);
    setError(null);

    try {
      await apiPost("/api/lab/sec-01/reset", {});
      setNotice("Lab reset complete. All order statuses are pending.");
      await loadOrders();
    } catch (err) {
      setError(`Reset failed: ${errorMessage(err)}`);
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-200 md:flex">
      <LabSidebar activeScenario="SEC-01" />

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-5xl px-5 py-7 sm:px-8 sm:py-9">
          <div className="mb-7 text-xs text-slate-500">
            Security Lab <span className="mx-2">/</span> SEC-01
          </div>

          <header className="border-b border-white/[0.08] pb-6">
            <div className="text-xs font-medium text-emerald-300">
              SEC-01 · API Security
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Broken Object Level Authorization
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Can an authenticated user cancel someone else&apos;s order? Test
              it in both implementations.
            </p>
          </header>

          <section className="border-b border-white/[0.08] py-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-white">Your lab</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Orders in your lab. Compare the owner ID with your user ID.
                </p>
              </div>

              <button
                type="button"
                onClick={resetLab}
                disabled={resetting || loading || ordersLoading || !user}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-400/20 px-3 py-2 text-xs text-amber-200 transition hover:bg-amber-400/[0.06] disabled:opacity-40"
              >
                {resetting ? (
                  <LoaderCircle size={14} className="animate-spin" />
                ) : (
                  <RotateCcw size={14} />
                )}
                {resetting ? "Resetting…" : "Reset lab"}
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <UserRound size={14} />
                  Authenticated user
                </div>
                <p className="mt-2 font-mono text-lg font-semibold text-white">
                  {user ? `#${user.user_id}` : "Loading…"}
                </p>
                {user && (
                  <p className="mt-1 break-all text-xs text-slate-500">
                    {user.email}
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4">
                <p className="text-xs text-slate-500">Lab orders</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {ordersLoading ? "…" : orders.length}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Restricted to your authenticated lab
                </p>
              </div>
            </div>

            {error && (
              <div role="alert" className="mt-4 text-xs text-red-300">
                {error}
              </div>
            )}

            {notice && (
              <div role="status" className="mt-4 text-xs text-emerald-300">
                {notice}
              </div>
            )}

            <div className="mt-4 overflow-x-auto rounded-lg border border-white/[0.08]">
              <table className="w-full min-w-[350px] text-left text-xs">
                <thead className="border-b border-white/[0.08] bg-white/[0.02] text-[10px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Order ID</th>
                    <th className="px-4 py-3 font-medium">Owner ID</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {ordersLoading ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                        <LoaderCircle size={14} className="mx-auto animate-spin" />
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                        No orders found.
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3 font-mono text-slate-200">
                          #{order.id}
                        </td>
                        <td className="px-4 py-3 font-mono text-amber-200">
                          {order.customer_id}
                          {user?.user_id === order.customer_id && (
                            <span className="ml-2 font-sans text-[10px] text-emerald-300">
                              You
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {order.status}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] text-slate-600">
                Reset sets statuses to pending. Orders and IDs are preserved.
              </p>
              <button
                type="button"
                onClick={() => void loadOrders()}
                disabled={ordersLoading || resetting}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-white disabled:opacity-40"
              >
                <RefreshCw size={12} />
                Refresh orders
              </button>
            </div>
          </section>

          <section className="py-6">
            <h2 className="text-base font-semibold text-white">Try it</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Select a mode, then ask the agent to cancel an order from the
              table above.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => changeMode("vulnerable")}
                disabled={loading}
                aria-pressed={mode === "vulnerable"}
                className={`rounded-lg border p-3 text-left transition disabled:opacity-40 ${
                  mode === "vulnerable"
                    ? "border-red-400/30 bg-red-400/[0.06]"
                    : "border-white/[0.08] hover:border-white/20"
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-medium text-white">
                  <ShieldAlert size={16} className="text-red-300" />
                  Vulnerable
                </span>
                <p className="mt-1.5 text-xs leading-5 text-slate-500">
                  Order ownership is not enforced during cancellation.
                </p>
              </button>

              <button
                type="button"
                onClick={() => changeMode("hardened")}
                disabled={loading}
                aria-pressed={mode === "hardened"}
                className={`rounded-lg border p-3 text-left transition disabled:opacity-40 ${
                  mode === "hardened"
                    ? "border-emerald-400/30 bg-emerald-400/[0.06]"
                    : "border-white/[0.08] hover:border-white/20"
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-medium text-white">
                  <ShieldCheck size={16} className="text-emerald-300" />
                  Hardened
                </span>
                <p className="mt-1.5 text-xs leading-5 text-slate-500">
                  The backend checks whether you can cancel the order.
                </p>
              </button>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b1018]">
              <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-3">
                <Bot size={16} className="text-emerald-300" />
                <span className="text-sm font-medium text-white">
                  Orders Agent
                </span>
                <span className="ml-auto font-mono text-[10px] text-slate-500">
                  {mode === "vulnerable" ? "VULNERABLE" : "HARDENED"}
                </span>
              </div>

              <div
                className="flex max-h-[440px] min-h-48 flex-col gap-4 overflow-y-auto p-4"
                aria-live="polite"
                aria-label="Agent conversation"
              >
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <Bot size={16} className="mt-1 shrink-0 text-emerald-300" />
                    )}
                    <div
                      className={`max-w-[88%] rounded-lg border px-3 py-2.5 ${
                        message.role === "user"
                          ? "border-white/[0.08] bg-white/[0.05]"
                          : message.error
                            ? "border-red-400/15 bg-red-400/[0.04]"
                            : "border-white/[0.06] bg-white/[0.02]"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words text-xs leading-6 text-slate-300">
                        {message.content}
                      </p>

                      {message.httpStatus !== undefined && (
                        <p
                          className={`mt-2 text-[10px] ${
                            message.error ? "text-red-300" : "text-emerald-300"
                          }`}
                        >
                          HTTP {message.httpStatus}
                          {message.orderId !== undefined &&
                            message.orderStatus &&
                            ` · Order #${message.orderId}: ${message.orderStatus}`}
                          {message.orderOwnerId !== undefined &&
                            ` · Owner ID: ${message.orderOwnerId}`}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <LoaderCircle size={14} className="animate-spin" />
                    Agent is processing…
                  </div>
                )}
              </div>

              <form
                onSubmit={sendMessage}
                className="border-t border-white/[0.07] p-3"
              >
                <label htmlFor="bola-message" className="sr-only">
                  Message the Orders Agent
                </label>
                <div className="flex items-end gap-2 rounded-lg border border-white/[0.1] bg-[#080b11] p-2 focus-within:border-emerald-300/30">
                  <textarea
                    id="bola-message"
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
                    disabled={loading || !user}
                    rows={2}
                    maxLength={2000}
                    placeholder="e.g. Cancel order 1844."
                    className="min-w-0 flex-1 resize-y bg-transparent px-2 py-1.5 text-sm text-slate-200 outline-none placeholder:text-slate-600 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim() || !user}
                    aria-label="Send message"
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-300 text-[#08110e] hover:bg-emerald-200 disabled:opacity-40"
                  >
                    {loading ? (
                      <LoaderCircle size={16} className="animate-spin" />
                    ) : (
                      <Send size={15} />
                    )}
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-slate-600">
                  Enter to send · Shift+Enter for a new line
                </p>
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
