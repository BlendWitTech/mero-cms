// CMS_API_URL works server-side (RSC/layout); NEXT_PUBLIC_CMS_API_URL works both server + client
const BASE_URL =
  process.env.CMS_API_URL ||
  process.env.NEXT_PUBLIC_CMS_API_URL ||
  'http://localhost:3001';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  github?: string;
  [key: string]: string | undefined;
}

export interface SiteSettings {
  siteTitle?: string;
  tagline?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroBgImage?: string;
  aboutTitle?: string;
  aboutContent?: string;
  aboutImage?: string;
  ctaText?: string;
  ctaUrl?: string;
  primaryColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  contact_email?: string; // theme specific
  site_tagline?: string;  // theme specific
  social_twitter?: string; // theme specific
  social_github?: string;  // theme specific
  address?: string;
  socialLinks?: SocialLinks;
  activeTheme?: string;
  copyrightText?: string;
  footerText?: string;
  [key: string]: unknown;
}

export interface MenuItem {
  id?: string;
  label: string;
  url: string;
  order: number;
  children?: MenuItem[];
}

export interface Menu {
  id?: string;
  name: string;
  slug: string;
  items: MenuItem[];
}

export interface Post {
  id?: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  featuredImage?: string;
  status?: string;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  author?: { id?: string; name?: string; email?: string; avatar?: string };
  categories?: Array<{ id?: string; name: string; slug: string }>;
  tags?: Array<{ id?: string; name: string; slug: string }>;
  metaTitle?: string;
  metaDescription?: string;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  description?: string;
  content?: string;
  data: {
    sections?: Array<{
      id: string;
      type?: string;
      enabled: boolean;
      data: Record<string, any>;
    }>;
  };
  status?: string;
  metaTitle?: string;
  metaDescription?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeamMember {
  id?: string;
  name: string;
  role?: string;
  bio?: string;
  avatar?: string;
  order?: number;
  socialLinks?: SocialLinks;
}

export interface Testimonial {
  id?: string;
  clientName: string;
  clientRole?: string;
  clientCompany?: string;
  clientAvatar?: string;
  content: string;
  rating?: number;
}

export interface Service {
  id?: string;
  title: string;
  description?: string;
  icon?: string;
  image?: string;
  order?: number;
}

export interface SiteData {
  settings: SiteSettings;
  menus: Menu[];
  services: Service[];
  testimonials: Testimonial[];
  team: TeamMember[];
  pages: Page[];
}

export interface PostsResponse {
  data: Post[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SeoMeta {
  title?: string;
  description?: string;
  ogImage?: string;
  canonicalUrl?: string;
  keywords?: string;
  noIndex?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function cmsImageUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = BASE_URL.replace(/\/$/, '');
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${base}${clean}`;
}

export function getMenuBySlug(menus: Menu[], slug: string): Menu | undefined {
  return menus.find((m) => m.slug === slug);
}

// ─── API Calls ────────────────────────────────────────────────────────────────

export async function getSiteData(revalidate = 60): Promise<SiteData> {
  const fallback: SiteData = {
    settings: { siteTitle: 'My Site' },
    menus: [],
    services: [],
    testimonials: [],
    team: [],
    pages: [],
  };

  try {
    const res = await fetch(`${BASE_URL}/public/site-data`, {
      next: { revalidate },
    });
    if (!res.ok) return fallback;
    const json = await res.json();
    return {
      settings: json.settings ?? fallback.settings,
      menus: Array.isArray(json.menus) ? json.menus : [],
      services: Array.isArray(json.services) ? json.services : [],
      testimonials: Array.isArray(json.testimonials) ? json.testimonials : [],
      team: Array.isArray(json.team) ? json.team : [],
      pages: Array.isArray(json.pages) ? json.pages : [],
    };
  } catch {
    return fallback;
  }
}

export async function getPublishedPosts(
  opts: { page?: number; limit?: number } = {},
  revalidate = 60,
): Promise<PostsResponse> {
  const { page = 1, limit = 10 } = opts;
  const empty: PostsResponse = { data: [], total: 0, page, limit, totalPages: 0 };

  try {
    const url = `${BASE_URL}/public/posts?page=${page}&limit=${limit}`;
    const res = await fetch(url, { next: { revalidate } });
    if (!res.ok) return empty;
    const json = await res.json();
    return {
      data: Array.isArray(json.data) ? json.data : [],
      total: json.total ?? 0,
      page: json.page ?? page,
      limit: json.limit ?? limit,
      totalPages: json.totalPages ?? 1,
    };
  } catch {
    return empty;
  }
}

export async function getPostBySlug(slug: string, revalidate = 60): Promise<Post | null> {
  try {
    const res = await fetch(`${BASE_URL}/public/posts/${slug}`, { next: { revalidate } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getPageBySlug(slug: string, revalidate = 60): Promise<Page | null> {
  try {
    const res = await fetch(`${BASE_URL}/public/pages/${slug}`, { next: { revalidate } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getCollection(
  slug: string,
  opts: { page?: number; limit?: number; search?: string } = {},
  revalidate = 60,
): Promise<any> {
  const { page = 1, limit = 10, search = '' } = opts;
  try {
    const url = new URL(`${BASE_URL}/public/collections/${slug}/items`);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('limit', limit.toString());
    if (search) url.searchParams.append('search', search);

    const res = await fetch(url.toString(), { next: { revalidate } });
    if (!res.ok) return { data: [], total: 0 };
    return await res.json();
  } catch {
    return { data: [], total: 0 };
  }
}

// ─── Package types (mirrors backend/src/config/packages.ts) ──────────────────

export type WebsiteType = 'personal' | 'organizational';
export type PackageId =
    | 'personal-basic' | 'personal-premium' | 'personal-professional'
    | 'org-basic' | 'org-premium' | 'org-enterprise' | 'org-custom';

export interface CmsPackage {
    id: PackageId;
    name: string;
    websiteType: WebsiteType;
    tier: 1 | 2 | 3 | 4;
    aiEnabled: boolean;
    priceNPR: number | { min: number; max: number } | 'custom';
    tagline: string;
    features: string[];
    comingSoon?: string[];
    starterThemes: string[];
    supportLevel: 'email' | 'priority' | 'dedicated';
    highlighted?: boolean;
}

export function formatPrice(price: CmsPackage['priceNPR']): string {
    if (price === 'custom') return 'Custom';
    if (typeof price === 'number') return `NPR ${price.toLocaleString()}`;
    return `NPR ${(price as { min: number; max: number }).min.toLocaleString()} – ${(price as { min: number; max: number }).max.toLocaleString()}`;
}

export async function getPackages(type?: WebsiteType): Promise<CmsPackage[]> {
    try {
        const url = type
            ? `${BASE_URL}/public/packages?type=${type}`
            : `${BASE_URL}/public/packages`;
        const res = await fetch(url, { next: { revalidate: 3600 } });
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
}

// ─── Demo ─────────────────────────────────────────────────────────────────────

export interface DemoSession {
    instanceUrl: string;
    sessionId: string;
    expiresAt: string;
    demoCredentials: { adminEmail: string; adminPassword: string };
    package: CmsPackage;
}

export async function startDemo(packageId: PackageId): Promise<{ success: boolean; data?: DemoSession; error?: string }> {
    try {
        const res = await fetch(`${BASE_URL}/demo/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ packageId }),
            cache: 'no-store',
        });
        const json = await res.json();
        if (!res.ok) return { success: false, error: json.message || 'Failed to start demo' };
        return { success: true, data: json };
    } catch {
        return { success: false, error: 'Could not connect to the server. Please try again.' };
    }
}

export async function submitLead(data: any): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${BASE_URL}/public/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch {
    return { success: false, message: 'Failed to submit.' };
  }
}

export async function submitForm(
  id: string,
  data: any,
): Promise<{ success: boolean; id?: string; message?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/public/forms/${id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch {
    return { success: false, message: 'Failed to submit.' };
  }
}

export interface DemoStatus {
  demoMode: boolean;
  branch: string;
  nextResetAt: string | null;
}

export async function getDemoStatus(): Promise<DemoStatus> {
  try {
    const res = await fetch(`${BASE_URL}/auth/demo-status`, {
      cache: 'no-store',
    });
    if (!res.ok) return { demoMode: false, branch: '', nextResetAt: null };
    return await res.json();
  } catch {
    return { demoMode: false, branch: '', nextResetAt: null };
  }
}

export async function getSeoMeta(route: string, revalidate = 60): Promise<SeoMeta | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/seo-meta/public?route=${encodeURIComponent(route)}`,
      { next: { revalidate } },
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
