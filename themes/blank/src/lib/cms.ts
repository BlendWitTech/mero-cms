const BASE_URL = process.env.CMS_API_URL || 'http://localhost:3001';

export interface SiteSettings {
  siteTitle?: string;
  tagline?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  [key: string]: unknown;
}

export interface MenuItem {
  label: string;
  url: string;
  order: number;
}

export interface Menu {
  id?: string;
  name: string;
  slug: string;
  items: MenuItem[];
}

export interface SiteData {
  settings: SiteSettings;
  menus: Menu[];
}

export function cmsImageUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function getSiteData(): Promise<SiteData> {
  const fallback: SiteData = { settings: { siteTitle: 'My Site' }, menus: [] };
  try {
    const res = await fetch(`${BASE_URL}/public/site-data`, { next: { revalidate: 60 } });
    if (!res.ok) return fallback;
    const json = await res.json();
    return {
      settings: json.settings ?? fallback.settings,
      menus: Array.isArray(json.menus) ? json.menus : [],
    };
  } catch {
    return fallback;
  }
}
