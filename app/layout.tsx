import { Inter } from "next/font/google";
import "./globals.css";
import React from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Rajbhog Sweets | Employee App",
  description: "Attendance & Payroll Management",
  manifest: "/manifest.json",
};

// ফিক্স: children এর টাইপ (React.ReactNode) বলে দেওয়া হয়েছে
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900`}>
        {children}
      </body>
    </html>
  );
}