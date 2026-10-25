import type { Metadata, Viewport } from "next";
import { Fraunces, Noto_Sans_Javanese, Plus_Jakarta_Sans } from "next/font/google";
import { MotionProvider } from "@/components/motion";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-jakarta", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-fraunces", display: "swap" });
// Aksara Jawa appears only as small ornaments, so no preload.
const javanese = Noto_Sans_Javanese({ subsets: ["javanese"], weight: ["400"], variable: "--font-javanese", display: "swap", preload: false });

export const metadata: Metadata = {
  title: { default: "Primbon NLP", template: "%s · Primbon NLP" },
  description: "Mesin penterjemah rule-based untuk konsultasi weton dan primbon Jawa",
};

export const viewport: Viewport = { themeColor: "#fbf6ec", colorScheme: "light" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${jakarta.variable} ${fraunces.variable} ${javanese.variable}`}>
      <body className="min-h-dvh font-sans">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
