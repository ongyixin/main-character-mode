import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Press_Start_2P, VT323, DM_Mono, Rajdhani } from "next/font/google";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

/** Primary pixel art font — HUD labels, badges, titles */
const pressStart2P = Press_Start_2P({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pixel",
  display: "swap",
});

/** Large readable pixel font — dialogue, narration, descriptions */
const vt323 = VT323({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-vt",
  display: "swap",
});

/** Data readouts — timestamps, XP numbers, quest codes */
const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

/** Fallback display font for larger headers */
const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rajdhani",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Main Character Mode",
  description: "Your world. Reframed as a mission.",
};

export const viewport: Viewport = {
  themeColor: "#06040e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pressStart2P.variable} ${vt323.variable} ${dmMono.variable} ${rajdhani.variable} bg-[#06040e]`}
      >
        {children}
      </body>
    </html>
  );
}
