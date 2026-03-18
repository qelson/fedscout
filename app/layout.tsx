import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import InactivityTimer from "./components/InactivityTimer";
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
  title: "FedScout — Federal Contract Intelligence",
  description: "Never miss a government contract. FedScout finds the federal opportunities that match your business profile and delivers them to your inbox every morning.",
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <InactivityTimer />
      </body>
    </html>
  );
}
