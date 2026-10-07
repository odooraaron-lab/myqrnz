import { JsonLd } from "@/components/JsonLd";
import type { Faq } from "@/content/faq";

export function FaqList({ faqs, withSchema = true }: { faqs: Faq[]; withSchema?: boolean }) {
  return (
    <>
      <div className="divide-y divide-line border-y border-line">
        {faqs.map((f) => (
          <details key={f.q} className="group">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-lg font-semibold [&::-webkit-details-marker]:hidden">
              <h3>{f.q}</h3>
              <svg
                className="mt-1.5 shrink-0 transition-transform group-open:rotate-45"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                aria-hidden="true"
              >
                <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </summary>
            <p className="max-w-[68ch] pb-6 leading-relaxed text-ink-soft">{f.a}</p>
          </details>
        ))}
      </div>
      {withSchema && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }}
        />
      )}
    </>
  );
}
