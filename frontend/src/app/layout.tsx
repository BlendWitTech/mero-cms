import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, Syne, Outfit } from "next/font/google";
import "./globals.css";
import { NotificationProvider } from '@/context/NotificationContext';
import ToastStack from '@/components/ui/ToastStack';
import AnalyticsScripts from '@/components/AnalyticsScripts';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

async function getGlobalSeo() {
  try {
    const res = await fetch('http://localhost:3001/seo-meta/GLOBAL', {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

async function getAnalyticsConfig() {
  try {
    const res = await fetch('http://localhost:3001/analytics/config', {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getGlobalSeo();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  return {
    title: {
      default: seo?.title || "Blendwit CMS | Premium Content Management System",
      template: "%s | Blendwit CMS",
    },
    description: seo?.description || "Advanced Content Management System with powerful features for modern web applications",
    keywords: ["CMS", "Content Management", "Blendwit", "Web Development", "Blog Platform"],
    authors: [{ name: "Blendwit Team" }],
    creator: "Blendwit",
    publisher: "Blendwit",
    metadataBase: new URL(siteUrl),
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteUrl,
      siteName: "Blendwit CMS",
      title: seo?.title || "Blendwit CMS | Premium Content Management System",
      description: seo?.description || "Advanced Content Management System with powerful features for modern web applications",
    },
    twitter: {
      card: "summary_large_image",
      title: seo?.title || "Blendwit CMS",
      description: seo?.description || "Advanced Content Management System",
    },
    robots: {
      index: true,
      follow: true,
    }
  };
}

import { SettingsProvider } from '@/context/SettingsContext';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const analyticsConfig = await getAnalyticsConfig();

  return (
    <html lang="en">
      <head>
        <AnalyticsScripts config={analyticsConfig} />
      </head>
      <body
        className={`${inter.variable} ${plusJakartaSans.variable} ${syne.variable} ${outfit.variable} font-sans antialiased`}
      >
        <NotificationProvider>
          <SettingsProvider>
            {children}
            <ToastStack />
          </SettingsProvider>
        </NotificationProvider>
      </body>
    </html>
  );
}
