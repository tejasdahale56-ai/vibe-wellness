import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VIBE — Feel more like you",
  description:
    "A little more insight into your everyday wellbeing. Meet VIBE, your personal wellness companion.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
