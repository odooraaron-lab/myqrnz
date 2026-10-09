import "server-only";
import { Resend } from "resend";
import { site } from "@/config/site";

type Email = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

let client: Resend | null = null;

export async function sendEmail(email: Email): Promise<{ ok: boolean }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`\n[email] (RESEND_API_KEY not set — not sent)\nTo: ${email.to}\nSubject: ${email.subject}\n\n${email.text}\n`);
    return { ok: true };
  }
  client ??= new Resend(key);
  const { error } = await client.emails.send({
    from: process.env.EMAIL_FROM || `${site.name} <${site.contactEmail}>`,
    to: email.to,
    subject: email.subject,
    html: email.html,
    text: email.text,
    replyTo: email.replyTo,
  });
  if (error) {
    console.error("[email] send failed", error);
    return { ok: false };
  }
  return { ok: true };
}

function escape(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** A plain, sturdy email layout that renders in every client. */
function layout(title: string, bodyHtml: string) {
  return `<!doctype html><html><body style="margin:0;background:#F3F3EE;font-family:Arial,Helvetica,sans-serif;color:#1A1D2E">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #DEDDD5">
<tr><td style="padding:20px 28px;border-bottom:1px solid #DEDDD5;font-weight:bold;font-size:18px;letter-spacing:-0.2px">my<span style="color:#2546F0">QR</span></td></tr>
<tr><td style="padding:28px">
<h1 style="font-size:22px;line-height:1.25;margin:0 0 16px">${escape(title)}</h1>
${bodyHtml}
</td></tr></table>
<p style="font-size:12px;color:#6B6F80;margin:16px 0 0">${site.name} · ${site.rootDomain}</p>
</td></tr></table></body></html>`;
}

function button(href: string, label: string) {
  return `<p style="margin:24px 0"><a href="${href}" style="background:#2546F0;color:#ffffff;text-decoration:none;padding:12px 20px;display:inline-block;font-weight:bold">${escape(label)}</a></p>`;
}

function p(text: string) {
  return `<p style="font-size:15px;line-height:1.6;margin:0 0 12px">${text}</p>`;
}

export function welcomeEmail(opts: { shopName: string; shopUrl: string; dashboardUrl: string }) {
  const title = `${opts.shopName} has a home online`;
  return {
    subject: `Your shop address is ready: ${opts.shopUrl.replace(/^https?:\/\//, "")}`,
    html: layout(
      title,
      p(`Your address <strong>${escape(opts.shopUrl.replace(/^https?:\/\//, ""))}</strong> is yours.`) +
        p("Next: add a logo, list a few items, then print your QR code for the stall or counter.") +
        button(opts.dashboardUrl, "Open your dashboard"),
    ),
    text: `${title}\n\nYour address ${opts.shopUrl} is yours.\nNext: add a logo, list a few items, then print your QR code.\n\nDashboard: ${opts.dashboardUrl}`,
  };
}

export function passwordResetEmail(opts: { resetUrl: string }) {
  return {
    subject: "Reset your myQR password",
    html: layout(
      "Reset your password",
      p("Someone asked to reset the password for this email address. If that was you, choose a new one below. The link works for one hour.") +
        button(opts.resetUrl, "Choose a new password") +
        p(`<span style="color:#6B6F80">If you didn't ask for this, you can ignore this email — your password stays the same.</span>`),
    ),
    text: `Reset your password\n\nChoose a new password (link works for one hour):\n${opts.resetUrl}\n\nIf you didn't ask for this, ignore this email.`,
  };
}

export function enquiryEmail(opts: {
  shopName: string;
  fromName: string;
  fromEmail: string;
  phone?: string | null;
  message: string;
  itemTitle?: string | null;
  itemUrl?: string | null;
  inboxUrl: string;
}) {
  const about = opts.itemTitle ? ` about ${opts.itemTitle}` : "";
  const lines = [
    `<strong>${escape(opts.fromName)}</strong> &lt;${escape(opts.fromEmail)}&gt;${opts.phone ? ` · ${escape(opts.phone)}` : ""}`,
  ];
  if (opts.itemTitle && opts.itemUrl) lines.push(`Item: <a href="${opts.itemUrl}">${escape(opts.itemTitle)}</a>`);
  return {
    subject: `New enquiry${about} — ${opts.shopName}`,
    html: layout(
      `New enquiry${about}`,
      p(lines.join("<br>")) +
        `<blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #2546F0;background:#F6F6F2;font-size:15px;line-height:1.6;white-space:pre-wrap">${escape(opts.message)}</blockquote>` +
        p("Reply to this email to answer them directly.") +
        button(opts.inboxUrl, "Open your inbox"),
    ),
    text: `New enquiry${about}\n\nFrom: ${opts.fromName} <${opts.fromEmail}>${opts.phone ? `\nPhone: ${opts.phone}` : ""}${opts.itemUrl ? `\nItem: ${opts.itemUrl}` : ""}\n\n${opts.message}\n\nReply to this email to answer them directly.`,
  };
}

// ── Orders and payouts ─────────────────────────────────────────────────────

const money = (cents: number) =>
  new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD" }).format(cents / 100);

function rows(lines: [string, string][]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 16px;font-size:15px">${lines
    .map(
      ([a, b], i) =>
        `<tr><td style="padding:6px 0;${i === lines.length - 1 ? "font-weight:bold;border-top:1px solid #DEDDD5" : ""}">${escape(a)}</td><td align="right" style="padding:6px 0;${i === lines.length - 1 ? "font-weight:bold;border-top:1px solid #DEDDD5" : ""}">${escape(b)}</td></tr>`,
    )
    .join("")}</table>`;
}

type OrderMail = {
  number: number;
  shopName: string;
  itemTitle: string;
  quantity: number;
  unitPriceCents: number;
  shippingCents: number;
  totalCents: number;
  delivery: "post" | "pickup";
  trackUrl: string;
};

export function orderConfirmationEmail(o: OrderMail & { pickupInfo?: string | null }) {
  const title = `Thanks for your order from ${o.shopName}`;
  const lines: [string, string][] = [
    [`${o.itemTitle}${o.quantity > 1 ? ` × ${o.quantity}` : ""}`, money(o.unitPriceCents * o.quantity)],
    ...(o.delivery === "post" ? ([["Shipping", o.shippingCents ? money(o.shippingCents) : "Free"]] as [string, string][]) : []),
    ["Paid", money(o.totalCents)],
  ];
  const next =
    o.delivery === "post"
      ? `${escape(o.shopName)} will post it to you and let you know when it's on its way.`
      : `${escape(o.shopName)} will let you know when it's ready to collect.${o.pickupInfo ? ` ${escape(o.pickupInfo)}` : ""}`;
  return {
    subject: `Order #${o.number} confirmed — ${o.shopName}`,
    html: layout(title, p(`Order <strong>#${o.number}</strong>`) + rows(lines) + p(next) + button(o.trackUrl, "Track your order") + p(`<span style="color:#6B6F80">Payment was processed by myQR on behalf of ${escape(o.shopName)}.</span>`)),
    text: `${title}\n\nOrder #${o.number}\n${lines.map(([a, b]) => `${a}: ${b}`).join("\n")}\n\n${next.replace(/<[^>]+>/g, "")}\n\nTrack your order: ${o.trackUrl}`,
  };
}

