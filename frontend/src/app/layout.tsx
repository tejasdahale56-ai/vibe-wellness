import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "VIBE — Feel more like you",
  description:
    "A little more insight into your everyday wellness. Meet VIBE, your personal wellness companion.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
