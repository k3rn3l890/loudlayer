import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "./api";
import { ArrowLeft } from "lucide-react";

interface OrderItem {
  id: number;
  product_name: string;
  product_price: number;
  quantity: number;
  size: string;
  image: string;
}

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  status: string;
  total: number;
  notes: string;
  created_at: string;
}

const VALID_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = () => {
    api.get<{ order: Order; items: OrderItem[] }>(`/orders/${id}`)
      .then((data) => { setOrder(data.order); setItems(data.items); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      const data = await api.patch<{ order: Order }>(`/orders/${id}/status`, { status: newStatus });
      setOrder(data.order);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return <div className="text-sm text-neutral-400">Order not found.</div>;
  }

  const statusIndex = VALID_STATUSES.indexOf(order.status);

  return (
    <div className="max-w-3xl">
      <button onClick={() => navigate("/admin/orders")} className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 mb-4 transition cursor-pointer">
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Back to Orders</span>
        <span className="sm:hidden">Orders</span>
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-neutral-900">
            Order <span className="font-mono">{order.order_number}</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-neutral-400 font-mono mt-0.5">
            Created {new Date(order.created_at).toLocaleString()}
          </p>
        </div>
        <span className={`self-start sm:self-auto text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full uppercase tracking-wider ${statusColors[order.status]}`}>
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white rounded-xl sm:rounded-2xl border border-neutral-200 p-4 sm:p-5">
          <h3 className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 sm:mb-3 font-mono">Customer</h3>
          <p className="text-sm font-medium text-neutral-900">{order.customer_name || "—"}</p>
          <p className="text-xs text-neutral-400 font-mono mt-0.5 break-all">{order.customer_email}</p>
          {order.customer_phone && <p className="text-xs text-neutral-400 font-mono mt-0.5">{order.customer_phone}</p>}
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl border border-neutral-200 p-4 sm:p-5">
          <h3 className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 sm:mb-3 font-mono">Shipping</h3>
          <p className="text-xs sm:text-sm text-neutral-600 whitespace-pre-line">{order.shipping_address || "—"}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl border border-neutral-200 overflow-hidden mb-4 sm:mb-6">
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-neutral-100">
          <h3 className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">Items</h3>
        </div>
        {items.length === 0 ? (
          <div className="p-4 sm:p-5 text-sm text-neutral-400">No items.</div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {items.map((item) => (
              <div key={item.id} className="px-4 sm:px-5 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-10 sm:w-10 sm:h-12 bg-zinc-100 rounded-lg overflow-hidden shrink-0">
                  <img src={item.image || "/placeholder-product.svg"} alt={item.product_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-neutral-900 truncate">{item.product_name}</p>
                  <p className="text-[11px] sm:text-xs text-neutral-400 font-mono">
                    ₵{item.product_price.toFixed(2)} x {item.quantity}
                    {item.size ? ` [${item.size}]` : ""}
                  </p>
                </div>
                <p className="font-mono font-bold text-xs sm:text-sm whitespace-nowrap">₵{(item.product_price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-t border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <span className="text-sm font-bold text-neutral-900">Total</span>
          <span className="font-mono font-bold text-base sm:text-lg">₵{order.total.toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl border border-neutral-200 p-4 sm:p-5">
        <h3 className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 sm:mb-3 font-mono">Update Status</h3>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {VALID_STATUSES.map((s, i) => {
            const isPast = i < statusIndex;
            const isCurrent = i === statusIndex;
            return (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={updating || isCurrent}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition cursor-pointer disabled:cursor-not-allowed ${
                  isCurrent
                    ? "bg-neutral-900 text-white"
                    : isPast
                    ? "bg-neutral-100 text-neutral-400"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
        {order.notes && (
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-neutral-100">
            <h4 className="text-[10px] sm:text-xs font-bold text-neutral-400 font-mono mb-1">Notes</h4>
            <p className="text-xs sm:text-sm text-neutral-600">{order.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
