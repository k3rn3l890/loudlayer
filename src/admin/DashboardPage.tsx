import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "./api";
import { DollarSign, ShoppingCart, Package, Users } from "lucide-react";
import {
  PageMasthead, MonoCaption, StatusTag, Skeleton, SkeletonRows, EmptyState,
  cardClass, cardTitle, pageLink, formatDate, formatMoney, thClass, tdClass,
  STATUS_DOTS, STATUS_ORDER,
} from "./ui";

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  ordersByStatus: { status: string; count: number }[];
}

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getStats(),
      adminApi.getOrders({ status: "all", search: "" }),
    ])
      .then(([data, orders]) => {
        setStats(data.stats);
        setRecentOrders(data.recentOrders);
        setAllOrders(orders);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-5">
        <div>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-2 h-3 w-56" />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className={`${cardClass} p-5`}>
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              <Skeleton className="mt-4 h-7 w-24" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className={`${cardClass} p-5 lg:col-span-2 lg:p-6`}>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-5 h-2.5 w-full rounded-full" />
            <div className="mt-4 space-y-2.5">
              {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-3.5 w-full" />)}
            </div>
          </div>
          <div className={`${cardClass} p-5 lg:p-6`}>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-5 h-8 w-28" />
            <Skeleton className="mt-3 h-3 w-36" />
          </div>
        </div>
        <SkeletonRows rows={4} />
      </div>
    );
  }

  /* ---- derived data (client-side only, from real API responses) ---- */

  const statusCounts = STATUS_ORDER.map((status) => ({
    status,
    count: stats?.ordersByStatus?.find((s) => s.status === status)?.count ?? 0,
  }));
  const totalStatusCount = statusCounts.reduce((sum, s) => sum + s.count, 0);

  const pendingOrders = allOrders.filter((o) => o.status === "pending");
  const pendingTotal = pendingOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  const dayWindow = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const dailyCounts = dayWindow.map((day) =>
    allOrders.filter((o) => {
      const t = new Date(o.created_at);
      return !Number.isNaN(t.getTime()) && t >= day && t < new Date(day.getTime() + DAY_MS);
    }).length
  );
  const dailyMax = Math.max(1, ...dailyCounts);

  const kpis = [
    { label: "Total Revenue", value: formatMoney(stats?.totalRevenue ?? 0), icon: DollarSign },
    { label: "Total Orders", value: String(stats?.totalOrders ?? 0), icon: ShoppingCart },
    { label: "Products", value: String(stats?.totalProducts ?? 0), icon: Package },
    { label: "Customers", value: String(stats?.totalCustomers ?? 0), icon: Users },
  ];

  return (
    <div className="space-y-5">
      <PageMasthead
        title="Dashboard"
        meta={formatDate(new Date().toISOString())}
        actions={
          <Link to="/admin/orders" className={pageLink}>
            View all orders <span aria-hidden="true">→</span>
          </Link>
        }
      />

      {/* KPI cards */}
      <section aria-label="Key figures" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`${cardClass} p-4 sm:p-5`}>
            <div className="flex items-center justify-between gap-2">
              <MonoCaption>{kpi.label}</MonoCaption>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-zinc-100">
                <kpi.icon className="h-4 w-4 text-zinc-600" strokeWidth={1.5} />
              </span>
            </div>
            <p className="mt-4 text-2xl font-semibold leading-none tracking-tight text-zinc-950 tabular-nums sm:text-[28px]">
              {kpi.value}
            </p>
          </div>
        ))}
      </section>

      {/* Instruments row */}
      <section className="grid gap-4 lg:grid-cols-3">
        {/* Order status distribution */}
        <div className={`${cardClass} p-5 lg:col-span-2 lg:p-6`}>
          <div className="flex items-center justify-between">
            <h2 className={cardTitle}>Order status</h2>
            <MonoCaption className="text-[10px]">Live totals</MonoCaption>
          </div>
          {totalStatusCount === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">No orders yet.</p>
          ) : (
            <>
              <div
                className="mt-4 flex h-2.5 gap-0.5 overflow-hidden rounded-full"
                role="img"
                aria-label={statusCounts.filter((s) => s.count > 0).map((s) => `${s.status}: ${s.count}`).join(", ")}
              >
                {statusCounts.filter((s) => s.count > 0).map((s) => (
                  <div
                    key={s.status}
                    className={STATUS_DOTS[s.status] ?? "bg-zinc-400"}
                    style={{ width: `${(s.count / totalStatusCount) * 100}%` }}
                  />
                ))}
              </div>
              <ul className="mt-4 space-y-2.5">
                {statusCounts.map((s) => (
                  <li key={s.status} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-sm capitalize text-zinc-600">
                      <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOTS[s.status] ?? "bg-zinc-400"}`} />
                      {s.status}
                    </span>
                    <span className={`font-mono text-xs tabular-nums ${s.count === 0 ? "text-zinc-400" : "text-zinc-950"}`}>
                      {s.count}
                      <span className="ml-2 text-zinc-400">{Math.round((s.count / totalStatusCount) * 100)}%</span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Money in flight */}
        <div className={`${cardClass} flex flex-col p-5 lg:p-6`}>
          <div className="flex items-center justify-between">
            <h2 className={cardTitle}>Money in flight</h2>
            <MonoCaption className="text-[10px]">Pending</MonoCaption>
          </div>
          <p className="mt-4 text-[28px] font-semibold leading-none tracking-tight text-zinc-950 tabular-nums">
            {formatMoney(pendingTotal)}
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            {pendingOrders.length > 0
              ? `${pendingOrders.length} ${pendingOrders.length === 1 ? "order" : "orders"} awaiting confirmation`
              : "Nothing pending right now."}
          </p>
          <Link to="/admin/orders" className={`${pageLink} mt-auto pt-4`}>
            Review orders <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {/* 7-day order flow */}
      <section className={`${cardClass} p-5 lg:p-6`} aria-label="Orders in the last 7 days">
        <div className="flex items-center justify-between">
          <h2 className={cardTitle}>Last 7 days</h2>
          <MonoCaption className="text-[10px]">Orders / day</MonoCaption>
        </div>
        <div className="mt-5 flex items-end gap-1.5 sm:gap-2">
          {dayWindow.map((day, i) => {
            const count = dailyCounts[i];
            const isToday = i === dayWindow.length - 1;
            const pct = count === 0 ? 3 : Math.max(8, (count / dailyMax) * 100);
            const dayLabel = day.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2).toUpperCase();
            const dayTitle = day.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            return (
              <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <div className="flex h-24 w-full items-end">
                  <div
                    title={`${count} ${count === 1 ? "order" : "orders"} · ${dayTitle}`}
                    style={{ height: `${pct}%` }}
                    className={`w-full rounded-md ${
                      count === 0 ? "bg-zinc-200" : isToday ? "bg-orange-500" : "bg-zinc-900"
                    }`}
                  />
                </div>
                <span className="font-mono text-[10px] uppercase text-zinc-400">{dayLabel}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent orders */}
      <section aria-label="Recent orders">
        {recentOrders.length === 0 ? (
          <EmptyState>No orders yet. Your first sale will show up here.</EmptyState>
        ) : (
          <div className={cardClass}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100">
                    <th scope="col" className={thClass}>Order</th>
                    <th scope="col" className={thClass}>Customer</th>
                    <th scope="col" className={`${thClass} text-right`}>Total</th>
                    <th scope="col" className={thClass}>Status</th>
                    <th scope="col" className={`${thClass} hidden md:table-cell`}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-zinc-100 transition-colors duration-150 last:border-b-0"
                    >
                      <td className={`${tdClass} whitespace-nowrap`}>
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="font-mono text-xs font-semibold text-zinc-950 underline-offset-4 hover:underline"
                        >
                          {order.order_number}
                        </Link>
                      </td>
                      <td className={`${tdClass} max-w-40 truncate text-zinc-600`}>
                        {order.customer_name || "—"}
                      </td>
                      <td className={`${tdClass} whitespace-nowrap text-right font-mono text-xs tabular-nums text-zinc-950`}>
                        {formatMoney(order.total)}
                      </td>
                      <td className={`${tdClass} whitespace-nowrap`}>
                        <StatusTag status={order.status} />
                      </td>
                      <td className={`${tdClass} hidden whitespace-nowrap font-mono text-[11px] text-zinc-500 md:table-cell`}>
                        {formatDate(order.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
