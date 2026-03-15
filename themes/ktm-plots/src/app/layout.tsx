import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};
import './globals.css';
import { getSiteData } from '@/lib/cms';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getSiteData();
  return {
    title: {
      default: settings.siteTitle || 'Mero CMS',
      template: `%s | ${settings.siteTitle || 'Mero CMS'}`,
    },
    description: settings.tagline || 'The modular CMS that adapts to every project',
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
