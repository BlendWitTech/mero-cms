import { apiRequest } from '@/lib/api';
import DefaultHomePage from '@/components/themes/default/HomePage';
import BlendwitHomePage from '@/components/themes/blendwit/HomePage';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Fetch Active Theme
async function getActiveTheme() {
    try {
        // We can't use apiRequest easily in Server Components if it relies on localStorage/Context.
        // But this is a Server Component, so we can use standard fetch to the backend URL.
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/themes/active`, { cache: 'no-store' }); // Disable cache for dev
        if (!res.ok) return 'default';
        const data = await res.json();
        return data.activeTheme || 'default';
    } catch (e) {
        console.error('Failed to fetch active theme', e);
        return 'default';
    }
}

async function getThemeData(theme: string) {
    // In a real app, this would fetch the theme.json content from the DB
    // For now, we return empty or basic mock
    return {};
}

export default async function Page() {
    const activeTheme = await getActiveTheme();
    // const themeData = await getThemeData(activeTheme);

    console.log('Rendering Theme:', activeTheme);

    if (activeTheme === 'blendwit' || activeTheme === 'Blendwit Premium') {
        return <BlendwitHomePage data={{}} />;
    }

    return <DefaultHomePage />;
}
