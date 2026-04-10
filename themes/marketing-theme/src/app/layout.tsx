import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { getSiteData, cmsImageUrl, SiteData } from '@/lib/cms';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { settings } = await getSiteData();
    const title = settings.siteTitle || 'Mero CMS';
    const description = settings.tagline || 'Modern headless CMS for agencies.';

    return {
      title: { default: title, template: `%s | ${title}` },
      description,
      metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
      openGraph: {
        title,
        description,
        images: settings.logoUrl ? [cmsImageUrl(settings.logoUrl as string)] : [],
      },
      icons: settings.faviconUrl ? { icon: cmsImageUrl(settings.faviconUrl as string) } : undefined,
    };
  } catch (error) {
    return {
      title: 'Mero CMS',
      description: 'Modern headless CMS for agencies.',
    };
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let siteData: SiteData = { 
    settings: { siteTitle: 'Mero CMS' }, 
    menus: [],
    services: [],
    testimonials: [],
    team: []
  };

  try {
    siteData = await getSiteData();
  } catch (error) {
    console.error('Failed to fetch site data in layout:', error);
  }

  return (
    <html lang="en" className={`${outfit.variable} scroll-smooth`}>
      <body className="font-sans antialiased bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900 min-h-screen">
        <Header siteData={siteData} />
        <main>{children}</main>
        <Footer siteData={siteData} />
      </body>
    </html>
  );
}
