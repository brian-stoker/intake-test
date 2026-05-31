import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "A.I. Guys Intake",
  description: "Messy input → structured lead → delivered, in one paste.",
  icons: {
    icon: "/ai-guys-logo.png",
    apple: "/ai-guys-logo.png",
  },
  openGraph: {
    title: "A.I. Guys Intake",
    description: "Messy input → structured lead → delivered, in one paste.",
    images: [
      {
        url: "/ai-guys-logo.png",
        width: 512,
        height: 512,
        alt: "A.I. Guys Intake",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "A.I. Guys Intake",
    description: "Messy input → structured lead → delivered, in one paste.",
    images: ["/ai-guys-logo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
