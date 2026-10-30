import type { ReactNode } from "react";

/**
 * Shared "LoudLayer Ledger" primitives for the admin.
 *
 * Editorial system: ink on paper, 1px hairlines instead of cards and shadows,
 * mono uppercase captions, tabular figures, and statuses rendered as a colored
 * dot + text (never color alone). Orange-500 is reserved for markers, dots,
 * focus rings and CTA hovers — it is never used as a text color.
 */

const STATUS_DOTS: Record<string, string> = {
  pending: "bg-amber-500",
  processing: "bg-blue-500",
  shipped: "bg-violet-500",
  delivered: "bg-green-600",
  cancelled: "bg-red-500",
};

export function StatusTag({
  status,
  dotColor,
  className = "",
}: {
  status: string;
  dotColor?: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 whitespace-nowrap ${className}`}>
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor ?? STATUS_DOTS[status] ?? "bg-zinc-400"}`}
      />
      <span className="font-mono text-[10px] sm:text-[11px] font-medium uppercase tracking-widest text-zinc-950">
        {status}
      </span>
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
      className={`mb-6 flex flex-col gap-4 border-b border-neutral-200 pb-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:pb-6 ${className}`}
    >
      <div className="min-w-0">
        <h1 className="font-display text-3xl leading-[1.04] tracking-tight text-zinc-950 sm:text-4xl lg:text-[40px]">
          {title}
        </h1>
        {meta ? (
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-zinc-500 sm:text-[11px]">
            {meta}
          </p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0 self-start sm:self-auto">{actions}</div> : null}
    </header>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton bg-zinc-200/70 ${className}`} />;
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading" className="border border-neutral-200 bg-white">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-neutral-100 px-4 py-4 last:border-b-0 sm:gap-6 sm:px-6"
        >
          <Skeleton className="h-3 w-16 sm:w-24" />
          <Skeleton className="h-3 max-w-40 flex-[2]" />
          <Skeleton className="ml-auto h-3 w-10" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="border border-neutral-200 bg-white px-6 py-16 text-center sm:py-24">
      <p className="mx-auto max-w-md font-display text-xl italic leading-relaxed text-zinc-500 sm:text-2xl">
        {children}
      </p>
    </div>
  );
}

/* ---------- Ledger table class conventions ---------- */

export const thClass =
  "px-3 py-2.5 text-left align-middle font-mono text-[10px] font-medium uppercase tracking-widest text-zinc-500 whitespace-nowrap sm:px-6 sm:py-3";

export const tdClass =
  "px-3 py-3 align-middle text-xs sm:px-6 sm:py-3.5 sm:text-sm";

export const monoLink =
  "inline-flex cursor-pointer items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-zinc-500 underline decoration-neutral-300 underline-offset-4 transition-colors duration-200 hover:text-zinc-950 hover:decoration-orange-500 sm:text-[11px]";

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
