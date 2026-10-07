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
