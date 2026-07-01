import sgMail from "@sendgrid/mail";

const FROM_EMAIL = "loudlayer000@gmail.com";
const FROM_NAME = "LOUDLAYER";

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

function isConfigured(): boolean {
  return !!process.env.SENDGRID_API_KEY;
}

function itemsTable(items: any[]): string {
  const rows = items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px">${i.product_name || i.name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:center">${i.size || "M"}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:center">${i.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:right">₵${(i.product_price ?? i.price ?? 0).toFixed(2)}</td>
        </tr>`
    )
    .join("");
  return `
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <thead>
        <tr style="background:#f5f5f5">
          <th style="padding:10px 12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Item</th>
          <th style="padding:10px 12px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Size</th>
          <th style="padding:10px 12px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Qty</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Price</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function total(items: any[]): string {
  const sum = items.reduce((s: number, i: any) => s + (i.product_price ?? i.price ?? 0) * i.quantity, 0);
  return `₵${sum.toFixed(2)}`;
}

const brandFooter = `
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#999;text-align:center">
    <p style="margin:2px 0">LOUDLAYER — Urban Fashion Collection</p>
    <p style="margin:2px 0">loudlayer000@gmail.com</p>
  </div>`;

function wrapHtml(title: string, body: string): string {
  return `
    <div style="max-width:560px;margin:0 auto;font-family:Helvetica,Arial,sans-serif;color:#1a1a1a">
      <div style="background:#1a1a1a;color:#fff;padding:24px 32px;border-radius:12px 12px 0 0">
        <h1 style="margin:0;font-size:18px;letter-spacing:2px;text-transform:uppercase">LOUDLAYER</h1>
      </div>
      <div style="padding:32px;background:#fff;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 12px 12px">
        <h2 style="margin:0 0 16px;font-size:20px">${title}</h2>
        ${body}
        ${brandFooter}
      </div>
    </div>`;
}

export async function sendOrderConfirmation(
  to: string,
  order: any,
  items: any[]
) {
  if (!isConfigured()) return;

  const body = `
    <p style="margin:0 0 8px;font-size:14px">Thank you for your order!</p>
    <p style="margin:0 0 4px;font-size:13px;color:#555"><strong>Order:</strong> ${order.order_number}</p>
    <p style="margin:0 0 4px;font-size:13px;color:#555"><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
    <p style="margin:0 0 4px;font-size:13px;color:#555"><strong>Status:</strong> ${order.status}</p>
    ${order.shipping_address ? `<p style="margin:0 0 16px;font-size:13px;color:#555"><strong>Shipping to:</strong> ${order.shipping_address}</p>` : ""}
    ${itemsTable(items)}
    <p style="text-align:right;font-size:16px;font-weight:bold;margin:8px 0 0">Total: ${total(items)}</p>
  `;

  await sgMail.send({
    from: { email: FROM_EMAIL, name: FROM_NAME },
    to,
    subject: `Order Confirmed — ${order.order_number}`,
    html: wrapHtml("Order Confirmed ✓", body),
  });
}

export async function sendAdminAlert(order: any, items: any[]) {
  if (!isConfigured()) return;

  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
  if (!adminEmail) return;

  const body = `
    <p style="margin:0 0 8px;font-size:14px">New order received!</p>
    <p style="margin:0 0 4px;font-size:13px;color:#555"><strong>Customer:</strong> ${order.customer_name}</p>
    <p style="margin:0 0 4px;font-size:13px;color:#555"><strong>Email:</strong> ${order.customer_email}</p>
    <p style="margin:0 0 4px;font-size:13px;color:#555"><strong>Order:</strong> ${order.order_number}</p>
    <p style="margin:0 0 16px;font-size:13px;color:#555"><strong>Total:</strong> ${total(items)}</p>
    ${itemsTable(items)}
  `;

  await sgMail.send({
    from: { email: FROM_EMAIL, name: FROM_NAME },
    to: adminEmail,
    subject: `New Order — ${order.order_number}`,
    html: wrapHtml("New Order Alert", body),
  });
}

export async function sendStatusUpdate(
  to: string,
  order: any,
  newStatus: string
) {
  if (!isConfigured()) return;

  const statusMessages: Record<string, string> = {
    shipped: "Your order is on its way!",
    delivered: "Your order has been delivered.",
    cancelled: "Your order has been cancelled.",
  };

  const message = statusMessages[newStatus] || `Your order status has been updated to "${newStatus}".`;

  const body = `
    <p style="margin:0 0 8px;font-size:14px">${message}</p>
    <p style="margin:0 0 4px;font-size:13px;color:#555"><strong>Order:</strong> ${order.order_number}</p>
    <p style="margin:0 0 4px;font-size:13px;color:#555"><strong>Status:</strong> ${newStatus}</p>
  `;

  await sgMail.send({
    from: { email: FROM_EMAIL, name: FROM_NAME },
    to,
    subject: `Order ${newStatus} — ${order.order_number}`,
    html: wrapHtml(`Order ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`, body),
  });
}