// ============================================================================
// Supabase Edge Function: send-order-emails
//
// Replaces server/mail.ts from the Express backend. Sends:
//   - type "created": order confirmation to the customer + alert to the admin
//   - type "status":  shipped/delivered/cancelled notification to the customer
//
// Security: the caller's JWT is forwarded to PostgREST, so RLS decides which
// orders are visible. Customers can only trigger mail for their own order;
// status mails additionally require the caller to be an admin.
//
// Secrets (supabase secrets set ...):
//   SENDGRID_API_KEY
//   ADMIN_NOTIFY_EMAIL
//   SENDGRID_FROM_EMAIL   (optional, defaults to ADMIN_NOTIFY_EMAIL)
//
// Deploy: supabase functions deploy send-order-emails
// ============================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.118.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface OrderItem {
  product_name: string;
  product_price: number | string;
  quantity: number;
  size?: string;
}

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  status: string;
  total: number | string;
  created_at: string;
}

const FROM_EMAIL = Deno.env.get("SENDGRID_FROM_EMAIL") || Deno.env.get("ADMIN_NOTIFY_EMAIL") || "";
const FROM_NAME = "LOUDLAYER";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function money(value: number | string): string {
  return `₵${Number(value ?? 0).toFixed(2)}`;
}

function itemsTable(items: OrderItem[]): string {
  const rows = items
    .map(
      (item) => `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px">${item.product_name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:center">${item.size || "M"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:center">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:right">${money(item.product_price)}</td>
      </tr>`
    )
    .join("");

  return `<table style="width:100%;border-collapse:collapse;margin:16px 0">
    <thead><tr style="background:#f5f5f5">
      <th style="padding:10px 12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Item</th>
      <th style="padding:10px 12px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Size</th>
      <th style="padding:10px 12px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Qty</th>
      <th style="padding:10px 12px;text-align:right;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Price</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function itemsTotal(items: OrderItem[]): string {
  const sum = items.reduce(
    (total, item) => total + Number(item.product_price ?? 0) * item.quantity,
    0
  );
  return money(sum);
}

function wrapHtml(title: string, body: string): string {
  return `<div style="max-width:560px;margin:0 auto;font-family:Helvetica,Arial,sans-serif;color:#1a1a1a">
    <div style="background:#1a1a1a;color:#fff;padding:24px 32px;border-radius:12px 12px 0 0">
      <h1 style="margin:0;font-size:18px;letter-spacing:2px;text-transform:uppercase">LOUDLAYER</h1>
    </div>
    <div style="padding:32px;background:#fff;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 12px 12px">
      <h2 style="margin:0 0 16px;font-size:20px">${title}</h2>
      ${body}
      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#999;text-align:center">
        <p style="margin:2px 0">LOUDLAYER — Urban Fashion Collection</p>
        <p style="margin:2px 0">${FROM_EMAIL}</p>
      </div>
    </div>
  </div>`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = Deno.env.get("SENDGRID_API_KEY");
  if (!apiKey) {
    console.warn("SENDGRID_API_KEY is not set — skipping email to", to);
    return;
  }

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject,
      content: [{ type: "text/html", value: html }],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`SendGrid ${response.status}: ${detail.slice(0, 400)}`);
  }
}

function confirmationEmail(order: Order, items: OrderItem[]) {
  const body = `
    <p style="margin:0 0 8px;font-size:14px">Thank you for your order!</p>
    <p style="margin:0 0 4px;font-size:13px;color:#555"><strong>Order:</strong> ${order.order_number}</p>
    <p style="margin:0 0 4px;font-size:13px;color:#555"><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
    <p style="margin:0 0 4px;font-size:13px;color:#555"><strong>Status:</strong> ${order.status}</p>
    ${order.shipping_address ? `<p style="margin:0 0 16px;font-size:13px;color:#555"><strong>Shipping to:</strong> ${order.shipping_address}</p>` : ""}
    ${itemsTable(items)}
    <p style="text-align:right;font-size:16px;font-weight:bold;margin:8px 0 0">Total: ${itemsTotal(items)}</p>`;

  return {
    subject: `Order Confirmed — ${order.order_number}`,
    html: wrapHtml("Order Confirmed ✓", body),
  };
}

function adminAlertEmail(order: Order, items: OrderItem[]) {
  const body = `
    <p style="margin:0 0 8px;font-size:14px">New order received!</p>
    <p style="margin:0 0 4px;font-size:13px;color:#555"><strong>Customer:</strong> ${order.customer_name}</p>
    <p style="margin:0 0 4px;font-size:13px;color:#555"><strong>Email:</strong> ${order.customer_email}</p>
    <p style="margin:0 0 4px;font-size:13px;color:#555"><strong>Order:</strong> ${order.order_number}</p>
    <p style="margin:0 0 16px;font-size:13px;color:#555"><strong>Total:</strong> ${itemsTotal(items)}</p>
    ${itemsTable(items)}`;

  return {
    subject: `New Order — ${order.order_number}`,
    html: wrapHtml("New Order Alert", body),
  };
}

function statusEmail(order: Order, status: string) {
  const messages: Record<string, string> = {
    shipped: "Your order is on its way!",
    delivered: "Your order has been delivered.",
    cancelled: "Your order has been cancelled.",
  };
  const message = messages[status] || `Your order status has been updated to "${status}".`;
  const body = `
    <p style="margin:0 0 8px;font-size:14px">${message}</p>
    <p style="margin:0 0 4px;font-size:13px;color:#555"><strong>Order:</strong> ${order.order_number}</p>
    <p style="margin:0 0 4px;font-size:13px;color:#555"><strong>Status:</strong> ${status}</p>`;

  return {
    subject: `Order ${status} — ${order.order_number}`,
    html: wrapHtml(`Order ${status.charAt(0).toUpperCase() + status.slice(1)}`, body),
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization) {
    return json({ error: "Unauthorized" }, 401);
  }

  let payload: { orderId?: number; type?: string; status?: string };
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const orderId = Number(payload.orderId);
  const type = payload.type === "status" ? "status" : "created";
  if (!Number.isFinite(orderId) || orderId <= 0) {
    return json({ error: "orderId is required" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } }
  );

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return json({ error: "Unauthorized" }, 401);
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) return json({ error: orderError.message }, 400);
  if (!order) return json({ error: "Order not found" }, 404);

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("product_name, product_price, quantity, size")
    .eq("order_id", orderId);

  if (itemsError) return json({ error: itemsError.message }, 400);

  const sent: string[] = [];

  try {
    if (type === "created") {
      const confirmation = confirmationEmail(order as Order, (items || []) as OrderItem[]);
      await sendEmail(order.customer_email, confirmation.subject, confirmation.html);
      sent.push("customer");

      const adminEmail = Deno.env.get("ADMIN_NOTIFY_EMAIL");
      if (adminEmail) {
        const alert = adminAlertEmail(order as Order, (items || []) as OrderItem[]);
        await sendEmail(adminEmail, alert.subject, alert.html);
        sent.push("admin");
      }
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .maybeSingle();

      if (profile?.role !== "admin") {
        return json({ error: "Admin access required" }, 403);
      }

      const status = payload.status || order.status;
      if (!["shipped", "delivered", "cancelled"].includes(status)) {
        return json({ error: "No email is sent for this status" }, 400);
      }

      const email = statusEmail(order as Order, status);
      await sendEmail(order.customer_email, email.subject, email.html);
      sent.push("customer");
    }
  } catch (error) {
    console.error("send-order-emails failed:", error);
    return json({ error: error instanceof Error ? error.message : "Email send failed" }, 502);
  }

  return json({ success: true, sent });
});
