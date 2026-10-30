import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "./api";
import { Search } from "lucide-react";
import {
  PageMasthead, StatusTag, SkeletonRows, EmptyState,
  formatDate, formatMoney, thClass, tdClass,
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
    <div>
      <PageMasthead
        title="Orders"
        meta={`Order book — ${orders.length} ${orders.length === 1 ? "entry" : "entries"}`}
      />

      {/* Filters + search */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div
          className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-1 sm:mx-0 sm:gap-5 sm:px-0 sm:pb-0"
          aria-label="Filter orders by status"
        >
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              aria-current={filter === s ? "true" : undefined}
              className={`shrink-0 border-b-2 pb-2 pt-1 font-mono text-[10px] uppercase tracking-widest transition-colors duration-200 cursor-pointer sm:text-[11px] ${
                filter === s
                  ? "border-orange-500 font-medium text-zinc-950"
                  : "border-neutral-200 text-zinc-500 hover:border-neutral-400 hover:text-zinc-950"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="relative flex w-full items-center border-b border-neutral-200 transition-colors duration-200 focus-within:border-zinc-950 sm:w-64">
          <Search className="h-4 w-4 shrink-0 text-zinc-400" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search orders…"
            aria-label="Search orders"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent py-2.5 pl-2.5 text-sm text-zinc-950 placeholder-zinc-400 focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <SkeletonRows rows={6} />
      ) : orders.length === 0 ? (
        <EmptyState>No orders found. Clear the filters or search and the ledger will fill in.</EmptyState>
      ) : (
        <div className="border border-neutral-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
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
                    className="cursor-pointer border-b border-neutral-100 transition-colors duration-200 last:border-b-0 hover:bg-zinc-50"
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
