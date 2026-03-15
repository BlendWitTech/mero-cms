import type { Metadata } from 'next';
import './globals.css';
import SessionProvider from '@/components/SessionProvider';

export const metadata: Metadata = {
    title: 'Mero CMS — Try it Free',
    description:
        'Explore Mero CMS — a modular, self-hosted content management system. Sign in for free and see how it works before you buy.',
    openGraph: {
        title: 'Mero CMS Demo Playground',
        description: 'Try Mero CMS before you buy. Sign in with Google, GitHub, or LinkedIn.',
        siteName: 'Mero CMS by Blendwit Tech',
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className="bg-white text-gray-900 antialiased">
                <SessionProvider>{children}</SessionProvider>
            </body>
        </html>
    );
}
