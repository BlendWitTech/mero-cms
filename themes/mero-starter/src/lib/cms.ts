/**
 * Mero CMS Client Library — mero-starter theme
 * Typed, ISR-ready functions for fetching data from the CMS backend.
 *
 * Set CMS_API_URL in .env.local (default: http://localhost:3001)
 */

const CMS_API_URL = process.env.CMS_API_URL || 'http://localhost:3001';

// ─── TypeScript Interfaces ─────────────────────────────────────────────────

export interface SiteSettings {
  siteTitle: string;
  tagline: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  footerText: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  socialLinks: Record<string, string> | null;
  activeTheme: string | null;
  // Hero & marketing section content (editable via Admin > Settings)
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroBgImage: string | null;
  aboutTitle: string | null;
  aboutContent: string | null;
  aboutImage: string | null;
  ctaText: string | null;
  ctaUrl: string | null;
  metaDescription: string | null;
}

export interface SiteData {
  settings: SiteSettings;
  menus: Menu[];
  services: Service[];
  testimonials: Testimonial[];
  recentPosts: Post[];
}

export interface MenuItem {
  id: string;
  label: string;
  url: string;
  target?: '_self' | '_blank';
  order: number;
  children?: MenuItem[];
}

export interface Menu {
  id: string;
  name: string;
  slug: string;
  items: MenuItem[];
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  featuredImageUrl: string | null;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  author?: { id?: string; name: string; email?: string };
  categories?: { id?: string; name: string; slug: string }[];
  tags?: { id?: string; name: string; slug: string }[];
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  photo: string | null;
  email: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  githubUrl: string | null;
  order: number;
}

export interface Testimonial {
  id: string;
  clientName: string;
  clientRole: string | null;
  clientCompany: string | null;
  clientPhoto: string | null;
  content: string;
  rating: number | null;
  order?: number;
}

export interface Service {
  id: string;
  title: string;
  slug?: string;
  description: string | null;
  icon: string | null;
  order?: number;
}

export interface SeoMeta {
  title: string | null;
  description: string | null;
  keywords: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;
}

// ─── Fallback data ─────────────────────────────────────────────────────────

const FALLBACK_SITE_DATA: SiteData = {
  settings: {
    siteTitle: 'Mero CMS',
    tagline: 'The flexible CMS for modern websites',
    logoUrl: null,
    faviconUrl: null,
    primaryColor: '#4f46e5',
    footerText: null,
    contactEmail: null,
    contactPhone: null,
    address: null,
    socialLinks: null,
    activeTheme: 'mero-starter',
    heroTitle: 'Build Powerful Websites — Without the Complexity',
    heroSubtitle:
      'Mero CMS gives developers and businesses a clean content management system with a beautiful dashboard, theme switching, and a public REST API.',
    heroBgImage: null,
    aboutTitle: 'Why Mero CMS?',
    aboutContent:
      'Mero CMS is built for modern teams who need speed without sacrificing flexibility. Deploy in minutes, customize via themes, and let clients manage their own content.',
    aboutImage: null,
    ctaText: 'Get Started Free',
    ctaUrl: 'https://github.com/BlendWitTech/blendwit-cms-saas',
    metaDescription: null,
  },
  menus: [],
  services: [],
  testimonials: [],
  recentPosts: [],
};

// ─── Fetch Helper ──────────────────────────────────────────────────────────

async function cmsGet<T>(path: string, revalidate = 60): Promise<T> {
  const url = `${CMS_API_URL}${path}`;
  const res = await fetch(url, {
    next: { revalidate },
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`CMS fetch failed: ${url} → ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// ─── API Functions ─────────────────────────────────────────────────────────

/**
 * Fetch all public site data in a single request.
 * Ideal for layouts and homepages. Revalidates every 60s by default.
 */
export async function getSiteData(revalidate = 60): Promise<SiteData> {
  try {
    const data = await cmsGet<Partial<SiteData>>('/public/site-data', revalidate);
    return {
      ...FALLBACK_SITE_DATA,
      ...data,
      settings: { ...FALLBACK_SITE_DATA.settings, ...(data.settings ?? {}) },
      menus: data.menus ?? [],
      services: data.services ?? [],
      testimonials: data.testimonials ?? [],
      recentPosts: data.recentPosts ?? [],
    };
  } catch {
    return FALLBACK_SITE_DATA;
  }
}

/**
 * Fetch a navigation menu by slug (e.g. "main-nav", "footer").
 */
export async function getMenu(slug: string, revalidate = 60): Promise<Menu | null> {
  try {
    return await cmsGet<Menu>(`/menus/${slug}`, revalidate);
  } catch {
    return null;
  }
}

// ── Blog ─────────────────────────────────────────────────────────────────

export interface PostListResponse {
  data: Post[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Fetch published blog posts with optional pagination.
 */
export async function getPublishedPosts(
  options: { page?: number; limit?: number; category?: string } = {},
  revalidate = 60
): Promise<PostListResponse> {
  const { page = 1, limit = 10, category } = options;
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    status: 'published',
  });
  if (category) params.set('category', category);
  try {
    return await cmsGet<PostListResponse>(`/posts/public?${params}`, revalidate);
  } catch {
    return { data: [], total: 0, page: 1, limit };
  }
}

/**
 * Fetch a single published post by slug.
 */
export async function getPostBySlug(slug: string, revalidate = 60): Promise<Post | null> {
  try {
    return await cmsGet<Post>(`/posts/public/${slug}`, revalidate);
  } catch {
    return null;
  }
}

// ── Team ────────────────────────────────────────────────────────────────

/**
 * Fetch all team members (ordered by `order` field).
 */
export async function getTeam(revalidate = 300): Promise<TeamMember[]> {
  try {
    return await cmsGet<TeamMember[]>('/team/public', revalidate);
  } catch {
    return [];
  }
}

// ── Testimonials ────────────────────────────────────────────────────────

/**
 * Fetch all testimonials (ordered by `order` field).
 */
export async function getTestimonials(revalidate = 300): Promise<Testimonial[]> {
  try {
    return await cmsGet<Testimonial[]>('/testimonials/public', revalidate);
  } catch {
    return [];
  }
}

// ── Services ─────────────────────────────────────────────────────────────

/**
 * Fetch all services (ordered by `order` field).
 */
export async function getServices(revalidate = 300): Promise<Service[]> {
  try {
    return await cmsGet<Service[]>('/services/public', revalidate);
  } catch {
    return [];
  }
}

// ── Pages ────────────────────────────────────────────────────────────────

/**
 * Fetch a published static page by slug.
 */
export async function getPageBySlug(slug: string, revalidate = 60): Promise<Page | null> {
  try {
    return await cmsGet<Page>(`/pages/public/${slug}`, revalidate);
  } catch {
    return null;
  }
}

// ── SEO ──────────────────────────────────────────────────────────────────

/**
 * Fetch SEO meta for a given route (e.g. "/", "/blog", "/about").
 */
export async function getSeoMeta(route: string, revalidate = 300): Promise<SeoMeta | null> {
  try {
    const encoded = encodeURIComponent(route);
    return await cmsGet<SeoMeta>(`/seo-meta/public?route=${encoded}`, revalidate);
  } catch {
    return null;
  }
}

// ─── Image URL Helper ──────────────────────────────────────────────────────

/**
 * Build a full URL for a CMS-hosted image path (e.g. "/uploads/image.jpg").
 */
export function cmsImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${CMS_API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

/**
 * Format a date string to a human-readable format.
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
