import type { Metadata } from 'next';
import './globals.css';
import { getSiteData } from '@/lib/cms';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getSiteData();
  return {
    title: {
      default: settings.siteTitle || 'KTM Plots',
      template: `%s | ${settings.siteTitle || 'KTM Plots'}`,
    },
    description: settings.tagline || "Kathmandu Valley's Trusted Land Partner",
    icons: settings.faviconUrl ? { icon: settings.faviconUrl } : undefined,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteData = await getSiteData();
  const mainMenu = siteData.menus.find((m) => m.slug === 'main-nav');

  return (
    <html lang="en">
      <body>
        <Header siteData={siteData} menu={mainMenu} />
        <main>{children}</main>
        <Footer siteData={siteData} />
      </body>
    </html>
  );
}
