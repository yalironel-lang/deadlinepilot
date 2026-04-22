import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "DeadlinePilot — Stop falling behind",
  description: "Upload your course materials and get a clear daily action plan.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="h-full bg-zinc-50 text-zinc-900 antialiased">{children}</body>
    </html>
  );
}
