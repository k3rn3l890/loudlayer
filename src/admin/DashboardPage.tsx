import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "./api";
import {
  PageMasthead, MonoCaption, StatusTag, Skeleton, SkeletonRows, EmptyState,
  formatDate, formatMoney, thClass, tdClass, monoLink,
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

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getStats()
      .then((data) => {
        setStats(data.stats);
        setRecentOrders(data.recentOrders);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        {/* Masthead skeleton */}
        <div className="mb-6 border-b border-neutral-200 pb-5 sm:mb-8 sm:pb-6">
          <Skeleton className="h-8 w-44 sm:h-10 sm:w-56" />
          <Skeleton className="mt-3 h-2.5 w-60" />
        </div>

        {/* Stat strip skeleton */}
        <div className="mb-8 grid grid-cols-2 gap-px border border-neutral-200 bg-neutral-200 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="space-y-3 bg-white px-4 py-5 sm:px-6 sm:py-6">
              <Skeleton className="h-2.5 w-16 sm:w-20" />
              <Skeleton className="h-7 w-20 sm:h-8 sm:w-24" />
            </div>
          ))}
        </div>

        <SkeletonRows rows={5} />
      </div>
    );
  }

  const cards = [
    { label: "Total Revenue", value: formatMoney(stats?.totalRevenue ?? 0) },
    { label: "Total Orders", value: String(stats?.totalOrders ?? 0) },
    { label: "Products", value: String(stats?.totalProducts ?? 0) },
    { label: "Customers", value: String(stats?.totalCustomers ?? 0) },
  ];

  return (
    <div>
      <PageMasthead
        title="Dashboard"
        meta={`LoudLayer Ledger — ${formatDate(new Date().toISOString())}`}
        actions={
          <Link to="/admin/orders" className={monoLink}>
            View all orders <span aria-hidden="true">→</span>
          </Link>
        }
      />

      {/* Stat strip: one hairline lattice, no cards */}
      <section aria-label="Key figures" className="mb-8 grid grid-cols-2 gap-px border border-neutral-200 bg-neutral-200 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white px-4 py-5 sm:px-6 sm:py-6">
            <MonoCaption>{card.label}</MonoCaption>
            <p className="mt-2.5 text-2xl font-extrabold tracking-tight text-zinc-950 tabular-nums sm:text-3xl lg:text-[34px]">
              {card.value}
            </p>
          </div>
        ))}
      </section>

      {/* Recent orders — ledger */}
      <section aria-label="Recent orders">
        {recentOrders.length === 0 ? (
          <EmptyState>No orders yet — the ledger opens with your first sale.</EmptyState>
        ) : (
          <div className="border border-neutral-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
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
                      className="border-b border-neutral-100 transition-colors duration-200 last:border-b-0"
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
