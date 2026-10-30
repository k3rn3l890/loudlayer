import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminApi } from "./api";
import { notifyOrderEmails } from "../lib/userApi";
import { resolveImage } from "../lib/supabase";
import { ArrowLeft, ChevronDown } from "lucide-react";
import {
  PageMasthead, MonoCaption, StatusTag, Skeleton, SkeletonRows, EmptyState,
  formatDateTime, formatMoney,
} from "./ui";

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

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = () => {
    adminApi.getOrder(id!)
      .then((data) => { setOrder(data.order); setItems(data.items); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      const order = await adminApi.updateOrderStatus(id!, newStatus);
      setOrder(order);
      if (["shipped", "delivered", "cancelled"].includes(newStatus)) {
        void notifyOrderEmails(Number(order.id), "status", newStatus);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl">
        <div className="mb-6 border-b border-neutral-200 pb-5 sm:mb-8 sm:pb-6">
          <Skeleton className="h-8 w-56 sm:h-10 sm:w-72" />
          <Skeleton className="mt-3 h-2.5 w-44" />
        </div>
        <div className="mb-6 grid grid-cols-1 gap-px border border-neutral-200 bg-neutral-200 sm:grid-cols-2">
          <div className="space-y-2.5 bg-white px-4 py-4 sm:px-5 sm:py-5">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
          <div className="space-y-2.5 bg-white px-4 py-4 sm:px-5 sm:py-5">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
        <SkeletonRows rows={4} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl">
        <EmptyState>Order not found. It may have been removed from the ledger.</EmptyState>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => navigate("/admin/orders")}
        className="mb-5 inline-flex cursor-pointer items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-zinc-500 transition-colors duration-200 hover:text-zinc-950 sm:text-[11px]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to orders
      </button>

      <PageMasthead
        title={<span>Order {order.order_number}</span>}
        meta={`Created ${formatDateTime(order.created_at)}`}
        actions={<StatusTag status={order.status} />}
      />

      {/* Customer + Shipping spec sheet */}
      <section className="mb-4 grid grid-cols-1 border border-neutral-200 bg-white sm:mb-6 sm:grid-cols-2" aria-label="Order details">
        <div className="border-b border-neutral-200 px-4 py-4 sm:border-b-0 sm:border-r sm:px-5 sm:py-5">
          <MonoCaption>Customer</MonoCaption>
          <p className="mt-2.5 text-sm font-medium text-zinc-950">{order.customer_name || "—"}</p>
          <p className="mt-1 break-all font-mono text-xs text-zinc-500">{order.customer_email}</p>
          {order.customer_phone && (
            <p className="mt-0.5 font-mono text-xs text-zinc-500">{order.customer_phone}</p>
          )}
        </div>
        <div className="px-4 py-4 sm:px-5 sm:py-5">
          <MonoCaption>Shipping</MonoCaption>
          <p className="mt-2.5 text-sm text-zinc-600 whitespace-pre-line">{order.shipping_address || "—"}</p>
        </div>
      </section>

      {/* Items ledger */}
      <section className="mb-4 border border-neutral-200 bg-white sm:mb-6" aria-label="Order items">
        <div className="border-b border-neutral-200 px-4 py-3 sm:px-5">
          <MonoCaption>Items</MonoCaption>
        </div>
        {items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-zinc-500 sm:px-5">No items on this order.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-3.5">
                <div className="h-11 w-9 shrink-0 overflow-hidden border border-neutral-200 bg-zinc-100 sm:h-12 sm:w-10">
                  <img
                    src={resolveImage(item.image)}
                    alt={item.product_name}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-950">{item.product_name}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-zinc-500">
                    {formatMoney(item.product_price)} × {item.quantity}
                    {item.size ? ` (${item.size})` : ""}
                  </p>
                </div>
                <p className="whitespace-nowrap font-mono text-xs font-semibold text-zinc-950 tabular-nums sm:text-sm">
                  {formatMoney(item.product_price * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3.5 sm:px-5">
          <MonoCaption>Total</MonoCaption>
          <p className="font-mono text-base font-semibold text-zinc-950 tabular-nums sm:text-lg">
            {formatMoney(order.total)}
          </p>
        </div>
      </section>

      {/* Status control */}
      <section className="border border-neutral-200 bg-white px-4 py-4 sm:px-5 sm:py-5" aria-label="Update status">
        <label htmlFor="order-status" className="block">
          <MonoCaption>Update status</MonoCaption>
          <div className="relative mt-2.5 max-w-xs">
            <select
              id="order-status"
              value={order.status}
              disabled={updating}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full cursor-pointer appearance-none rounded-none border border-neutral-200 bg-white py-2.5 pl-3 pr-9 font-mono text-xs uppercase tracking-widest text-zinc-950 transition-colors duration-200 focus:border-zinc-950 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:cursor-wait disabled:opacity-50"
            >
              {VALID_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" strokeWidth={1.5} />
          </div>
        </label>
        <p className="mt-2.5 font-mono text-[10px] uppercase tracking-widest text-zinc-400" role="status">
          {updating ? "Updating…" : "Select to move this order along"}
        </p>
      </section>

      {/* Notes */}
      {order.notes && (
        <section className="mt-4 border-l-2 border-neutral-300 pl-4" aria-label="Order notes">
          <MonoCaption>Notes</MonoCaption>
          <p className="mt-2 text-sm text-zinc-600">{order.notes}</p>
        </section>
      )}
    </div>
  );
}
