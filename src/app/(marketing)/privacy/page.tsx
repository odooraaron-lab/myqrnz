import type { Metadata } from "next";
import { PageIntro } from "@/components/marketing/PageIntro";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How myQR collects, uses and protects personal information.",
  alternates: { canonical: "/privacy" },
};

// Plain-language starting point aligned with the Privacy Act 2020. Review before launch.
export default function PrivacyPage() {
  return (
    <>
      <PageIntro title="Privacy" intro="What we collect, why, and what you can do about it." />
      <article className="prose-guide mx-auto max-w-6xl px-4 sm:px-6">
        <h2>Sellers</h2>
        <p>
          When you create a shop we collect your email address, password (stored scrambled, never in plain text), shop
          details and the products you list. We use these to run your shop, sign you in and contact you about your account.
        </p>
        <h2>Shoppers</h2>
        <p>
          When you send an enquiry from a shop, we pass your name, email, phone number (if you give it) and message to that
          shop&apos;s owner and keep a copy so they can find it in their inbox. The shop owner is responsible for how they
          use it after that.
        </p>
        <h2>Visit counts</h2>
        <p>
          We count visits and QR code scans per shop per day so sellers can see how their shop is doing. These counts
          don&apos;t identify you and we don&apos;t use advertising trackers.
        </p>
        <h2>Who else handles data</h2>
        <p>
          We use trusted providers to host the site, store images, run the database and send email. They only process
          data to provide their service to us.
        </p>
        <h2>Your rights</h2>
        <p>
          Under the Privacy Act 2020 you can ask to see or correct the personal information we hold about you. Email{" "}
          <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> and we&apos;ll respond within 20 working days.
        </p>
      </article>
    </>
  );
}
