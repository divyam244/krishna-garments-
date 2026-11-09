import Link from "next/link";
import { ArrowRight, MessageCircle, Factory } from "lucide-react";

/** Section 10 — entry point to the wholesale/manufacturing desk. */
export default function WholesaleStrip() {
  return (
    <section aria-labelledby="wholesale-strip" className="mx-auto max-w-[1600px] px-6 pb-24 md:px-10">
      <div className="relative overflow-hidden rounded-xl border border-copper/30 bg-gradient-to-br from-espresso via-deep to-charcoal p-8 shadow-card md:p-12">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full border border-copper/20" />
        <div className="pointer-events-none absolute -bottom-24 right-24 h-72 w-72 rounded-full border border-copper/12" />

        <div className="relative grid items-center gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <p className="eyebrow mb-4 flex items-center gap-3">
              <Factory size={15} className="text-champagne" /> For Businesses
            </p>
            <h2 id="wholesale-strip" className="font-display text-[32px] leading-tight md:text-[44px]">
              Manufacture with us —
              <span className="italic gold-text"> wholesale, bulk & custom</span>
            </h2>
            <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-ivory/60">
              We produce for boutiques, exporters, retail chains and independent labels. Share your style sheet or a
              reference photo and we will come back with costing, MOQ and a sample timeline.
            </p>

            <ul className="mt-7 flex flex-wrap gap-x-8 gap-y-3 text-[12.5px] text-ivory/70">
              {[
                ["MOQ", "50 pcs per style"],
                ["Sampling", "7–10 working days"],
                ["Lead time", "3–5 weeks"],
                ["Capacity", "12,000 pcs / month"],
              ].map(([k, v]) => (
                <li key={k}>
                  <span className="block text-[10px] uppercase tracking-[0.2em] text-champagne/60">{k}</span>
                  <span className="font-display text-[19px] text-champagne">{v}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/wholesale" className="btn-solid sheen">
              Start an Enquiry <ArrowRight size={15} />
            </Link>
            <a
              href={
                process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
                  ? `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER.replace(/\D/g, "")}?text=${encodeURIComponent(
                      "Hello Krishna Garments, I'd like to discuss a wholesale order.",
                    )}`
                  : "/wholesale#contact"
              }
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
            >
              <MessageCircle size={15} />
              {process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ? "Chat on WhatsApp" : "Enquire by Phone"}
            </a>
            <p className="text-center text-[10.5px] leading-relaxed text-ivory/35">
              {process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
                ? "Typical reply within one working day."
                : "WhatsApp number not configured yet — set NEXT_PUBLIC_WHATSAPP_NUMBER in .env"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
