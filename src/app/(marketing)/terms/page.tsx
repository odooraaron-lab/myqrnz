import type { Metadata } from "next";
import { PageIntro } from "@/components/marketing/PageIntro";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "The terms for using myQR to run an online shop.",
  alternates: { canonical: "/terms" },
};

// Plain-language starting point. Have these reviewed before taking payments.
export default function TermsPage() {
  return (
    <>
      <PageIntro title="Terms of use" intro="The short version: sell honestly, keep your account secure, and we'll keep your shop running." />
      <article className="prose-guide mx-auto max-w-6xl px-4 sm:px-6">
        <h2>Your shop</h2>
        <p>
          When you sign up you choose a shop address on {site.rootDomain}. You can use it for as long as your account is in
          good standing. Your address is fixed once your shop is published, because it&apos;s what your printed QR codes
          point to.
        </p>
        <h2>What you sell</h2>
        <p>
          You are the seller of everything listed in your shop. You&apos;re responsible for describing products accurately,
          meeting the Consumer Guarantees Act, the Fair Trading Act and any food safety or product rules that apply, and
          for handling delivery, returns and refunds with your customers.
        </p>
        <p>
          You can&apos;t use myQR to sell anything illegal in New Zealand, counterfeit goods, weapons, tobacco or vaping
          products, alcohol without the right licence, or anything that infringes someone else&apos;s rights. We may hide
          listings or suspend shops that break these rules.
        </p>
        <h2>Fees</h2>
        <p>
          The setup fee is paid once to publish your shop and isn&apos;t refundable once your shop has been published. When
          card checkout is available, a platform fee of {site.platformFeePercent}% applies to each sale, including
          shipping charged on it. Card processing fees are covered by this fee. We&apos;ll give
          you at least 30 days&apos; notice before changing fees.
        </p>
        <h2>Payments and payouts</h2>
        <p>
          When card checkout is on, customers pay myQR, and we collect each payment on your behalf. The sale, less our fee,
          is added to your balance. Each sale is held for a few days (currently 7) so refunds and card disputes can be
          covered, then you can ask for a payout to your bank account. Refunds and lost disputes come out of your balance.
          To receive payouts you may need to verify your identity and bank account with our payments provider.
        </p>
        <h2>Your content</h2>
        <p>
          You keep ownership of your photos, logo and descriptions. You give us permission to display them in your shop,
          in search results and in previews so your shop can work.
        </p>
        <h2>Your account</h2>
        <p>
          Keep your password private. You&apos;re responsible for what happens in your account. Tell us straight away if you
          think someone else has access.
        </p>
        <h2>Ending things</h2>
        <p>
          You can take your shop offline at any time from your dashboard. We may close shops that break these terms, after
          telling you why where we can.
        </p>
        <h2>Contact</h2>
        <p>
          Questions about these terms: <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
        </p>
      </article>
    </>
  );
}
