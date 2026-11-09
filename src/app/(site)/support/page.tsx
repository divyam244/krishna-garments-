import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Support",
  description: "Shipping, returns, order tracking and frequently asked questions for Krishna Garments.",
};

const FAQS = [
  ["Do you sell directly to customers?", "Yes. Retail orders ship from our facility with no minimum. For 50 pieces or more on a single style, use the wholesale desk for lot pricing."],
  ["How long does delivery take?", "In-stock styles dispatch in 2–4 working days and arrive within 4–7 days across India. Made-to-order and custom stitching takes 3–5 weeks depending on fabric availability."],
  ["Can I return something?", "Yes — 7 days from delivery, unworn, tags intact, original packing. Ethnic and heavily embellished pieces are checked on return before the refund is raised."],
  ["Do you stitch to my measurements?", "We do. Send measurements through the custom stitching enquiry, or visit the studio for a fitting. We also accept your own fabric where the construction suits it."],
  ["Is GST invoicing available?", "GST invoices are issued against your business name and number for all wholesale orders. Add your GSTIN in the enquiry message or share it with the desk."],
  ["What is your monthly capacity?", "Approximately 12,000 pieces per month across categories, which is why we reserve production slots for recurring wholesale partners."],
];

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-[1100px] px-6 pb-24 pt-28 md:px-10 md:pt-32">
      <header className="mb-12 text-center">
        <p className="eyebrow mb-4">We&apos;re here</p>
        <h1 className="section-title font-display text-4xl md:text-[52px]">Customer Support</h1>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
        <Panel id="track" title="Track Order">
          <p>
            Use the tracker on your <Link href="/account" className="text-champagne underline decoration-copper/50">account page</Link>{" "}
            with the order number from your confirmation. If it does not resolve, send the number to our desk and we will
            report the exact production stage.
          </p>
        </Panel>

        <Panel id="shipping" title="Shipping">
          <p>
            Free shipping on retail orders above ₹999. Below that, a flat ₹80 applies pan-India. Wholesale shipments are
            quoted separately by transport mode, and we support your own freight agent.
          </p>
        </Panel>

        <Panel id="returns" title="Returns &amp; Exchanges">
          <p>
            7-day hassle-free returns on unworn pieces with tags intact. Size exchanges are subject to stock; if a size is
            sold out we issue store credit or a refund to the original method within 7 working days.
          </p>
        </Panel>

        <Panel id="contact" title="Contact Us">
          <p>
            Call Mon–Sat, 10:00–19:00 IST, or write to{" "}
            <a href={`mailto:${process.env.NEXT_PUBLIC_BUSINESS_EMAIL}`} className="text-champagne underline decoration-copper/50">
              {process.env.NEXT_PUBLIC_BUSINESS_EMAIL}
            </a>
            . For manufacturing and bulk matters, use the{" "}
            <Link href="/wholesale" className="text-champagne underline decoration-copper/50">business desk</Link>.
          </p>
        </Panel>
      </div>

      <section id="faqs" className="mt-16 scroll-mt-28">
        <h2 className="mb-6 font-display text-[32px]">Frequently Asked Questions</h2>
        <ul className="flex flex-col divide-y divide-copper/15 border-y border-copper/20">
          {FAQS.map(([q, a]) => (
            <li key={q}>
              <details className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-[19px] text-ivory marker:hidden group-hover:text-champagne">
                  {q}
                  <span className="shrink-0 text-copper transition-transform duration-300 group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 max-w-3xl text-[13.5px] leading-relaxed text-ivory/60">{a}</p>
              </details>
            </li>
          ))}
        </ul>
      </section>

      <section id="privacy" className="mt-16 grid gap-6 scroll-mt-28 md:grid-cols-2">
        <Panel id="terms" title="Terms of Sale">
          <p>
            Prices shown include GST unless stated otherwise. Wholesale quotations are valid for 15 days. Production
            timelines start once the approved sample and advance payment are both in hand.
          </p>
        </Panel>
        <Panel title="Privacy">
          <p>
            We collect only what an order needs: name, contact details, address and business information. Enquiry data is
            used solely to answer your enquiry. Payment card details are never stored on our systems.
          </p>
        </Panel>
      </section>
    </div>
  );
}

function Panel({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <article id={id} className={`card-espresso p-7 ${id ? "scroll-mt-28" : ""}`}>
      <h2 className="mb-3 font-display text-[22px] text-champagne">{title}</h2>
      <div className="text-[13.5px] leading-relaxed text-ivory/60">{children}</div>
    </article>
  );
}
