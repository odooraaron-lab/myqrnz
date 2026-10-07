import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { PageHead } from "@/components/dashboard/PageHead";
import { db } from "@/db";
import { enquiries, listings } from "@/db/schema";
import { requireSeller } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { deleteEnquiryAction, markAllReadAction, markEnquiryAction } from "./actions";

export const metadata = { title: "Enquiries" };

export default async function EnquiriesPage() {
  const { shop } = await requireSeller();
  const rows = await db
    .select({ enquiry: enquiries, listingTitle: listings.title, listingId: listings.id })
    .from(enquiries)
    .leftJoin(listings, eq(listings.id, enquiries.listingId))
    .where(eq(enquiries.shopId, shop.id))
    .orderBy(desc(enquiries.createdAt))
    .limit(200);
  const unread = rows.filter((r) => !r.enquiry.readAt).length;

  return (
    <>
      <PageHead
        title="Enquiries"
        intro="Order requests and messages from your shop. Each one was also emailed to you — reply from your email as usual."
        actions={
          unread > 0 ? (
            <form action={markAllReadAction}>
              <button className="btn btn-outline btn-sm">Mark all as read</button>
            </form>
          ) : undefined
        }
      />

      {rows.length === 0 ? (
        <div className="panel px-6 py-14 text-center">
          <h2 className="font-semiwide text-2xl">No enquiries yet</h2>
          <p className="mx-auto mt-2 max-w-md text-ink-soft">
            When someone orders or sends a message from your shop it lands here and in your email. Put your QR code on the
            stall to get things moving.
          </p>
          <Link href="/dashboard/qr" className="btn btn-primary mt-6">
            Print your QR code
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map(({ enquiry: e, listingTitle, listingId }) => {
            const subject = listingTitle ? `Re: ${listingTitle}` : `Re: your message to ${shop.name}`;
            return (
              <li key={e.id} className={`panel p-5 sm:p-6 ${e.readAt ? "" : "border-l-4 border-l-cobalt"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold">
                      {e.name}
                      {!e.readAt && <span className="ml-2 rounded-full bg-cobalt px-2 py-0.5 text-xs font-bold text-white">New</span>}
                    </p>
                    <p className="text-sm text-ink-soft">
                      <a href={`mailto:${e.email}`} className="underline underline-offset-2">
                        {e.email}
                      </a>
                      {e.phone && (
                        <>
                          {", "}
                          <a href={`tel:${e.phone.replace(/\s/g, "")}`} className="underline underline-offset-2">
                            {e.phone}
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                  <p className="text-sm text-ink-soft">{formatDateTime(e.createdAt)}</p>
                </div>
                {listingTitle && listingId && (
                  <p className="mt-3 text-sm">
                    About{" "}
                    <Link href={`/dashboard/listings/${listingId}`} className="font-semibold underline underline-offset-2">
                      {listingTitle}
                    </Link>
                  </p>
                )}
                <p className="mt-3 max-w-[70ch] whitespace-pre-line leading-relaxed">{e.message}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <a
                    href={`mailto:${e.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Hi ${e.name.split(" ")[0]},\n\n`)}`}
                    className="btn btn-primary btn-sm"
                  >
                    Reply by email
                  </a>
                  <form action={markEnquiryAction}>
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="read" value={e.readAt ? "0" : "1"} />
                    <button className="btn btn-outline btn-sm">{e.readAt ? "Mark as unread" : "Mark as read"}</button>
                  </form>
                  <form action={deleteEnquiryAction}>
                    <input type="hidden" name="id" value={e.id} />
                    <button className="btn btn-quiet btn-sm text-stop">Delete</button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
