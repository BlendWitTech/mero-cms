import type { Metadata } from 'next';
import { getSiteData, cmsImageUrl } from '@/lib/cms';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { settings } = await getSiteData(3600);
    return {
      title: {
        default: settings.siteTitle,
        template: `%s | ${settings.siteTitle}`,
      },
      description: settings.tagline,
      icons: settings.faviconUrl ? { icon: cmsImageUrl(settings.faviconUrl)! } : {},
      openGraph: {
        type: 'website',
        siteName: settings.siteTitle,
        images: settings.logoUrl ? [{ url: cmsImageUrl(settings.logoUrl)! }] : [],
      },
    };
  } catch {
    return {
      title: {
        default: 'Mero CMS',
        template: '%s | Mero CMS',
      },
      description: 'The modular CMS that adapts to every project.',
    };
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const siteData = await getSiteData(60).catch(() => null);

  return (
    <html lang="en">
      <body>
        <Header siteData={siteData} />
        <main>{children}</main>
        <Footer siteData={siteData} />
      </body>
    </html>
  );
}
