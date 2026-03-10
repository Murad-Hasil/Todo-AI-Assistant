import type { Metadata } from "next";
import localFont from "next/font/local";
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

const siteUrl = "https://murad-hasil-todo-ai.vercel.app";

// [Task]: T-3.4.4 — Enterprise SEO & Metadata
export const metadata: Metadata = {
  applicationName: "TodoAI Evolution",
  title: "TodoAI | Distributed Intelligence & Event-Driven Productivity",
  description:
    "An enterprise-grade AI task management system utilizing a distributed architecture with Next.js, FastAPI, Kubernetes, and Kafka. Engineered for high scalability and intelligent automation.",
  keywords: [
    "AI Software Architecture",
    "Distributed Systems",
    "Cloud Native SaaS",
    "Event Driven Microservices",
    "Full Stack AI Development",
  ],
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "TodoAI Evolution",
    title: "TodoAI: The Architecture of Intelligence",
    description:
      "Explore a fully containerized, Kafka-powered AI Todo system built with Spec-Driven Development.",
  },
  twitter: {
    card: "summary_large_image",
    title: "TodoAI: The Architecture of Intelligence",
    description:
      "Explore a fully containerized, Kafka-powered AI Todo system built with Spec-Driven Development.",
  },
  themeColor: "#0f172a",
  icons: {
    icon: "/favicon.ico",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TodoAI Evolution",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "An enterprise-grade AI task management system utilizing a distributed architecture with Next.js, FastAPI, Kubernetes, and Kafka.",
  url: siteUrl,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
