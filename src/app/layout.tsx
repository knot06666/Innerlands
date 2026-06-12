import type { Metadata } from "next";
import "./globals.css";

const title = "โลกข้างใน";
const description = "เว็บเดินทางผ่านธรรมชาติของใจ เพื่อค้นพบว่าโลกข้างในของคุณคล้ายภูมิประเทศแบบไหน";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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
        url: "/nature/mist-forest.png",
        width: 1024,
        height: 1024,
        alt: "ป่าสนในหมอกจากประสบการณ์โลกข้างใน"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/nature/mist-forest.png"]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
