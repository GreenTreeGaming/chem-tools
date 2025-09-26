// app/layout.tsx (or wherever your RootLayout is defined)

import type { Metadata } from "next";
import localFont from "next/font/local";
import './globals.css'
import { SpeedInsights } from "@vercel/speed-insights/next"

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

export const metadata: Metadata = {
  title: "Chemistry Tools Hub",
  description: "Chemistry tools for any chemistry class!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        {children}
        <footer className="bg-gray-800 text-white text-center py-4">
          <p>
            Made by{' '}
            <a
              href="https://sarvajithkarun.com" // Replace with your actual website link
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-400"
            >
              Sarvajith Karun
            </a>
            <SpeedInsights/>
          </p>
        </footer>
      </body>
    </html>
  );
}