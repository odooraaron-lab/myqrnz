import type { Metadata } from "next";
import { FaqList } from "@/components/marketing/Faqs";
import { CtaBand, PageIntro } from "@/components/marketing/PageIntro";
import { site } from "@/config/site";
import { FAQS } from "@/content/faq";

export const metadata: Metadata = {
  title: "Questions about myQR online stores and QR codes",
  description:
    "Answers about myQR: pricing, payments, printing QR codes, getting found on Google, selling food, changing your shop name and more.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <>
      <PageIntro
        title="Questions, answered"
        intro="The things market stallholders and small shop owners ask us most. Can't see yours?"
        crumbs={[{ href: "/faq", label: "Questions" }]}
      >
        <p className="mt-3 text-lg">
          <a href={`mailto:${site.contactEmail}`} className="font-semibold text-cobalt underline underline-offset-4">
            Email {site.contactEmail}
          </a>
        </p>
      </PageIntro>
      <section className="mx-auto max-w-3xl px-4 sm:px-6">
        <FaqList faqs={FAQS} />
      </section>
      <CtaBand title="Ready to try it?" body="Claim your shop name in under a minute." />
    </>
  );
}
