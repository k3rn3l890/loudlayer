import { useEffect, useState } from "react";
import { api } from "./api";
import { Package, ShoppingCart, DollarSign, Users } from "lucide-react";

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
    api.get<{ stats: Stats; recentOrders: Order[] }>("/dashboard/stats")
      .then((data) => {
        setStats(data.stats);
        setRecentOrders(data.recentOrders);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const cards = [
    { label: "Total Revenue", value: `₵${stats?.totalRevenue?.toFixed(2) || "0.00"}`, icon: DollarSign, color: "bg-green-500" },
    { label: "Total Orders", value: stats?.totalOrders || 0, icon: ShoppingCart, color: "bg-blue-500" },
    { label: "Products", value: stats?.totalProducts || 0, icon: Package, color: "bg-orange-500" },
    { label: "Customers", value: stats?.totalCustomers || 0, icon: Users, color: "bg-purple-500" },
  ];

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    processing: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-4 sm:mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl sm:rounded-2xl border border-neutral-200 p-3 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[10px] sm:text-xs font-medium text-neutral-400 font-mono uppercase tracking-wider">{card.label}</span>
              <div className={`w-7 h-7 sm:w-9 sm:h-9 ${card.color} rounded-lg sm:rounded-xl flex items-center justify-center`}>
                <card.icon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-neutral-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl border border-neutral-200">
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-neutral-100">
          <h2 className="text-sm font-bold text-neutral-900">Recent Orders</h2>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-6 sm:p-8 text-center text-sm text-neutral-400">No orders yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] sm:text-xs text-neutral-400 font-mono uppercase tracking-wider border-b border-neutral-100">
                  <th className="px-3 sm:px-5 py-2 sm:py-3 font-medium whitespace-nowrap">Order</th>
                  <th className="px-3 sm:px-5 py-2 sm:py-3 font-medium whitespace-nowrap">Customer</th>
                  <th className="px-3 sm:px-5 py-2 sm:py-3 font-medium whitespace-nowrap">Total</th>
                  <th className="px-3 sm:px-5 py-2 sm:py-3 font-medium whitespace-nowrap">Status</th>
                  <th className="px-3 sm:px-5 py-2 sm:py-3 font-medium whitespace-nowrap">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition">
                    <td className="px-3 sm:px-5 py-2 sm:py-3 font-mono text-[11px] sm:text-xs font-bold text-neutral-700 whitespace-nowrap">{order.order_number}</td>
                    <td className="px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm text-neutral-600 truncate max-w-[80px] sm:max-w-none">{order.customer_name || "—"}</td>
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
        )}
      </div>
    </div>
  );
}
