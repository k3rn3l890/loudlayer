import { Inbox } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

/**
 * Shared "LoudLayer Admin v2" fintech primitives.
 *
 * Light financial-dashboard system: soft gray canvas, white rounded cards with
 * whisper shadows and hairline borders, tinted status chips, compact sans
 * headings, mono uppercase captions, tabular figures. Brand orange is reserved
 * for focus rings, active markers and CTA hovers — never body text.
 */

export const cardClass =
  "rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]";

export const cardTitle = "text-sm font-semibold text-zinc-950";

export const STATUS_DOTS: Record<string, string> = {
  pending: "bg-amber-500",
  processing: "bg-blue-500",
  shipped: "bg-violet-500",
  delivered: "bg-emerald-500",
  cancelled: "bg-red-500",
};

export const STATUS_ORDER = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;

type Tone = { chip: string; dot: string };

const STATUS_CHIPS: Record<string, Tone> = {
  pending: { chip: "bg-amber-50 text-amber-700 ring-amber-600/20", dot: "bg-amber-500" },
  processing: { chip: "bg-blue-50 text-blue-700 ring-blue-600/20", dot: "bg-blue-500" },
  shipped: { chip: "bg-violet-50 text-violet-700 ring-violet-600/20", dot: "bg-violet-500" },
  delivered: { chip: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", dot: "bg-emerald-500" },
  cancelled: { chip: "bg-red-50 text-red-700 ring-red-600/20", dot: "bg-red-500" },
};

export const TONE_ACTIVE: Tone = { chip: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", dot: "bg-emerald-500" };
export const TONE_NEUTRAL: Tone = { chip: "bg-zinc-100 text-zinc-600 ring-zinc-600/10", dot: "bg-zinc-400" };

export function StatusTag({
  status,
  tone,
  className = "",
}: {
  status: string;
  tone?: Tone;
  className?: string;
}) {
  const conf = tone ?? STATUS_CHIPS[status] ?? TONE_NEUTRAL;
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${conf.chip} ${className}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${conf.dot}`} />
      {status}
    </span>
  );
}

export function MonoCaption({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-zinc-500 ${className}`}>
      {children}
    </span>
  );
}

export function PageMasthead({
  title,
  meta,
  actions,
  className = "",
}: {
  title: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={`mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">{title}</h1>
        {meta ? <p className="mt-1 text-sm text-zinc-500">{meta}</p> : null}
      </div>
      {actions ? <div className="shrink-0 self-start sm:self-auto">{actions}</div> : null}
    </header>
  );
}

export function Skeleton({ className = "" }: ComponentProps<"div">) {
  return <div aria-hidden="true" className={`skeleton bg-zinc-200/70 ${className}`} />;
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading" className={cardClass}>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-zinc-100 px-4 py-4 last:border-b-0 sm:gap-6 sm:px-6"
        >
          <Skeleton className="h-3 w-16 sm:w-24" />
          <Skeleton className="h-3 max-w-40 flex-[2]" />
          <Skeleton className="ml-auto h-3 w-10" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={`${cardClass} px-6 py-14 text-center sm:py-20`}>
      <div className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-xl bg-zinc-100">
        <Inbox className="h-5 w-5 text-zinc-400" strokeWidth={1.5} />
      </div>
      <p className="mx-auto max-w-md text-sm leading-relaxed text-zinc-500">{children}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/* ---------- Table class conventions ---------- */

export const thClass =
  "px-3 py-2.5 text-left align-middle font-mono text-[10px] font-medium uppercase tracking-widest text-zinc-500 whitespace-nowrap sm:px-6 sm:py-3";

export const tdClass =
  "px-3 py-3 align-middle text-xs sm:px-6 sm:py-3.5 sm:text-sm";

export const pageLink =
  "inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-zinc-600 transition-colors duration-150 hover:text-zinc-950 sm:text-[15px]";

/* ---------- Formatting helpers ---------- */

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d
    .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    .toUpperCase();
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  return `${formatDate(iso)} · ${time.toUpperCase()}`;
}

export function formatMoney(n: number): string {
  return `₵${n.toFixed(2)}`;
}