export function newOrderEmail(o: OrderMail & { buyerName: string; feeCents: number; orderUrl: string; releaseDate: string }) {
  const title = `New order #${o.number}: ${o.itemTitle}`;
  const lines: [string, string][] = [
    ["Order total", money(o.totalCents)],
    ["myQR fee", `−${money(o.feeCents)}`],
    ["Added to your balance", money(o.totalCents - o.feeCents)],
  ];
  return {
    subject: `New order #${o.number} — ${o.itemTitle}`,
    html: layout(
      title,
      p(`<strong>${escape(o.buyerName || "A customer")}</strong> paid for ${escape(o.itemTitle)}${o.quantity > 1 ? ` × ${o.quantity}` : ""}. ${o.delivery === "post" ? "It needs posting." : "They'll collect it."}`) +
        rows(lines) +
        p(`The money is held until <strong>${escape(o.releaseDate)}</strong>, then you can withdraw it.`) +
        button(o.orderUrl, "View the order"),
    ),
    text: `${title}\n\n${lines.map(([a, b]) => `${a}: ${b}`).join("\n")}\n\nAvailable to withdraw from ${o.releaseDate}.\n\n${o.orderUrl}`,
  };
}

export function orderUpdateEmail(o: {
  number: number;
  shopName: string;
  kind: "shipped" | "ready" | "refunded";
  itemTitle: string;
  trackUrl: string;
  courier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  pickupInfo?: string | null;
  refundCents?: number;
}) {
  const title =
    o.kind === "shipped" ? `Your order is on its way` : o.kind === "ready" ? `Your order is ready to collect` : `You've been refunded`;
  let body = "";
  if (o.kind === "shipped") {
    body = p(`${escape(o.shopName)} has sent ${escape(o.itemTitle)}.`);
    if (o.courier || o.trackingNumber)
      body += p(`${o.courier ? `Courier: <strong>${escape(o.courier)}</strong><br>` : ""}${o.trackingNumber ? `Tracking number: <strong>${escape(o.trackingNumber)}</strong>` : ""}`);
    if (o.trackingUrl) body += button(o.trackingUrl, "Track the parcel");
  } else if (o.kind === "ready") {
    body = p(`${escape(o.itemTitle)} is ready to collect from ${escape(o.shopName)}.`) + (o.pickupInfo ? p(escape(o.pickupInfo)) : "");
  } else {
    body = p(`${escape(o.shopName)} has refunded ${money(o.refundCents ?? 0)} for order #${o.number}. It usually reaches your card in 5–10 days.`);
  }
  return {
    subject: `${title} — order #${o.number}`,
    html: layout(title, body + button(o.trackUrl, "View your order")),
    text: `${title}\n\n${body.replace(/<[^>]+>/g, "")}\n\n${o.trackUrl}`,
  };
}

