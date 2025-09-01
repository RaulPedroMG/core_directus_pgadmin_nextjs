import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import type React from "react"; // Import React
import { cn } from "@/lib/utils";
import DevConfigProvider from "@/components/DevConfigProvider";

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ShipFree",
  description:
    "Open Source Alternative to ShipFast - Launch your startup in days Not in weeks",
  keywords: [
    "saas",
    "boilerplate",
    "open source",
    "free",
    "open source shipfast",
    "shipfree",
    "idee8",
    "made by idee8",
    "free boilerplate",
    "github",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={cn(bricolageGrotesque.className, "antialiased")}>
        <DevConfigProvider>{children}</DevConfigProvider>
      </body>
    </html>
  );
}
