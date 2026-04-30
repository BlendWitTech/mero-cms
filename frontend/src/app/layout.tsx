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

import { getApiBaseUrl } from '@/lib/api';

const API_URL = getApiBaseUrl();

async function getGlobalSeo() {
  try {
    const res = await fetch(`${API_URL}/seo-meta/GLOBAL`, {
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
    const res = await fetch(`${API_URL}/analytics/config`, {
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

async function getSettings() {
  try {
    const res = await fetch(`${API_URL}/public/site-data`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.settings || null;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const [seo, settings] = await Promise.all([
    getGlobalSeo(),
    getSettings(),
  ]);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  return {
    title: {
      default: seo?.title || (settings?.siteTitle ? `${settings.siteTitle} | CMS` : "Mero CMS | Premium Content Management"),
      template: `%s | ${settings?.siteTitle || "Mero CMS"}`,
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
      siteName: "Mero CMS",
      title: seo?.title || "Mero CMS | Premium Content Management System",
      description: seo?.description || "Advanced Content Management System with powerful features for modern web applications",
    },
    twitter: {
      card: "summary_large_image",
      title: seo?.title || "Mero CMS",
      description: seo?.description || "Advanced Content Management System",
    },
    robots: {
      index: true,
      follow: true,
    }
  };
}

import { SettingsProvider } from '@/context/SettingsContext';
import { ThemeProvider } from '@/components/theme-provider';
import AppSplash from '@/components/ui/AppSplash';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const analyticsConfig = await getAnalyticsConfig();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <AnalyticsScripts config={analyticsConfig} />
      </head>
      <body
        className={`${inter.variable} ${plusJakartaSans.variable} ${syne.variable} ${outfit.variable} font-sans antialiased`}
      >
        <AppSplash />

        <NotificationProvider>
          <SettingsProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              {children}
            </ThemeProvider>
            <ToastStack />
          </SettingsProvider>
        </NotificationProvider>
      </body>
    </html>
  );
}
