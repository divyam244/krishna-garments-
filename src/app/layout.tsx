import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import { SiteProviders } from "@/components/providers/SiteProviders";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const body = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Krishna Garments — From Fabric to Fashion",
    template: "%s | Krishna Garments",
  },
  description:
    "Krishna Garments designs and manufactures women's fashion — co-ord sets, jackets, kurtis, dresses and ethnic wear. Retail, wholesale and custom stitching.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "Krishna Garments — From Fabric to Fashion",
    description:
      "Premium women's fashion, crafted from the finest fabric to the final stitch. Retail, wholesale and made-to-measure.",
    type: "website",
    siteName: "Krishna Garments",
  },
};

export const viewport: Viewport = {
  themeColor: "#121110",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <SiteProviders>{children}</SiteProviders>
      </body>
    </html>
  );
}
