import { site } from "@/config/site";

export type Faq = { q: string; a: string };

const fee = `$${site.setupFee}`;
const pct = `${site.platformFeePercent}%`;

export const FAQS: Faq[] = [
  {
    q: "What is myQR?",
    a: `myQR gives market stall holders and small shops their own online store at a web address like yourname.myqr.co.nz, plus printable QR codes that take customers straight to it. You set it up yourself from your phone or computer in under an hour.`,
  },
  {
    q: "How much does it cost?",
    a: `A one-off setup fee of ${fee} to claim your address and publish your shop, then ${pct} of each sale once card checkout is on. There are no monthly fees, so a quiet month costs you nothing.`,
  },
  {
    q: "How do customers pay?",
    a: site.paymentsEnabled
      ? "Customers pay by card at checkout and the money is paid out to your bank account, minus the platform fee."
      : "Card checkout is being switched on soon. Until then, shoppers send you an order enquiry from any product page and you arrange payment directly — bank transfer, cash at the stall, or however you already take payment.",
  },
  {
    q: "Do I need any technical skills?",
    a: "No. If you can post a photo on Facebook you can run a myQR shop. You type your shop name, upload a logo, add products with photos and prices, and print your QR code. There is nothing to install.",
  },
  {
    q: "What do I get with my shop?",
    a: "Your own web address, a choice of shop designs, unlimited product listings with up to eight photos each, printable QR signs and counter cards, a QR code for every product, an enquiries inbox, scan counts, and pages set up so Google can find your shop.",
  },
  {
    q: "Can I change my shop name later?",
    a: "Your shop's display name, logo, colours and description can change any time. Your web address is fixed once your shop is published, because it's what your printed QR codes point to.",
  },
  {
    q: "How big should I print my QR code?",
    a: "About one-tenth of the distance people scan from. Counter cards and table tents work at 6–8 cm; a sign people read from a couple of metres away needs 15–20 cm. The print templates in your dashboard are already sized for each use.",
  },
  {
    q: "Will my shop show up on Google?",
    a: "Each shop and product page is built with search titles, descriptions, structured data and a sitemap that Google reads. Clear product names, good descriptions and mentioning your town all help you show up for local searches.",
  },
  {
    q: "Can I sell food?",
    a: "Yes. You're responsible for meeting food safety rules for what you sell, the same as at your stall. Mark perishable items as pickup only so they don't get posted.",
  },
  {
    q: "What happens in my quiet season?",
    a: "Nothing — there's no monthly fee, so your shop stays up. You can hide products that are out of season and bring them back later, or take your whole shop offline from the dashboard.",
  },
  {
    q: "Can I use my own domain name?",
    a: "Not yet. Every shop gets its own address on myqr.co.nz, which is short enough to print and easy to remember.",
  },
  {
    q: "Do I need to be GST registered?",
    a: "Only once your turnover goes over $60,000 in 12 months. Below that it's your choice. Inland Revenue has the details for your situation.",
  },
];
