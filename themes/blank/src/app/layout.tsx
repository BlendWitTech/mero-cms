import type { Metadata } from 'next';
import './globals.css';
import { getSiteData } from '@/lib/cms';

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getSiteData();
  return {
    title: settings.siteTitle || 'My Site',
    description: settings.tagline || '',
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
