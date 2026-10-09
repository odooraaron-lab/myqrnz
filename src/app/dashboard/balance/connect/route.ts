import { NextResponse } from "next/server";
import { rootUrl } from "@/config/site";
import { requireSeller } from "@/lib/auth";
import { connectOnboardingUrl } from "@/lib/payouts";
import { connectEnabled, stripeErrorMessage } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/** Starts (or resumes) the seller's one-time payout verification with Stripe. */
export async function GET() {
  const { user, shop } = await requireSeller();
  if (!connectEnabled()) return NextResponse.redirect(rootUrl("/dashboard/balance"));
  try {
    return NextResponse.redirect(await connectOnboardingUrl(shop, shop.contactEmail ?? user.email));
  } catch (err) {
    console.error("[connect] onboarding failed", stripeErrorMessage(err));
    return NextResponse.redirect(rootUrl("/dashboard/balance?connect_error=1"));
  }
}
