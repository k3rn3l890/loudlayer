import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "./api";
import { Search } from "lucide-react";
import {
  PageMasthead, StatusTag, SkeletonRows, EmptyState,
  cardClass, formatDate, formatMoney, thClass, tdClass,
} from "./ui";

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total: number;
  status: string;
  created_at: string;
}

const STATUSES = ["all", "pending", "processing", "shipped", "delivered", "cancelled"];

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchOrders = () => {
    setLoading(true);
    adminApi.getOrders({ status: filter, search })
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, [filter, search]);

  return (
    <div className="space-y-5">
      <PageMasthead
        title="Orders"
        meta={`Order book — ${orders.length} ${orders.length === 1 ? "entry" : "entries"}`}
      />

      {/* Segmented filter + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="flex max-w-full gap-1 overflow-x-auto rounded-lg bg-zinc-100 p-1"
          aria-label="Filter orders by status"
        >
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              aria-current={filter === s ? "true" : undefined}
              className={`shrink-0 cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-all duration-150 ${
                filter === s
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-950"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search orders…"
            aria-label="Search orders"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-950 placeholder-zinc-400 transition-colors duration-150 focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/10"
          />
        </div>
      </div>

      {loading ? (
        <SkeletonRows rows={6} />
      ) : orders.length === 0 ? (
        <EmptyState
          action={
            <button
              onClick={() => { setFilter("all"); setSearch(""); }}
              className="h-10 cursor-pointer rounded-full border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-700 transition-colors duration-150 hover:border-zinc-950 hover:text-zinc-950"
            >
              Clear filters
            </button>
          }
        >
          No orders match this view. Clear the filters or search to see the full order book.
        </EmptyState>
      ) : (
        <div className={cardClass}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th scope="col" className={thClass}>Order #</th>
                  <th scope="col" className={thClass}>Customer</th>
                  <th scope="col" className={`${thClass} hidden sm:table-cell`}>Email</th>
                  <th scope="col" className={`${thClass} text-right`}>Total</th>
                  <th scope="col" className={thClass}>Status</th>
                  <th scope="col" className={`${thClass} hidden md:table-cell`}>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="cursor-pointer border-b border-zinc-100 transition-colors duration-150 last:border-b-0 hover:bg-zinc-50"
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                  >
                    <td className={`${tdClass} whitespace-nowrap font-mono text-xs font-semibold text-zinc-950`}>
                      {order.order_number}
                    </td>
                    <td className={`${tdClass} max-w-40 truncate text-zinc-600`}>
                      {order.customer_name || "—"}
                    </td>
                    <td className={`${tdClass} hidden max-w-56 truncate font-mono text-[11px] text-zinc-500 sm:table-cell`}>
                      {order.customer_email || "—"}
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
    </div>
  );
}
