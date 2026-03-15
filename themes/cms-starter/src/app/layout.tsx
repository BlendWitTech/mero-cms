import type { Metadata } from 'next';
import './globals.css';
import { getSiteData, cmsImageUrl } from '@/lib/cms';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export async function generateMetadata(): Promise<Metadata> {
  const siteData = await getSiteData();
  const { settings } = siteData;

  const title = settings.siteTitle || 'Mero CMS';
  const description =
    settings.tagline || 'The flexible, open-source CMS for modern websites';

  return {
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002'),
    openGraph: {
      title,
      description,
      images: settings.logoUrl ? [cmsImageUrl(settings.logoUrl)] : [],
    },
    icons: settings.faviconUrl
      ? { icon: cmsImageUrl(settings.faviconUrl) }
      : undefined,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteData = await getSiteData();

  return (
    <html lang="en">
      <body className="font-sans antialiased bg-white text-gray-900">
        <Header siteData={siteData} />
        <main>{children}</main>
        <Footer siteData={siteData} />
      </body>
    </html>
  );
}
