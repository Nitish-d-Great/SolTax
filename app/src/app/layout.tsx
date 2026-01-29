import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WalletContextProvider } from "@/providers/WalletProvider";
import { EmployeeProvider } from "@/providers/EmployeeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZK Payroll | Privacy-Preserving Payroll on Solana",
  description: "Process payroll with zero-knowledge proofs. Tax and salary amounts hidden via Bulletproofs. Built on Solana with ShadowWire.",
  keywords: ["solana", "payroll", "zero-knowledge", "privacy", "ZK", "bulletproofs", "shadowwire"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-white min-h-screen`}
      >
        <WalletContextProvider>
          <EmployeeProvider>
            {children}
          </EmployeeProvider>
        </WalletContextProvider>
      </body>
    </html>
  );
}
