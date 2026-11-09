import type { Metadata } from "next";
import { MessageCircle, Phone, Mail, Clock, Building2 } from "lucide-react";
import EnquiryForm from "@/components/enquiry/EnquiryForm";

export const metadata: Metadata = {
  title: "Wholesale & Manufacturing",
  description:
    "Wholesale, bulk order, custom stitching and contract manufacturing enquiries for Krishna Garments — women's fashion made in-house.",
};

const DESKS = [
  {
    id: "wholesale",
    icon: Building2,
    title: "Wholesale Enquiry",
    body: "Recurring supply of our current styles at lot pricing, with reserved production slots each month.",
    points: ["MOQ from 50 pcs per style", "Size-set or random-pick packing", "Credit terms after first two orders"],
  },
  {
    id: "bulk-order",
    icon: Clock,
    title: "Bulk Order Enquiry",
    body: "A single large run of existing designs — for corporate gifting, export houses and retail chains.",
    points: ["3–5 week lead time", "Stage-wise payment", "Pre-shipment sample approval"],
  },
  {
    id: "custom-stitching",
    icon: MessageCircle,
    title: "Custom Stitching Enquiry",
    body: "Send a photo, a fabric swatch or your measurements. We pattern it, sample it and stitch it to fit.",
    points: ["Personal fittings available", "Your fabric accepted", "From 1 piece retail to 500+ bulk"],
  },
  {
    id: "manufacturing",
    icon: Phone,
    title: "Manufacturing Enquiry",
    body: "Contract manufacturing and private label production with your tech pack, or we develop one for you.",
    points: ["Tech pack development", "Labelling, tagging & barcoding", "Third-party audit ready"],
  },
];

export default function WholesalePage() {
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");

  return (
    <div className="mx-auto max-w-[1600px] px-6 pb-24 pt-28 md:px-10 md:pt-32">
      <header className="mb-14 max-w-3xl">
        <p className="eyebrow mb-4 flex items-center gap-3">
          <span className="h-px w-10 bg-champagne" /> Business Desk
        </p>
        <h1 className="font-display text-4xl leading-[1.05] md:text-[54px]">
          Wholesale, bulk &amp; <span className="italic gold-text">made-to-measure</span>
        </h1>
        <p className="mt-5 text-[15px] leading-relaxed text-ivory/60">
          Four ways to work with our factory. Choose the desk that fits, tell us what you need, and we will come back
          with costing, minimums and a timeline.
        </p>
      </header>

      {/* Desk overview */}
      <ul className="mb-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {DESKS.map((d) => (
          <li key={d.id}>
            <a
              href={`#${d.id}-form`}
              className="card-espresso group flex h-full flex-col gap-3 p-6 transition-all hover:border-copper/70 hover:bg-espresso"
              id={d.id}
            >
              <d.icon size={20} strokeWidth={1.4} className="text-copper transition-colors group-hover:text-champagne" />
              <h2 className="font-display text-[20px] leading-tight">{d.title}</h2>
              <p className="text-[12.5px] leading-relaxed text-ivory/55">{d.body}</p>
              <ul className="mt-auto space-y-1.5 pt-3 text-[11.5px] text-ivory/45">
                {d.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-copper" />
                    {p}
                  </li>
                ))}
              </ul>
            </a>
          </li>
        ))}
      </ul>

      <div className="hairline mb-16" />

      {/* Forms */}
      <div className="grid gap-12 lg:grid-cols-[1.25fr_1fr]">
        <section id="wholesale-form" className="scroll-mt-28">
          <h2 className="mb-2 font-display text-[30px] leading-tight">Tell us about your requirement</h2>
          <p className="mb-7 text-sm leading-relaxed text-ivory/55">
            One form covers all four desks — pick the enquiry type at the top of it.
          </p>
          <EnquiryForm presetType="WHOLESALE" />
        </section>

        <aside id="contact" className="scroll-mt-28 lg:sticky lg:top-28 lg:h-fit">
          <div className="card flex flex-col gap-5 p-7">
            <h3 className="font-display text-[24px]">Talk to the desk directly</h3>
            <p className="text-[13px] leading-relaxed text-ivory/55">
              Prefer a conversation? Call during working hours and ask for the wholesale desk. Have your style
              reference or quantity ready if you have it.
            </p>

            <ul className="flex flex-col gap-3 text-[13.5px]">
              <li className="flex items-center gap-3">
                <Phone size={15} className="shrink-0 text-copper" />
                {process.env.NEXT_PUBLIC_BUSINESS_PHONE ? (
                  <a href={`tel:${process.env.NEXT_PUBLIC_BUSINESS_PHONE}`} className="hover:text-champagne">
                    {process.env.NEXT_PUBLIC_BUSINESS_PHONE}
                  </a>
                ) : (
                  <span className="text-ivory/40">Business phone not configured</span>
                )}
              </li>
              <li className="flex items-center gap-3">
                <Mail size={15} className="shrink-0 text-copper" />
                <a href={`mailto:${process.env.NEXT_PUBLIC_BUSINESS_EMAIL}`} className="break-all hover:text-champagne">
                  {process.env.NEXT_PUBLIC_BUSINESS_EMAIL}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Clock size={15} className="mt-0.5 shrink-0 text-copper" />
                <span className="text-ivory/60">Mon – Sat, 10:00 – 19:00 IST</span>
              </li>
            </ul>

            {wa ? (
              <a
                href={`https://wa.me/${wa}?text=${encodeURIComponent("Hello Krishna Garments, I'd like to discuss a wholesale order.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-solid w-full"
              >
                <MessageCircle size={15} /> WhatsApp Us
              </a>
            ) : (
              <p className="rounded border border-warn/40 bg-warn/8 px-3 py-2.5 text-[11.5px] leading-relaxed text-warn">
                WhatsApp integration is ready but needs a business number. Set{" "}
                <code className="text-champagne">NEXT_PUBLIC_WHATSAPP_NUMBER</code> in <code className="text-champagne">.env</code>{" "}
                to enable it across the site.
              </p>
            )}
          </div>

          <dl className="card-espresso mt-5 grid grid-cols-2 gap-4 p-6 text-[12.5px]">
            {[
              ["Sampling", "7–10 days"],
              ["Lead time", "3–5 weeks"],
              ["Minimum", "50 pcs/style"],
              ["Capacity", "12k pcs/mo"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[10px] uppercase tracking-[0.18em] text-ivory/40">{k}</dt>
                <dd className="mt-1 font-display text-[19px] text-champagne">{v}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </div>
  );
}
