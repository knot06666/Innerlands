import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import { Sarabun } from "next/font/google";
import "./globals.css";

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sarabun",
  display: "swap"
});

const title = "โลกข้างใน";
const description = "เว็บเดินทางผ่านธรรมชาติของใจ เพื่อค้นพบว่าโลกข้างในของคุณคล้ายภูมิประเทศแบบไหน";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://innerlands.vercel.app";
const previewImage = "/og";

export const viewport: Viewport = {
  themeColor: "#0b191f"
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: title,
  openGraph: {
    title,
    description,
    siteName: title,
    locale: "th_TH",
    type: "website",
    images: [
      {
        url: previewImage,
        width: 1200,
        height: 630,
        alt: "โลกข้างใน เว็บเดินทางผ่านธรรมชาติของใจ"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [previewImage]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={sarabun.variable}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
