import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "./api";

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

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchOrders = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== "all") params.set("status", filter);
    if (search) params.set("search", search);
    api.get<{ orders: Order[] }>(`/orders?${params.toString()}`)
      .then((data) => setOrders(data.orders))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, [filter, search]);

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-4 sm:mb-6">Orders</h1>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 -mx-1 px-1 sm:mx-0 sm:px-0">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                filter === s
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search orders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-auto sm:ml-auto px-3 sm:px-4 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-900 placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-neutral-200 p-8 sm:p-12 text-center">
          <p className="text-sm text-neutral-400">No orders found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] sm:text-xs text-neutral-400 font-mono uppercase tracking-wider border-b border-neutral-100 bg-neutral-50/50">
                  <th className="px-3 sm:px-5 py-2 sm:py-3 font-medium whitespace-nowrap">Order #</th>
                  <th className="px-3 sm:px-5 py-2 sm:py-3 font-medium whitespace-nowrap">Customer</th>
                  <th className="px-3 sm:px-5 py-2 sm:py-3 font-medium whitespace-nowrap">Email</th>
                  <th className="px-3 sm:px-5 py-2 sm:py-3 font-medium whitespace-nowrap">Total</th>
                  <th className="px-3 sm:px-5 py-2 sm:py-3 font-medium whitespace-nowrap">Status</th>
                  <th className="px-3 sm:px-5 py-2 sm:py-3 font-medium whitespace-nowrap">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition cursor-pointer" onClick={() => window.location.href = `/admin/orders/${order.id}`}>
                    <td className="px-3 sm:px-5 py-2 sm:py-3 font-mono text-[11px] sm:text-xs font-bold text-neutral-700 whitespace-nowrap">{order.order_number}</td>
                    <td className="px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm text-neutral-600 truncate max-w-[80px] sm:max-w-none">{order.customer_name || "—"}</td>
                    <td className="px-3 sm:px-5 py-2 sm:py-3 text-[11px] sm:text-xs text-neutral-400 font-mono truncate max-w-[100px] sm:max-w-none">{order.customer_email || "—"}</td>
                    <td className="px-3 sm:px-5 py-2 sm:py-3 font-mono text-xs sm:text-sm font-bold whitespace-nowrap">₵{order.total.toFixed(2)}</td>
                    <td className="px-3 sm:px-5 py-2 sm:py-3 whitespace-nowrap">
                      <span className={`text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full uppercase tracking-wider ${statusColors[order.status] || "bg-neutral-100 text-neutral-600"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-5 py-2 sm:py-3 text-[11px] sm:text-xs text-neutral-400 font-mono whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString()}
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