export function payoutEmail(o: { kind: "paid" | "rejected"; number: number; amountCents: number; note?: string | null; balanceUrl: string; viaStripe?: boolean }) {
  const title = o.kind === "paid" ? `Payout #${o.number} is on its way` : `Payout #${o.number} wasn't sent`;
  const body =
    o.kind === "paid"
      ? p(`We've sent <strong>${money(o.amountCents)}</strong> to your bank account. ${o.viaStripe ? "It usually arrives within 2 business days." : "It usually arrives within 1 business day."}`)
      : p(`Your request for ${money(o.amountCents)} has been returned to your balance.`) + (o.note ? p(`Reason: ${escape(o.note)}`) : "");
  return {
    subject: title,
    html: layout(title, body + button(o.balanceUrl, "View your balance")),
    text: `${title}\n\n${body.replace(/<[^>]+>/g, "")}\n\n${o.balanceUrl}`,
  };
}

export function payoutRequestedAdminEmail(o: { number: number; shopName: string; amountCents: number; adminUrl: string }) {
  const title = `Payout request #${o.number}: ${money(o.amountCents)}`;
  return {
    subject: `${title} — ${o.shopName}`,
    html: layout(title, p(`${escape(o.shopName)} has asked to withdraw ${money(o.amountCents)}.`) + button(o.adminUrl, "Open payouts")),
    text: `${title}\n\n${o.shopName} has asked to withdraw ${money(o.amountCents)}.\n\n${o.adminUrl}`,
  };
}
