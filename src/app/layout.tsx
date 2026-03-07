import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Rajdhani, Cinzel, DM_Mono, Outfit, Press_Start_2P, Pixelify_Sans } from "next/font/google";
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

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rajdhani",
  display: "swap",
});

/** Story mode display font — dramatic, roman, cinematic */
const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-cinzel",
  display: "swap",
});

/** Quest mode monospace — dry mission-control readout */
const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

/** Body copy — clean, modern */
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-outfit",
  display: "swap",
});

/** Retro pixel font for headings */
const pressStart = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pixel",
  display: "swap",
});

/** Pixel-friendly body text */
const pixelifySans = Pixelify_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-pixel-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TinyCatch — Discover Tiny Creatures in the Real World",
  description: "Point your camera anywhere. AI transforms everyday objects into adorable pixel creatures you can interact with, battle, and befriend.",
};

export const viewport: Viewport = {
  themeColor: "#FFF8E7",
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
        className={`${geistSans.variable} ${geistMono.variable} ${rajdhani.variable} ${cinzel.variable} ${dmMono.variable} ${outfit.variable} ${pressStart.variable} ${pixelifySans.variable} antialiased bg-[#FFF8E7]`}
      >
        {children}
      </body>
    </html>
  );
}
